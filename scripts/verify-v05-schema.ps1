# V0.5 Schema Verification Script
# This script verifies that the v0.5 schema migration was applied correctly
# Run after: npm run db:reset

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 V0.5 Schema Verification" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase is running
Write-Host "📡 Checking Supabase status..." -ForegroundColor Yellow
$statusOutput = & supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase is not running. Please start it first:" -ForegroundColor Red
    Write-Host "   supabase start" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Supabase is running" -ForegroundColor Green
Write-Host ""

# Helper function to query database
function Invoke-SqlQuery {
    param(
        [string]$Query,
        [string]$Description
    )
    
    if ($Verbose) {
        Write-Host "  Query: $Query" -ForegroundColor Gray
    }
    
    $result = & supabase db execute $Query 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ $Description - Failed" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
        return $false
    }
    
    return $result
}

# Section 1: Verify Enums
Write-Host "1️⃣  Verifying Enums..." -ForegroundColor Yellow
$enums = @(
    "user_role",
    "assessment_state",
    "report_status",
    "task_status",
    "parsing_status",
    "notification_status"
)

$enumsFound = 0
foreach ($enum in $enums) {
    $query = "SELECT 1 FROM pg_type WHERE typname = '$enum' AND typtype = 'e';"
    $result = Invoke-SqlQuery -Query $query -Description "Checking enum: $enum"
    if ($result) {
        $enumsFound++
        Write-Host "  ✓ $enum" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $enum" -ForegroundColor Red
    }
}

Write-Host "  Found $enumsFound / $($enums.Count) enums" -ForegroundColor $(if ($enumsFound -eq $enums.Count) { "Green" } else { "Red" })
Write-Host ""

# Section 2: Verify Tables
Write-Host "2️⃣  Verifying Tables..." -ForegroundColor Yellow
$tables = @(
    "organizations",
    "user_profiles",
    "user_org_membership",
    "funnels_catalog",
    "funnel_versions",
    "patient_funnels",
    "assessment_events",
    "documents",
    "calculated_results",
    "report_sections",
    "tasks",
    "notifications",
    "audit_log"
)

$tablesFound = 0
foreach ($table in $tables) {
    $query = "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';"
    $result = Invoke-SqlQuery -Query $query -Description "Checking table: $table"
    if ($result) {
        $tablesFound++
        Write-Host "  ✓ $table" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $table" -ForegroundColor Red
    }
}

Write-Host "  Found $tablesFound / $($tables.Count) tables" -ForegroundColor $(if ($tablesFound -eq $tables.Count) { "Green" } else { "Red" })
Write-Host ""

# Section 3: Verify JSONB Columns
Write-Host "3️⃣  Verifying JSONB Columns..." -ForegroundColor Yellow
$jsonbColumns = @(
    @{ Table = "organizations"; Column = "settings" },
    @{ Table = "user_profiles"; Column = "metadata" },
    @{ Table = "funnel_versions"; Column = "questionnaire_config" },
    @{ Table = "funnel_versions"; Column = "content_manifest" },
    @{ Table = "assessment_events"; Column = "payload" },
    @{ Table = "documents"; Column = "extracted_data" },
    @{ Table = "documents"; Column = "confidence" },
    @{ Table = "documents"; Column = "confirmed_data" },
    @{ Table = "calculated_results"; Column = "scores" },
    @{ Table = "calculated_results"; Column = "risk_models" },
    @{ Table = "calculated_results"; Column = "priority_ranking" },
    @{ Table = "reports"; Column = "safety_findings" },
    @{ Table = "reports"; Column = "citations_meta" },
    @{ Table = "report_sections"; Column = "citations_meta" },
    @{ Table = "tasks"; Column = "payload" },
    @{ Table = "notifications"; Column = "payload" },
    @{ Table = "audit_log"; Column = "diff" }
)

$jsonbFound = 0
foreach ($col in $jsonbColumns) {
    $query = "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$($col.Table)' AND column_name = '$($col.Column)' AND data_type = 'jsonb';"
    $result = Invoke-SqlQuery -Query $query -Description "Checking JSONB: $($col.Table).$($col.Column)"
    if ($result) {
        $jsonbFound++
        Write-Host "  ✓ $($col.Table).$($col.Column)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($col.Table).$($col.Column)" -ForegroundColor Red
    }
}

Write-Host "  Found $jsonbFound / $($jsonbColumns.Count) JSONB columns" -ForegroundColor $(if ($jsonbFound -eq $jsonbColumns.Count) { "Green" } else { "Red" })
Write-Host ""

# Section 4: Verify Unique Constraints
Write-Host "4️⃣  Verifying Unique Constraints..." -ForegroundColor Yellow
$constraints = @(
    @{ Table = "funnels_catalog"; Constraint = "funnels_catalog_slug_key" },
    @{ Table = "funnel_versions"; Constraint = "funnel_versions_funnel_id_version_key" },
    @{ Table = "user_org_membership"; Constraint = "user_org_membership_user_id_organization_id_key" },
    @{ Table = "calculated_results"; Constraint = "calculated_results_assessment_version_unique" },
    @{ Table = "reports"; Constraint = "reports_assessment_version_unique" },
    @{ Table = "report_sections"; Constraint = "report_sections_report_key_unique" }
)

