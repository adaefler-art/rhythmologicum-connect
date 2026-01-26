[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$OutDir,
  [string]$Allowlist,
  [switch]$SkipGitDiff
)

$ErrorActionPreference = 'Stop'

if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..') | Select-Object -First 1).Path
}
if (-not $OutDir) {
  $OutDir = Join-Path $RepoRoot 'docs\api'
}
if (-not $Allowlist) {
  $Allowlist = Join-Path $RepoRoot 'docs\api\endpoint-allowlist.json'
}

$generator = Join-Path $RepoRoot 'scripts\dev\endpoint-catalog\generate.js'
if (-not (Test-Path $generator)) {
  throw "Missing generator: $generator"
}

# ========================================
# Fail fast if tracked .next artifacts exist
# ========================================
Push-Location $RepoRoot
try {
  $trackedNext = git ls-files "**/.next/**" 2>$null
  if ($trackedNext) {
    Write-Host "❌ Tracked .next artifacts detected. Remove them from git index." -ForegroundColor Red
    $trackedNext | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    throw "Tracked .next artifacts present"
  }
} finally {
  Pop-Location
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
# Run endpoint catalog generator
# ========================================
Write-Host "Running endpoint catalog generator..." -ForegroundColor Cyan
$generatorOutput = & node $generator --repo-root $RepoRoot --out-dir $OutDir --allowlist $Allowlist 2>&1
$generatorExitCode = $LASTEXITCODE
if ($generatorOutput) {
  $generatorOutput | ForEach-Object { Write-Host $_ }
}
if ($generatorExitCode -ne 0) {
  $catalogPath = Join-Path $OutDir 'endpoint-catalog.json'
  Write-Host "`n--- Orphan endpoints ---" -ForegroundColor Yellow
  try {
    $catalog = Get-Content $catalogPath -Raw | ConvertFrom-Json
    $orphans = @()
    foreach ($endpoint in @($catalog.endpoints)) {
      $allowlisted = $false
      if ($null -ne $endpoint.allowlisted) { $allowlisted = [bool]$endpoint.allowlisted }
      elseif ($null -ne $endpoint.isAllowedOrphan) { $allowlisted = [bool]$endpoint.isAllowedOrphan }

      $callsites = if ($null -ne $endpoint.callsites) { $endpoint.callsites } elseif ($null -ne $endpoint.usedBy) { $endpoint.usedBy } else { @() }
      if (-not $allowlisted -and @($callsites).Count -eq 0) {
        $orphans += $endpoint
      }
    }

    if ($orphans.Count -eq 0) {
      Write-Host "  (none)" -ForegroundColor DarkGray
    } else {
      $orphans | ForEach-Object {
        $method = if ($_.methods -and $_.methods.Count -gt 0) { ($_.methods -join ', ') } else { '(none)' }
        $path = $_.path
        $provenance = if ($_.file) { $_.file } elseif ($_.source) { $_.source } else { '' }
        [PSCustomObject]@{ method = $method; path = $path; provenance = $provenance }
      } | Format-Table -AutoSize
    }
  } catch {
    Write-Host "Failed to parse endpoint-catalog.json for orphan diagnostics." -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor DarkGray
  }

  Write-Host "FIX: Add a literal callsite fetch('/api/...') OR add to docs/api/endpoint-allowlist.json with justification." -ForegroundColor Yellow
  throw "Endpoint catalog generator failed with exit code $generatorExitCode"
}

# ========================================
# Verify no git changes
# ========================================
if (-not $SkipGitDiff) {
  Push-Location $RepoRoot
  try {
    $diff = git diff --name-only -- 'docs/api'
    if ($diff) {
      Write-Host "`n=== ❌ VERIFICATION FAILED ===" -ForegroundColor Red
      Write-Host "docs/api is out of date. The endpoint catalog needs to be regenerated." -ForegroundColor Red
      
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
      git diff --stat -- 'docs/api' | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }

      # Show preview of ENDPOINT_CATALOG.md
      $catalogPath = Join-Path $OutDir 'ENDPOINT_CATALOG.md'
      if (Test-Path $catalogPath) {
        Write-Host "`n--- First 30 lines of ENDPOINT_CATALOG.md ---" -ForegroundColor Yellow
        Get-Content $catalogPath -TotalCount 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
        $totalLines = (Get-Content $catalogPath | Measure-Object -Line).Lines
        if ($totalLines -gt 30) {
          Write-Host "  ... ($($totalLines - 30) more lines)" -ForegroundColor DarkGray
        }
      } else {
        Write-Host "`n--- ENDPOINT_CATALOG.md not found ---" -ForegroundColor Red
        Write-Host "  Expected at: $catalogPath" -ForegroundColor Red
      }

      Write-Host "`n--- How to fix ---" -ForegroundColor Cyan
      Write-Host "  Run the following command:" -ForegroundColor White
      Write-Host "    node scripts/dev/endpoint-catalog/generate.js --repo-root . --out-dir docs/api --allowlist docs/api/endpoint-allowlist.json" -ForegroundColor White
      Write-Host "  Then commit the updated docs/api artifacts." -ForegroundColor White
      Write-Host "========================================`n" -ForegroundColor Red
      
      exit 3
    }
  } finally {
    Pop-Location
  }
}

Write-Host "`n✅ Endpoint catalog verified successfully" -ForegroundColor Green
