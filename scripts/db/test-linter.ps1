# Test Script for Migration Linter
# Purpose: Deterministic tests to verify linter blocks non-canonical objects
# Usage: .\scripts\db\test-linter.ps1
#
# Exit Codes:
#   0 = All tests passed
#   1 = Test failures detected

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$linterScript = Join-Path $scriptDir "lint-migrations.ps1"
$fixturesDir = Join-Path $scriptDir "fixtures"
$allowedFixture = Join-Path $fixturesDir "allowed.sql"
$forbiddenFixture = Join-Path $fixturesDir "forbidden.sql"

Write-Host "🧪 Migration Linter Test Suite" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# ============================================================
# Test 1: Allowed fixture should pass (exit code 0)
# ============================================================

Write-Host "Test 1: Canonical objects (allowed.sql)" -ForegroundColor Yellow

if (-not (Test-Path $allowedFixture)) {
    Write-Host "❌ FAIL: Fixture not found: $allowedFixture" -ForegroundColor Red
    $testsFailed++
} else {
    $output = & pwsh -File $linterScript -Path $allowedFixture 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($Verbose) {
        Write-Host "Output:" -ForegroundColor Gray
        Write-Host $output -ForegroundColor Gray
    }
    
    if ($exitCode -eq 0) {
        Write-Host "✅ PASS: Linter accepted canonical objects (exit code 0)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ FAIL: Linter rejected canonical objects (exit code $exitCode)" -ForegroundColor Red
        Write-Host "Output: $output" -ForegroundColor Yellow
        $testsFailed++
    }
}

Write-Host ""

# ============================================================
# Test 2: Forbidden fixture should fail (exit code 1)
# ============================================================

Write-Host "Test 2: Non-canonical objects (forbidden.sql)" -ForegroundColor Yellow

if (-not (Test-Path $forbiddenFixture)) {
    Write-Host "❌ FAIL: Fixture not found: $forbiddenFixture" -ForegroundColor Red
    $testsFailed++
} else {
    $output = & pwsh -File $linterScript -Path $forbiddenFixture 2>&1 | Out-String
    $exitCode = $LASTEXITCODE
    
    if ($Verbose) {
        Write-Host "Output:" -ForegroundColor Gray
        Write-Host $output -ForegroundColor Gray
    }
    
    # Check exit code
    if ($exitCode -ne 1) {
        Write-Host "❌ FAIL: Expected exit code 1, got $exitCode" -ForegroundColor Red
        $testsFailed++
    } else {
        Write-Host "✅ PASS: Linter rejected non-canonical objects (exit code 1)" -ForegroundColor Green
        
        # Check output contains expected violations
        $checks = @(
            @{ Pattern = "forbidden\.sql"; Name = "filename" },
            @{ Pattern = "fantasy_table"; Name = "fantasy_table" },
            @{ Pattern = ":\d+"; Name = "line number" }
        )
        
        $allChecksPass = $true
        foreach ($check in $checks) {
            if ($output -match $check.Pattern) {
                Write-Host "  ✓ Output contains $($check.Name)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Output missing $($check.Name)" -ForegroundColor Red
                $allChecksPass = $false
            }
        }
        
        if ($allChecksPass) {
            $testsPassed++
        } else {
            $testsFailed++
        }
    }
}

Write-Host ""

# ============================================================
# Test Summary
# ============================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 Test Results" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    exit 1
}
