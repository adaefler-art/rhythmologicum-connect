# V061-I06 - Pilot Smoke Runner
# One Command → Evidence Pack (Pass/Fail)
#
# Usage:
#   ./scripts/audit/run-v061-smoke.ps1 -BaseUrl http://localhost:3000
#   ./scripts/audit/run-v061-smoke.ps1 -BaseUrl http://localhost:3000 -SkipBuild -SkipTest

param(
  [Parameter(Mandatory=$true)]
  [string]$BaseUrl,
  
  [switch]$SkipBuild,
  [switch]$SkipTest
)

# Configuration
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$evidenceDir = ".audit/v061/$timestamp"
$summaryMd = "$evidenceDir/summary.md"
$summaryJson = "$evidenceDir/summary.json"
$httpLog = "$evidenceDir/http.log"

# Results tracking
$results = @{
  timestamp = $timestamp
  baseUrl = $BaseUrl
  checks = @()
  buildResult = $null
  testResult = $null
  overallStatus = "PASS"
}

# Create evidence directory
Write-Host "Creating evidence directory: $evidenceDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null

# Initialize HTTP log
"# HTTP Log - $timestamp`n" | Out-File -FilePath $httpLog -Encoding UTF8

function Write-HttpLog {
  param([string]$message)
  $message | Out-File -FilePath $httpLog -Append -Encoding UTF8
}

function Invoke-UrlCheck {
  param(
    [string]$url,
    [int[]]$expectedStatuses,
    [string]$description
  )
  
  $checkResult = @{
    url = $url
    description = $description
    expectedStatuses = $expectedStatuses
    actualStatus = $null
    result = "FAIL"
    error = $null
    timestamp = (Get-Date -Format "o")
  }
  
  Write-Host "`nChecking: $description" -ForegroundColor Yellow
  Write-Host "  URL: $url" -ForegroundColor Gray
  Write-Host "  Expected: $($expectedStatuses -join ', ')" -ForegroundColor Gray
  
  Write-HttpLog "`n=== $description ==="
  Write-HttpLog "Timestamp: $(Get-Date -Format 'o')"
  Write-HttpLog "URL: $url"
  Write-HttpLog "Expected Status Codes: $($expectedStatuses -join ', ')"
  
  try {
    # Make request without following redirects
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
    $actualStatus = $response.StatusCode
    
    Write-HttpLog "Actual Status: $actualStatus"
    Write-HttpLog "Response Headers:"
    foreach ($headerItem in $response.Headers.GetEnumerator()) {
      # Redact sensitive headers
      $headerValue = $headerItem.Value
      if ($headerItem.Key -match "cookie|authorization|token|secret|api-key") {
        $headerValue = "[REDACTED]"
      }
      Write-HttpLog "  $($headerItem.Key): $headerValue"
    }
    
  } catch {
    # Handle HTTP errors (redirects, 4xx, 5xx)
    if ($_.Exception.Response) {
      $actualStatus = [int]$_.Exception.Response.StatusCode
      Write-HttpLog "Actual Status: $actualStatus (from exception)"
      
      # Log response headers if available
      if ($_.Exception.Response.Headers) {
        Write-HttpLog "Response Headers:"
        foreach ($headerName in $_.Exception.Response.Headers) {
          $headerValue = $_.Exception.Response.Headers[$headerName]
          if ($headerName -match "cookie|authorization|token|secret|api-key") {
            $headerValue = "[REDACTED]"
          }
          Write-HttpLog "  ${headerName}: $headerValue"
        }
      }
    } else {
      # Network error or other issue
      $checkResult.error = $_.Exception.Message
      $checkResult.result = "FAIL"
      $results.overallStatus = "FAIL"
      Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
      Write-HttpLog "Error: $($_.Exception.Message)"
      $results.checks += $checkResult
      return $checkResult
    }
  }
  
  $checkResult.actualStatus = $actualStatus
  
  # Check if status is in expected range
  if ($expectedStatuses -contains $actualStatus) {
    $checkResult.result = "PASS"
    Write-Host "  ✅ PASS: Got $actualStatus" -ForegroundColor Green
    Write-HttpLog "Result: PASS"
  } else {
    $checkResult.result = "FAIL"
    $checkResult.error = "Unexpected status code: $actualStatus (expected: $($expectedStatuses -join ', '))"
    Write-Host "  ❌ FAIL: Got $actualStatus (expected: $($expectedStatuses -join ', '))" -ForegroundColor Red
    Write-HttpLog "Result: FAIL - $($checkResult.error)"
    $results.overallStatus = "FAIL"
  }
  
  $results.checks += $checkResult
  return $checkResult
}

