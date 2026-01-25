[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

function Invoke-Step {
  param(
    [string]$Label,
    [ScriptBlock]$Action,
    [string]$Fix
  )

  Write-Host "`n==> $Label" -ForegroundColor Cyan
  try {
    & $Action
  } catch {
    Write-Host "FIX: $Fix" -ForegroundColor Yellow
    throw
  }
}

Invoke-Step -Label 'Endpoint catalog' -Fix "Run 'pwsh -File scripts/ci/verify-endpoint-catalog.ps1' and fix any orphan endpoints." -Action {
  pwsh -File scripts/ci/verify-endpoint-catalog.ps1
}

Invoke-Step -Label 'Migration lint' -Fix "Run 'pwsh -File scripts/db/lint-migrations.ps1' and fix non-canonical or non-idempotent migrations." -Action {
  pwsh -File scripts/db/lint-migrations.ps1
}

Invoke-Step -Label 'Typegen verify' -Fix "Run 'pwsh -File scripts/db/typegen.ps1 -Generate' and commit lib/types/supabase.ts." -Action {
  pwsh -File scripts/db/typegen.ps1 -Verify
}

Invoke-Step -Label 'Repo verify' -Fix "Run 'npm run verify' and resolve the reported guardrail failures." -Action {
  npm run verify
}

Write-Host "`n✅ Preflight checks passed." -ForegroundColor Green