$constraintsFound = 0
foreach ($con in $constraints) {
    $query = "SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = '$($con.Table)' AND constraint_name = '$($con.Constraint)' AND constraint_type = 'UNIQUE';"
    $result = Invoke-SqlQuery -Query $query -Description "Checking constraint: $($con.Constraint)"
    if ($result) {
        $constraintsFound++
        Write-Host "  ✓ $($con.Constraint)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($con.Constraint)" -ForegroundColor Red
    }
}

Write-Host "  Found $constraintsFound / $($constraints.Count) unique constraints" -ForegroundColor $(if ($constraintsFound -eq $constraints.Count) { "Green" } else { "Red" })
Write-Host ""

# Section 5: Verify RLS Enabled
Write-Host "5️⃣  Verifying RLS Enabled..." -ForegroundColor Yellow
$rlsTables = $tables

$rlsEnabled = 0
foreach ($table in $rlsTables) {
    $query = "SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '$table' AND rowsecurity = true;"
    $result = Invoke-SqlQuery -Query $query -Description "Checking RLS: $table"
    if ($result) {
        $rlsEnabled++
        Write-Host "  ✓ $table" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $table" -ForegroundColor Red
    }
}

Write-Host "  RLS enabled on $rlsEnabled / $($rlsTables.Count) tables" -ForegroundColor $(if ($rlsEnabled -eq $rlsTables.Count) { "Green" } else { "Red" })
Write-Host ""

# Section 6: Verify Critical Indexes
Write-Host "6️⃣  Verifying Critical Indexes..." -ForegroundColor Yellow
$indexes = @(
    @{ Table = "funnels_catalog"; Index = "idx_funnels_catalog_slug" },
    @{ Table = "funnel_versions"; Index = "idx_funnel_versions_funnel_id" },
    @{ Table = "assessment_events"; Index = "idx_assessment_events_assessment_id" },
    @{ Table = "documents"; Index = "idx_documents_assessment_id" },
    @{ Table = "calculated_results"; Index = "idx_calculated_results_assessment_id" },
    @{ Table = "report_sections"; Index = "idx_report_sections_report_id" },
    @{ Table = "tasks"; Index = "idx_tasks_assigned_to_role_status_due" },
    @{ Table = "audit_log"; Index = "idx_audit_log_entity_type_id" }
)

$indexesFound = 0
foreach ($idx in $indexes) {
    $query = "SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = '$($idx.Table)' AND indexname = '$($idx.Index)';"
    $result = Invoke-SqlQuery -Query $query -Description "Checking index: $($idx.Index)"
    if ($result) {
        $indexesFound++
        Write-Host "  ✓ $($idx.Index)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($idx.Index)" -ForegroundColor Red
    }
}

Write-Host "  Found $indexesFound / $($indexes.Count) critical indexes" -ForegroundColor $(if ($indexesFound -eq $indexes.Count) { "Green" } else { "Red" })
Write-Host ""

# Final Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$totalChecks = 6
$passedChecks = 0

if ($enumsFound -eq $enums.Count) { $passedChecks++ }
if ($tablesFound -eq $tables.Count) { $passedChecks++ }
if ($jsonbFound -eq $jsonbColumns.Count) { $passedChecks++ }
if ($constraintsFound -eq $constraints.Count) { $passedChecks++ }
if ($rlsEnabled -eq $rlsTables.Count) { $passedChecks++ }
if ($indexesFound -eq $indexes.Count) { $passedChecks++ }

Write-Host "Enums:       $enumsFound / $($enums.Count)" -ForegroundColor $(if ($enumsFound -eq $enums.Count) { "Green" } else { "Red" })
Write-Host "Tables:      $tablesFound / $($tables.Count)" -ForegroundColor $(if ($tablesFound -eq $tables.Count) { "Green" } else { "Red" })
Write-Host "JSONB:       $jsonbFound / $($jsonbColumns.Count)" -ForegroundColor $(if ($jsonbFound -eq $jsonbColumns.Count) { "Green" } else { "Red" })
Write-Host "Constraints: $constraintsFound / $($constraints.Count)" -ForegroundColor $(if ($constraintsFound -eq $constraints.Count) { "Green" } else { "Red" })
Write-Host "RLS:         $rlsEnabled / $($rlsTables.Count)" -ForegroundColor $(if ($rlsEnabled -eq $rlsTables.Count) { "Green" } else { "Red" })
Write-Host "Indexes:     $indexesFound / $($indexes.Count)" -ForegroundColor $(if ($indexesFound -eq $indexes.Count) { "Green" } else { "Red" })
Write-Host ""

if ($passedChecks -eq $totalChecks) {
    Write-Host "🎉 All verification checks passed!" -ForegroundColor Green
    Write-Host "   V0.5 schema migration successfully applied." -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some verification checks failed: $passedChecks / $totalChecks passed" -ForegroundColor Yellow
    Write-Host "   Review the output above for details." -ForegroundColor Yellow
    exit 1
}
