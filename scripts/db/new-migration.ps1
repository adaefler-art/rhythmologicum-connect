[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Name,
  [string]$Directory = "supabase/migrations",
  [string]$Schema = "public",
  [string]$Table = "your_table"
)

$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$filename = "${timestamp}_${Name}.sql"
$path = Join-Path $Directory $filename

New-Item -ItemType Directory -Force -Path $Directory | Out-Null

$template = @"
-- Migration: $Name
-- Created: $(Get-Date -Format "yyyy-MM-dd")

-- Do not remove DROP POLICY guards – required by lint
DROP POLICY IF EXISTS "${Table}_select_own" ON $Schema.$Table;
CREATE POLICY "${Table}_select_own"
    ON $Schema.$Table
    FOR SELECT
    TO authenticated
    USING (false);

DROP POLICY IF EXISTS "${Table}_insert_own" ON $Schema.$Table;
CREATE POLICY "${Table}_insert_own"
    ON $Schema.$Table
    FOR INSERT
    TO authenticated
    WITH CHECK (false);

DROP POLICY IF EXISTS "${Table}_update_own" ON $Schema.$Table;
CREATE POLICY "${Table}_update_own"
    ON $Schema.$Table
    FOR UPDATE
    TO authenticated
    USING (false);
"@

Set-Content -Path $path -Value $template -Encoding UTF8
Write-Host "Created migration: $path" -ForegroundColor Green
