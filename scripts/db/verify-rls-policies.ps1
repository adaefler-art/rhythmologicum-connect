# Verify RLS Policies on User Data Tables
# Purpose: Automated enforcement of R-DB-009 (RLS required on user data tables)
# Usage: pwsh -File scripts/db/verify-rls-policies.ps1
#
# Exit Codes:
#   0 = All checks passed
#   1 = RLS violations detected or script errors (fail-closed)

param(
    [string]$AllowlistPath = "docs/canon/rls-allowlist.json",
    [string]$OutputDir = "artifacts/rls-verify",
    [string]$PatientRoleName = "patient"
)

$ErrorActionPreference = 'Stop'

# Color output helpers
function Write-Success { param([string]$Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param([string]$Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Failure { param([string]$Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Sanitize SQL identifier to prevent SQL injection
function ConvertTo-SafeSqlIdentifier {
    param([Parameter(Mandatory = $true)][string]$Identifier)
    
    # Only allow alphanumeric, underscore, and hyphen
    # Reject anything else to prevent SQL injection
    if ($Identifier -notmatch '^[a-zA-Z0-9_-]+$') {
        Write-Failure "Invalid SQL identifier: $Identifier (contains unsafe characters)"
        exit 1
    }
    
    return $Identifier
}

# Check if a policy is patient-oriented
function Test-IsPatientPolicy {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Policy,
        [Parameter(Mandatory = $true)][string]$PatientRoleName
    )
    
    # Check if policy name contains "patient" (case-insensitive)
    if ($Policy.policyName -match '(?i)patient') {
        return $true
    }
    
    # Check if policy is applied to patient role or public roles
    $roles = $Policy.roles
    if ($roles -match $PatientRoleName) {
        return $true
    }
    
    # Handle PostgreSQL array format for roles: {public} or public
    if ($roles -eq '{public}' -or $roles -eq 'public' -or $roles -match '\{[^}]*public[^}]*\}') {
        return $true
    }
    
    return $false
}

Write-Info "RLS Policy Verification (R-DB-009)"
Write-Host "====================================`n" -ForegroundColor Cyan

# ============================================================
# Helper Functions
# ============================================================

function Assert-CommandExists {
    param([Parameter(Mandatory = $true)][string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Failure "Required command not found: $Name"
        exit 1
    }
}

function Resolve-LocalDbContainerName {
    Assert-CommandExists -Name 'docker'
    
    $names = & docker ps --format "{{.Names}}" --filter "name=supabase_db_" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Failed to list Docker containers"
        throw ($names | Out-String)
    }
    
    $list = @($names | Where-Object { $_ -and $_.Trim().Length -gt 0 })
    if ($list.Count -eq 0) {
        Write-Failure "No running container matching name=supabase_db_. Is 'supabase start' running?"
        exit 1
    }
    
    if ($list.Count -gt 1) {
        Write-Warning "Multiple supabase_db_ containers found; using '$($list[0])'"
    }
    
    return $list[0]
}

function Invoke-DbQuery {
    param([Parameter(Mandatory = $true)][string]$Sql)
    
    Assert-CommandExists -Name 'docker'
    
    $container = Resolve-LocalDbContainerName
    $tempFile = New-TemporaryFile
    try {
        # Write UTF-8 without BOM
        [System.IO.File]::WriteAllText(
            $tempFile.FullName,
            $Sql,
            (New-Object System.Text.UTF8Encoding($false))
        )
        
        # Execute in Postgres container with JSON output
        $output = Get-Content -LiteralPath $tempFile.FullName -Raw |
            & docker exec -i $container psql -U postgres -d postgres -t -A -F '|' 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "Database query failed"
            throw ($output | Out-String)
        }
        
        return ,$output
    } finally {
        try { Remove-Item -Force $tempFile.FullName -ErrorAction SilentlyContinue } catch {}
    }
}

function Get-AllowlistEntries {
    param([string]$Path)
    
    $repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.ScriptName))
    $fullPath = Join-Path $repoRoot $Path
    
    if (-not (Test-Path $fullPath)) {
        Write-Failure "Allowlist file not found: $fullPath"
        exit 1
    }
    
    try {
        $json = Get-Content -Raw -Path $fullPath | ConvertFrom-Json
        
        # Validate allowlist format
        if (-not $json.entries) {
            Write-Failure "Invalid allowlist format: missing 'entries' field"
            exit 1
        }
        
        Write-Info "Loaded $($json.entries.Count) allowlisted tables from $Path"
        return $json.entries
    } catch {
        Write-Failure "Failed to parse allowlist JSON: $_"
        exit 1
    }
}

# ============================================================
# Main Logic
# ============================================================

Write-Info "Loading allowlist..."
$allowlist = Get-AllowlistEntries -Path $AllowlistPath

Write-Info "Querying database for user data tables..."

# Query to find all tables with patient_id or user_id columns
# Exclude system schemas (pg_catalog, information_schema)
$tableQuerySql = @"
SELECT DISTINCT
    t.table_schema,
    t.table_name,
    array_agg(DISTINCT c.column_name ORDER BY c.column_name) AS matched_columns
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON c.table_schema = t.table_schema 
    AND c.table_name = t.table_name
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage', 'extensions', 'graphql', 'vault', 'realtime')
    AND t.table_type = 'BASE TABLE'
    AND c.column_name IN ('patient_id', 'user_id')
GROUP BY t.table_schema, t.table_name
ORDER BY t.table_schema, t.table_name;
"@

$tableResults = Invoke-DbQuery -Sql $tableQuerySql
$userDataTables = @()

foreach ($line in $tableResults) {
    if (-not $line -or $line.Trim().Length -eq 0) { continue }
    
    $parts = $line -split '\|'
    if ($parts.Count -ge 3) {
        $userDataTables += @{
            schema = $parts[0].Trim()
            table = $parts[1].Trim()
            matched_columns = ($parts[2].Trim() -replace '[{}]', '') -split ','
        }
    }
}

Write-Info "Found $($userDataTables.Count) tables with patient_id/user_id columns"

# Query RLS status and policies for each table
Write-Info "Checking RLS status and policies..."

$results = @()
$violations = @()

foreach ($tableInfo in $userDataTables) {
    $schema = ConvertTo-SafeSqlIdentifier -Identifier $tableInfo.schema
    $table = ConvertTo-SafeSqlIdentifier -Identifier $tableInfo.table
    $fullTableName = "$schema.$table"
    
    # Check if allowlisted and get reason
    $allowlistEntry = $allowlist | Where-Object { $_.table -eq $fullTableName }
    $isAllowlisted = $null -ne $allowlistEntry
    
    # Query RLS enabled status (using safe identifiers)
    $rlsQuerySql = @"
SELECT 
    c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = '$schema'
    AND c.relname = '$table';
"@
    
    $rlsResult = Invoke-DbQuery -Sql $rlsQuerySql
    $rlsEnabled = $false
    
    # Normalize output to array to handle single-line results (scalar-safe)
    $rlsLines = @($rlsResult | Where-Object { $_ })
    if ($rlsLines.Count -gt 0) {
        $rlsValue = $rlsLines[0].ToString().Trim()
        $rlsEnabled = ($rlsValue -eq 't' -or $rlsValue -eq 'true')
    }
    
    # Query policies (using safe identifiers)
    $policiesQuerySql = @"
SELECT 
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = '$schema'
    AND tablename = '$table';
"@
    
    $policiesResult = Invoke-DbQuery -Sql $policiesQuerySql
    $policies = @()
    $hasPatientPolicy = $false
    
    foreach ($policyLine in $policiesResult) {
        if (-not $policyLine -or $policyLine.Trim().Length -eq 0) { continue }
        
        $policyParts = $policyLine -split '\|'
        if ($policyParts.Count -ge 3) {
            $policyName = $policyParts[0].Trim()
            $roles = $policyParts[1].Trim()
            $cmd = $policyParts[2].Trim()
            
            $policyRecord = @{
                policyName = $policyName
                roles = $roles
                cmd = $cmd
            }
            
            $policies += $policyRecord
            
            # Check if this policy is patient-oriented (using helper function)
            if (Test-IsPatientPolicy -Policy $policyRecord -PatientRoleName $PatientRoleName) {
                $hasPatientPolicy = $true
            }
        }
    }
    
    # Build result record
    $record = @{
        schema = $schema
        table = $table
        classification = @{
            matchedColumns = $tableInfo.matched_columns
            source = "heuristic"
        }
        rlsEnabled = $rlsEnabled
        policies = $policies
        allowlisted = $isAllowlisted
    }
    
    if ($isAllowlisted -and $allowlistEntry) {
        $record.allowlistReason = $allowlistEntry.reason
    }
    
    $results += $record
    
    # Check for violations (only if not allowlisted)
    if (-not $isAllowlisted) {
        if (-not $rlsEnabled) {
            $violations += "Table $fullTableName has RLS disabled"
            Write-Failure "Table $fullTableName has RLS disabled"
        } elseif (-not $hasPatientPolicy) {
            $violations += "Table $fullTableName has no patient-role policy"
            Write-Warning "Table $fullTableName has RLS enabled but no patient-role policy found"
        } else {
            Write-Success "Table ${fullTableName}: RLS enabled with patient policy"
        }
    } else {
        Write-Info "Table ${fullTableName}: allowlisted (skipped)"
    }
}

# ============================================================
# Generate Output Artifacts
# ============================================================

Write-Info "Generating output artifacts..."

# Ensure output directory exists
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.ScriptName))
$fullOutputDir = Join-Path $repoRoot $OutputDir
if (-not (Test-Path $fullOutputDir)) {
    New-Item -ItemType Directory -Path $fullOutputDir -Force | Out-Null
}

