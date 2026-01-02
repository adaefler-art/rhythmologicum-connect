# Verify Pillars/Catalog SOT Audit Implementation (TV05_01B)
# This script verifies that the pillars/catalog source-of-truth audit endpoint works correctly

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Debug
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TV05_01B: Pillars SOT Audit Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Track overall success
$allChecksPassed = $true

function Write-Check {
    param(
        [string]$Message,
        [string]$Status,
        [string]$Details = ""
    )
    
    $icon = switch ($Status) {
        "PASS" { "✓"; $color = "Green" }
        "FAIL" { "✗"; $color = "Red" }
        "SKIP" { "⊘"; $color = "Yellow" }
        "INFO" { "ℹ"; $color = "Cyan" }
        default { "•"; $color = "White" }
    }
    
    Write-Host "  $icon $Message" -ForegroundColor $color
    if ($Details) {
        Write-Host "    $Details" -ForegroundColor Gray
    }
}

# ==============================================
# 1. Run Tests
# ==============================================
Write-Host "Step 1: Running Tests" -ForegroundColor Yellow
Write-Host ""

if ($SkipTests) {
    Write-Check "Tests" "SKIP" "Skipped by user"
} else {
    try {
        $testOutput = npm test -- app/api/admin/diagnostics/pillars-sot/__tests__/route.test.ts 2>&1
        $testExitCode = $LASTEXITCODE
        
        if ($Debug) {
            Write-Host $testOutput -ForegroundColor Gray
        }
        
        if ($testExitCode -eq 0) {
            $passedTests = ($testOutput | Select-String "Tests:\s+(\d+) passed" | ForEach-Object { $_.Matches.Groups[1].Value })
            Write-Check "Tests passed ($passedTests tests)" "PASS"
        } else {
            Write-Check "Tests failed" "FAIL"
            $allChecksPassed = $false
            if (-not $Debug) {
                Write-Host $testOutput -ForegroundColor Gray
            }
        }
    } catch {
        Write-Check "Tests encountered an error" "FAIL" $_.Exception.Message
        $allChecksPassed = $false
    }
}

Write-Host ""

# ==============================================
# 2. Build Project
# ==============================================
Write-Host "Step 2: Building Project" -ForegroundColor Yellow
Write-Host ""

if ($SkipBuild) {
    Write-Check "Build" "SKIP" "Skipped by user"
} else {
    try {
        $buildOutput = npm run build 2>&1
        $buildExitCode = $LASTEXITCODE
        
        if ($Debug) {
            Write-Host $buildOutput -ForegroundColor Gray
        }
        
        if ($buildExitCode -eq 0) {
            Write-Check "Build successful" "PASS"
        } else {
            Write-Check "Build failed" "FAIL"
            $allChecksPassed = $false
            if (-not $Debug) {
                Write-Host $buildOutput -ForegroundColor Gray
            }
        }
    } catch {
        Write-Check "Build encountered an error" "FAIL" $_.Exception.Message
        $allChecksPassed = $false
    }
}

Write-Host ""

# ==============================================
# 3. Verify Endpoint Structure
# ==============================================
Write-Host "Step 3: Verifying Endpoint Structure" -ForegroundColor Yellow
Write-Host ""

try {
    # Check that the route file exists
    $routeFile = "app/api/admin/diagnostics/pillars-sot/route.ts"
    if (Test-Path $routeFile) {
        Write-Check "Route file exists" "PASS" $routeFile
        
        # Verify key components in the route file
        $routeContent = Get-Content $routeFile -Raw
        
        $checks = @(
            @{ Pattern = "export async function GET"; Description = "GET handler defined" },
            @{ Pattern = "getCurrentUser"; Description = "Authentication check present" },
            @{ Pattern = "hasAdminOrClinicianRole"; Description = "Authorization check present" },
            @{ Pattern = "PillarsSotAuditResponse"; Description = "Response type defined" },
            @{ Pattern = "redactUrl"; Description = "URL redaction function present" },
            @{ Pattern = "getTableMetadata"; Description = "Table metadata function present" },
            @{ Pattern = "getRowCount"; Description = "Row count function present" },
            @{ Pattern = "checkStressFunnelSeed"; Description = "Seed verification present" }
        )
        
        foreach ($check in $checks) {
            if ($routeContent -match $check.Pattern) {
                Write-Check $check.Description "PASS"
            } else {
                Write-Check $check.Description "FAIL"
                $allChecksPassed = $false
            }
        }
    } else {
        Write-Check "Route file exists" "FAIL" "File not found: $routeFile"
        $allChecksPassed = $false
    }
} catch {
    Write-Check "Endpoint structure verification failed" "FAIL" $_.Exception.Message
    $allChecksPassed = $false
}

