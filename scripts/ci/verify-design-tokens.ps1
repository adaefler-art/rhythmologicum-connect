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
  $OutputPath = Join-Path $RepoRoot 'docs\dev\design-tokens.json'
}

$exportScript = Join-Path $RepoRoot 'scripts\dev\design-tokens\export.js'
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
# Run design tokens export script
# ========================================
Write-Host "Running design tokens export..." -ForegroundColor Cyan
Write-Host "  Script: $exportScript" -ForegroundColor DarkGray
Write-Host "  Output: $OutputPath" -ForegroundColor DarkGray
Write-Host ""

& node $exportScript --out $OutputPath
if ($LASTEXITCODE -ne 0) {
  throw "Design tokens export failed with exit code $LASTEXITCODE"
}

# ========================================
# Verify determinism (run twice)
# ========================================
Write-Host "`nVerifying deterministic output..." -ForegroundColor Cyan

# Save first run
$tempFile1 = [System.IO.Path]::GetTempFileName()
Copy-Item $OutputPath $tempFile1

# Run again
& node $exportScript --out $OutputPath
if ($LASTEXITCODE -ne 0) {
  throw "Design tokens export (second run) failed with exit code $LASTEXITCODE"
}

# Compare
$tempFile2 = [System.IO.Path]::GetTempFileName()
Copy-Item $OutputPath $tempFile2

$hash1 = (Get-FileHash $tempFile1 -Algorithm SHA256).Hash
$hash2 = (Get-FileHash $tempFile2 -Algorithm SHA256).Hash

if ($hash1 -ne $hash2) {
  Write-Host "`n=== ❌ DETERMINISM FAILED ===" -ForegroundColor Red
  Write-Host "Export script produced different output on consecutive runs." -ForegroundColor Red
  Write-Host "This indicates non-deterministic behavior (e.g., timestamps)." -ForegroundColor Red
  Write-Host ""
  Write-Host "Hash (run 1): $hash1" -ForegroundColor Yellow
  Write-Host "Hash (run 2): $hash2" -ForegroundColor Yellow
  
  Remove-Item $tempFile1, $tempFile2 -ErrorAction SilentlyContinue
  exit 2
}

Write-Host "  ✓ Export is deterministic (identical output on consecutive runs)" -ForegroundColor Green
Remove-Item $tempFile1, $tempFile2 -ErrorAction SilentlyContinue

# ========================================
# Verify no git changes
# ========================================
if (-not $SkipGitDiff) {
  Push-Location $RepoRoot
  try {
    $diff = git diff --name-only -- 'docs/dev/design-tokens.json'
    if ($diff) {
      Write-Host "`n=== ❌ VERIFICATION FAILED ===" -ForegroundColor Red
      Write-Host "docs/dev/design-tokens.json is out of date." -ForegroundColor Red
      Write-Host "The design tokens export needs to be regenerated." -ForegroundColor Red
      
      Write-Host "`n--- Changed files ---" -ForegroundColor Yellow
      $diff | ForEach-Object { 
        $filePath = Join-Path $RepoRoot $_
        $exists = Test-Path $filePath
        if ($exists) {
          Write-Host "  ✓ $_" -ForegroundColor Yellow
        } else {
          Write-Host "  ✗ $_ (missing)" -ForegroundColor Red
        }
      }

      Write-Host "`n--- Diff statistics ---" -ForegroundColor Yellow
      git diff --stat -- 'docs/dev/design-tokens.json' | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }

      # Show summary of design-tokens.json
      if (Test-Path $OutputPath) {
        Write-Host "`n--- Design tokens summary ---" -ForegroundColor Yellow
        try {
          $tokens = Get-Content $OutputPath | ConvertFrom-Json
          Write-Host "  Version: $($tokens.version)" -ForegroundColor DarkGray
          Write-Host "  Source: $($tokens.source)" -ForegroundColor DarkGray
          if ($tokens.themes) {
            $themeNames = ($tokens.themes | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) -join ', '
            Write-Host "  Themes: $themeNames" -ForegroundColor DarkGray
          }
          if ($tokens.brands) {
            $brandNames = ($tokens.brands | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) -join ', '
            Write-Host "  Brands: $brandNames" -ForegroundColor DarkGray
          }
          if ($tokens.resolved) {
            $resolvedNames = ($tokens.resolved | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) -join ', '
            Write-Host "  Resolved: $resolvedNames" -ForegroundColor DarkGray
          }
        } catch {
          Write-Host "  Could not parse JSON: $_" -ForegroundColor Red
        }
      } else {
        Write-Host "`n--- design-tokens.json not found ---" -ForegroundColor Red
        Write-Host "  Expected at: $OutputPath" -ForegroundColor Red
      }

      Write-Host "`n--- How to fix ---" -ForegroundColor Cyan
      Write-Host "  Run the following command:" -ForegroundColor White
      Write-Host "    node scripts/dev/design-tokens/export.js --out docs/dev/design-tokens.json" -ForegroundColor White
      Write-Host "  Then commit the updated design-tokens.json file." -ForegroundColor White
      Write-Host "========================================`n" -ForegroundColor Red
      
      exit 3
    }
  } finally {
    Pop-Location
  }
}

Write-Host "`n✅ Design tokens verified successfully" -ForegroundColor Green
Write-Host "  ✓ Export script runs without errors" -ForegroundColor Green
Write-Host "  ✓ Output is deterministic" -ForegroundColor Green
Write-Host "  ✓ Committed file is up-to-date`n" -ForegroundColor Green
