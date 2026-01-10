[CmdletBinding()]
param(
  [string]$Since = '2025-12-30',
  [string]$RepoRoot,
  [string]$OutDir,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

function Write-Info([string]$msg) {
  if (-not $Quiet) { Write-Host $msg }
}

if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..') | Select-Object -First 1).Path
}
if (-not $OutDir) {
  $OutDir = Join-Path $RepoRoot 'docs\v0.5'
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$cmd = "git -C `"$RepoRoot`" log --since=`"$Since`" --name-only --pretty=format:"
$raw = Invoke-Expression $cmd

$files = $raw | Where-Object { $_ -and $_.Trim() -ne '' } | Sort-Object -Unique

$mdPath = Join-Path $OutDir 'CHANGED_FILES_SINCE_2025-12-30.md'
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('# Changed Files Since 2025-12-30')
$lines.Add('')
$lines.Add("Evidence command:")
$lines.Add('```powershell')
$lines.Add('git log --since="2025-12-30" --name-only --pretty=format: | sort | uniq')
$lines.Add('```')
$lines.Add('')
$lines.Add("Total unique files: $($files.Count)")
$lines.Add('')
foreach ($f in $files) { $lines.Add("- $f") }

Set-Content -LiteralPath $mdPath -Encoding UTF8 -Value ($lines -join "`n")
Write-Info "Wrote: $mdPath"