Write-Host ""

# ==============================================
# 4. Verify Test Coverage
# ==============================================
Write-Host "Step 4: Verifying Test Coverage" -ForegroundColor Yellow
Write-Host ""

try {
    $testFile = "app/api/admin/diagnostics/pillars-sot/__tests__/route.test.ts"
    if (Test-Path $testFile) {
        Write-Check "Test file exists" "PASS" $testFile
        
        $testContent = Get-Content $testFile -Raw
        
        $testChecks = @(
            @{ Pattern = "returns 401 when user is not authenticated"; Description = "Auth test present" },
            @{ Pattern = "returns 403 when user is not admin/clinician"; Description = "Authorization test present" },
            @{ Pattern = "returns audit data.*admin user"; Description = "Success case test present" },
            @{ Pattern = "handles missing tables gracefully"; Description = "Missing tables test present" },
            @{ Pattern = "works for clinician user"; Description = "Clinician role test present" },
            @{ Pattern = "does not include PHI"; Description = "PHI compliance test present" },
            @{ Pattern = "redacts.*URL"; Description = "URL redaction test present" },
            @{ Pattern = "machine-readable JSON.*stable schema"; Description = "Schema stability test present" }
        )
        
        foreach ($check in $testChecks) {
            if ($testContent -match $check.Pattern) {
                Write-Check $check.Description "PASS"
            } else {
                Write-Check $check.Description "FAIL"
                $allChecksPassed = $false
            }
        }
    } else {
        Write-Check "Test file exists" "FAIL" "File not found: $testFile"
        $allChecksPassed = $false
    }
} catch {
    Write-Check "Test coverage verification failed" "FAIL" $_.Exception.Message
    $allChecksPassed = $false
}

Write-Host ""

# ==============================================
# 5. Verify Documentation
# ==============================================
Write-Host "Step 5: Checking Documentation" -ForegroundColor Yellow
Write-Host ""

try {
    $routeContent = Get-Content "app/api/admin/diagnostics/pillars-sot/route.ts" -Raw
    
    $docChecks = @(
        @{ Pattern = "TV05_01B"; Description = "Issue reference present" },
        @{ Pattern = "@param|@returns"; Description = "JSDoc comments present" },
        @{ Pattern = "PHI-free|machine-readable"; Description = "Requirements documented" },
        @{ Pattern = "Authentication:"; Description = "Auth requirements documented" }
    )
    
    foreach ($check in $docChecks) {
        if ($routeContent -match $check.Pattern) {
            Write-Check $check.Description "PASS"
        } else {
            Write-Check $check.Description "FAIL"
            $allChecksPassed = $false
        }
    }
} catch {
    Write-Check "Documentation check failed" "FAIL" $_.Exception.Message
    $allChecksPassed = $false
}

Write-Host ""

# ==============================================
# Summary
# ==============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allChecksPassed) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The pillars/catalog SOT audit endpoint is properly implemented." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Deploy to a test environment" -ForegroundColor White
    Write-Host "  2. Test with actual Supabase instance" -ForegroundColor White
    Write-Host "  3. Verify endpoint at /api/admin/diagnostics/pillars-sot" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ Some checks failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the failed checks above and fix any issues." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  • If tests failed: Check test mocks and implementation" -ForegroundColor White
    Write-Host "  • If build failed: Check TypeScript errors and imports" -ForegroundColor White
    Write-Host "  • If structure checks failed: Ensure all required functions are present" -ForegroundColor White
    Write-Host ""
    exit 1
}
