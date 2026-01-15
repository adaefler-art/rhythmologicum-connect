# E6.4.8 Telemetry Verification Script
# 
# Tests correlation ID propagation and event emission for pilot flows.
# Requires valid authentication cookies for patient and admin users.

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$PatientCookie = $env:PILOT_PATIENT_COOKIE,
    [string]$AdminCookie = $env:PILOT_ADMIN_COOKIE
)

# Color output helpers
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Failure { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }

# Test counters
$script:TestsPassed = 0
$script:TestsFailed = 0

function Test-Assertion {
    param(
        [bool]$Condition,
        [string]$Message
    )
    
    if ($Condition) {
        Write-Success $Message
        $script:TestsPassed++
    } else {
        Write-Failure $Message
        $script:TestsFailed++
    }
}

# Validation functions
function Test-CorrelationId {
    param([string]$Id)
    
    if (-not $Id) { return $false }
    if ($Id.Length -gt 64) { return $false }
    if ($Id -notmatch '^[a-zA-Z0-9_-]+$') { return $false }
    return $true
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "E6.4.8 Telemetry Verification" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Check prerequisites
if (-not $PatientCookie) {
    Write-Warning "PatientCookie not provided. Set `$env:PILOT_PATIENT_COOKIE or use -PatientCookie parameter."
    Write-Info "Some tests will be skipped."
}

if (-not $AdminCookie) {
    Write-Warning "AdminCookie not provided. Set `$env:PILOT_ADMIN_COOKIE or use -AdminCookie parameter."
    Write-Info "Admin API tests will be skipped."
}

# Test 1: Funnel Start - FUNNEL_STARTED Event
Write-Host "`n--- Test 1: FUNNEL_STARTED Event ---`n" -ForegroundColor Yellow

if ($PatientCookie) {
    try {
        $response = Invoke-WebRequest `
            -Uri "$BaseUrl/api/funnels/stress/assessments" `
            -Method Post `
            -Headers @{ Cookie = $PatientCookie } `
            -SkipHttpErrorCheck
        
        Test-Assertion `
            -Condition ($response.StatusCode -eq 201) `
            -Message "Funnel start returned 201 Created"
        
        $correlationIdHeader = $response.Headers["X-Correlation-Id"]
        Test-Assertion `
            -Condition (Test-CorrelationId $correlationIdHeader) `
            -Message "X-Correlation-Id header is valid: $correlationIdHeader"
        
        $body = $response.Content | ConvertFrom-Json
        
        Test-Assertion `
            -Condition ($body.requestId) `
            -Message "Response body contains requestId: $($body.requestId)"
        
        Test-Assertion `
            -Condition ($body.requestId -eq $correlationIdHeader) `
            -Message "Header and body correlation IDs match"
        
        $script:AssessmentId = $body.data.assessmentId
        $script:CorrelationId = $correlationIdHeader
        
        Write-Info "Assessment ID: $script:AssessmentId"
        Write-Info "Correlation ID: $script:CorrelationId"
        
    } catch {
        Write-Failure "Funnel start request failed: $($_.Exception.Message)"
        $script:TestsFailed++
    }
} else {
    Write-Warning "Skipped (no patient cookie)"
}

# Test 2: Funnel Resume - FUNNEL_RESUMED Event
Write-Host "`n--- Test 2: FUNNEL_RESUMED Event ---`n" -ForegroundColor Yellow

if ($PatientCookie -and $script:AssessmentId) {
    try {
        $response = Invoke-WebRequest `
            -Uri "$BaseUrl/api/funnels/stress/assessments/$script:AssessmentId" `
            -Method Get `
            -Headers @{ Cookie = $PatientCookie } `
            -SkipHttpErrorCheck
        
        Test-Assertion `
            -Condition ($response.StatusCode -eq 200) `
            -Message "Funnel resume returned 200 OK"
        
        $correlationIdHeader = $response.Headers["X-Correlation-Id"]
        Test-Assertion `
            -Condition (Test-CorrelationId $correlationIdHeader) `
            -Message "X-Correlation-Id header is valid"
        
        $body = $response.Content | ConvertFrom-Json
        Test-Assertion `
            -Condition ($body.requestId) `
            -Message "Response contains requestId"
        
    } catch {
        Write-Failure "Funnel resume request failed: $($_.Exception.Message)"
        $script:TestsFailed++
    }
} else {
    Write-Warning "Skipped (requires successful Test 1)"
}

# Test 3: Admin Events API - Event Retrieval
Write-Host "`n--- Test 3: Admin Event Retrieval ---`n" -ForegroundColor Yellow

if ($AdminCookie) {
    try {
        # Test basic retrieval
        $response = Invoke-WebRequest `
            -Uri "$BaseUrl/api/admin/pilot/flow-events?limit=10" `
            -Method Get `
            -Headers @{ Cookie = $AdminCookie } `
            -SkipHttpErrorCheck
        
        Test-Assertion `
            -Condition ($response.StatusCode -eq 200) `
            -Message "Admin events endpoint returned 200 OK"
        
        $body = $response.Content | ConvertFrom-Json
        
        Test-Assertion `
            -Condition ($body.success -eq $true) `
            -Message "Response has success = true"
        
        Test-Assertion `
            -Condition ($body.data.events -is [Array]) `
            -Message "Response contains events array"
        
        Write-Info "Total events: $($body.data.total)"
        Write-Info "Returned events: $($body.data.events.Count)"
        
        # Test filtering by correlation ID if we have one
        if ($script:CorrelationId) {
            Write-Info "Testing filter by correlation ID: $script:CorrelationId"
            
            $filteredResponse = Invoke-WebRequest `
                -Uri "$BaseUrl/api/admin/pilot/flow-events?correlationId=$script:CorrelationId&limit=50" `
                -Method Get `
                -Headers @{ Cookie = $AdminCookie } `
                -SkipHttpErrorCheck
            
            $filteredBody = $filteredResponse.Content | ConvertFrom-Json
            
            Test-Assertion `
                -Condition ($filteredBody.data.events.Count -gt 0) `
                -Message "Found events with correlation ID (count: $($filteredBody.data.events.Count))"
            
            # Display event sequence
            if ($filteredBody.data.events.Count -gt 0) {
                Write-Host "`nEvent Sequence:" -ForegroundColor Cyan
                foreach ($event in $filteredBody.data.events) {
                    $timestamp = ([DateTime]$event.created_at).ToString("HH:mm:ss")
                    $fromState = if ($event.from_state) { $event.from_state } else { "N/A" }
                    $toState = if ($event.to_state) { $event.to_state } else { "N/A" }
                    Write-Host "  $timestamp | $($event.event_type.PadRight(25)) | $fromState → $toState" -ForegroundColor Gray
                }
            }
            
            # Verify deterministic ordering
            if ($filteredBody.data.events.Count -gt 1) {
                $isOrdered = $true
                for ($i = 1; $i -lt $filteredBody.data.events.Count; $i++) {
                    $prev = [DateTime]$filteredBody.data.events[$i-1].created_at
                    $curr = [DateTime]$filteredBody.data.events[$i].created_at
                    if ($curr -lt $prev) {
                        $isOrdered = $false
                        break
                    }
                }
                Test-Assertion `
                    -Condition $isOrdered `
                    -Message "Events are ordered by created_at ASC"
            }
        }
        
    } catch {
        Write-Failure "Admin events request failed: $($_.Exception.Message)"
        $script:TestsFailed++
    }
} else {
    Write-Warning "Skipped (no admin cookie)"
}

# Test 4: Unauthenticated Access Control
Write-Host "`n--- Test 4: Access Control ---`n" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri "$BaseUrl/api/admin/pilot/flow-events" `
        -Method Get `
        -SkipHttpErrorCheck
    
    Test-Assertion `
        -Condition ($response.StatusCode -eq 401) `
        -Message "Unauthenticated request returns 401 Unauthorized"
    
} catch {
    Write-Failure "Access control test failed: $($_.Exception.Message)"
    $script:TestsFailed++
}

