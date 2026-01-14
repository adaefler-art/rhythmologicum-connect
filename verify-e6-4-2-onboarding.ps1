# E6.4.2 Patient Onboarding Happy Path Verification Script
# 
# This script verifies the patient onboarding flow:
# 1. Check onboarding status (should need consent and profile)
# 2. After consent/profile completion, status should be 'completed'
# 3. Dashboard should be accessible
# 4. Next step should show appropriate CTA
#
# Usage:
#   .\verify-e6-4-2-onboarding.ps1 -BaseUrl "http://localhost:3000" -Cookie "sb-access-token=..."

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$Cookie
)

Write-Host "=== E6.4.2 Patient Onboarding Happy Path Verification ===" -ForegroundColor Cyan
Write-Host ""

# Helper function for API calls
function Invoke-ApiCall {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
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
        return @{
            StatusCode = $response.StatusCode
            Content = ($response.Content | ConvertFrom-Json)
        }
    }
    catch {
        Write-Host "Error calling $Endpoint : $_" -ForegroundColor Red
        return @{
            StatusCode = 0
            Content = $null
        }
    }
}

# Test 1: Check onboarding status
Write-Host "Test 1: Checking onboarding status..." -ForegroundColor Yellow
$statusResponse = Invoke-ApiCall -Endpoint "/api/patient/onboarding-status"

if ($statusResponse.StatusCode -eq 200) {
    Write-Host "✓ Status endpoint accessible (200)" -ForegroundColor Green
    $status = $statusResponse.Content.data
    
    Write-Host "  - needsConsent: $($status.needsConsent)" -ForegroundColor Gray
    Write-Host "  - needsProfile: $($status.needsProfile)" -ForegroundColor Gray
    Write-Host "  - completed: $($status.completed)" -ForegroundColor Gray
    Write-Host "  - status: $($status.status)" -ForegroundColor Gray
    
    if ($status.status -eq "completed") {
        Write-Host "  ✓ Onboarding status is 'completed' (AC1)" -ForegroundColor Green
    }
    elseif ($status.status -eq "not_started") {
        Write-Host "  ! Onboarding not yet completed" -ForegroundColor Yellow
    }
}
else {
    Write-Host "✗ Status endpoint failed ($($statusResponse.StatusCode))" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check dashboard access
Write-Host "Test 2: Checking dashboard API..." -ForegroundColor Yellow
$dashboardResponse = Invoke-ApiCall -Endpoint "/api/patient/dashboard"

if ($dashboardResponse.StatusCode -eq 200) {
    Write-Host "✓ Dashboard API accessible (AC2)" -ForegroundColor Green
    $dashboard = $dashboardResponse.Content.data
    Write-Host "  - message: $($dashboard.message)" -ForegroundColor Gray
}
else {
    Write-Host "✗ Dashboard API failed ($($dashboardResponse.StatusCode))" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check for in-progress assessments
Write-Host "Test 3: Checking in-progress assessments..." -ForegroundColor Yellow
$inProgressResponse = Invoke-ApiCall -Endpoint "/api/assessments/in-progress"

if ($inProgressResponse.StatusCode -eq 200) {
    Write-Host "✓ In-progress assessment found (AC3)" -ForegroundColor Green
    $assessment = $inProgressResponse.Content.data
    Write-Host "  - funnel: $($assessment.funnel)" -ForegroundColor Gray
    Write-Host "  - started_at: $($assessment.started_at)" -ForegroundColor Gray
    Write-Host "  → Dashboard should show 'Continue Assessment' CTA" -ForegroundColor Cyan
}
elseif ($inProgressResponse.StatusCode -eq 404) {
    Write-Host "✓ No in-progress assessments (AC3)" -ForegroundColor Green
    Write-Host "  → Dashboard should show 'Start Assessment' CTA" -ForegroundColor Cyan
}
else {
    Write-Host "✗ In-progress endpoint failed ($($inProgressResponse.StatusCode))" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected Flow:" -ForegroundColor Yellow
Write-Host "1. Login as patient" -ForegroundColor Gray
Write-Host "2. Complete consent (if needed)" -ForegroundColor Gray
Write-Host "3. Complete profile (if needed)" -ForegroundColor Gray
Write-Host "4. Redirect to /patient/dashboard" -ForegroundColor Gray
Write-Host "5. Dashboard shows next step CTA" -ForegroundColor Gray
Write-Host ""
Write-Host "Manual Verification:" -ForegroundColor Yellow
Write-Host "- Visit $BaseUrl/patient in browser" -ForegroundColor Gray
Write-Host "- Complete onboarding if prompted" -ForegroundColor Gray
Write-Host "- Verify redirect to dashboard" -ForegroundColor Gray
Write-Host "- Verify appropriate CTA is shown" -ForegroundColor Gray
Write-Host ""
Write-Host "All API checks completed!" -ForegroundColor Green
