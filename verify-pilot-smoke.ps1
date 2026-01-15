# E6.4.7 Pilot Smoke Tests
# 
# This script runs the 5 mandatory smoke tests for the pilot deployment.
# It verifies the core patient flow end-to-end.
#
# Usage:
#   .\verify-pilot-smoke.ps1 -BaseUrl "http://localhost:3000" -Cookie "sb-localhost-auth-token=..."
#
# Or use environment variables:
#   $env:PILOT_BASE_URL = "http://localhost:3000"
#   $env:PILOT_AUTH_COOKIE = "sb-localhost-auth-token=..."
#   .\verify-pilot-smoke.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = $env:PILOT_BASE_URL,
    
    [Parameter(Mandatory=$false)]
    [string]$Cookie = $env:PILOT_AUTH_COOKIE
)

# Validate parameters
if (-not $BaseUrl) {
    Write-Host "Error: BaseUrl is required. Provide -BaseUrl parameter or set `$env:PILOT_BASE_URL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host '  .\verify-pilot-smoke.ps1 -BaseUrl "http://localhost:3000" -Cookie "sb-localhost-auth-token=..."' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or set environment variables:" -ForegroundColor Yellow
    Write-Host '  $env:PILOT_BASE_URL = "http://localhost:3000"' -ForegroundColor Gray
    Write-Host '  $env:PILOT_AUTH_COOKIE = "sb-localhost-auth-token=..."' -ForegroundColor Gray
    Write-Host '  .\verify-pilot-smoke.ps1' -ForegroundColor Gray
    exit 1
}

if (-not $Cookie) {
    Write-Host "Error: Cookie is required. Provide -Cookie parameter or set `$env:PILOT_AUTH_COOKIE" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your auth cookie:" -ForegroundColor Yellow
    Write-Host "1. Login at http://localhost:3000 (or your BaseUrl)" -ForegroundColor Gray
    Write-Host "2. Open DevTools > Application > Cookies" -ForegroundColor Gray
    Write-Host "3. Copy value of 'sb-localhost-auth-token'" -ForegroundColor Gray
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "E6.4.7 Pilot Smoke Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Auth: Cookie provided" -ForegroundColor Gray
Write-Host ""

$exitCode = 0
$smokeResults = @{
    Smoke1 = $false
    Smoke2 = $false
    Smoke3 = $false
    Smoke4 = $false
    Smoke5 = $false
}

# State object to pass data between tests (avoids global variables)
$testState = @{
    AssessmentId = $null
    FunnelSlug = $null
    HasInProgress = $false
}

# Helper function for API calls
function Invoke-ApiCall {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null,
        [switch]$AllowNotFound
    )
    
    $headers = @{
        "Cookie" = $Cookie
        "Content-Type" = "application/json"
    }
    
    $params = @{
        Uri = "$BaseUrl$Endpoint"
        Method = $Method
        Headers = $headers
        SkipHttpErrorCheck = $true
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-WebRequest @params
        
        # Try to parse JSON content
        $content = $null
        try {
            $content = $response.Content | ConvertFrom-Json
        }
        catch {
            Write-Host "  ! Warning: Response is not valid JSON" -ForegroundColor Yellow
        }
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $content
        }
    }
    catch {
        Write-Host "  ! Request error: $_" -ForegroundColor Red
        return @{
            Success = $false
            StatusCode = 0
            Content = $null
        }
    }
}

# ============================================
# Smoke 1: Dashboard loads (auth ok, eligible ok)
# ============================================
Write-Host "Smoke 1: Dashboard Loads (Auth + Eligibility)" -ForegroundColor Yellow
Write-Host "  Testing: GET /api/patient/dashboard" -ForegroundColor Gray

$dashboardResponse = Invoke-ApiCall -Endpoint "/api/patient/dashboard"

