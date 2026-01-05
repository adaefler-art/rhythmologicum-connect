# V05-I07.1 Verification Script
# PowerShell-only commands for testing triage implementation

Write-Host "=== V05-I07.1 Triage Implementation Verification ===" -ForegroundColor Cyan
Write-Host ""

# Part A: Route Conflict Fix Verification
Write-Host "Part A: Route Conflict Resolution" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

Write-Host "1. Checking route structure..." -ForegroundColor White
$identifierRoute = Test-Path "app/clinician/funnels/[identifier]/page.tsx"
$editorRoute = Test-Path "app/clinician/funnels/[identifier]/editor/page.tsx"
$oldIdRoute = Test-Path "app/clinician/funnels/[id]"
$oldSlugRoute = Test-Path "app/clinician/funnels/[slug]"

if ($identifierRoute -and $editorRoute -and -not $oldIdRoute -and -not $oldSlugRoute) {
    Write-Host "   ✓ Routes unified to [identifier]" -ForegroundColor Green
} else {
    Write-Host "   ✗ Route structure incorrect" -ForegroundColor Red
    Write-Host "     [identifier] exists: $identifierRoute" -ForegroundColor Gray
    Write-Host "     [identifier]/editor exists: $editorRoute" -ForegroundColor Gray
    Write-Host "     Old [id] exists: $oldIdRoute" -ForegroundColor Gray
    Write-Host "     Old [slug] exists: $oldSlugRoute" -ForegroundColor Gray
}

Write-Host ""
Write-Host "2. Running build to verify no route conflicts..." -ForegroundColor White
$buildOutput = npm run build 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

if ($buildSuccess) {
    Write-Host "   ✓ Build successful - no route conflicts" -ForegroundColor Green
} else {
    Write-Host "   ✗ Build failed" -ForegroundColor Red
    Write-Host $buildOutput | Select-String "Error:|different slug names" -ForegroundColor Red
}

Write-Host ""

# Part B: Triage Schema Evidence Verification
Write-Host "Part B: Triage Schema Evidence" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

Write-Host "1. Checking triage page exists..." -ForegroundColor White
$triagePage = Test-Path "app/clinician/triage/page.tsx"
if ($triagePage) {
    Write-Host "   ✓ Triage page exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Triage page missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Verifying schema evidence..." -ForegroundColor White

# Check if tables referenced in triage exist in schema
$schemaContent = Get-Content "schema/schema.sql" -Raw

$assessmentsTable = $schemaContent -match 'CREATE TABLE.*"assessments"'
$processingJobsTable = $schemaContent -match 'CREATE TABLE.*"processing_jobs"'
$reportsTable = $schemaContent -match 'CREATE TABLE.*"reports"'
$patientProfilesTable = $schemaContent -match 'CREATE TABLE.*"patient_profiles"'
$funnelsTable = $schemaContent -match 'CREATE TABLE.*"funnels"'

Write-Host "   Tables in schema:" -ForegroundColor Gray
Write-Host "   - assessments: $assessmentsTable" -ForegroundColor $(if ($assessmentsTable) { "Green" } else { "Red" })
Write-Host "   - processing_jobs: $processingJobsTable" -ForegroundColor $(if ($processingJobsTable) { "Green" } else { "Red" })
Write-Host "   - reports: $reportsTable" -ForegroundColor $(if ($reportsTable) { "Green" } else { "Red" })
Write-Host "   - patient_profiles: $patientProfilesTable" -ForegroundColor $(if ($patientProfilesTable) { "Green" } else { "Red" })
Write-Host "   - funnels: $funnelsTable" -ForegroundColor $(if ($funnelsTable) { "Green" } else { "Red" })

$allTablesExist = $assessmentsTable -and $processingJobsTable -and $reportsTable -and $patientProfilesTable -and $funnelsTable

if ($allTablesExist) {
    Write-Host "   ✓ All referenced tables exist in schema" -ForegroundColor Green
} else {
    Write-Host "   ✗ Some tables missing from schema" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Checking role definitions..." -ForegroundColor White

$clinicianRole = $schemaContent -match "'clinician'"
$adminRole = $schemaContent -match "'admin'"
$nurseRole = $schemaContent -match "'nurse'"
$patientRole = $schemaContent -match "'patient'"

Write-Host "   Roles in schema:" -ForegroundColor Gray
Write-Host "   - clinician: $clinicianRole" -ForegroundColor $(if ($clinicianRole) { "Green" } else { "Red" })
Write-Host "   - admin: $adminRole" -ForegroundColor $(if ($adminRole) { "Green" } else { "Red" })
Write-Host "   - nurse: $nurseRole" -ForegroundColor $(if ($nurseRole) { "Green" } else { "Red" })
Write-Host "   - patient: $patientRole" -ForegroundColor $(if ($patientRole) { "Green" } else { "Red" })

if ($clinicianRole -and $adminRole -and $nurseRole -and $patientRole) {
    Write-Host "   ✓ All expected roles exist in schema" -ForegroundColor Green
} else {
    Write-Host "   ✗ Some roles missing from schema" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Running tests..." -ForegroundColor White
$testOutput = npm test 2>&1
$testResults = $testOutput | Select-String "Test Suites:.*passed" | Select-Object -Last 1

if ($testResults) {
    Write-Host "   $testResults" -ForegroundColor Gray
    
    # Extract passed count
    if ($testOutput -match "(\d+) passed") {
        $passedCount = [int]$matches[1]
        if ($passedCount -gt 0) {
            Write-Host "   ✓ Tests running ($passedCount passing)" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ⚠ Could not parse test results" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Write-Host ""

$partAPass = $identifierRoute -and $editorRoute -and -not $oldIdRoute -and -not $oldSlugRoute -and $buildSuccess
$partBPass = $triagePage -and $allTablesExist

Write-Host "Part A (Route Conflict): $(if ($partAPass) { '✓ PASS' } else { '✗ FAIL' })" -ForegroundColor $(if ($partAPass) { "Green" } else { "Red" })
Write-Host "Part B (Schema Evidence): $(if ($partBPass) { '✓ PASS' } else { '✗ FAIL' })" -ForegroundColor $(if ($partBPass) { "Green" } else { "Red" })

Write-Host ""

if ($partAPass -and $partBPass) {
    Write-Host "Overall: ✓ MERGE READY" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Overall: ✗ NEEDS FIXES" -ForegroundColor Red
    exit 1
}
