# E6.4.8 Pilot Export Verification Script
# Verifies patient-measures export and PDF download endpoints

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$Cookie = $env:PILOT_AUTH_COOKIE,
    
    [Parameter(Mandatory=$false)]
    [string]$ReportId = ""
)

# Color functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }

# Validation
if ([string]::IsNullOrWhiteSpace($Cookie)) {
    Write-Error "Cookie required. Provide via -Cookie parameter or PILOT_AUTH_COOKIE env variable."
    Write-Info "Example: `$env:PILOT_AUTH_COOKIE = 'sb-localhost-auth-token=...'"
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "E6.4.8 Pilot Export Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$headers = @{
    "Cookie" = $Cookie
}

$testsPassed = 0
$testsFailed = 0

# ==============================================================================
# Test 1: Patient Measures Export - Authenticated
# ==============================================================================
Write-Info "Test 1: Patient Measures Export (Authenticated)"

try {
    $uri = "$BaseUrl/api/patient-measures/export"
    Write-Host "   URI: $uri" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Success "Returns 200 OK"
        $testsPassed++
        
        # Parse JSON response
        $data = $response.Content | ConvertFrom-Json
        
        # Verify required fields
        $requiredFields = @('export_date', 'patient_id', 'user_id', 'measures', 'total_count', 'consents', 'consents_count')
        $missingFields = @()
        
        foreach ($field in $requiredFields) {
            if (-not ($data.PSObject.Properties.Name -contains $field)) {
                $missingFields += $field
            }
        }
        
        if ($missingFields.Count -eq 0) {
            Write-Success "All required fields present"
            $testsPassed++
        } else {
            Write-Error "Missing fields: $($missingFields -join ', ')"
            $testsFailed++
        }
        
        # Verify export_date is ISO 8601
        if ($data.export_date -match '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}') {
            Write-Success "export_date is ISO 8601 format"
            $testsPassed++
        } else {
            Write-Error "export_date is not ISO 8601: $($data.export_date)"
            $testsFailed++
        }
        
        # Verify total_count matches array length
        if ($data.total_count -eq $data.measures.Count) {
            Write-Success "total_count matches measures array length ($($data.total_count))"
            $testsPassed++
        } else {
            Write-Error "total_count ($($data.total_count)) != measures.length ($($data.measures.Count))"
            $testsFailed++
        }
        
        # Verify consents_count
        if ($data.consents_count -eq $data.consents.Count) {
            Write-Success "consents_count matches consents array length ($($data.consents_count))"
            $testsPassed++
        } else {
            Write-Error "consents_count ($($data.consents_count)) != consents.length ($($data.consents.Count))"
            $testsFailed++
        }
        
        # Check Content-Disposition header
        $contentDisposition = $response.Headers['Content-Disposition']
        if ($contentDisposition -and $contentDisposition -like '*attachment*') {
            Write-Success "Content-Disposition header set: $contentDisposition"
            $testsPassed++
        } else {
            Write-Warning "Content-Disposition header missing or incorrect"
            $testsFailed++
        }
        
        # Display summary
        Write-Host "`n   📊 Export Summary:" -ForegroundColor Cyan
        Write-Host "      Patient ID: $($data.patient_id)" -ForegroundColor Gray
        Write-Host "      User ID: $($data.user_id)" -ForegroundColor Gray
        Write-Host "      Measures: $($data.total_count)" -ForegroundColor Gray
        Write-Host "      Consents: $($data.consents_count)" -ForegroundColor Gray
        Write-Host "      Export Date: $($data.export_date)" -ForegroundColor Gray
        
        # Display first measure if available
        if ($data.measures.Count -gt 0) {
            $measure = $data.measures[0]
            Write-Host "`n   📋 First Measure:" -ForegroundColor Cyan
            Write-Host "      Measure ID: $($measure.measure_id)" -ForegroundColor Gray
            Write-Host "      Stress Score: $($measure.stress_score)" -ForegroundColor Gray
            Write-Host "      Sleep Score: $($measure.sleep_score)" -ForegroundColor Gray
            Write-Host "      Risk Level: $($measure.risk_level)" -ForegroundColor Gray
            Write-Host "      Measured At: $($measure.measured_at)" -ForegroundColor Gray
        }
        
    } else {
        Write-Error "Unexpected status code: $($response.StatusCode)"
        $testsFailed++
    }
    
} catch {
    Write-Error "Request failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    $testsFailed++
}

Write-Host ""

# ==============================================================================
# Test 2: Patient Measures Export - Unauthenticated (should fail with 401)
# ==============================================================================
Write-Info "Test 2: Patient Measures Export (Unauthenticated - expect 401)"

