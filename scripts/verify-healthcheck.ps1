# TV05_03 Healthcheck Endpoint - Manual Verification Script
# 
# This PowerShell script demonstrates how to test the /api/health/env endpoint
# manually. For automated testing, use `npm test` instead.

# Configuration
$baseUrl = "http://localhost:3000"  # Update if your server runs on a different port
$healthEndpoint = "$baseUrl/api/health/env"

Write-Host "`n=== TV05_03 Healthcheck Endpoint Verification ===" -ForegroundColor Cyan
Write-Host "Testing endpoint: $healthEndpoint`n" -ForegroundColor Cyan

# Test 1: Unauthenticated request (should return 401)
Write-Host "Test 1: Unauthenticated Request" -ForegroundColor Yellow
Write-Host "Expected: 401 Unauthorized" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri $healthEndpoint -Method GET -ErrorAction Stop
    Write-Host "❌ FAILED: Got status $($response.StatusCode), expected 401" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASSED: Got 401 Unauthorized as expected" -ForegroundColor Green
        $body = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Response: $($body | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAILED: Got status $($_.Exception.Response.StatusCode), expected 401" -ForegroundColor Red
    }
}

Write-Host "`n" -NoNewline

# Test 2: Authenticated admin request (requires manual token)
Write-Host "Test 2: Authenticated Admin Request" -ForegroundColor Yellow
Write-Host "This test requires a valid admin JWT token." -ForegroundColor Gray
Write-Host "To get a token:" -ForegroundColor Gray
Write-Host "1. Start the dev server: npm run dev" -ForegroundColor Gray
Write-Host "2. Login as admin user in browser" -ForegroundColor Gray
Write-Host "3. Copy JWT from browser DevTools (Application > Cookies)" -ForegroundColor Gray
Write-Host "`n" -NoNewline

$token = Read-Host "Enter your admin JWT token (or press Enter to skip)"

if ($token) {
    Write-Host "`nTesting with provided token..." -ForegroundColor Gray
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $response = Invoke-RestMethod -Uri $healthEndpoint -Method GET -Headers $headers
        
        if ($response.success) {
            Write-Host "✅ PASSED: Got successful response" -ForegroundColor Green
            Write-Host "`nOverall Status: $($response.data.overallStatus)" -ForegroundColor $(if ($response.data.overallStatus -eq "pass") { "Green" } else { "Red" })
            Write-Host "`nEnvironment Checks:" -ForegroundColor Cyan
            
            foreach ($check in $response.data.checks) {
                $status = if ($check.pass) { "✅" } else { "❌" }
                $color = if ($check.pass) { "Green" } else { "Red" }
                Write-Host "  $status $($check.name): $($check.message)" -ForegroundColor $color
            }
            
            Write-Host "`nTimestamp: $($response.data.timestamp)" -ForegroundColor Gray
            
            # Verify no secrets are exposed
            $responseJson = $response | ConvertTo-Json -Depth 10
            if ($responseJson -match "eyJ" -or $responseJson -match "https://.*\.supabase\.co") {
                Write-Host "`n⚠️  WARNING: Response may contain secret values!" -ForegroundColor Red
            } else {
                Write-Host "`n✅ Secret redaction verified: No actual secrets in response" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ FAILED: Got error response" -ForegroundColor Red
            Write-Host "Error: $($response.error | ConvertTo-Json)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ FAILED: Request error" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Skipped - no token provided" -ForegroundColor Gray
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
Write-Host "`nFor automated testing, run: npm test -- app/api/health/env" -ForegroundColor Yellow
Write-Host ""
