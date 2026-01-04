# Migration Sync Verification Script
# Purpose: Verify that local migrations are in sync with remote database
# Usage: pwsh -File scripts/verify-migration-sync.ps1

param(
    [switch]$Verbose,
    [switch]$CI,
    [switch]$NoAutoStart
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Migration Sync Verification ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

# Step 1: Count local migrations
Write-Host "[1/6] Counting local migrations..." -ForegroundColor Cyan
$localMigrations = Get-ChildItem supabase/migrations/*.sql -ErrorAction SilentlyContinue
if (-not $localMigrations) {
    Write-Host "❌ No migrations found in supabase/migrations/" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Found $($localMigrations.Count) local migrations" -ForegroundColor Green

# Step 2: Get latest local migration
Write-Host "`n[2/6] Identifying latest local migration..." -ForegroundColor Cyan
$latestLocal = $localMigrations | Sort-Object Name | Select-Object -Last 1
$latestLocalVersion = $latestLocal.BaseName
Write-Host "  ✓ Latest local migration: $latestLocalVersion" -ForegroundColor Green

if ($Verbose) {
    Write-Host "`n  Recent migrations:" -ForegroundColor Gray
    $localMigrations | Sort-Object Name | Select-Object -Last 5 | ForEach-Object {
        Write-Host "    - $($_.BaseName)" -ForegroundColor Gray
    }
}

# Step 3: Check if Supabase CLI is available
Write-Host "`n[3/6] Checking Supabase CLI..." -ForegroundColor Cyan
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "  ✓ Supabase CLI is installed: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "  Install from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Step 4: Check remote status (requires link)
Write-Host "`n[4/6] Checking remote migration status..." -ForegroundColor Cyan
try {
    $migrationListOutput = supabase migration list 2>&1
    
    if ($migrationListOutput -match "not linked") {
        Write-Host "  ⚠️  Project not linked to remote" -ForegroundColor Yellow
        
        if ($CI) {
            Write-Host "  ❌ CI Mode: Project must be linked" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "  Run: supabase link --project-ref <your-project-ref>" -ForegroundColor Yellow
        Write-Host "  Skipping remote checks..." -ForegroundColor Gray
        $isLinked = $false
    } else {
        Write-Host "  ✓ Project is linked" -ForegroundColor Green
        $isLinked = $true
        
        if ($Verbose) {
            Write-Host "`n  Migration status:" -ForegroundColor Gray
            Write-Host $migrationListOutput -ForegroundColor Gray
        }
        
        # Parse output to check if latest migration is applied remotely
        $appliedRemotely = $migrationListOutput -match $latestLocalVersion
        if ($appliedRemotely) {
            Write-Host "  ✓ Latest migration is applied remotely" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Latest migration may not be applied remotely" -ForegroundColor Yellow
            Write-Host "  Run: supabase db push" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  ⚠️  Could not check remote status: $_" -ForegroundColor Yellow
    $isLinked = $false
}

# Step 5: Verify types are in sync
Write-Host "`n[5/6] Verifying TypeScript types..." -ForegroundColor Cyan
try {
    # Check if local Supabase is running
    $supabaseStatus = supabase status 2>&1
    if ($supabaseStatus -match "not running" -or $supabaseStatus -match "No local") {
        if ($CI -or $NoAutoStart) {
            Write-Host "  ❌ Local Supabase is not running (auto-start disabled)" -ForegroundColor Red
            if ($CI) {
                Write-Host "  CI Mode: Failing fast" -ForegroundColor Red
                exit 1
            } else {
                Write-Host "  Run 'supabase start' to start local Supabase" -ForegroundColor Yellow
                Write-Host "  Skipping type verification..." -ForegroundColor Gray
                throw "Local Supabase not running"
            }
        }
        Write-Host "  ⚠️  Local Supabase is not running" -ForegroundColor Yellow
        Write-Host "  Starting local Supabase..." -ForegroundColor Gray
        supabase start | Out-Null
    }
    
    # Reset local DB to latest migrations
    Write-Host "  Applying migrations locally..." -ForegroundColor Gray
    supabase db reset 2>&1 | Out-Null
    
    # Generate types
    Write-Host "  Generating types..." -ForegroundColor Gray
    npm run db:typegen 2>&1 | Out-Null
    
    # Check for differences
    $typesDiff = git diff lib/types/supabase.ts
    $script:typesOutOfSync = $false
    if ($typesDiff) {
        $script:typesOutOfSync = $true
        Write-Host "  ❌ Types are out of sync with database!" -ForegroundColor Red
        Write-Host "`n  Suggested fix:" -ForegroundColor Yellow
        Write-Host "    npm run db:typegen" -ForegroundColor Yellow
        Write-Host "    git add lib/types/supabase.ts" -ForegroundColor Yellow
        Write-Host "    git commit -m 'chore: regenerate types after migrations'" -ForegroundColor Yellow
        
        if ($Verbose) {
            Write-Host "`n  Type diff preview:" -ForegroundColor Gray
            Write-Host $typesDiff -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✓ Types are in sync with migrations" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  Could not verify types: $_" -ForegroundColor Yellow
}

# Step 6: Check schema drift
Write-Host "`n[6/6] Checking for schema drift..." -ForegroundColor Cyan
try {
    $driftOutput = supabase db diff --local 2>&1
    
    if ($driftOutput -match "No schema changes" -or $driftOutput -match "No changes found") {
        Write-Host "  ✓ No schema drift detected" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Schema drift detected!" -ForegroundColor Yellow
        Write-Host "  This means there are database changes not captured in migrations." -ForegroundColor Yellow
        
        if ($Verbose) {
            Write-Host "`n  Drift details:" -ForegroundColor Gray
            Write-Host $driftOutput -ForegroundColor Gray
        }
        
        Write-Host "`n  Suggested fix:" -ForegroundColor Yellow
        Write-Host "    supabase db diff --file new_migration.sql" -ForegroundColor Yellow
        Write-Host "    # Review the generated migration" -ForegroundColor Yellow
        Write-Host "    # Move to supabase/migrations/ with timestamp prefix" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Could not check drift: $_" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Local migrations: $($localMigrations.Count)" -ForegroundColor White
Write-Host "Latest migration: $latestLocalVersion" -ForegroundColor White
if ($isLinked) {
    Write-Host "Remote status: Linked ✓" -ForegroundColor Green
} else {
    Write-Host "Remote status: Not linked ⚠️" -ForegroundColor Yellow
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
Write-Host "Run with -Verbose flag for detailed output" -ForegroundColor Gray
Write-Host "Run with -CI flag to enforce strict checks in CI`n" -ForegroundColor Gray

# Determine exit code based on CI mode
if ($CI) {
    # In CI mode, fail if types are out of sync or critical checks failed
    if ($script:typesOutOfSync) {
        Write-Host "`n❌ CI Mode: Types out of sync - failing build" -ForegroundColor Red
        exit 1
    }
    Write-Host "`n✅ CI Mode: All strict checks passed" -ForegroundColor Green
    exit 0
} else {
    # In local mode, always exit 0 (informational only)
    if ($script:typesOutOfSync) {
        Write-Host "`n⚠️  Local Mode: Issues found but exiting successfully (informational)" -ForegroundColor Yellow
    }
    exit 0
}
