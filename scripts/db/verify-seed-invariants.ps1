# Verify baseline seed invariants after `supabase db reset`
# Fails fast with clear error messages if required baseline data is missing.
# Designed for CI + local use (PowerShell 7+).

$ErrorActionPreference = 'Stop'

function Assert-CommandExists {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Get-SupabaseDbQueryAvailable {
  Assert-CommandExists -Name 'supabase'

  $help = & supabase db --help 2>&1 | Out-String
  return ($help -match '(?m)^\s*query\b')
}

function Get-SupabaseDbQuerySupportsLocal {
  Assert-CommandExists -Name 'supabase'

  $help = & supabase db query --help 2>&1 | Out-String
  return ($help -match '(?m)^\s*--local\b')
}

function Resolve-LocalDbContainerName {
  Assert-CommandExists -Name 'docker'

  $names = & docker ps --format "{{.Names}}" --filter "name=supabase_db_" 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ($names | Out-String)
  }

  $list = @($names | Where-Object { $_ -and $_.Trim().Length -gt 0 })
  if ($list.Count -eq 0) {
    throw 'No running container matching name=supabase_db_. Is `supabase start` running?'
  }

  if ($list.Count -gt 1) {
    Write-Host "[seed-invariants] WARN: multiple supabase_db_ containers found; using '$($list[0])'." -ForegroundColor Yellow
  }

  return $list[0]
}

function Invoke-DockerPsql {
  param([Parameter(Mandatory = $true)][string]$Sql)

  Assert-CommandExists -Name 'docker'

  $container = Resolve-LocalDbContainerName
  $tempFile = New-TemporaryFile
  try {
    # Write UTF-8 without BOM (avoids subtle tooling issues)
    [System.IO.File]::WriteAllText(
      $tempFile.FullName,
      $Sql,
      (New-Object System.Text.UTF8Encoding($false))
    )

    # Run inside the Postgres container (psql is guaranteed there). ON_ERROR_STOP makes CI fail on RAISE EXCEPTION.
    $output = Get-Content -LiteralPath $tempFile.FullName -Raw |
      & docker exec -i $container psql -U postgres -d postgres -v ON_ERROR_STOP=1 2>&1

    if ($LASTEXITCODE -ne 0) {
      throw ($output | Out-String)
    }

    return ,$output
  } finally {
    try { Remove-Item -Force $tempFile.FullName -ErrorAction SilentlyContinue } catch {}
  }
}

function Invoke-SupabaseDbQuery {
  param([Parameter(Mandatory = $true)][string]$Sql)

  Assert-CommandExists -Name 'supabase'

  # Prefer native Supabase CLI querying when available.
  $hasDbQuery = $false
  try {
    $hasDbQuery = Get-SupabaseDbQueryAvailable
  } catch {
    $hasDbQuery = $false
  }

  if (-not $hasDbQuery) {
    # Supabase CLI versions (including the one pinned in CI) may not have `supabase db query`.
    # Fall back to executing SQL via `psql` inside the local Supabase Postgres container.
    return Invoke-DockerPsql -Sql $Sql
  }

  $tempFile = New-TemporaryFile
  try {
    [System.IO.File]::WriteAllText(
      $tempFile.FullName,
      $Sql,
      (New-Object System.Text.UTF8Encoding($false))
    )

    $supportsLocal = $false
    try {
      $supportsLocal = Get-SupabaseDbQuerySupportsLocal
    } catch {
      $supportsLocal = $false
    }

    if ($supportsLocal) {
      $output = & supabase db query --local --file $tempFile.FullName 2>&1
    } else {
      $output = & supabase db query --file $tempFile.FullName 2>&1
    }

    if ($LASTEXITCODE -ne 0) {
      throw ($output | Out-String)
    }

    return ,$output
  } finally {
    try { Remove-Item -Force $tempFile.FullName -ErrorAction SilentlyContinue } catch {}
  }
}

Write-Host "[seed-invariants] Checking baseline invariants..." -ForegroundColor Cyan

# Invariant:
# For every funnels_catalog row with default_version_id NOT NULL,
# the referenced funnel_versions.questionnaire_config must have `steps` as a non-empty JSON array.
#
# NOTE: We use a single DO block that raises a helpful exception that includes offending slugs + ids.
$invariantsSql = @'
DO $$
DECLARE
  bad_count int;
  bad_details text;
BEGIN
  SELECT
    COUNT(*),
    string_agg(
      format('slug=%s default_version_id=%s', fc.slug, fc.default_version_id),
      E'\n'
      ORDER BY fc.slug
    )
  INTO bad_count, bad_details
  FROM public.funnels_catalog fc
  JOIN public.funnel_versions fv
    ON fv.id = fc.default_version_id
  WHERE fc.default_version_id IS NOT NULL
    AND (
      jsonb_typeof(fv.questionnaire_config->'steps') <> 'array'
      OR jsonb_array_length(fv.questionnaire_config->'steps') <= 0
    );

  IF bad_count > 0 THEN
    RAISE EXCEPTION
      USING
        MESSAGE = format(
          'Seed invariants failed: %s funnel(s) have invalid funnel_versions.questionnaire_config.steps (must be a non-empty JSON array).',
          bad_count
        ),
        DETAIL = COALESCE(bad_details, ''),
        HINT = 'Fix your seed/baseline data so each funnels_catalog.default_version_id points at a funnel_versions row with questionnaire_config.steps present and non-empty.';
  END IF;
END $$;

-- Optional check (warning only): ensure content_manifest exists for default versions.
-- TODO: validate content_manifest shape (pages/sections) once canonicalized.
SELECT
  COUNT(*) AS default_versions_missing_content_manifest
FROM public.funnels_catalog fc
JOIN public.funnel_versions fv
  ON fv.id = fc.default_version_id
WHERE fc.default_version_id IS NOT NULL
  AND fv.content_manifest IS NULL;
'@

try {
  $output = Invoke-SupabaseDbQuery -Sql $invariantsSql

  # Best-effort: surface the optional content_manifest count for visibility.
  $joined = ($output | Out-String)
  $match = [regex]::Match($joined, '(?im)default_versions_missing_content_manifest\s*\|\s*(\d+)')
  if ($match.Success) {
    $missing = [int]$match.Groups[1].Value
    if ($missing -gt 0) {
      Write-Host "[seed-invariants] WARN: $missing default version(s) have NULL content_manifest (TODO: validate shape)." -ForegroundColor Yellow
    } else {
      Write-Host "[seed-invariants] OK: content_manifest present for default versions" -ForegroundColor Green
    }
  }

  Write-Host "[seed-invariants] OK: baseline invariants satisfied" -ForegroundColor Green
} catch {
  Write-Host "[seed-invariants] FAIL" -ForegroundColor Red
  throw
}

if ($env:GITHUB_STEP_SUMMARY) {
  Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value "- Seed invariants: funnels_catalog.default_version_id -> funnel_versions.questionnaire_config.steps must be a non-empty JSON array"
}