# Header
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "V061-I06 Pilot Smoke Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host "Evidence Dir: $evidenceDir"
Write-Host "Skip Build: $SkipBuild"
Write-Host "Skip Test: $SkipTest"
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Optional Build
if (-not $SkipBuild) {
  Write-Host "`n--- Running Build ---" -ForegroundColor Cyan
  Write-HttpLog "`n=== Build Step ==="
  Write-HttpLog "Command: npm run build"
  
  try {
    $buildOutput = npm run build 2>&1
    $buildExitCode = $LASTEXITCODE
    
    if ($buildExitCode -eq 0) {
      $results.buildResult = "PASS"
      Write-Host "✅ Build: PASS" -ForegroundColor Green
      Write-HttpLog "Build Result: PASS"
    } else {
      $results.buildResult = "FAIL"
      $results.overallStatus = "FAIL"
      Write-Host "❌ Build: FAIL (exit code: $buildExitCode)" -ForegroundColor Red
      Write-HttpLog "Build Result: FAIL (exit code: $buildExitCode)"
      Write-HttpLog "Build Output (last 50 lines):"
      $buildOutput | Select-Object -Last 50 | ForEach-Object { Write-HttpLog "  $_" }
    }
  } catch {
    $results.buildResult = "FAIL"
    $results.overallStatus = "FAIL"
    Write-Host "❌ Build: FAIL - $($_.Exception.Message)" -ForegroundColor Red
    Write-HttpLog "Build Result: FAIL - $($_.Exception.Message)"
  }
} else {
  Write-Host "`n--- Skipping Build ---" -ForegroundColor Yellow
  $results.buildResult = "SKIPPED"
}

# Step 2: Optional Test
if (-not $SkipTest) {
  Write-Host "`n--- Running Tests ---" -ForegroundColor Cyan
  Write-HttpLog "`n=== Test Step ==="
  Write-HttpLog "Command: npm test"
  
  try {
    $testOutput = npm test 2>&1
    $testExitCode = $LASTEXITCODE
    
    if ($testExitCode -eq 0) {
      $results.testResult = "PASS"
      Write-Host "✅ Tests: PASS" -ForegroundColor Green
      Write-HttpLog "Test Result: PASS"
    } else {
      $results.testResult = "FAIL"
      $results.overallStatus = "FAIL"
      Write-Host "❌ Tests: FAIL (exit code: $testExitCode)" -ForegroundColor Red
      Write-HttpLog "Test Result: FAIL (exit code: $testExitCode)"
      Write-HttpLog "Test Output (last 50 lines):"
      $testOutput | Select-Object -Last 50 | ForEach-Object { Write-HttpLog "  $_" }
    }
  } catch {
    $results.testResult = "FAIL"
    $results.overallStatus = "FAIL"
    Write-Host "❌ Tests: FAIL - $($_.Exception.Message)" -ForegroundColor Red
    Write-HttpLog "Test Result: FAIL - $($_.Exception.Message)"
  }
} else {
  Write-Host "`n--- Skipping Tests ---" -ForegroundColor Yellow
  $results.testResult = "SKIPPED"
}

# Step 3: URL Smoke Tests
Write-Host "`n--- URL Smoke Tests ---" -ForegroundColor Cyan

