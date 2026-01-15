# E6.4.10 Seed Verification Script
# 
# Verifies that the pilot seed data is correctly loaded and deterministic
# 
# Usage:
#   .\verify-e6-4-10-seed.ps1
#
# Prerequisites:
#   - Supabase local instance running (supabase start)
#   - Database reset and seeded (npm run db:reset)

$ErrorActionPreference = 'Stop'

Write-Host "=== E6.4.10 Seed Verification ===" -ForegroundColor Cyan
Write-Host ""

# Function to execute SQL query
function Invoke-LocalPsql {
    param([Parameter(Mandatory = $true)][string]$Query)
    
    # Check if supabase CLI is available
    $supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
    if ($supabaseCmd) {
        $tempFile = New-TemporaryFile
        try {
            [System.IO.File]::WriteAllText(
                $tempFile.FullName,
                $Query,
                (New-Object System.Text.UTF8Encoding($false))
            )
            $output = supabase db query --local --file $tempFile.FullName 2>&1
            if ($LASTEXITCODE -ne 0) {
                throw ($output | Out-String)
            }
            return , $output
        }
        finally {
            try { 
                Remove-Item -Force $tempFile.FullName -ErrorAction SilentlyContinue 
            } 
            catch { 
                # Ignore file cleanup errors - file may already be deleted
            }
        }
    }
    
    # Fallback to docker exec
    $container = (docker ps --format "{{.Names}}" --filter "name=supabase_db_" | Select-Object -First 1)
    if (-not $container) {
        throw "No running Supabase database container found. Run 'supabase start' first."
    }
    
    $output = $Query | docker exec -i $container psql -U postgres -d postgres -t -A 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($output | Out-String)
    }
    return , $output
}

# Test counters
$testsRun = 0
$testsPassed = 0
$testsFailed = 0

function Test-Query {
    param(
        [string]$Name,
        [string]$Query,
        [int]$ExpectedCount,
        [string]$Description
    )
    
    $script:testsRun++
    Write-Host "Test $testsRun : $Name" -ForegroundColor Yellow
    Write-Host "  $Description" -ForegroundColor Gray
    
    try {
        $output = Invoke-LocalPsql -Query $Query
        $joined = ($output | Out-String).Trim()
        
        # Parse count from output
        $count = 0
        if ($joined -match '^\d+$') {
            $count = [int]$joined
        }
        elseif ($joined -match 'COUNT.*?(\d+)') {
            $count = [int]$Matches[1]
        }
        elseif ($joined -match '^\s*(\d+)\s*$') {
            $count = [int]$Matches[1]
        }
        
        if ($count -eq $ExpectedCount) {
            Write-Host "  ✓ PASS (found $count record(s))" -ForegroundColor Green
            $script:testsPassed++
        }
        else {
            Write-Host "  ✗ FAIL (expected $ExpectedCount, got $count)" -ForegroundColor Red
            $script:testsFailed++
        }
    }
    catch {
        Write-Host "  ✗ FAIL (error: $_)" -ForegroundColor Red
        $script:testsFailed++
    }
    Write-Host ""
}

function Test-UUID {
    param(
        [string]$Name,
        [string]$Query,
        [string]$ExpectedUUID,
        [string]$Description
    )
    
    $script:testsRun++
    Write-Host "Test $testsRun : $Name" -ForegroundColor Yellow
    Write-Host "  $Description" -ForegroundColor Gray
    
    try {
        $output = Invoke-LocalPsql -Query $Query
        $joined = ($output | Out-String).Trim()
        
        if ($joined -eq $ExpectedUUID) {
            Write-Host "  ✓ PASS (UUID matches)" -ForegroundColor Green
            $script:testsPassed++
        }
        else {
            Write-Host "  ✗ FAIL (expected $ExpectedUUID, got $joined)" -ForegroundColor Red
            $script:testsFailed++
        }
    }
    catch {
        Write-Host "  ✗ FAIL (error: $_)" -ForegroundColor Red
        $script:testsFailed++
    }
    Write-Host ""
}

# AC1: Deterministic Seeds - Check UUIDs
Write-Host "=== AC1: Deterministic Seeds ===" -ForegroundColor Cyan
Write-Host ""

Test-UUID `
    -Name "Pilot Organization UUID" `
    -Query "SELECT id::text FROM organizations WHERE slug = 'pilot-org';" `
    -ExpectedUUID "00000000-0000-0000-0000-000000000001" `
    -Description "Pilot org should have deterministic UUID"

Test-UUID `
    -Name "Admin User UUID" `
    -Query "SELECT id::text FROM auth.users WHERE email = 'admin@pilot.test';" `
    -ExpectedUUID "10000000-0000-0000-0000-000000000001" `
    -Description "Admin user should have deterministic UUID"

Test-UUID `
    -Name "Clinician User UUID" `
    -Query "SELECT id::text FROM auth.users WHERE email = 'clinician@pilot.test';" `
    -ExpectedUUID "10000000-0000-0000-0000-000000000002" `
    -Description "Clinician user should have deterministic UUID"

Test-UUID `
    -Name "Patient 1 UUID" `
    -Query "SELECT id::text FROM auth.users WHERE email = 'patient1@pilot.test';" `
    -ExpectedUUID "10000000-0000-0000-0000-000000000101" `
    -Description "Patient 1 should have deterministic UUID"

