[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$OutputPath,
  [switch]$SkipGitDiff
)

$ErrorActionPreference = 'Stop'

if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..') | Select-Object -First 1).Path
}
if (-not $OutputPath) {
  $OutputPath = Join-Path $RepoRoot 'docs\dev\mobile-contracts.v1.json'
}

$exportScript = Join-Path $RepoRoot 'scripts\dev\mobile-contract\export.js'
if (-not (Test-Path $exportScript)) {
  throw "Missing export script: $exportScript"
}

# ========================================
# Display diagnostic information
# ========================================
Write-Host "`n=== Environment Diagnostics ===" -ForegroundColor Cyan

# Git information
Push-Location $RepoRoot
try {
  $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
  $sha = (git rev-parse HEAD 2>$null)
  $shortSha = (git rev-parse --short HEAD 2>$null)
  if ($branch -and $sha) {
    Write-Host "Git Branch:  $($branch.Trim())" -ForegroundColor DarkGray
    Write-Host "Git Commit:  $($sha.Trim()) ($($shortSha.Trim()))" -ForegroundColor DarkGray
  }
} catch {
  Write-Host "Git info unavailable: $_" -ForegroundColor DarkGray
} finally {
  Pop-Location
}

# Node version
try {
  $nodeVersion = (node --version 2>$null)
  if ($nodeVersion) {
    Write-Host "Node Version: $($nodeVersion.Trim())" -ForegroundColor DarkGray
  }
} catch {
  Write-Host "Node version unavailable" -ForegroundColor DarkGray
}

# OS information
if ($IsLinux -or $IsMacOS) {
  try {
    $osInfo = (uname -a 2>$null)
    if ($osInfo) {
      Write-Host "OS:          $($osInfo.Trim())" -ForegroundColor DarkGray
    }
  } catch {
    Write-Host "OS info unavailable (Unix)" -ForegroundColor DarkGray
  }
} elseif ($IsWindows -or $env:OS -match "Windows") {
  try {
    $osInfo = "$([System.Environment]::OSVersion.VersionString)"
    Write-Host "OS:          $osInfo" -ForegroundColor DarkGray
  } catch {
    Write-Host "OS info unavailable (Windows)" -ForegroundColor DarkGray
  }
} else {
  Write-Host "OS:          Unknown" -ForegroundColor DarkGray
}

Write-Host "================================`n" -ForegroundColor Cyan

# ========================================
# Export to temporary directory (don't modify committed file)
# ========================================
Write-Host "Exporting mobile contracts to temporary directory..." -ForegroundColor Cyan
$tempDir = [System.IO.Path]::GetTempPath()
$tempOutput = Join-Path $tempDir "mobile-contracts-ci-verify-$(Get-Random).json"
Write-Host "  Script: $exportScript" -ForegroundColor DarkGray
Write-Host "  Temp Output: $tempOutput" -ForegroundColor DarkGray
Write-Host "  Committed File: $OutputPath" -ForegroundColor DarkGray
Write-Host ""

& node $exportScript --out $tempOutput
if ($LASTEXITCODE -ne 0) {
  Remove-Item $tempOutput -ErrorAction SilentlyContinue
  throw "Mobile contracts export failed with exit code $LASTEXITCODE"
}

# ========================================
# Verify determinism (run twice to temp files)
# ========================================
Write-Host "`nVerifying deterministic output..." -ForegroundColor Cyan

# Run export again to a second temp file
$tempOutput2 = Join-Path $tempDir "mobile-contracts-ci-verify2-$(Get-Random).json"

& node $exportScript --out $tempOutput2
if ($LASTEXITCODE -ne 0) {
  Remove-Item $tempOutput, $tempOutput2 -ErrorAction SilentlyContinue
  throw "Mobile contracts export (second run) failed with exit code $LASTEXITCODE"
}

# Compare two runs for determinism
$hash1 = (Get-FileHash $tempOutput -Algorithm SHA256).Hash
$hash2 = (Get-FileHash $tempOutput2 -Algorithm SHA256).Hash

if ($hash1 -ne $hash2) {
  Write-Host "`n=== ❌ DETERMINISM FAILED ===" -ForegroundColor Red
  Write-Host "Export script produced different output on consecutive runs." -ForegroundColor Red
  Write-Host "This indicates non-deterministic behavior (e.g., timestamps)." -ForegroundColor Red
  Write-Host ""
  Write-Host "Hash (run 1): $hash1" -ForegroundColor Yellow
  Write-Host "Hash (run 2): $hash2" -ForegroundColor Yellow
  
  Remove-Item $tempOutput, $tempOutput2 -ErrorAction SilentlyContinue
  exit 2
}

Write-Host "  ✓ Export is deterministic (identical output on consecutive runs)" -ForegroundColor Green
Remove-Item $tempOutput2 -ErrorAction SilentlyContinue

