[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

function Get-SafeCommandOutput {
  param(
    [ScriptBlock]$Action,
    [string]$Fallback = 'unknown'
  )

  try {
    $value = & $Action
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($value)) {
      return $Fallback
    }
    return ($value | Select-Object -First 1)
  } catch {
    return $Fallback
  }
}

$branch = Get-SafeCommandOutput -Action { git rev-parse --abbrev-ref HEAD } -Fallback 'unknown'
$commit = Get-SafeCommandOutput -Action { git rev-parse HEAD } -Fallback 'unknown'
$os = [System.Runtime.InteropServices.RuntimeInformation]::OSDescription
$pwshVersion = $PSVersionTable.PSVersion.ToString()
$nodeVersion = Get-SafeCommandOutput -Action { node --version }
$npmVersion = Get-SafeCommandOutput -Action { npm --version }

Write-Host "==> Preflight evidence" -ForegroundColor Cyan
Write-Host "Branch:  $branch"
Write-Host "Commit:  $commit"
Write-Host "OS:      $os"
Write-Host "Pwsh:    $pwshVersion"
Write-Host "Node:    $nodeVersion"
Write-Host "npm:     $npmVersion"

function Invoke-Step {
  param(
    [string]$Label,
    [ScriptBlock]$Action,
    [string]$Fix
  )

  Write-Host "`n==> $Label" -ForegroundColor Cyan
  try {
    $global:LASTEXITCODE = 0
    & $Action
    if ($LASTEXITCODE -ne 0) {
      throw "Step failed: $Label (exit $LASTEXITCODE)"
    }
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
