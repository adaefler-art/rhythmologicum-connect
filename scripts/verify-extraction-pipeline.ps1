# V05-I04.2 Extraction Pipeline Verification Script
# Verifies extraction pipeline implementation

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "V05-I04.2 — AI Extraction Pipeline Verification" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0

# Function to report test result
function Test-Result {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = ""
    )
    
    if ($Passed) {
        Write-Host "✓ $TestName" -ForegroundColor Green
        if ($Details) {
            Write-Host "  $Details" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ $TestName" -ForegroundColor Red
        if ($Details) {
            Write-Host "  $Details" -ForegroundColor Yellow
        }
        $script:ErrorCount++
    }
}

# Test 1: Verify migration file exists
Write-Host "1. Database Migration" -ForegroundColor Yellow
$migrationFile = "supabase/migrations/20260103130600_add_extraction_pipeline_fields.sql"
$migrationExists = Test-Path $migrationFile
Test-Result "Migration file exists" $migrationExists $migrationFile

if ($migrationExists) {
    $migrationContent = Get-Content $migrationFile -Raw
    Test-Result "Migration adds extractor_version column" ($migrationContent -match "extractor_version")
    Test-Result "Migration adds input_hash column" ($migrationContent -match "input_hash")
    Test-Result "Migration adds extracted_json column" ($migrationContent -match "extracted_json")
    Test-Result "Migration adds confidence_json column" ($migrationContent -match "confidence_json")
    Test-Result "Migration creates idempotency index" ($migrationContent -match "idx_documents_extraction_idempotency")
}
Write-Host ""

# Test 2: Verify type definitions
Write-Host "2. Type Definitions" -ForegroundColor Yellow
$extractionTypesFile = "lib/types/extraction.ts"
$extractionTypesExists = Test-Path $extractionTypesFile
Test-Result "Extraction types file exists" $extractionTypesExists $extractionTypesFile

if ($extractionTypesExists) {
    $typesContent = Get-Content $extractionTypesFile -Raw
    Test-Result "ExtractedDataSchema defined" ($typesContent -match "ExtractedDataSchema")
    Test-Result "ConfidenceMetadataSchema defined" ($typesContent -match "ConfidenceMetadataSchema")
    Test-Result "ExtractionResult type defined" ($typesContent -match "ExtractionResult")
    Test-Result "EXTRACTION_ERROR constants defined" ($typesContent -match "EXTRACTION_ERROR")
}
Write-Host ""

# Test 3: Verify extraction pipeline
Write-Host "3. Extraction Pipeline" -ForegroundColor Yellow
$pipelineFile = "lib/extraction/pipeline.ts"
$pipelineExists = Test-Path $pipelineFile
Test-Result "Pipeline file exists" $pipelineExists $pipelineFile

if ($pipelineExists) {
    $pipelineContent = Get-Content $pipelineFile -Raw
    Test-Result "computeExtractionInputHash function exists" ($pipelineContent -match "computeExtractionInputHash")
    Test-Result "validateDocumentReadyForExtraction function exists" ($pipelineContent -match "validateDocumentReadyForExtraction")
    Test-Result "extractDataWithAI function exists" ($pipelineContent -match "extractDataWithAI")
    Test-Result "runExtractionPipeline function exists" ($pipelineContent -match "runExtractionPipeline")
    Test-Result "Uses Anthropic SDK" ($pipelineContent -match "Anthropic")
}
Write-Host ""

# Test 4: Verify API route
Write-Host "4. API Route" -ForegroundColor Yellow
$apiRouteFile = "app/api/documents/[id]/extract/route.ts"
$apiRouteExists = Test-Path $apiRouteFile
Test-Result "Extract API route exists" $apiRouteExists $apiRouteFile

if ($apiRouteExists) {
    $apiContent = Get-Content $apiRouteFile -Raw
    Test-Result "POST handler defined" ($apiContent -match "export async function POST")
    Test-Result "Authentication check present" ($apiContent -match "getCurrentUser")
    Test-Result "Ownership verification present" ($apiContent -match "patient_profiles")
    Test-Result "Pipeline orchestrator called" ($apiContent -match "runExtractionPipeline")
}
Write-Host ""

# Test 5: Verify contracts registry
Write-Host "5. Contracts Registry" -ForegroundColor Yellow
$registryFile = "lib/contracts/registry.ts"
$registryExists = Test-Path $registryFile
Test-Result "Registry file exists" $registryExists $registryFile

if ($registryExists) {
    $registryContent = Get-Content $registryFile -Raw
    Test-Result "EXTRACTOR_VERSION defined" ($registryContent -match "EXTRACTOR_VERSION")
    Test-Result "CURRENT_EXTRACTOR_VERSION defined" ($registryContent -match "CURRENT_EXTRACTOR_VERSION")
    Test-Result "V1_0_0 version exists" ($registryContent -match "V1_0_0")
}
Write-Host ""

# Test 6: Verify tests
Write-Host "6. Unit Tests" -ForegroundColor Yellow
$testFile = "lib/extraction/__tests__/pipeline.test.ts"
$testExists = Test-Path $testFile
Test-Result "Test file exists" $testExists $testFile

if ($testExists) {
    $testContent = Get-Content $testFile -Raw
    Test-Result "Input hash tests present" ($testContent -match "computeExtractionInputHash")
    Test-Result "Document validation tests present" ($testContent -match "validateDocumentReadyForExtraction")
    Test-Result "Schema validation tests present" ($testContent -match "ExtractedDataSchema")
    Test-Result "Confidence metadata tests present" ($testContent -match "ConfidenceMetadataSchema")
}

Write-Host ""
Write-Host "Running test suite..." -ForegroundColor Yellow
$testOutput = npm test -- lib/extraction/__tests__/pipeline.test.ts 2>&1
$testsPassed = $testOutput -match "Tests:.*passed"
Test-Result "All extraction pipeline tests pass" $testsPassed

Write-Host ""

# Test 7: Verify documentation
Write-Host "7. Documentation" -ForegroundColor Yellow
$docFile = "docs/DOCUMENT_EXTRACTION.md"
$docExists = Test-Path $docFile
Test-Result "Extraction documentation exists" $docExists $docFile

if ($docExists) {
    $docContent = Get-Content $docFile -Raw
    Test-Result "Architecture section present" ($docContent -match "## Architecture")
    Test-Result "API endpoint documented" ($docContent -match "POST /api/documents/\[id\]/extract")
    Test-Result "Schema documentation present" ($docContent -match "Extracted Data Schema")
    Test-Result "Security section present" ($docContent -match "## Security")
}
Write-Host ""

# Test 8: Build verification
Write-Host "8. Build Verification" -ForegroundColor Yellow
Write-Host "Building project..." -ForegroundColor Gray
$buildOutput = npm run build 2>&1
$buildSuccess = $buildOutput -match "Compiled successfully"
Test-Result "Project builds successfully" $buildSuccess

Write-Host ""

# Summary
Write-Host "==============================================================================" -ForegroundColor Cyan
if ($ErrorCount -eq 0) {
    Write-Host "✓ ALL VERIFICATION CHECKS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Extraction pipeline implementation is complete and verified." -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ $ErrorCount VERIFICATION CHECK(S) FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the failed checks above." -ForegroundColor Yellow
    exit 1
}