# ========================================
# Compare with committed file
# ========================================
if (-not $SkipGitDiff) {
  Write-Host "`nComparing with committed file..." -ForegroundColor Cyan
  
  # Check if committed file exists
  if (-not (Test-Path $OutputPath)) {
    Write-Host "`n=== ❌ VERIFICATION FAILED ===" -ForegroundColor Red
    Write-Host "Committed mobile contracts file not found: $OutputPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "--- How to fix ---" -ForegroundColor Cyan
    Write-Host "  Run the following command:" -ForegroundColor White
    Write-Host "    node scripts/dev/mobile-contract/export.js --out docs/dev/mobile-contracts.v1.json" -ForegroundColor White
    Write-Host "  Then commit the mobile-contracts.v1.json file." -ForegroundColor White
    Write-Host "========================================`n" -ForegroundColor Red
    
    Remove-Item $tempOutput -ErrorAction SilentlyContinue
    exit 3
  }
  
  # Compare temp export with committed file
  $committedHash = (Get-FileHash $OutputPath -Algorithm SHA256).Hash
  $exportedHash = (Get-FileHash $tempOutput -Algorithm SHA256).Hash
  
  if ($committedHash -ne $exportedHash) {
    Write-Host "`n=== ❌ VERIFICATION FAILED ===" -ForegroundColor Red
    Write-Host "docs/dev/mobile-contracts.v1.json is out of date." -ForegroundColor Red
    Write-Host "The mobile contracts export needs to be regenerated." -ForegroundColor Red
    
    # Show file comparison details
    Write-Host "`n--- Hash Comparison ---" -ForegroundColor Yellow
    Write-Host "  Committed: $committedHash" -ForegroundColor DarkGray
    Write-Host "  Generated: $exportedHash" -ForegroundColor DarkGray

    # Try to show meaningful diff
    Push-Location $RepoRoot
    try {
      # Temporarily copy the generated file for diff comparison
      $tempCommitted = Join-Path $tempDir "committed-contracts.json"
      Copy-Item $OutputPath $tempCommitted
      
      Write-Host "`n--- Diff Preview (first 20 lines) ---" -ForegroundColor Yellow
      $diffOutput = git diff --no-index $tempCommitted $tempOutput 2>&1 | Select-Object -First 20
      if ($diffOutput) {
        $diffOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
      }
      
      Remove-Item $tempCommitted -ErrorAction SilentlyContinue
    } catch {
      Write-Host "  Could not generate diff: $_" -ForegroundColor DarkGray
    } finally {
      Pop-Location
    }

    # Show summary of both files
    Write-Host "`n--- Current Committed File ---" -ForegroundColor Yellow
    try {
      $committedContracts = Get-Content $OutputPath | ConvertFrom-Json
      Write-Host "  Version: $($committedContracts.version)" -ForegroundColor DarkGray
      Write-Host "  Source: $($committedContracts.source)" -ForegroundColor DarkGray
      if ($committedContracts.statistics) {
        Write-Host "  Total Endpoints: $($committedContracts.statistics.totalEndpoints)" -ForegroundColor DarkGray
        Write-Host "  MUST Support: $($committedContracts.statistics.mustSupportEndpoints)" -ForegroundColor DarkGray
      }
    } catch {
      Write-Host "  Could not parse committed JSON: $_" -ForegroundColor Red
    }
    
    Write-Host "`n--- Generated File (Expected) ---" -ForegroundColor Yellow
    try {
      $generatedContracts = Get-Content $tempOutput | ConvertFrom-Json
      Write-Host "  Version: $($generatedContracts.version)" -ForegroundColor DarkGray
      Write-Host "  Source: $($generatedContracts.source)" -ForegroundColor DarkGray
      if ($generatedContracts.statistics) {
        Write-Host "  Total Endpoints: $($generatedContracts.statistics.totalEndpoints)" -ForegroundColor DarkGray
        Write-Host "  MUST Support: $($generatedContracts.statistics.mustSupportEndpoints)" -ForegroundColor DarkGray
      }
    } catch {
      Write-Host "  Could not parse generated JSON: $_" -ForegroundColor Red
    }

    Write-Host "`n--- How to fix ---" -ForegroundColor Cyan
    Write-Host "  Run the following command:" -ForegroundColor White
    Write-Host "    node scripts/dev/mobile-contract/export.js --out docs/dev/mobile-contracts.v1.json" -ForegroundColor White
    Write-Host "  Then commit the updated mobile-contracts.v1.json file." -ForegroundColor White
    Write-Host "========================================`n" -ForegroundColor Red
    
    Remove-Item $tempOutput -ErrorAction SilentlyContinue
    exit 3
  }
  
  Write-Host "  ✓ Committed file matches generated output" -ForegroundColor Green
}

# Clean up temp file
Remove-Item $tempOutput -ErrorAction SilentlyContinue

Write-Host "`n✅ Mobile contracts verified successfully" -ForegroundColor Green
Write-Host "  ✓ Export script runs without errors" -ForegroundColor Green
Write-Host "  ✓ Output is deterministic" -ForegroundColor Green
Write-Host "  ✓ Committed file is up-to-date`n" -ForegroundColor Green