# Test 1: Patient Dashboard
Invoke-UrlCheck `
  -url "$BaseUrl/patient/dashboard" `
  -expectedStatuses @(200, 302) `
  -description "Patient Dashboard"

# Test 2: Admin
Invoke-UrlCheck `
  -url "$BaseUrl/admin" `
  -expectedStatuses @(200, 302) `
  -description "Admin Portal"

# Test 3: Clinician
Invoke-UrlCheck `
  -url "$BaseUrl/clinician" `
  -expectedStatuses @(200, 302) `
  -description "Clinician Portal"

# Test 4: Health endpoint (discover /api/health or /api/ready)
# Try /api/health/env first (known to exist)
$healthCheck = Invoke-UrlCheck `
  -url "$BaseUrl/api/health/env" `
  -expectedStatuses @(200, 401, 403) `
  -description "Health Endpoint (/api/health/env)"

# If /api/health/env failed unexpectedly, try alternatives
if ($healthCheck.result -eq "FAIL" -and $healthCheck.actualStatus -eq $null) {
  Write-Host "`nTrying alternative health endpoints..." -ForegroundColor Yellow
  
  # Try /api/health
  $healthCheck2 = Invoke-UrlCheck `
    -url "$BaseUrl/api/health" `
    -expectedStatuses @(200, 401, 403, 404) `
    -description "Health Endpoint (/api/health) - Fallback"
  
  # Try /api/ready
  if ($healthCheck2.actualStatus -eq 404) {
    Invoke-UrlCheck `
      -url "$BaseUrl/api/ready" `
      -expectedStatuses @(200, 401, 403, 404) `
      -description "Health Endpoint (/api/ready) - Fallback"
  }
}

# Step 4: Generate Summary
Write-Host "`n--- Generating Evidence Pack ---" -ForegroundColor Cyan

# Summary Markdown
$summaryMdContent = @"
# V061-I06 Smoke Test Results

**Timestamp:** $timestamp  
**Base URL:** $BaseUrl  
**Overall Status:** $($results.overallStatus)

## Build & Test

- **Build:** $($results.buildResult)
- **Test:** $($results.testResult)

## URL Smoke Tests

| URL | Expected | Actual | Result |
|-----|----------|--------|--------|
"@

foreach ($check in $results.checks) {
  $expectedStr = $check.expectedStatuses -join ', '
  $actualStr = if ($check.actualStatus) { $check.actualStatus } else { "N/A" }
  $resultEmoji = if ($check.result -eq "PASS") { "✅" } else { "❌" }
  $summaryMdContent += "`n| $($check.url) | $expectedStr | $actualStr | $resultEmoji $($check.result) |"
}

if ($results.overallStatus -eq "FAIL") {
  $summaryMdContent += @"


## Failures

"@
  foreach ($check in $results.checks) {
    if ($check.result -eq "FAIL") {
      $summaryMdContent += "`n- **$($check.description):** $($check.error)"
    }
  }
}

$summaryMdContent += @"


## Evidence Files

- ``summary.md`` - This file
- ``summary.json`` - Machine-readable results
- ``http.log`` - Detailed HTTP request/response log

---
*Generated by run-v061-smoke.ps1*
"@

$summaryMdContent | Out-File -FilePath $summaryMd -Encoding UTF8

# Summary JSON
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath $summaryJson -Encoding UTF8

# Final Output
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Evidence Pack Generated" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Directory: $evidenceDir"
Write-Host "Files:"
Write-Host "  - summary.md"
Write-Host "  - summary.json"
Write-Host "  - http.log"
Write-Host "`nOverall Status: $($results.overallStatus)" -ForegroundColor $(if ($results.overallStatus -eq "PASS") { "Green" } else { "Red" })
Write-Host "========================================`n" -ForegroundColor Cyan

# Exit with appropriate code
if ($results.overallStatus -eq "FAIL") {
  exit 1
} else {
  exit 0
}
