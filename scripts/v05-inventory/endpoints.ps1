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

$appApiRoot = Join-Path $RepoRoot 'app\api'
if (-not (Test-Path $appApiRoot)) {
  throw "app/api not found at $appApiRoot"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$routeFiles = Get-ChildItem -Recurse -File $appApiRoot -Filter 'route.ts' | Sort-Object FullName

# Helpers
function Get-RelPath([string]$basePath, [string]$targetPath) {
  $base = (Resolve-Path -LiteralPath $basePath).Path
  $target = (Resolve-Path -LiteralPath $targetPath).Path

  # Ensure base ends with a directory separator so MakeRelativeUri behaves as expected
  if (-not $base.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $base = $base + [System.IO.Path]::DirectorySeparatorChar
  }

  $baseUri = New-Object System.Uri($base)
  $targetUri = New-Object System.Uri($target)
  $rel = $baseUri.MakeRelativeUri($targetUri).ToString()
  return [System.Uri]::UnescapeDataString($rel)
}

function To-RoutePattern([string]$fullPath) {
  $rel = Get-RelPath $RepoRoot $fullPath

  # Convert app\api\foo\[id]\route.ts -> /api/foo/[id]
  $routeRel = $rel -replace '^app[\\/]+api[\\/]+', ''
  $routeRel = $routeRel -replace '[\\/]+route\.ts$', ''
  $routeRel = $routeRel -replace '[\\/]+', '/'
  return "/api/$routeRel"
}

function Extract-Methods([string]$content) {
  $methods = @()
  $pattern = 'export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b'
  foreach ($m in [regex]::Matches($content, $pattern, 'IgnoreCase')) {
    $methods += $m.Groups[2].Value.ToUpperInvariant()
  }
  return ($methods | Select-Object -Unique)
}

function Guess-Auth([string]$content) {
  $hints = @()
  if ($content -match 'createServerSupabaseClient\(' -or $content -match "@/lib/db/supabase\.server") { $hints += 'supabase.server' }
  if ($content -match 'createAdminSupabaseClient\(' -or $content -match "@/lib/db/supabase\.admin") { $hints += 'supabase.admin' }
  if ($content -match '\.auth\.getUser\(') { $hints += 'auth.getUser' }
  if ($content -match 'hasClinicianRole\(') { $hints += 'hasClinicianRole' }
  if ($content -match 'USER_ROLE\.' -or $content -match 'app_metadata\s*:\s*\{\s*role') { $hints += 'role-check' }
  return ($hints | Select-Object -Unique) -join ', '
}

function Guess-DataSource([string]$content) {
  $sources = @()
  # Detect Supabase table access: .from('table') / .from("table")
  if ($content -match '\.from\(\s*[\x27\x22][^\x27\x22]+[\x27\x22]') { $sources += 'db(supabase)' }
  if ($content -match 'registry' -or $content -match 'FUNNEL_SLUG' -or $content -match 'getCanonicalFunnelSlug') { $sources += 'registry' }
  if ($content -match 'fs\.' -or $content -match 'readFile' -or $content -match 'public\/') { $sources += 'filesystem/static' }
  if ($content -match 'NextResponse\.redirect' -or $content -match 'cookies\(') { $sources += 'runtime/session' }
  return ($sources | Select-Object -Unique) -join ', '
}

# Quick response-shape hints: best-effort only
function Guess-ResponseShape([string]$content) {
  $shapes = @()
  if ($content -match 'NextResponse\.json\(\s*\[\s*\]') { $shapes += 'json: []' }
  if ($content -match 'success\s*:\s*(true|false)') { $shapes += 'json: {success,...}' }
  if ($content -match 'error\s*:\s*\{') { $shapes += 'json: {error:{...}}' }
  if ($content -match 'requestId') { $shapes += 'json: {requestId,...}' }
  return ($shapes | Select-Object -Unique) -join ', '
}

$rows = foreach ($f in $routeFiles) {
  $content = Get-Content -Raw -LiteralPath $f.FullName
  [pscustomobject]@{
    Route = To-RoutePattern $f.FullName
    File = (Get-RelPath $RepoRoot $f.FullName) -replace '\\','/'
    Methods = (Extract-Methods $content) -join ', '
    AuthHints = Guess-Auth $content
    DataSourceHints = Guess-DataSource $content
    ResponseHints = Guess-ResponseShape $content
  }
}

$csvPath = Join-Path $OutDir 'endpoint-inventory.csv'
$mdPath = Join-Path $OutDir 'ENDPOINT_INVENTORY.md'

$rows | Export-Csv -NoTypeInformation -Encoding UTF8 $csvPath

$generatedAt = (Get-Date).ToString('s')
$head = @(
  "# Endpoint Inventory (v0.5)",
  "",
  "Generated: $generatedAt",
  "",
  "Evidence commands:",
  '```powershell',
  'Get-ChildItem -Recurse -File app/api -Filter route.ts | % FullName',
  'rg -n "export async function (GET|POST|PUT|PATCH|DELETE)" app/api',
  '```',
  "",
  "## Inventory",
  "",
  "| Route | Methods | Auth hints | Data source | Response hints | File |",
  "| --- | --- | --- | --- | --- | --- |"
)

$lines = New-Object System.Collections.Generic.List[string]
foreach ($h in $head) {
  $lines.Add([string]$h)
}

foreach ($r in $rows) {
  $route = $r.Route
  $methods = if ($r.Methods) { $r.Methods } else { '(none detected)' }
  $auth = if ($r.AuthHints) { $r.AuthHints } else { '' }
  $ds = if ($r.DataSourceHints) { $r.DataSourceHints } else { '' }
  $resp = if ($r.ResponseHints) { $r.ResponseHints } else { '' }
  $file = $r.File
  $lines.Add("| $route | $methods | $auth | $ds | $resp | $file |")
}

Set-Content -LiteralPath $mdPath -Encoding UTF8 -Value ($lines -join "`n")

Write-Info "Wrote: $mdPath"
Write-Info "Wrote: $csvPath"
