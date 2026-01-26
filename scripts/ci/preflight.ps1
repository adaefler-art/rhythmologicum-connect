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

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..') | Select-Object -First 1).Path

Write-Host "==> Preflight guardrails" -ForegroundColor Cyan
Push-Location $repoRoot
try {
  $trackedNext = git ls-files "**/.next/**" 2>$null
  if ($trackedNext) {
    Write-Host "❌ Tracked .next artifacts detected. Remove them from git index." -ForegroundColor Red
    $trackedNext | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    throw "Tracked .next artifacts present"
  }

  $trackedVersion = git ls-files "public/version.json" "apps/*/public/version.json" 2>$null
  if ($trackedVersion) {
    Write-Host "❌ Tracked version.json artifacts detected. Remove them from git index." -ForegroundColor Red
    $trackedVersion | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    throw "Tracked version.json artifacts present"
  }
} finally {
  Pop-Location
}

function Invoke-NonFatalCommand {
  param(
    [string]$Label,
    [ScriptBlock]$Action
  )

  Write-Host "-- $Label" -ForegroundColor DarkGray
  try {
    $output = & $Action 2>&1
    $exitCode = $LASTEXITCODE
    if ($output) {
      $safeOutput = ($output | Out-String)
      $safeOutput = $safeOutput -replace 'sb_secret_[A-Za-z0-9_-]+', 'sb_secret_[redacted]'
      $safeOutput = $safeOutput -replace 'sb_publishable_[A-Za-z0-9_-]+', 'sb_publishable_[redacted]'
      Write-Host $safeOutput
    }
  } catch {
    $exitCode = 1
    Write-Host $_ -ForegroundColor DarkGray
    $output = ''
  }

  return @{ Output = ($output | Out-String).Trim(); ExitCode = $exitCode }
}

function Ensure-SupabaseRunning {
  $statusPattern = 'not running'
  $timeoutSeconds = 420

  Invoke-NonFatalCommand -Label 'supabase --version' -Action { supabase --version }
  Invoke-NonFatalCommand -Label 'docker version' -Action { docker version }
  Invoke-NonFatalCommand -Label 'docker info' -Action { docker info }

  $statusResult = Invoke-NonFatalCommand -Label 'supabase status' -Action { supabase status }
  $needsStart = $statusResult.ExitCode -ne 0 -or ($statusResult.Output -match $statusPattern)

  if (-not $needsStart) {
    return
  }

  Write-Host 'Supabase not running -> starting...' -ForegroundColor Yellow

  $startProcess = Start-Process -FilePath 'supabase' -ArgumentList 'start --debug --exclude imgproxy --exclude edge-runtime --exclude studio' -PassThru -NoNewWindow
  $timedOut = $false
  try {
    Wait-Process -Id $startProcess.Id -Timeout $timeoutSeconds -ErrorAction Stop
  } catch {
    $timedOut = $true
  }

  if ($timedOut) {
    try {
      Stop-Process -Id $startProcess.Id -Force -ErrorAction SilentlyContinue
    } catch {
      # Best-effort
    }

    Write-Host "Supabase start timed out after ${timeoutSeconds}s" -ForegroundColor Red
    Invoke-NonFatalCommand -Label 'docker ps -a' -Action { docker ps -a }
    Invoke-NonFatalCommand -Label 'supabase status' -Action { supabase status }

    $containers = @()
    try {
      $containers = (docker ps -a --format "{{.Names}}" 2>$null) | Where-Object { $_ -match 'supabase|postgrest|kong|realtime|storage|auth|edge|studio' }
    } catch {
      $containers = @()
    }

    foreach ($name in $containers) {
      Invoke-NonFatalCommand -Label "docker logs --tail 200 $name" -Action { docker logs --tail 200 $name }
    }

    throw "Supabase start timed out"
  }

  $statusResult = Invoke-NonFatalCommand -Label 'supabase status' -Action { supabase status }
  if ($statusResult.ExitCode -ne 0 -or ($statusResult.Output -match $statusPattern)) {
    throw "Supabase start failed"
  }
}

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

Invoke-Step -Label 'Supabase start' -Fix "Ensure Docker is running and run 'supabase start', then rerun 'npm run preflight'." -Action {
  Ensure-SupabaseRunning
}

Invoke-Step -Label 'Typegen verify' -Fix "Run 'npx supabase@2.63.1 start' (or 'supabase start') then rerun 'npm run preflight'." -Action {
  pwsh -File scripts/db/typegen.ps1 -Verify
}

Invoke-Step -Label 'Repo verify' -Fix "Run 'npm run verify' and resolve the reported guardrail failures." -Action {
  npm run verify
}

Write-Host "`n✅ Preflight checks passed." -ForegroundColor Green
