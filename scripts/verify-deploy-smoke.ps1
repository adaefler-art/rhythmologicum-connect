param(
  [string]$PatientBaseUrl = $env:PATIENT_BASE_URL,
  [string]$StudioBaseUrl = $env:STUDIO_BASE_URL,
  [string]$EngineBaseUrl = $env:ENGINE_BASE_URL
)

function Require-BaseUrl([string]$value, [string]$name) {
  if (-not $value) {
    throw "Missing $name. Provide -$name or set $name in environment."
  }
}

function Invoke-Check([string]$url, [int[]]$expectedStatuses) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0
    if ($expectedStatuses -notcontains $response.StatusCode) {
      throw "Unexpected status $($response.StatusCode) for $url"
    }
    Write-Host "OK $($response.StatusCode) $url"
  } catch {
    if ($_.Exception.Response) {
      $status = $_.Exception.Response.StatusCode.value__
      if ($expectedStatuses -contains $status) {
        Write-Host "OK $status $url"
        return
      }
      throw "Unexpected status $status for $url"
    }
    throw
  }
}

Require-BaseUrl $PatientBaseUrl 'PATIENT_BASE_URL'
Require-BaseUrl $StudioBaseUrl 'STUDIO_BASE_URL'
Require-BaseUrl $EngineBaseUrl 'ENGINE_BASE_URL'

$patientRoutes = @(
  '/datenschutz',
  '/impressum',
  '/patient'
)

$studioRoutes = @(
  '/datenschutz',
  '/impressum',
  '/admin'
)

$engineRoutes = @(
  '/api/test/correlation-id'
)

foreach ($route in $patientRoutes) {
  Invoke-Check "$PatientBaseUrl$route" @(200)
}

foreach ($route in $studioRoutes) {
  Invoke-Check "$StudioBaseUrl$route" @(200)
}

foreach ($route in $engineRoutes) {
  Invoke-Check "$EngineBaseUrl$route" @(200)
}

Invoke-Check "$EngineBaseUrl/api/health/env" @(200, 401, 403)

if ($env:DIAGNOSIS_SMOKE_ENABLED -eq '1') {
  Write-Host "Running diagnosis post-deploy smoke..." -ForegroundColor Cyan
  node scripts/verify/verify-diagnosis-smoke.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "Diagnosis post-deploy smoke failed (see output above)."
  }
} else {
  Write-Host "Diagnosis post-deploy smoke skipped (set DIAGNOSIS_SMOKE_ENABLED=1)." -ForegroundColor Gray
}
