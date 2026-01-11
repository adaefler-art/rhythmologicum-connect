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

Write-Host "Running endpoint catalog generator..." -ForegroundColor Cyan
& node $generator --repo-root $RepoRoot --out-dir $OutDir --allowlist $Allowlist
if ($LASTEXITCODE -ne 0) {
  throw "Endpoint catalog generator failed with exit code $LASTEXITCODE"
}

if (-not $SkipGitDiff) {
  Push-Location $RepoRoot
  try {
    $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
    $sha = (git rev-parse --short HEAD 2>$null)
    if ($branch -and $sha) {
      Write-Host ("Git: {0}@{1}" -f $branch.Trim(), $sha.Trim()) -ForegroundColor DarkGray
    }

    $diff = git diff --name-only -- 'docs/api'
    if ($diff) {
      Write-Host "❌ docs/api is out of date. Run:" -ForegroundColor Red
      Write-Host "  node scripts/dev/endpoint-catalog/generate.js --repo-root . --out-dir docs/api --allowlist docs/api/endpoint-allowlist.json" -ForegroundColor Yellow
      Write-Host "Then commit updated docs/api artifacts." -ForegroundColor Yellow
      Write-Host "\nChanged files:" -ForegroundColor Red
      $diff | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }

      Write-Host "\nDiff stat:" -ForegroundColor DarkGray
      git diff --stat -- 'docs/api' | ForEach-Object { Write-Host $_ -ForegroundColor DarkGray }
      exit 3
    }
  } finally {
    Pop-Location
  }
}

Write-Host "✅ Endpoint catalog verified" -ForegroundColor Green