# Test 5: Custom Correlation ID
Write-Host "`n--- Test 5: Custom Correlation ID ---`n" -ForegroundColor Yellow

if ($PatientCookie) {
    try {
        $customCorrelationId = "test-$(Get-Random -Minimum 1000 -Maximum 9999)"
        
        $response = Invoke-WebRequest `
            -Uri "$BaseUrl/api/funnels/stress/assessments" `
            -Method Post `
            -Headers @{ 
                Cookie = $PatientCookie
                "X-Correlation-Id" = $customCorrelationId
            } `
            -SkipHttpErrorCheck
        
        Test-Assertion `
            -Condition ($response.StatusCode -eq 201) `
            -Message "Request with custom correlation ID succeeded"
        
        $returnedCorrelationId = $response.Headers["X-Correlation-Id"]
        Test-Assertion `
            -Condition ($returnedCorrelationId -eq $customCorrelationId) `
            -Message "Server preserved custom correlation ID: $customCorrelationId"
        
        $body = $response.Content | ConvertFrom-Json
        Test-Assertion `
            -Condition ($body.requestId -eq $customCorrelationId) `
            -Message "Response body contains custom correlation ID"
        
    } catch {
        Write-Failure "Custom correlation ID test failed: $($_.Exception.Message)"
        $script:TestsFailed++
    }
} else {
    Write-Warning "Skipped (no patient cookie)"
}

# Test 6: Invalid Correlation ID (Fail-Closed)
Write-Host "`n--- Test 6: Invalid Correlation ID Handling ---`n" -ForegroundColor Yellow

if ($PatientCookie) {
    try {
        $invalidCorrelationId = "this-is-way-too-long-and-should-be-rejected-because-it-exceeds-64-characters-limit"
        
        $response = Invoke-WebRequest `
            -Uri "$BaseUrl/api/funnels/stress/assessments" `
            -Method Post `
            -Headers @{ 
                Cookie = $PatientCookie
                "X-Correlation-Id" = $invalidCorrelationId
            } `
            -SkipHttpErrorCheck
        
        Test-Assertion `
            -Condition ($response.StatusCode -eq 201) `
            -Message "Request with invalid correlation ID still succeeded (fail-closed)"
        
        $returnedCorrelationId = $response.Headers["X-Correlation-Id"]
        Test-Assertion `
            -Condition ($returnedCorrelationId -ne $invalidCorrelationId) `
            -Message "Server generated new ID instead of using invalid one"
        
        Test-Assertion `
            -Condition (Test-CorrelationId $returnedCorrelationId) `
            -Message "Generated correlation ID is valid"
        
    } catch {
        Write-Failure "Invalid correlation ID test failed: $($_.Exception.Message)"
        $script:TestsFailed++
    }
} else {
    Write-Warning "Skipped (no patient cookie)"
}

# Summary
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "Test Summary" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

Write-Host "Tests Passed: " -NoNewline
Write-Host $script:TestsPassed -ForegroundColor Green

Write-Host "Tests Failed: " -NoNewline
if ($script:TestsFailed -eq 0) {
    Write-Host $script:TestsFailed -ForegroundColor Green
} else {
    Write-Host $script:TestsFailed -ForegroundColor Red
}

if ($script:TestsFailed -eq 0) {
    Write-Host "`n✨ All tests passed! ✨`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed. Please review the output above.`n" -ForegroundColor Yellow
    exit 1
}
