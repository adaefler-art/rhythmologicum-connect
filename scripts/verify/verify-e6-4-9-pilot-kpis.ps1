# E6.4.9 Verification Script
# Tests pilot KPIs endpoint and critical endpoints documentation

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$AdminCookie = $env:PILOT_ADMIN_COOKIE,
    [string]$PatientCookie = $env:PILOT_PATIENT_COOKIE
)

Write-Host "=== E6.4.9 Pilot KPIs Verification ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Documentation exists
Write-Host "[TEST 1] Documentation files exist" -ForegroundColor Yellow
$docFiles = @(
    "docs/pilot/CRITICAL_ENDPOINTS.md",
    "E6_4_9_IMPLEMENTATION_SUMMARY.md"
)

$allDocsExist = $true
foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file missing" -ForegroundColor Red
        $allDocsExist = $false
    }
}

if ($allDocsExist) {
    Write-Host "  [PASS] All documentation files exist" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Missing documentation files" -ForegroundColor Red
}
Write-Host ""

# Test 2: Endpoint catalog updated
Write-Host "[TEST 2] Endpoint catalog contains pilot KPIs" -ForegroundColor Yellow
$catalogContent = Get-Content "docs/api/ENDPOINT_CATALOG.md" -Raw
if ($catalogContent -match "pilot/kpis") {
    Write-Host "  ✓ /api/admin/pilot/kpis found in catalog" -ForegroundColor Green
    Write-Host "  [PASS] Endpoint catalog updated" -ForegroundColor Green
} else {
    Write-Host "  ✗ /api/admin/pilot/kpis not found in catalog" -ForegroundColor Red
    Write-Host "  [FAIL] Endpoint catalog not updated" -ForegroundColor Red
}
Write-Host ""

# Test 3: Allowlist updated
Write-Host "[TEST 3] Allowlist contains pilot KPIs" -ForegroundColor Yellow
$allowlistContent = Get-Content "docs/api/endpoint-allowlist.json" -Raw
if ($allowlistContent -match "pilot/kpis") {
    Write-Host "  ✓ /api/admin/pilot/kpis found in allowlist" -ForegroundColor Green
    Write-Host "  [PASS] Allowlist updated" -ForegroundColor Green
} else {
    Write-Host "  ✗ /api/admin/pilot/kpis not found in allowlist" -ForegroundColor Red
    Write-Host "  [FAIL] Allowlist not updated" -ForegroundColor Red
}
Write-Host ""

# Test 4: Critical endpoints documented
Write-Host "[TEST 4] Critical endpoints are documented" -ForegroundColor Yellow
$criticalContent = Get-Content "docs/pilot/CRITICAL_ENDPOINTS.md" -Raw
$requiredSections = @(
    "Must Be Used During Pilot",
    "funnel.*assessment",
    "review.*decide",
    "support-cases"
)

$allSectionsFound = $true
foreach ($section in $requiredSections) {
    if ($criticalContent -match $section) {
        Write-Host "  ✓ Found section/endpoint: $section" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing section/endpoint: $section" -ForegroundColor Red
        $allSectionsFound = $false
    }
}

if ($allSectionsFound) {
    Write-Host "  [PASS] All critical endpoint sections documented" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Missing critical endpoint documentation" -ForegroundColor Red
}
Write-Host ""

# Test 5: API endpoint exists (if server is running)
Write-Host "[TEST 5] API endpoint accessibility" -ForegroundColor Yellow
if ($AdminCookie) {
    try {
        $headers = @{ "Cookie" = $AdminCookie }
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/admin/pilot/kpis" -Method Get -Headers $headers -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ Endpoint returns 200 OK with admin auth" -ForegroundColor Green
            
            $data = $response.Content | ConvertFrom-Json
            if ($data.success -eq $true) {
                Write-Host "  ✓ Response has success: true" -ForegroundColor Green
                
                if ($data.data.kpis) {
                    Write-Host "  ✓ Response contains KPIs object" -ForegroundColor Green
                    
                    # Check for expected KPI categories
                    $expectedCategories = @("funnelMetrics", "reviewMetrics", "supportCaseMetrics", "workupMetrics")
                    $allCategoriesPresent = $true
                    
                    foreach ($category in $expectedCategories) {
                        if ($data.data.kpis.$category) {
                            Write-Host "    ✓ $category present" -ForegroundColor Green
                        } else {
                            Write-Host "    ✗ $category missing" -ForegroundColor Red
                            $allCategoriesPresent = $false
                        }
                    }
                    
                    if ($allCategoriesPresent) {
                        Write-Host "  [PASS] All KPI categories present" -ForegroundColor Green
                    } else {
                        Write-Host "  [FAIL] Missing KPI categories" -ForegroundColor Red
                    }
                } else {
                    Write-Host "  ✗ Response missing KPIs object" -ForegroundColor Red
                    Write-Host "  [FAIL] Malformed response" -ForegroundColor Red
                }
            } else {
                Write-Host "  ✗ Response has success: false" -ForegroundColor Red
                Write-Host "  [FAIL] API returned error" -ForegroundColor Red
            }
        } else {
            Write-Host "  ✗ Endpoint returned status $($response.StatusCode)" -ForegroundColor Red
            Write-Host "  [FAIL] Unexpected status code" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Failed to access endpoint: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  [SKIP] Server may not be running or admin cookie invalid" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [SKIP] No admin cookie provided (set PILOT_ADMIN_COOKIE env var)" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Authorization check (patient should be denied)
Write-Host "[TEST 6] Authorization enforcement (patient denied)" -ForegroundColor Yellow
if ($PatientCookie) {
    try {
        $headers = @{ "Cookie" = $PatientCookie }
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/admin/pilot/kpis" -Method Get -Headers $headers -ErrorAction Stop
        
        Write-Host "  ✗ Patient was allowed access (expected 403)" -ForegroundColor Red
        Write-Host "  [FAIL] Authorization not enforced" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "  ✓ Patient correctly denied with 403 Forbidden" -ForegroundColor Green
            Write-Host "  [PASS] Authorization enforced" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  [FAIL] Unexpected response" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  [SKIP] No patient cookie provided (set PILOT_PATIENT_COOKIE env var)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Verification Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start dev server: npm run dev" -ForegroundColor White
Write-Host "2. Set admin cookie: `$env:PILOT_ADMIN_COOKIE = 'sb-localhost-auth-token=YOUR_COOKIE'" -ForegroundColor White
Write-Host "3. Set patient cookie: `$env:PILOT_PATIENT_COOKIE = 'sb-localhost-auth-token=YOUR_COOKIE'" -ForegroundColor White
Write-Host "4. Re-run this script to test API endpoints" -ForegroundColor White
Write-Host ""
Write-Host "Manual Testing:" -ForegroundColor Yellow
Write-Host "  curl -H 'Cookie: sb-localhost-auth-token=YOUR_ADMIN_COOKIE' http://localhost:3000/api/admin/pilot/kpis" -ForegroundColor White
Write-Host ""
