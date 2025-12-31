# Migration Linter - Validates DB schema objects against canonical manifest
# Purpose: Hard guardrail to prevent non-canonical DB objects from being introduced
# Usage: .\scripts\db\lint-migrations.ps1 [-Verbose]
#
# Exit Codes:
#   0 = All checks passed
#   1 = Non-canonical objects detected
#   2 = Script execution error

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# ============================================================
# CONFIGURATION
# ============================================================

$manifestPath = Join-Path $PSScriptRoot "..\..\docs\canon\DB_SCHEMA_MANIFEST.json"
$migrationsDir = Join-Path $PSScriptRoot "..\..\supabase\migrations"

# Regex patterns for extracting database objects
$tablePattern = '(?im)^\s*CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(public\.)?(?<table>[a-zA-Z_][a-zA-Z0-9_]*)'
$enumPattern = '(?im)^\s*CREATE\s+TYPE\s+(public\.)?(?<enum>[a-zA-Z_][a-zA-Z0-9_]*)\s+AS\s+ENUM'

Write-Host "🔍 Migration Linter - DB Schema Manifest Validator" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# LOAD CANONICAL MANIFEST
# ============================================================

if (-not (Test-Path $manifestPath)) {
    Write-Host "❌ Canonical manifest not found: $manifestPath" -ForegroundColor Red
    Write-Host "   Expected: docs/canon/DB_SCHEMA_MANIFEST.json" -ForegroundColor Yellow
    exit 2
}

try {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    Write-Host "✅ Loaded canonical manifest (v$($manifest.version))" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "   Tables: $($manifest.tables.Count)" -ForegroundColor Gray
        Write-Host "   Enums: $($manifest.enums.Count)" -ForegroundColor Gray
        Write-Host "   Deprecated tables: $($manifest.deprecated.tables.Count)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to parse manifest: $_" -ForegroundColor Red
    exit 2
}

Write-Host ""

# ============================================================
# SCAN MIGRATIONS
# ============================================================

Write-Host "📂 Scanning migrations in: supabase/migrations/" -ForegroundColor Yellow

$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name

if ($migrationFiles.Count -eq 0) {
    Write-Host "⚠️  No migration files found" -ForegroundColor Yellow
    exit 0
}

Write-Host "   Found $($migrationFiles.Count) migration files" -ForegroundColor Gray
Write-Host ""

# ============================================================
# EXTRACT IDENTIFIERS FROM MIGRATIONS
# ============================================================

Write-Host "🔎 Extracting database objects from migrations..." -ForegroundColor Yellow

$violations = @()

foreach ($file in $migrationFiles) {
    $filePath = $file.FullName
    $relativePath = $file.Name
    
    if ($Verbose) {
        Write-Host "  → $relativePath" -ForegroundColor Gray
    }
    
    try {
        $content = Get-Content $filePath -Raw -ErrorAction Stop
        $lines = Get-Content $filePath -ErrorAction Stop
    } catch {
        Write-Host "⚠️  Failed to read file: $relativePath" -ForegroundColor Yellow
        continue
    }
    
    if ([string]::IsNullOrWhiteSpace($content)) {
        if ($Verbose) {
            Write-Host "     (empty file, skipping)" -ForegroundColor Gray
        }
        continue
    }
    
    # Extract CREATE TABLE statements with line numbers
    $tableMatches = [regex]::Matches($content, $tablePattern)
    foreach ($match in $tableMatches) {
        $tableName = $match.Groups['table'].Value
        
        # Calculate line number from match position
        $lineNum = ($content.Substring(0, $match.Index) -split "`n").Count
        
        # Check against canonical list
        $isCanonical = $manifest.tables -contains $tableName
        $isDeprecated = $manifest.deprecated.tables | Where-Object { $_.name -eq $tableName }
        
        if (-not $isCanonical) {
            $violations += @{
                Type = "TABLE"
                Name = $tableName
                File = $relativePath
                Line = $lineNum
                Reason = "Not in canonical manifest"
                Severity = "ERROR"
            }
        } elseif ($isDeprecated) {
            $violations += @{
                Type = "TABLE"
                Name = $tableName
                File = $relativePath
                Line = $lineNum
                Reason = "Deprecated: $($isDeprecated.reason). Use '$($isDeprecated.replacement)' instead."
                Severity = "WARNING"
            }
        }
    }
    
    # Extract CREATE TYPE (enum) statements with line numbers
    $enumMatches = [regex]::Matches($content, $enumPattern)
    foreach ($match in $enumMatches) {
        $enumName = $match.Groups['enum'].Value
        
        # Calculate line number from match position
        $lineNum = ($content.Substring(0, $match.Index) -split "`n").Count
        
        # Check against canonical list
        $isCanonical = $manifest.enums -contains $enumName
        
        if (-not $isCanonical) {
            $violations += @{
                Type = "ENUM"
                Name = $enumName
                File = $relativePath
                Line = $lineNum
                Reason = "Not in canonical manifest"
                Severity = "ERROR"
            }
        }
    }
}

Write-Host ""

if ($Verbose) {
    Write-Host "📝 Debug: Total violations collected: $($violations.Count)" -ForegroundColor Gray
    foreach ($v in $violations) {
        Write-Host "   - $($v.Type) $($v.Name) in $($v.File):$($v.Line)" -ForegroundColor Gray
    }
    Write-Host ""
}

# ============================================================
# REPORT RESULTS
# ============================================================

if ($violations.Count -eq 0) {
    Write-Host "✅ All migration objects are canonical!" -ForegroundColor Green
    Write-Host "   No violations detected." -ForegroundColor Green
    Write-Host ""
    exit 0
}

# Separate errors and warnings
$errors = @($violations | Where-Object { $_.Severity -eq "ERROR" })
$warnings = @($violations | Where-Object { $_.Severity -eq "WARNING" })

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 Validation Results" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "❌ ERRORS ($($errors.Count) non-canonical objects detected):" -ForegroundColor Red
    Write-Host ""
    
    foreach ($violation in $errors) {
        Write-Host "  File: $($violation.File):$($violation.Line)" -ForegroundColor Yellow
        Write-Host "  Type: $($violation.Type)" -ForegroundColor White
        Write-Host "  Name: $($violation.Name)" -ForegroundColor White
        Write-Host "  Issue: $($violation.Reason)" -ForegroundColor Red
        Write-Host ""
    }
    
    Write-Host "💡 To fix:" -ForegroundColor Cyan
    Write-Host "   1. Check if the object name is misspelled" -ForegroundColor Gray
    Write-Host "   2. If this is a new canonical object, add it to:" -ForegroundColor Gray
    Write-Host "      docs/canon/DB_SCHEMA_MANIFEST.json" -ForegroundColor Gray
    Write-Host "   3. Update docs/canon/DB_MIGRATIONS.md with the change" -ForegroundColor Gray
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  WARNINGS ($($warnings.Count) deprecated objects detected):" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($violation in $warnings) {
        Write-Host "  File: $($violation.File):$($violation.Line)" -ForegroundColor Yellow
        Write-Host "  Type: $($violation.Type)" -ForegroundColor White
        Write-Host "  Name: $($violation.Name)" -ForegroundColor White
        Write-Host "  Issue: $($violation.Reason)" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -gt 0) {
    exit 1
} else {
    # Only warnings
    exit 0
}
