# Migration Linter - Validates DB schema objects against canonical manifest
# Purpose: Hard guardrail to prevent non-canonical DB objects from being introduced
# Usage: .\scripts\db\lint-migrations.ps1 [-Verbose] [-Path <file_or_directory>]
#
# Exit Codes:
#   0 = All checks passed
#   1 = Non-canonical objects detected
#   2 = Script execution error

param(
    [switch]$Verbose,
    [string]$Path = "",
    # When enabled, deprecated-object warnings are only emitted for migrations newly
    # added in the current git diff (PR/CI context). This keeps CI logs clean while
    # still preventing new deprecated usage.
    [bool]$WarnDeprecatedOnlyForNewMigrations = $true,
    # Base ref used to compute "new" migrations. In GitHub Actions PR runs,
    # GITHUB_BASE_REF is preferred automatically.
    [string]$BaseRef = "origin/main"
)

$ErrorActionPreference = "Stop"

# ============================================================
# CONFIGURATION
# ============================================================

$manifestPath = Join-Path $PSScriptRoot "..\..\docs\canon\DB_SCHEMA_MANIFEST.json"
$migrationsDir = Join-Path $PSScriptRoot "..\..\supabase\migrations"

# Regex patterns for extracting database objects
# NOTE: Case-insensitive flag (?i) handles both 'create table' and 'CREATE TABLE'
# Tested with actual migrations which use lowercase 'create table' syntax
$tablePattern = '(?im)^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"?[a-zA-Z_][a-zA-Z0-9_]*"?)\.)?(?<table>"?[a-zA-Z_][a-zA-Z0-9_]*"?)'
$enumPattern = '(?im)^\s*CREATE\s+TYPE\s+(?:(?:"?[a-zA-Z_][a-zA-Z0-9_]*"?)\.)?(?<enum>"?[a-zA-Z_][a-zA-Z0-9_]*"?)\s+AS\s+ENUM'
$alterTablePattern = '(?im)^\s*ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:(?:"?[a-zA-Z_][a-zA-Z0-9_]*"?)\.)?(?<table>"?[a-zA-Z_][a-zA-Z0-9_]*"?)'

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

if ($Path) {
    # Custom path provided (for testing)
    if (Test-Path $Path -PathType Leaf) {
        # Single file
        $migrationFiles = @(Get-Item $Path)
        Write-Host "📂 Scanning single file: $Path" -ForegroundColor Yellow
    } elseif (Test-Path $Path -PathType Container) {
        # Directory
        $migrationFiles = Get-ChildItem -Path $Path -Filter "*.sql" | Sort-Object Name
        Write-Host "📂 Scanning directory: $Path" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Path not found: $Path" -ForegroundColor Red
        exit 2
    }
} else {
    # Default: scan migrations directory
    Write-Host "📂 Scanning migrations in: supabase/migrations/" -ForegroundColor Yellow
    $migrationFiles = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name
}

if ($migrationFiles.Count -eq 0) {
    Write-Host "⚠️  No migration files found" -ForegroundColor Yellow
    exit 0
}

Write-Host "   Found $($migrationFiles.Count) migration files" -ForegroundColor Gray
Write-Host ""

# ============================================================
# DETERMINE "NEW" MIGRATIONS (for deprecated warnings)
# ============================================================

$newMigrationFileNames = New-Object 'System.Collections.Generic.HashSet[string]'
$computedNewMigrations = $false