try {
    $uri = "$BaseUrl/api/patient-measures/export"
    $response = Invoke-WebRequest -Uri $uri -Method Get -ErrorAction Stop
    
    Write-Error "Should have returned 401, but got $($response.StatusCode)"
    $testsFailed++
    
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Success "Correctly returns 401 Unauthorized"
        $testsPassed++
    } else {
        Write-Error "Expected 401, got: $($_.Exception.Response.StatusCode)"
        $testsFailed++
    }
}

Write-Host ""

# ==============================================================================
# Test 3: PDF Download - If ReportId provided
# ==============================================================================
if (-not [string]::IsNullOrWhiteSpace($ReportId)) {
    Write-Info "Test 3: PDF Download (Report ID: $ReportId)"
    
    try {
        $uri = "$BaseUrl/api/reports/$ReportId/pdf"
        Write-Host "   URI: $uri" -ForegroundColor Gray
        
        $response = Invoke-WebRequest -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Returns 200 OK"
            $testsPassed++
            
            # Parse JSON response
            $data = $response.Content | ConvertFrom-Json
            
            # Verify B8 standard format
            if ($data.success -eq $true) {
                Write-Success "Response follows B8 standard (success: true)"
                $testsPassed++
            } else {
                Write-Error "Response not B8 standard (success field missing or false)"
                $testsFailed++
            }
            
            # Verify data structure
            if ($data.data -and $data.data.url) {
                Write-Success "Signed URL present"
                $testsPassed++
                
                Write-Host "`n   📄 PDF Metadata:" -ForegroundColor Cyan
                Write-Host "      URL: $($data.data.url.Substring(0, [Math]::Min(60, $data.data.url.Length)))..." -ForegroundColor Gray
                Write-Host "      Expires At: $($data.data.expiresAt)" -ForegroundColor Gray
                
                if ($data.data.metadata) {
                    Write-Host "      File Size: $($data.data.metadata.fileSizeBytes) bytes" -ForegroundColor Gray
                    Write-Host "      Page Count: $($data.data.metadata.pageCount)" -ForegroundColor Gray
                    Write-Host "      Generated At: $($data.data.metadata.generatedAt)" -ForegroundColor Gray
                }
                
                # Try to download the PDF (just verify URL is accessible)
                try {
                    $pdfResponse = Invoke-WebRequest -Uri $data.data.url -Method Head -ErrorAction Stop
                    if ($pdfResponse.StatusCode -eq 200) {
                        Write-Success "PDF URL is accessible"
                        $testsPassed++
                    }
                } catch {
                    Write-Error "PDF URL not accessible: $($_.Exception.Message)"
                    $testsFailed++
                }
                
            } else {
                Write-Error "Signed URL missing in response"
                $testsFailed++
            }
            
        } else {
            Write-Error "Unexpected status code: $($response.StatusCode)"
            $testsFailed++
        }
        
    } catch {
        Write-Error "Request failed: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            
            # Parse error response if available
            try {
                # Use GetAwaiter().GetResult() instead of .Result to avoid potential deadlocks
                $errorContent = $_.Exception.Response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                $errorData = $errorContent | ConvertFrom-Json
                if ($errorData.error) {
                    Write-Host "   Error Code: $($errorData.error.code)" -ForegroundColor Red
                    Write-Host "   Error Message: $($errorData.error.message)" -ForegroundColor Red
                }
            } catch {
                # Ignore JSON parse errors
            }
        }
        $testsFailed++
    }
    
    Write-Host ""
} else {
    Write-Warning "Test 3: PDF Download - Skipped (no ReportId provided)"
    Write-Info "  To test PDF download, provide -ReportId parameter"
    Write-Host ""
}

# ==============================================================================
# Test 4: PDF Download - Invalid UUID (should return 404)
# ==============================================================================
Write-Info "Test 4: PDF Download - Invalid UUID (expect 404)"

try {
    $invalidId = "00000000-0000-0000-0000-000000000000"
    $uri = "$BaseUrl/api/reports/$invalidId/pdf"
    $response = Invoke-WebRequest -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Error "Should have returned 404, but got $($response.StatusCode)"
    $testsFailed++
    
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Success "Correctly returns 404 Not Found"
        $testsPassed++
    } else {
        Write-Error "Expected 404, got: $($_.Exception.Response.StatusCode)"
        $testsFailed++
    }
}

Write-Host ""

# ==============================================================================
# Summary
# ==============================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Success "Tests Passed: $testsPassed"
if ($testsFailed -gt 0) {
    Write-Error "Tests Failed: $testsFailed"
}
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Success "All tests passed! ✨"
    exit 0
} else {
    Write-Error "Some tests failed. See details above."
    exit 1
}
