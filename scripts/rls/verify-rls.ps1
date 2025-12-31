# RLS Verification PowerShell Script
# Purpose: Verify V0.5 RLS policies after database reset
# Usage: pwsh scripts/rls/verify-rls.ps1
# Prerequisites: npm run db:reset must have been run successfully
# Date: 2025-12-31
# Issue: V05-I01.2

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
$sqlScript = Join-Path $scriptDir "verify-rls.sql"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  V0.5 RLS Policy Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if Supabase is running
try {
    $supabaseStatus = npx supabase status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Supabase is not running" -ForegroundColor Red
        Write-Host "Please run: npx supabase start" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to check Supabase status" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Check if SQL script exists
if (-not (Test-Path $sqlScript)) {
    Write-Host "ERROR: SQL script not found: $sqlScript" -ForegroundColor Red
    exit 1
}

Write-Host "Prerequisites OK" -ForegroundColor Green
Write-Host ""

# Run verification SQL script
Write-Host "Running RLS verification tests..." -ForegroundColor Yellow
Write-Host ""

try {
    # Execute SQL script via Supabase CLI
    $output = npx supabase db execute --file $sqlScript --local 2>&1
    
    if ($Verbose) {
        Write-Host $output
    }
    
    # Check for PASS/FAIL in output
    $passed = $output -match "PASS: All RLS verification checks passed"
    $failed = $output -match "FAIL:"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($passed -and -not $failed) {
        Write-Host "  RESULT: PASS ✓" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "All RLS verification checks passed successfully!" -ForegroundColor Green
        Write-Host ""
        exit 0
    } elseif ($failed) {
        Write-Host "  RESULT: FAIL ✗" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "RLS verification failed. Check output above for details." -ForegroundColor Red
        Write-Host ""
        
        # Show failure details
        $failureLines = $output | Select-String "FAIL:" -Context 0,2
        if ($failureLines) {
            Write-Host "Failure details:" -ForegroundColor Yellow
            foreach ($line in $failureLines) {
                Write-Host $line -ForegroundColor Red
            }
        }
        Write-Host ""
        exit 1
    } else {
        Write-Host "  RESULT: UNKNOWN" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Could not determine test result. Run with -Verbose for details." -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  RESULT: ERROR ✗" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ERROR: Failed to execute verification script" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}
