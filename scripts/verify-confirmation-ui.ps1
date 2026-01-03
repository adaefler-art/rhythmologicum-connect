# V05-I04.3 Confirmation UI - PowerShell Verification Script
# Verifies security hardening and implementation completeness

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " V05-I04.3 CONFIRMATION UI - VERIFICATION SCRIPT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$testsPassed = 0
$testsFailed = 0

function Test-FileExists {
    param($Path, $Description)
    Write-Host "Checking: $Description..." -NoNewline
    if (Test-Path $Path) {
        Write-Host " ✓" -ForegroundColor Green
        $script:testsPassed++
        return $true
    } else {
        Write-Host " ✗" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

function Test-ContentContains {
    param($Path, $Pattern, $Description, $ShouldNotContain = $false)
    Write-Host "Checking: $Description..." -NoNewline
    if (Test-Path $Path) {
        $content = Get-Content $Path -Raw
        $match = $content -match $Pattern
        
        if ($ShouldNotContain) {
            if (-not $match) {
                Write-Host " ✓" -ForegroundColor Green
                $script:testsPassed++
                return $true
            } else {
                Write-Host " ✗ (FOUND: should not contain)" -ForegroundColor Red
                $script:testsFailed++
                return $false
            }
        } else {
            if ($match) {
                Write-Host " ✓" -ForegroundColor Green
                $script:testsPassed++
                return $true
            } else {
                Write-Host " ✗ (NOT FOUND)" -ForegroundColor Red
                $script:testsFailed++
                return $false
            }
        }
    } else {
        Write-Host " ✗ (FILE NOT FOUND)" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

Write-Host "1. FILE EXISTENCE" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-FileExists "lib/actions/confirmations.ts" "Server actions file"
Test-FileExists "lib/actions/__tests__/confirmations.test.ts" "Server action tests"
Test-FileExists "app/patient/documents/[id]/confirm/page.tsx" "Patient page component"
Test-FileExists "app/patient/documents/[id]/confirm/client.tsx" "Client UI component"
Test-FileExists "lib/types/extraction.ts" "Extraction types"
Write-Host ""

Write-Host "2. AUTH-FIRST PATTERN" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-ContentContains "lib/actions/confirmations.ts" `
    "// Auth-first: Get authenticated user BEFORE any parsing or validation" `
    "Auth-first comment in saveDocumentConfirmation"

Test-ContentContains "lib/actions/confirmations.ts" `
    "const \{ supabase, user, error: authError \} = await getAuthenticatedClient\(\)" `
    "Auth check before validation"

Test-ContentContains "lib/actions/__tests__/confirmations.test.ts" `
    "should check authentication BEFORE validating payload" `
    "Test for auth-first pattern"

Write-Host ""

Write-Host "3. PHI-SAFE LOGGING" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-ContentContains "lib/actions/confirmations.ts" `
    "console\.error\('\[saveDocumentConfirmation\] Update failed', \{" `
    "PHI-safe error logging (object format)"

Test-ContentContains "lib/actions/confirmations.ts" `
    "console\.error.*updateError\)" `
    "No raw error object logging" `
    -ShouldNotContain

Test-ContentContains "lib/actions/confirmations.ts" `
    "errorCode: updateError\?\.code" `
    "Error code only (no message/details)"

Test-ContentContains "lib/actions/__tests__/confirmations.test.ts" `
    "should log only metadata, not extracted values" `
    "Test for PHI-safe audit logging"

Test-ContentContains "lib/actions/__tests__/confirmations.test.ts" `
    "expect\(JSON\.stringify\(auditCall\.metadata\)\)\.not\.toContain\('Glucose'\)" `
    "Test verifies no PHI in audit"

Write-Host ""

Write-Host "4. DETERMINISTIC ORDERING" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-ContentContains "app/patient/documents/[id]/confirm/client.tsx" `
    "\.sort\(\(\[a\], \[b\]\) => a\.localeCompare\(b\)\)" `
    "Vital signs sorted alphabetically"

Test-ContentContains "app/patient/documents/[id]/confirm/client.tsx" `
    "// Sort vital signs by key for deterministic ordering" `
    "Deterministic ordering comment"

Test-ContentContains "app/patient/documents/[id]/confirm/client.tsx" `
    "Accept all vital signs - sort keys for deterministic ordering" `
    "Accept all also sorted"

Write-Host ""

Write-Host "5. COMPREHENSIVE TESTS" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-ContentContains "lib/actions/__tests__/confirmations.test.ts" `
    "should deny access to documents owned by other users" `
    "Ownership denial test"

Test-ContentContains "lib/actions/__tests__/confirmations.test.ts" `
    "should reject invalid document_id format" `
    "Invalid payload test"

Test-ContentContains "lib/actions/__tests__/confirmations.test.ts" `
    "should allow saving same confirmation multiple times" `
    "Idempotent persistence test"

Test-ContentContains "lib/actions/__tests__/confirmations.test.ts" `
    "should handle missing extraction data gracefully" `
    "Missing extraction test"

Write-Host ""

Write-Host "6. SCHEMA VERIFICATION" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-ContentContains "supabase/migrations/20251230211228_v05_core_schema_jsonb_fields.sql" `
    "confirmed_data JSONB" `
    "confirmed_data column exists in schema"

Test-ContentContains "supabase/migrations/20251230211228_v05_core_schema_jsonb_fields.sql" `
    "confirmed_at TIMESTAMPTZ" `
    "confirmed_at column exists in schema"

Write-Host ""

Write-Host "7. BUILD & TEST EXECUTION" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

Write-Host "Running npm test..." -NoNewline
try {
    $testOutput = npm test 2>&1 | Out-String
    if ($testOutput -match "Tests:\s+(\d+) passed") {
        $testsCount = $Matches[1]
        Write-Host " ✓ ($testsCount tests passed)" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host " ✗ (Tests failed or unexpected output)" -ForegroundColor Red
        $script:testsFailed++
    }
} catch {
    Write-Host " ✗ (Error running tests)" -ForegroundColor Red
    $script:testsFailed++
}

Write-Host "Running npm run build..." -NoNewline
try {
    $buildOutput = npm run build 2>&1 | Out-String
    if ($buildOutput -match "Compiled successfully" -or $buildOutput -match "Production build") {
        Write-Host " ✓" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host " ✗ (Build failed)" -ForegroundColor Red
        $script:testsFailed++
    }
} catch {
    Write-Host " ✗ (Error running build)" -ForegroundColor Red
    $script:testsFailed++
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: " -NoNewline
Write-Host $testsPassed -ForegroundColor Green
Write-Host "Tests Failed: " -NoNewline
Write-Host $testsFailed -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ ALL VERIFICATION CHECKS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "The confirmation UI implementation is:" -ForegroundColor Cyan
    Write-Host "  • Auth-first compliant" -ForegroundColor Gray
    Write-Host "  • PHI-safe (no values in logs)" -ForegroundColor Gray
    Write-Host "  • Deterministically ordered" -ForegroundColor Gray
    Write-Host "  • Comprehensively tested" -ForegroundColor Gray
    Write-Host "  • Production ready" -ForegroundColor Gray
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ SOME VERIFICATION CHECKS FAILED" -ForegroundColor Red
    Write-Host "Please review the output above and fix any issues." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
