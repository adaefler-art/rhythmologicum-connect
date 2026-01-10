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
  $OutDir = Join-Path $RepoRoot 'docs\dev'
}
if (-not $Allowlist) {
  $Allowlist = Join-Path $RepoRoot 'docs\dev\endpoint-allowlist.json'
}

$generator = Join-Path $RepoRoot 'scripts\dev\endpoint-catalog\generate.js'
if (-not (Test-Path $generator)) {
  throw "Missing generator: $generator"
}

Write-Host "Running endpoint catalog generator..." -ForegroundColor Cyan
& node $generator --repo-root $RepoRoot --out-dir $OutDir --allowlist $Allowlist
if ($LASTEXITCODE -ne 0) {
  throw "Endpoint catalog generator failed with exit code $LASTEXITCODE"
}

if (-not $SkipGitDiff) {
  Push-Location $RepoRoot
  try {
    $diff = git diff --name-only -- 'docs/dev'
    if ($diff) {
      Write-Host "❌ docs/dev is out of date. Run:" -ForegroundColor Red
      Write-Host "  node scripts/dev/endpoint-catalog/generate.js --repo-root . --out-dir docs/dev --allowlist docs/dev/endpoint-allowlist.json" -ForegroundColor Yellow
      Write-Host "Then commit updated docs/dev artifacts." -ForegroundColor Yellow
      Write-Host "\nChanged files:" -ForegroundColor Red
      $diff | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
      exit 3
    }
  } finally {
    Pop-Location
  }
}

Write-Host "✅ Endpoint catalog verified" -ForegroundColor Green
