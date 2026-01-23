#Requires -Version 7.0

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$envExamplePath = Join-Path $repoRoot '.env.example'

if (-not (Test-Path -LiteralPath $envExamplePath)) {
  throw "Missing .env.example at $envExamplePath"
}

$requiredKeys = @(
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
)

$keysInExample = @{}
Get-Content -LiteralPath $envExamplePath | ForEach-Object {
  if ($_ -match '^\s*([A-Z0-9_]+)\s*=') {
    $key = $matches[1]
    if ($requiredKeys -contains $key) {
      $keysInExample[$key] = $true
    }
  }
}

$missingInExample = $requiredKeys | Where-Object { -not $keysInExample.ContainsKey($_) }
if ($missingInExample.Count -gt 0) {
  throw "Required key(s) missing in .env.example: $($missingInExample -join ', ')"
}

function Read-NonEmptyValue {
  param(
    [string]$Prompt,
    [switch]$Secure
  )

  while ($true) {
    if ($Secure) {
      $secureValue = Read-Host -Prompt $Prompt -AsSecureString
      if ($secureValue.Length -gt 0) {
        $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
        try {
          $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
          if (-not [string]::IsNullOrWhiteSpace($plain)) {
            return $plain
          }
        } finally {
          [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
      }
    } else {
      $value = Read-Host -Prompt $Prompt
      if (-not [string]::IsNullOrWhiteSpace($value)) {
        return $value
      }
    }

    Write-Host 'Value cannot be empty. Please try again.' -ForegroundColor Yellow
  }
}

foreach ($key in $requiredKeys) {
  $currentValue = (Get-Item -Path "env:$key" -ErrorAction SilentlyContinue).Value
  if ([string]::IsNullOrWhiteSpace($currentValue)) {
    if ($key -eq 'SUPABASE_SERVICE_ROLE_KEY') {
      $value = Read-NonEmptyValue -Prompt "Enter $key (input hidden)" -Secure
    } else {
      $value = Read-NonEmptyValue -Prompt "Enter $key"
    }

    Set-Item -Path "env:$key" -Value $value
  }
}

function Get-PortOwner {
  param([int]$Port)

  $connection = $null
  try {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
  } catch {
    $netstat = netstat -ano | Select-String -Pattern "LISTENING" | Select-String -Pattern ":$Port\s"
    if ($netstat) {
      $parts = ($netstat -replace '\s+', ' ').Trim().Split(' ')
      $pid = $parts[-1]
      if ($pid) {
        return [pscustomobject]@{ OwningProcess = [int]$pid }
      }
    }
  }

  return $connection
}

$portOwner = Get-PortOwner -Port 3000
if ($portOwner) {
  $pid = $portOwner.OwningProcess
  $processName = 'unknown'
  try {
    $processName = (Get-Process -Id $pid -ErrorAction Stop).ProcessName
  } catch {
    $processName = 'unknown'
  }

  Write-Host "Port 3000 is in use by PID $pid (process $processName)." -ForegroundColor Yellow
  $response = Read-Host 'Kill it? (Y/N)'
  if ($response -match '^[Yy]') {
    Stop-Process -Id $pid -Force
    Write-Host "Stopped PID $pid." -ForegroundColor Green
  } else {
    Write-Host 'Aborting: port 3000 is in use.' -ForegroundColor Red
    exit 1
  }
}

Set-Location $repoRoot
Write-Host 'Starting app at http://localhost:3000' -ForegroundColor Cyan
npm run start