# Generate JSON summary
$jsonOutput = @{
    timestamp = (Get-Date -Format "o")
    rule = "R-DB-009"
    description = "RLS policies required on user data tables"
    patientRoleName = $PatientRoleName
    allowlistPath = $AllowlistPath
    summary = @{
        totalTablesChecked = $userDataTables.Count
        allowlistedTables = ($results | Where-Object { $_.allowlisted }).Count
        violations = $violations.Count
        passed = ($violations.Count -eq 0)
    }
    tables = $results
    violations = $violations
}

$jsonPath = Join-Path $fullOutputDir "rls-summary.json"
$jsonOutput | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Success "JSON summary: $jsonPath"

# Generate human-readable TXT summary
$txtPath = Join-Path $fullOutputDir "rls-summary.txt"
$txtContent = @"
RLS Policy Verification Report (R-DB-009)
==========================================
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Patient Role: $PatientRoleName
Allowlist: $AllowlistPath

Summary
-------
Total tables checked: $($userDataTables.Count)
Allowlisted tables: $(($results | Where-Object { $_.allowlisted }).Count)
Violations: $($violations.Count)
Result: $(if ($violations.Count -eq 0) { "PASS ✅" } else { "FAIL ❌" })

Tables Checked
--------------
"@

foreach ($record in $results) {
    $fullName = "$($record.schema).$($record.table)"
    $txtContent += "`n$fullName"
    $txtContent += "`n  Matched columns: $($record.classification.matchedColumns -join ', ')"
    $txtContent += "`n  RLS enabled: $($record.rlsEnabled)"
    $txtContent += "`n  Policies: $($record.policies.Count)"
    
    if ($record.allowlisted) {
        $txtContent += "`n  Status: ALLOWLISTED"
        if ($record.allowlistReason) {
            $txtContent += "`n  Reason: $($record.allowlistReason)"
        }
    } else {
        # Check if any policy is patient-oriented (using helper function)
        $hasPatientPolicy = $false
        foreach ($policy in $record.policies) {
            if (Test-IsPatientPolicy -Policy $policy -PatientRoleName $PatientRoleName) {
                $hasPatientPolicy = $true
                break
            }
        }
        
        if (-not $record.rlsEnabled) {
            $txtContent += "`n  Status: VIOLATION - RLS not enabled"
        } elseif (-not $hasPatientPolicy) {
            $txtContent += "`n  Status: WARNING - No patient policy"
        } else {
            $txtContent += "`n  Status: PASS"
        }
    }
}

if ($violations.Count -gt 0) {
    $txtContent += "`n`nViolations`n----------"
    foreach ($violation in $violations) {
        $txtContent += "`n- $violation"
    }
}

$txtContent | Set-Content -Path $txtPath -Encoding UTF8
Write-Success "TXT summary: $txtPath"

# ============================================================
# Final Result
# ============================================================

Write-Host ""
if ($violations.Count -eq 0) {
    Write-Success "All RLS checks passed!"
    Write-Info "Checked $($userDataTables.Count) user data tables"
    Write-Info "$(($results | Where-Object { $_.allowlisted }).Count) tables allowlisted"
    exit 0
} else {
    Write-Failure "RLS verification failed with $($violations.Count) violation(s)"
    Write-Host ""
    Write-Host "Violations:" -ForegroundColor Red
    foreach ($violation in $violations) {
        Write-Host "  - $violation" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Fix these violations or add tables to the allowlist if appropriate." -ForegroundColor Yellow
    exit 1
}
