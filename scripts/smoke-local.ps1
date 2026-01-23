#Requires -Version 7.0

$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3000'

function Get-StatusCode {
  param(
    [string]$Url,
    [hashtable]$Headers
  )

  $response = Invoke-WebRequest -UseBasicParsing -SkipHttpErrorCheck -Uri $Url -Headers $Headers
  return $response
}

function Test-Route {
  param([string]$Path)

  $url = "$base$Path"
  $response = Get-StatusCode -Url $url
  $status = $response.StatusCode

  $isRedirect = $status -in 301,302,303,307,308
  $isOk = $status -eq 200

  if ($isOk -or $isRedirect) {
    Write-Host "PASS ROUTE $Path -> $status" -ForegroundColor Green
  } else {
    Write-Host "FAIL ROUTE $Path -> $status" -ForegroundColor Red
  }
}

Write-Host "Base URL: $base" -ForegroundColor Cyan

$routes = @(
  '/patient/dashboard',
  '/patient/assess',
  '/patient/dialog',
  '/patient/profile'
)

foreach ($route in $routes) {
  Test-Route -Path $route
}

$apiUrl = "$base/api/funnels/catalog"
$apiResponse = Get-StatusCode -Url $apiUrl
$apiStatus = $apiResponse.StatusCode
$wwwAuth = $apiResponse.Headers['WWW-Authenticate']
$apiSnippet = ''
if ($apiResponse.Content) {
  $apiSnippet = $apiResponse.Content.Substring(0, [Math]::Min(300, $apiResponse.Content.Length))
}

if ($apiStatus -eq 401) {
  Write-Host "PASS API_UNAUTH /api/funnels/catalog -> $apiStatus" -ForegroundColor Green
} else {
  Write-Host "FAIL API_UNAUTH /api/funnels/catalog -> $apiStatus" -ForegroundColor Red
}

if ($wwwAuth) {
  Write-Host "WWW-Authenticate: $wwwAuth"
}
if ($apiSnippet) {
  Write-Host "Body snippet: $apiSnippet"
}

if ($env:RHYTHM_PATIENT_COOKIE) {
  $authHeaders = @{ Cookie = $env:RHYTHM_PATIENT_COOKIE }
  $authResponse = Get-StatusCode -Url $apiUrl -Headers $authHeaders
  $authStatus = $authResponse.StatusCode

  if ($authStatus -eq 200) {
    Write-Host "PASS API_AUTH /api/funnels/catalog -> $authStatus" -ForegroundColor Green
    try {
      $json = $authResponse.Content | ConvertFrom-Json
      $keys = $json.PSObject.Properties.Name | Select-Object -First 5
      if ($keys) {
        Write-Host "JSON keys: $($keys -join ', ')"
      }
    } catch {
      Write-Host 'WARN API_AUTH response not JSON.' -ForegroundColor Yellow
    }
  } else {
    Write-Host "FAIL API_AUTH /api/funnels/catalog -> $authStatus" -ForegroundColor Red
  }
} else {
  Write-Host 'SKIP API_AUTH (RHYTHM_PATIENT_COOKIE not set)' -ForegroundColor Yellow
}
