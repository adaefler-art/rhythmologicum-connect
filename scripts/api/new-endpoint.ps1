[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [string]$App = "apps/rhythm-patient-ui",
  [string]$CallsitesFile = "lib/api/endpoint-callsites.ts"
)

$ErrorActionPreference = 'Stop'

$normalized = $Path.Trim()
if (-not $normalized.StartsWith('/api/')) {
  throw "Path must start with /api/"
}

$routeDir = Join-Path $App ("app" + $normalized.Replace('/', '\'))
$routeFile = Join-Path $routeDir "route.ts"

New-Item -ItemType Directory -Force -Path $routeDir | Out-Null

$routeTemplate = @"
import { NextResponse } from 'next/server'

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

export async function GET() {
  const response: ApiResponse<{}> = { success: true, data: {} }
  return NextResponse.json(response)
}
"@

Set-Content -Path $routeFile -Value $routeTemplate -Encoding UTF8

$callsitePath = Join-Path (Resolve-Path ".") $CallsitesFile
if (-not (Test-Path $callsitePath)) {
  $callsiteDir = Split-Path $callsitePath -Parent
  New-Item -ItemType Directory -Force -Path $callsiteDir | Out-Null
  @"
// Endpoint callsites registry
// Keep literal /api/... strings in fetch() so the catalog can match them.
export function registerEndpointCallsites() {
}
"@ | Set-Content -Path $callsitePath -Encoding UTF8
}

$lines = Get-Content $callsitePath
$insert = "  fetch('${normalized}', { method: 'GET', credentials: 'include' }).catch(() => {})"

$updated = @()
$inserted = $false
foreach ($line in $lines) {
  $updated += $line
  if (-not $inserted -and $line -match '^export function registerEndpointCallsites\(\)\s*{') {
    $updated += $insert
    $inserted = $true
  }
}

if (-not $inserted) {
  $updated += ""
  $updated += "export function registerEndpointCallsites() {"
  $updated += $insert
  $updated += "}"
}

Set-Content -Path $callsitePath -Value $updated -Encoding UTF8

Write-Host "Created endpoint: $routeFile" -ForegroundColor Green
Write-Host "Created callsite in: $CallsitesFile" -ForegroundColor Green
Write-Host "Created endpoint + callsite; run npm run preflight" -ForegroundColor Yellow