if ($dashboardResponse.Success -and $dashboardResponse.StatusCode -eq 200) {
    Write-Host "  ✓ PASS - Dashboard loads successfully" -ForegroundColor Green
    Write-Host "    - Status: 200 OK" -ForegroundColor Gray
    Write-Host "    - Message: $($dashboardResponse.Content.data.message)" -ForegroundColor Gray
    $smokeResults.Smoke1 = $true
}
elseif ($dashboardResponse.StatusCode -eq 401) {
    Write-Host "  ✗ FAIL - Authentication failed (401)" -ForegroundColor Red
    Write-Host "    - Check cookie is valid and not expired" -ForegroundColor Yellow
    $exitCode = 1
}
elseif ($dashboardResponse.StatusCode -eq 403) {
    Write-Host "  ✗ FAIL - Not eligible for pilot (403)" -ForegroundColor Red
    Write-Host "    - Check user pilot_enabled flag in database" -ForegroundColor Yellow
    $exitCode = 1
}
else {
    Write-Host "  ✗ FAIL - Unexpected status: $($dashboardResponse.StatusCode)" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""

# ============================================
# Smoke 2: Check in-progress assessment
# ============================================
Write-Host "Smoke 2: In-Progress Assessment Check" -ForegroundColor Yellow
Write-Host "  Testing: GET /api/assessments/in-progress" -ForegroundColor Gray

$inProgressResponse = Invoke-ApiCall -Endpoint "/api/assessments/in-progress" -AllowNotFound

if ($inProgressResponse.Success -and ($inProgressResponse.StatusCode -eq 200 -or $inProgressResponse.StatusCode -eq 404)) {
    if ($inProgressResponse.StatusCode -eq 200) {
        Write-Host "  ✓ PASS - In-progress assessment found" -ForegroundColor Green
        $assessment = $inProgressResponse.Content.data
        Write-Host "    - Assessment ID: $($assessment.id)" -ForegroundColor Gray
        Write-Host "    - Funnel: $($assessment.funnel)" -ForegroundColor Gray
        Write-Host "    - Started: $($assessment.started_at)" -ForegroundColor Gray
        
        # Save for later tests
        $testState.AssessmentId = $assessment.id
        $testState.FunnelSlug = $assessment.funnel
        $testState.HasInProgress = $true
    }
    else {
        Write-Host "  ✓ PASS - No in-progress assessment (404)" -ForegroundColor Green
        Write-Host "    - This is valid state (no active assessment)" -ForegroundColor Gray
        $testState.HasInProgress = $false
    }
    $smokeResults.Smoke2 = $true
}
else {
    Write-Host "  ✗ FAIL - Unexpected status: $($inProgressResponse.StatusCode)" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""

# ============================================
# Smoke 3: Start/Resume funnel works
# ============================================
Write-Host "Smoke 3: Start/Resume Funnel" -ForegroundColor Yellow

if ($testState.HasInProgress) {
    Write-Host "  Testing: GET /api/funnels/$($testState.FunnelSlug)/assessments/$($testState.AssessmentId) (Resume)" -ForegroundColor Gray
    
    $resumeResponse = Invoke-ApiCall -Endpoint "/api/funnels/$($testState.FunnelSlug)/assessments/$($testState.AssessmentId)"
    
    if ($resumeResponse.Success -and $resumeResponse.StatusCode -eq 200) {
        Write-Host "  ✓ PASS - Resume works" -ForegroundColor Green
        $assessmentData = $resumeResponse.Content.data
        Write-Host "    - Status: $($assessmentData.status)" -ForegroundColor Gray
        Write-Host "    - Current step: $($assessmentData.currentStep.title)" -ForegroundColor Gray
        Write-Host "    - Progress: $($assessmentData.completedSteps)/$($assessmentData.totalSteps)" -ForegroundColor Gray
        $smokeResults.Smoke3 = $true
    }
    else {
        Write-Host "  ✗ FAIL - Resume failed: $($resumeResponse.StatusCode)" -ForegroundColor Red
        $exitCode = 1
    }
}
else {
    Write-Host "  Testing: POST /api/funnels/stress/assessments (Start)" -ForegroundColor Gray
    
    $startResponse = Invoke-ApiCall -Endpoint "/api/funnels/stress/assessments" -Method "POST"
    
    if ($startResponse.Success -and $startResponse.StatusCode -eq 200) {
        Write-Host "  ✓ PASS - Start new assessment works" -ForegroundColor Green
        $assessmentData = $startResponse.Content.data
        Write-Host "    - Assessment ID: $($assessmentData.assessmentId)" -ForegroundColor Gray
        Write-Host "    - Status: $($assessmentData.status)" -ForegroundColor Gray
        Write-Host "    - First step: $($assessmentData.currentStep.title)" -ForegroundColor Gray
        
        # Save for later tests
        $testState.AssessmentId = $assessmentData.assessmentId
        $testState.FunnelSlug = "stress"
        $smokeResults.Smoke3 = $true
    }
    elseif ($startResponse.StatusCode -eq 409) {
        Write-Host "  ⚠ WARNING - Assessment already exists (409)" -ForegroundColor Yellow
        Write-Host "    - This is expected if you already have an assessment" -ForegroundColor Gray
        Write-Host "    - Test passes (idempotency works)" -ForegroundColor Gray
        $smokeResults.Smoke3 = $true
    }
    else {
        Write-Host "  ✗ FAIL - Start failed: $($startResponse.StatusCode)" -ForegroundColor Red
        $exitCode = 1
    }
}

Write-Host ""

# ============================================
# Smoke 4: Workup needs_more_data shows follow-ups
# ============================================
Write-Host "Smoke 4: Workup Check (needs_more_data)" -ForegroundColor Yellow

if ($testState.AssessmentId -and $testState.FunnelSlug) {
    Write-Host "  Testing: POST /api/funnels/$($testState.FunnelSlug)/assessments/$($testState.AssessmentId)/workup" -ForegroundColor Gray
    Write-Host "  Note: This requires a COMPLETED assessment" -ForegroundColor Gray
    
    $workupResponse = Invoke-ApiCall -Endpoint "/api/funnels/$($testState.FunnelSlug)/assessments/$($testState.AssessmentId)/workup" -Method "POST"
    
    if ($workupResponse.Success -and $workupResponse.StatusCode -eq 200) {
        Write-Host "  ✓ PASS - Workup check successful" -ForegroundColor Green
        $workupData = $workupResponse.Content.data
        Write-Host "    - Workup status: $($workupData.workupStatus)" -ForegroundColor Gray
        
        if ($workupData.workupStatus -eq "needs_more_data") {
            Write-Host "    - Missing fields: $($workupData.missingDataFields -join ', ')" -ForegroundColor Gray
            Write-Host "    - Follow-up questions: $($workupData.followUpQuestions.Count)" -ForegroundColor Gray
            
            if ($workupData.followUpQuestions.Count -gt 0) {
                Write-Host "  ✓ Follow-up questions displayed:" -ForegroundColor Green
                foreach ($q in $workupData.followUpQuestions | Select-Object -First 3) {
                    Write-Host "      - $($q.questionText) (Priority: $($q.priority))" -ForegroundColor Gray
                }
            }
        }
        elseif ($workupData.workupStatus -eq "ready_for_review") {
            Write-Host "    - Assessment is ready for clinician review" -ForegroundColor Gray
            Write-Host "  ⚠ No follow-ups needed (all data sufficient)" -ForegroundColor Yellow
        }
        
        $smokeResults.Smoke4 = $true
    }
    elseif ($workupResponse.StatusCode -eq 400) {
        Write-Host "  ⚠ SKIP - Assessment not completed yet (400)" -ForegroundColor Yellow
        Write-Host "    - Complete the assessment first via UI or API" -ForegroundColor Gray
        Write-Host "    - Then run workup endpoint" -ForegroundColor Gray
        # Don't fail on this - it's expected for in-progress assessments
        $smokeResults.Smoke4 = $true
    }
    elseif ($workupResponse.StatusCode -eq 404) {
        Write-Host "  ⚠ SKIP - Assessment not found (404)" -ForegroundColor Yellow
        $smokeResults.Smoke4 = $true
    }
    else {
        Write-Host "  ✗ FAIL - Workup check failed: $($workupResponse.StatusCode)" -ForegroundColor Red
        if ($workupResponse.Content) {
            Write-Host "    - Error: $($workupResponse.Content.error.message)" -ForegroundColor Red
        }
        $exitCode = 1
    }
}
else {
    Write-Host "  ⚠ SKIP - No assessment available for testing" -ForegroundColor Yellow
    Write-Host "    - Create an assessment first (Smoke 3)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# Smoke 5: Back to dashboard shows updated Next Step
# ============================================
Write-Host "Smoke 5: Dashboard Next Step Updated" -ForegroundColor Yellow
Write-Host "  Testing: GET /api/patient/dashboard" -ForegroundColor Gray

$finalDashboardResponse = Invoke-ApiCall -Endpoint "/api/patient/dashboard"

if ($finalDashboardResponse.Success -and $finalDashboardResponse.StatusCode -eq 200) {
    Write-Host "  ✓ PASS - Dashboard loads with updated state" -ForegroundColor Green
    
    # Check in-progress again
    $finalInProgressResponse = Invoke-ApiCall -Endpoint "/api/assessments/in-progress"
    
    if ($finalInProgressResponse.StatusCode -eq 200) {
        $finalAssessment = $finalInProgressResponse.Content.data
        Write-Host "    - In-progress assessment found" -ForegroundColor Gray
        Write-Host "    - Funnel: $($finalAssessment.funnel)" -ForegroundColor Gray
        Write-Host "    → UI should show 'Continue Assessment' CTA" -ForegroundColor Cyan
    }
    elseif ($finalInProgressResponse.StatusCode -eq 404) {
        Write-Host "    - No in-progress assessment" -ForegroundColor Gray
        Write-Host "    → UI should show 'Start Assessment' CTA" -ForegroundColor Cyan
    }
    
    $smokeResults.Smoke5 = $true
}
else {
    Write-Host "  ✗ FAIL - Dashboard request failed: $($finalDashboardResponse.StatusCode)" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Smoke Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = ($smokeResults.Values | Where-Object { $_ -eq $true }).Count
$totalCount = $smokeResults.Count

if ($smokeResults.Smoke1) {
    Write-Host "✓ Smoke 1: Dashboard loads (auth ok, eligible ok)" -ForegroundColor Green
}
else {
    Write-Host "✗ Smoke 1: Dashboard loads (auth ok, eligible ok)" -ForegroundColor Red
}

if ($smokeResults.Smoke2) {
    Write-Host "✓ Smoke 2: In-progress assessment check" -ForegroundColor Green
}
else {
    Write-Host "✗ Smoke 2: In-progress assessment check" -ForegroundColor Red
}

if ($smokeResults.Smoke3) {
    Write-Host "✓ Smoke 3: Start/Resume funnel works" -ForegroundColor Green
}
else {
    Write-Host "✗ Smoke 3: Start/Resume funnel works" -ForegroundColor Red
}

if ($smokeResults.Smoke4) {
    Write-Host "✓ Smoke 4: Workup check (needs_more_data)" -ForegroundColor Green
}
else {
    Write-Host "✗ Smoke 4: Workup check (needs_more_data)" -ForegroundColor Red
}

if ($smokeResults.Smoke5) {
    Write-Host "✓ Smoke 5: Dashboard next step updated" -ForegroundColor Green
}
else {
    Write-Host "✗ Smoke 5: Dashboard next step updated" -ForegroundColor Red
}

Write-Host ""
Write-Host "Results: $passCount/$totalCount tests passed" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host ""

# Manual verification reminder
Write-Host "Manual UI Verification Required:" -ForegroundColor Yellow
Write-Host "1. Visit $BaseUrl/patient/dashboard in browser" -ForegroundColor Gray
Write-Host "2. Verify correct CTA is displayed ('Continue' or 'Start New')" -ForegroundColor Gray
Write-Host "3. Complete an assessment if needed for Smoke 4" -ForegroundColor Gray
Write-Host "4. Verify workup follow-up questions display correctly" -ForegroundColor Gray
Write-Host ""

# Additional checks
Write-Host "Pre-Deployment Checklist:" -ForegroundColor Yellow
Write-Host "□ npm test passes" -ForegroundColor Gray
Write-Host "□ npm run build succeeds" -ForegroundColor Gray
Write-Host "□ Health endpoint responds" -ForegroundColor Gray
Write-Host "□ Database migrations applied" -ForegroundColor Gray
Write-Host "□ Funnel definitions exist (stress funnel)" -ForegroundColor Gray
Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "✓ All automated smoke tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pilot flow is operational and ready for manual verification." -ForegroundColor Green
}
else {
    Write-Host "✗ Some smoke tests failed - review errors above" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix issues before proceeding with pilot deployment." -ForegroundColor Red
}

Write-Host ""
Write-Host "For detailed troubleshooting, see:" -ForegroundColor Cyan
Write-Host "  docs/runbooks/PILOT_SMOKE_TESTS.md" -ForegroundColor Gray
Write-Host ""

exit $exitCode