function Add-NewMigrationFileNamesFromGit {
    param(
        [string]$ResolvedBaseRef
    )

    try {
        $mergeBase = (git merge-base $ResolvedBaseRef HEAD 2>$null).Trim()
        if ([string]::IsNullOrWhiteSpace($mergeBase)) {
            return
        }

        $script:computedNewMigrations = $true

        # Only consider newly added migration files.
        $diffLines = git diff --name-status "$mergeBase...HEAD" -- supabase/migrations/*.sql 2>$null
        foreach ($line in $diffLines) {
            # Format is typically: A\tpath
            if ($line -match '^(?<status>[A-Z])\s+(?<path>supabase/migrations/.+\.sql)$') {
                if ($Matches['status'] -eq 'A') {
                    $fileName = [System.IO.Path]::GetFileName($Matches['path'])
                    if (-not [string]::IsNullOrWhiteSpace($fileName)) {
                        [void]$newMigrationFileNames.Add($fileName)
                    }
                }
            }
        }
    } catch {
        # Best-effort only; if git isn't available, we fall back to warning on all files.
        return
    }
}

if ($WarnDeprecatedOnlyForNewMigrations -and -not $Path) {
    $resolvedBaseRef = $BaseRef

    if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_BASE_REF)) {
        $candidate = "origin/$($env:GITHUB_BASE_REF)"

        $refExists = $false
        try {
            git rev-parse --verify $candidate *> $null
            $refExists = ($LASTEXITCODE -eq 0)
        } catch {
            $refExists = $false
        }

        $resolvedBaseRef = if ($refExists) { $candidate } else { $env:GITHUB_BASE_REF }
    }

    Add-NewMigrationFileNamesFromGit -ResolvedBaseRef $resolvedBaseRef

    if (-not $computedNewMigrations) {
        # We couldn't compute a merge-base/diff (e.g., shallow checkout or missing refs).
        # Falling back to warning on all deprecated usage avoids missing new deprecated objects.
        $WarnDeprecatedOnlyForNewMigrations = $false

        if ($Verbose) {
            Write-Host "⚠️  Could not determine new migrations via git; deprecated warnings will apply to ALL migrations." -ForegroundColor Yellow
            Write-Host "   Tip: ensure base ref '$resolvedBaseRef' is available (fetch-depth 0 or fetch base branch)." -ForegroundColor Yellow
            Write-Host "" -ForegroundColor Yellow
        }
    }

    if ($Verbose) {
        if ($WarnDeprecatedOnlyForNewMigrations) {
            Write-Host "🧪 Deprecated warnings scope: only NEW migrations" -ForegroundColor Gray
            Write-Host "   Base ref: $resolvedBaseRef" -ForegroundColor Gray
            Write-Host "   New migrations detected: $($newMigrationFileNames.Count)" -ForegroundColor Gray
            Write-Host "" -ForegroundColor Gray
        }
    }
}

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
        $tableName = $match.Groups['table'].Value.Trim('"')
        
        # Calculate line number from match position
        $lineNum = ($content.Substring(0, $match.Index) -split "`n").Count
        
        # Check against canonical list
        $isCanonical = $manifest.tables -contains $tableName
        $isDeprecated = $manifest.deprecated.tables | Where-Object { $_.name -eq $tableName }
        $isNewMigration = $newMigrationFileNames.Contains($relativePath)
        
        if (-not $isCanonical) {
            $violations += @{
                Type = "TABLE"
                Name = $tableName
                File = $relativePath
                Line = $lineNum
                Reason = "Not in canonical manifest"
                Severity = "ERROR"
            }
        } elseif ($isDeprecated -and (-not $WarnDeprecatedOnlyForNewMigrations -or $isNewMigration)) {
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
        $enumName = $match.Groups['enum'].Value.Trim('"')
        
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
    
    # Extract ALTER TABLE statements with line numbers
    $alterTableMatches = [regex]::Matches($content, $alterTablePattern)
    foreach ($match in $alterTableMatches) {
        $tableName = $match.Groups['table'].Value.Trim('"')
        
        # Calculate line number from match position
        $lineNum = ($content.Substring(0, $match.Index) -split "`n").Count
        
        # Check against canonical list
        $isCanonical = $manifest.tables -contains $tableName
        $isDeprecated = $manifest.deprecated.tables | Where-Object { $_.name -eq $tableName }
        $isNewMigration = $newMigrationFileNames.Contains($relativePath)
        
        if (-not $isCanonical) {
            $violations += @{
                Type = "ALTER TABLE"
                Name = $tableName
                File = $relativePath
                Line = $lineNum
                Reason = "Table not in canonical manifest"
                Severity = "ERROR"
            }
        } elseif ($isDeprecated -and (-not $WarnDeprecatedOnlyForNewMigrations -or $isNewMigration)) {
            $violations += @{
                Type = "ALTER TABLE"
                Name = $tableName
                File = $relativePath
                Line = $lineNum
                Reason = "Deprecated: $($isDeprecated.reason). Use '$($isDeprecated.replacement)' instead."
                Severity = "WARNING"
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
