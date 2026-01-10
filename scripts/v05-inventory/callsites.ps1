[CmdletBinding()]
param(
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

# Collect endpoint patterns from route.ts files (source of truth)
$endpointCsv = Join-Path $OutDir 'endpoint-inventory.csv'
if (-not (Test-Path $endpointCsv)) {
  throw "Missing $endpointCsv. Run scripts/v05-inventory/endpoints.ps1 first."
}

$endpoints = Import-Csv $endpointCsv

# Search for callsites referencing /api/ (string scan)
$searchRoots = @(
  (Join-Path $RepoRoot 'app')
  (Join-Path $RepoRoot 'lib')
)

# Use ripgrep if available; fallback to Select-String
function Run-Rg([string]$pattern, [string[]]$paths) {
  $rg = Get-Command rg -ErrorAction SilentlyContinue
  if (-not $rg) { return $null }
  $args = @('-n','--no-heading','--hidden','--glob','!**/node_modules/**','--glob','!**/.next/**',$pattern) + $paths
  $out = & $rg @args 2>$null
  return $out
}

$rawMatches = New-Object System.Collections.Generic.List[object]

$rgOut = Run-Rg '\/api\/' $searchRoots
if ($rgOut) {
  foreach ($line in $rgOut) {
    # format: path:line:col:text
    if ($line -match '^(.*?):(\d+):(\d+):(.*)$') {
      $rawMatches.Add([pscustomobject]@{
        File = $matches[1].Substring($RepoRoot.Length).TrimStart('\\','/')
        Line = [int]$matches[2]
        Text = $matches[4]
      })
    }
  }
} else {
  foreach ($root in $searchRoots) {
    $hits = Select-String -Path (Join-Path $root '**\\*.ts*') -Pattern '\/api\/' -AllMatches -ErrorAction SilentlyContinue
    foreach ($h in $hits) {
      $rawMatches.Add([pscustomobject]@{
        File = $h.Path.Substring($RepoRoot.Length).TrimStart('\\','/')
        Line = [int]$h.LineNumber
        Text = $h.Line.Trim()
      })
    }
  }
}

# Normalize potential /api/... strings from lines
function Extract-ApiStrings([string]$text) {
  $results = @()
  foreach ($m in [regex]::Matches($text, '(\/api\/[A-Za-z0-9_\-\/\[\]\$\{\}]+)')) {
    $results += $m.Groups[1].Value
  }
  return ($results | Select-Object -Unique)
}

$callRows = foreach ($m in $rawMatches) {
  foreach ($api in (Extract-ApiStrings $m.Text)) {
    [pscustomobject]@{
      Api = $api
      Caller = "${($m.File)}#L$($m.Line)"
      File = $m.File
      Line = $m.Line
    }
  }
}

# Map discovered api strings to known endpoint patterns by simple prefix matching.
# This is heuristic (dynamic routes will not match perfectly).
$map = @{}
foreach ($ep in $endpoints) {
  $map[$ep.Route] = @()
}

foreach ($c in $callRows) {
  $best = $null
  $bestLen = -1
  foreach ($ep in $endpoints) {
    $route = $ep.Route
    # Convert /api/foo/[id] to prefix /api/foo/
    $prefix = $route -replace '\[.*?\]', ''
    if ($c.Api.StartsWith($prefix) -and $prefix.Length -gt $bestLen) {
      $best = $route
      $bestLen = $prefix.Length
    }
  }
  if ($best) {
    $map[$best] += $c
  } else {
    if (-not $map.ContainsKey('__unmapped__')) { $map['__unmapped__'] = @() }
    $map['__unmapped__'] += $c
  }
}

$mdPath = Join-Path $OutDir 'CALLSITE_MAP.md'
$generatedAt = (Get-Date).ToString('s')

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('# Callsite Map (v0.5)')
$lines.Add('')
$lines.Add("Generated: $generatedAt")
$lines.Add('')
$lines.Add('Evidence commands:')
$lines.Add('```powershell')
$lines.Add('rg -n "/api/" app lib')
$lines.Add('```')
$lines.Add('')
$lines.Add('## Endpoint -> Callers')
$lines.Add('')

foreach ($key in ($map.Keys | Sort-Object)) {
  if ($key -eq '__unmapped__') { continue }
  $callers = $map[$key]
  $lines.Add("### $key")
  if (-not $callers -or $callers.Count -eq 0) {
    $lines.Add('- no known caller (string scan)')
    $lines.Add('')
    continue
  }

  # Deduplicate by file+line
  $uniq = $callers | Sort-Object File,Line -Unique
  foreach ($u in $uniq) {
    $lines.Add("- $($u.Caller)")
  }
  $lines.Add('')
}

if ($map.ContainsKey('__unmapped__')) {
  $lines.Add('## Unmapped /api references')
  $lines.Add('')
  $uniq = $map['__unmapped__'] | Sort-Object File,Line -Unique
  foreach ($u in $uniq) {
    $lines.Add("- $($u.Api) @ $($u.Caller)")
  }
  $lines.Add('')
}

Set-Content -LiteralPath $mdPath -Encoding UTF8 -Value ($lines -join "`n")
Write-Info "Wrote: $mdPath"
