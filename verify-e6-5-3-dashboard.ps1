# E6.5.3 Verification Script
# PowerShell script to verify GET /api/patient/dashboard endpoint

Write-Host "=== E6.5.3 Dashboard API Verification ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:3000"
$dashboardUrl = "$baseUrl/api/patient/dashboard"

# Test 1: AC1 - Unauthenticated request should return 401
Write-Host "Test 1: AC1 - Unauthenticated request (should return 401)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest $dashboardUrl -SkipHttpErrorCheck
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 401) { "Green" } else { "Red" })
    
    if ($response.StatusCode -eq 401) {
        $body = $response.Content | ConvertFrom-Json
        Write-Host "  Success: $($body.success)" -ForegroundColor $(if ($body.success -eq $false) { "Green" } else { "Red" })
        Write-Host "  Error Code: $($body.error.code)" -ForegroundColor $(if ($body.error.code -eq "UNAUTHORIZED") { "Green" } else { "Red" })
        Write-Host "  ✅ AC1 PASSED: Returns 401 for unauthenticated" -ForegroundColor Green
    } else {
        Write-Host "  ❌ AC1 FAILED: Expected 401, got $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: AC2 - Non-eligible user should return 403
Write-Host "Test 2: AC2 - Non-eligible user (should return 403)" -ForegroundColor Yellow
Write-Host "  Note: Requires authentication cookie for non-eligible user" -ForegroundColor Gray
Write-Host "  Set `$nonEligibleCookie variable with non-eligible user's auth token" -ForegroundColor Gray
if ($nonEligibleCookie) {
    try {
        $response = Invoke-WebRequest $dashboardUrl -Headers @{ Cookie = $nonEligibleCookie } -SkipHttpErrorCheck
        Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 403) { "Green" } else { "Red" })
        
        if ($response.StatusCode -eq 403) {
            $body = $response.Content | ConvertFrom-Json
            Write-Host "  Success: $($body.success)" -ForegroundColor $(if ($body.success -eq $false) { "Green" } else { "Red" })
            Write-Host "  Error Code: $($body.error.code)" -ForegroundColor $(if ($body.error.code -eq "PILOT_NOT_ELIGIBLE") { "Green" } else { "Red" })
            Write-Host "  ✅ AC2 PASSED: Returns 403 for non-eligible" -ForegroundColor Green
        } else {
            Write-Host "  ❌ AC2 FAILED: Expected 403, got $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  ⏭️  SKIPPED: No non-eligible cookie provided" -ForegroundColor Gray
}
Write-Host ""

# Test 3: AC3 & AC4 - Eligible patient sees only own data with bounded results
Write-Host "Test 3: AC3 & AC4 - Eligible patient (should return 200 with bounded data)" -ForegroundColor Yellow
Write-Host "  Note: Requires authentication cookie for eligible patient" -ForegroundColor Gray
Write-Host "  Set `$cookie variable with eligible patient's auth token" -ForegroundColor Gray
if ($cookie) {
    try {
        $response = Invoke-WebRequest $dashboardUrl -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck
        Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 200) { "Green" } else { "Red" })
        
        if ($response.StatusCode -eq 200) {
            $body = $response.Content | ConvertFrom-Json
            
            # Check response structure
            Write-Host "  Response Structure:" -ForegroundColor Cyan
            Write-Host "    success: $($body.success)" -ForegroundColor $(if ($body.success -eq $true) { "Green" } else { "Red" })
            Write-Host "    schemaVersion: $($body.schemaVersion)" -ForegroundColor $(if ($body.schemaVersion -eq "v1") { "Green" } else { "Red" })
            Write-Host "    requestId: $($body.requestId -ne $null)" -ForegroundColor $(if ($body.requestId) { "Green" } else { "Red" })
            
            # Check data fields
            Write-Host "  Data Fields:" -ForegroundColor Cyan
            Write-Host "    onboardingStatus: $($body.data.onboardingStatus)" -ForegroundColor Green
            Write-Host "    nextStep.type: $($body.data.nextStep.type)" -ForegroundColor Green
            Write-Host "    funnelSummaries count: $($body.data.funnelSummaries.Count)" -ForegroundColor Green
            Write-Host "    workupSummary.state: $($body.data.workupSummary.state)" -ForegroundColor Green
            Write-Host "    contentTiles count: $($body.data.contentTiles.Count)" -ForegroundColor Green
            
            # Check meta
            Write-Host "  Meta:" -ForegroundColor Cyan
            Write-Host "    version: $($body.data.meta.version)" -ForegroundColor $(if ($body.data.meta.version -eq 1) { "Green" } else { "Red" })
            Write-Host "    correlationId: $($body.data.meta.correlationId -ne $null)" -ForegroundColor $(if ($body.data.meta.correlationId) { "Green" } else { "Red" })
            Write-Host "    generatedAt: $($body.data.meta.generatedAt -ne $null)" -ForegroundColor $(if ($body.data.meta.generatedAt) { "Green" } else { "Red" })
            
            # AC4: Check bounded results (MVP returns 0, but should be ≤ 5 and ≤ 10 when populated)
            $funnelCount = $body.data.funnelSummaries.Count
            $tileCount = $body.data.contentTiles.Count
            Write-Host "  AC4 Bounded Results:" -ForegroundColor Cyan
            Write-Host "    Funnel summaries: $funnelCount (max 5 allowed)" -ForegroundColor $(if ($funnelCount -le 5) { "Green" } else { "Red" })
            Write-Host "    Content tiles: $tileCount (max 10 allowed)" -ForegroundColor $(if ($tileCount -le 10) { "Green" } else { "Red" })
            
            if ($body.success -eq $true -and $body.schemaVersion -eq "v1" -and $funnelCount -le 5 -and $tileCount -le 10) {
                Write-Host "  ✅ AC3 & AC4 PASSED: Returns valid data with bounded results" -ForegroundColor Green
            } else {
                Write-Host "  ❌ AC3 & AC4 FAILED: Response validation failed" -ForegroundColor Red
            }
        } else {
            Write-Host "  ❌ AC3 & AC4 FAILED: Expected 200, got $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  ⏭️  SKIPPED: No patient cookie provided" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run complete verification:" -ForegroundColor Yellow
Write-Host "  1. Start dev server: npm run dev" -ForegroundColor Gray
Write-Host "  2. Get patient cookie: Login as eligible patient and extract cookie" -ForegroundColor Gray
Write-Host "  3. Set cookie variable: `$cookie = 'sb-...-auth-token=...'" -ForegroundColor Gray
Write-Host "  4. Re-run this script" -ForegroundColor Gray
Write-Host ""
Write-Host "For AC2 test (non-eligible user):" -ForegroundColor Yellow
Write-Host "  1. Get non-eligible user cookie" -ForegroundColor Gray
Write-Host "  2. Set variable: `$nonEligibleCookie = 'sb-...-auth-token=...'" -ForegroundColor Gray
Write-Host "  3. Re-run this script" -ForegroundColor Gray
Write-Host ""