# AC2: Runnable Pilot - Check all required data exists
Write-Host "=== AC2: Runnable Pilot ===" -ForegroundColor Cyan
Write-Host ""

Test-Query `
    -Name "Pilot Organization Exists" `
    -Query "SELECT COUNT(*) FROM organizations WHERE slug = 'pilot-org' AND is_active = true;" `
    -ExpectedCount 1 `
    -Description "One active pilot organization should exist"

Test-Query `
    -Name "Test Users Exist" `
    -Query "SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@pilot.test';" `
    -ExpectedCount 5 `
    -Description "Five test users should exist (1 admin, 1 clinician, 3 patients)"

Test-Query `
    -Name "Admin User Role" `
    -Query "SELECT COUNT(*) FROM auth.users WHERE email = 'admin@pilot.test' AND raw_app_meta_data->>'role' = 'admin';" `
    -ExpectedCount 1 `
    -Description "Admin user should have admin role"

Test-Query `
    -Name "Clinician User Role" `
    -Query "SELECT COUNT(*) FROM auth.users WHERE email = 'clinician@pilot.test' AND raw_app_meta_data->>'role' = 'clinician';" `
    -ExpectedCount 1 `
    -Description "Clinician user should have clinician role"

Test-Query `
    -Name "Patient User Roles" `
    -Query "SELECT COUNT(*) FROM auth.users WHERE email LIKE 'patient%@pilot.test' AND raw_app_meta_data->>'role' = 'patient';" `
    -ExpectedCount 3 `
    -Description "Three patient users should have patient role"

Test-Query `
    -Name "Patient Profiles Exist" `
    -Query "SELECT COUNT(*) FROM patient_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'patient%@pilot.test');" `
    -ExpectedCount 3 `
    -Description "Three patient profiles should exist"

Test-Query `
    -Name "Onboarded Patients" `
    -Query "SELECT COUNT(*) FROM patient_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('patient1@pilot.test', 'patient2@pilot.test')) AND onboarding_status = 'completed';" `
    -ExpectedCount 2 `
    -Description "Two patients should have completed onboarding"

Test-Query `
    -Name "Not Onboarded Patient" `
    -Query "SELECT COUNT(*) FROM patient_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'patient3@pilot.test') AND (onboarding_status = 'not_started' OR onboarding_status IS NULL OR full_name IS NULL);" `
    -ExpectedCount 1 `
    -Description "One patient should not be onboarded yet"

Test-Query `
    -Name "User Consents" `
    -Query "SELECT COUNT(*) FROM user_consents WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'patient%@pilot.test');" `
    -ExpectedCount 2 `
    -Description "Two patients should have consent records"

Test-Query `
    -Name "Stress Funnel Exists" `
    -Query "SELECT COUNT(*) FROM funnels_catalog WHERE slug = 'stress-assessment' AND is_active = true;" `
    -ExpectedCount 1 `
    -Description "Stress assessment funnel should exist and be active"

Test-Query `
    -Name "Sleep Funnel Exists" `
    -Query "SELECT COUNT(*) FROM funnels_catalog WHERE slug = 'sleep-quality' AND is_active = true;" `
    -ExpectedCount 1 `
    -Description "Sleep quality funnel should exist and be active"

Test-Query `
    -Name "Funnel Versions" `
    -Query "SELECT COUNT(*) FROM funnel_versions fv JOIN funnels_catalog fc ON fc.id = fv.funnel_id WHERE fc.slug IN ('stress-assessment', 'sleep-quality') AND fv.is_default = true;" `
    -ExpectedCount 2 `
    -Description "Both funnels should have default versions"

Test-Query `
    -Name "Org Memberships" `
    -Query "SELECT COUNT(*) FROM user_org_membership WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;" `
    -ExpectedCount 5 `
    -Description "All five test users should have org memberships"

# Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Run: $testsRun" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ All seed verification tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Start the dev server: npm run dev" -ForegroundColor Gray
    Write-Host "  2. Login as patient3@pilot.test / patient123" -ForegroundColor Gray
    Write-Host "  3. Complete onboarding (consent + profile)" -ForegroundColor Gray
    Write-Host "  4. Verify redirect to dashboard" -ForegroundColor Gray
    Write-Host "  5. Start an assessment" -ForegroundColor Gray
    Write-Host "  Total time should be < 5 minutes (AC3)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Test Accounts:" -ForegroundColor Yellow
    Write-Host "  admin@pilot.test / admin123" -ForegroundColor Gray
    Write-Host "  clinician@pilot.test / clinician123" -ForegroundColor Gray
    Write-Host "  patient1@pilot.test / patient123 (onboarded)" -ForegroundColor Gray
    Write-Host "  patient2@pilot.test / patient123 (onboarded)" -ForegroundColor Gray
    Write-Host "  patient3@pilot.test / patient123 (not onboarded)" -ForegroundColor Gray
    
    exit 0
}
else {
    Write-Host "✗ Some seed verification tests failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Ensure Supabase is running: supabase status" -ForegroundColor Gray
    Write-Host "  2. Reset database: npm run db:reset" -ForegroundColor Gray
    Write-Host "  3. Check seed file: supabase/seed.sql" -ForegroundColor Gray
    Write-Host "  4. Check logs: supabase logs db" -ForegroundColor Gray
    
    exit 1
}
