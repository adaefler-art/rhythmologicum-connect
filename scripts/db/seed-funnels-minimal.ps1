# Seed minimal funnel data required for deterministic local builds
# Purpose: prevent "data drift" where required JSON manifests are missing after migrations
# This script is intentionally small and idempotent.

$ErrorActionPreference = 'Stop'

function Assert-CommandExists {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Invoke-SupabaseDbQuery {
  param([Parameter(Mandatory = $true)][string]$Sql)

  Assert-CommandExists -Name 'supabase'

  $tempFile = New-TemporaryFile
  try {
    # Write UTF-8 without BOM (avoid git/CLI issues)
    [System.IO.File]::WriteAllText($tempFile.FullName, $Sql, (New-Object System.Text.UTF8Encoding($false)))

    $output = & supabase db query --file $tempFile.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw ($output | Out-String)
    }

    return ,$output
  } finally {
    try { Remove-Item -Force $tempFile.FullName -ErrorAction SilentlyContinue } catch {}
  }
}

Write-Host "[seed] Seeding minimal funnels..." -ForegroundColor Cyan

# Minimal stress-assessment funnel + version with questionnaire_config.steps[]
# Notes:
# - funnel_versions.funnel_id references funnels_catalog.id
# - funnels_catalog.default_version_id references funnel_versions.id
# - use UPSERTs to remain deterministic across reruns

$sql = @'
DO $$
DECLARE
  v_funnel_id uuid;
  v_version_id uuid;
BEGIN
  INSERT INTO public.funnels_catalog (
    slug,
    title,
    pillar_id,
    description,
    is_active,
    outcomes,
    updated_at
  ) VALUES (
    'stress-assessment',
    'Stress Assessment',
    'stress',
    'Seeded minimal funnel (CI determinism)',
    true,
    '[]'::jsonb,
    now()
  )
  ON CONFLICT (slug) DO UPDATE
    SET title = EXCLUDED.title,
        pillar_id = COALESCE(public.funnels_catalog.pillar_id, EXCLUDED.pillar_id),
        description = COALESCE(public.funnels_catalog.description, EXCLUDED.description),
        is_active = true,
        updated_at = now()
  RETURNING id INTO v_funnel_id;

  INSERT INTO public.funnel_versions (
    funnel_id,
    version,
    questionnaire_config,
    content_manifest,
    algorithm_bundle_version,
    prompt_version,
    is_default,
    rollout_percent,
    updated_at
  ) VALUES (
    v_funnel_id,
    'seed-minimal',
    jsonb_build_object(
      'version', '1.0',
      'steps', jsonb_build_array(
        jsonb_build_object(
          'id', 'seed-step-1',
          'title', 'Start',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'seed-q1',
              'key', 'seed_question',
              'type', 'text',
              'label', 'Seed question',
              'required', false
            )
          )
        )
      )
    ),
    '{}'::jsonb,
    'v1.0.0',
    '1.0',
    false,
    100,
    now()
  )
  ON CONFLICT (funnel_id, version) DO UPDATE
    SET questionnaire_config = EXCLUDED.questionnaire_config,
        updated_at = now()
  RETURNING id INTO v_version_id;

  UPDATE public.funnels_catalog
    SET default_version_id = v_version_id,
        updated_at = now()
  WHERE id = v_funnel_id;
END $$;
'@

Invoke-SupabaseDbQuery -Sql $sql | Out-Null

Write-Host "[seed] OK: minimal funnel seed applied" -ForegroundColor Green

if ($env:GITHUB_STEP_SUMMARY) {
  Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value "- Seed: minimal funnel data applied (stress-assessment)"
}
