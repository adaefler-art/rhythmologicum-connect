<#
.SYNOPSIS
    Deterministic Supabase TypeScript type generation with fail-closed verification.

.DESCRIPTION
    This script enforces exactly ONE way to generate lib/types/supabase.ts, identical
    in CI and local environments. Eliminates typegen drift by pinning CLI version and
    providing full diagnostics on any output differences.

    PINNED CLI: npx supabase@2.63.1 (exact version, no global installs)
    MODE: --local (Supabase local development mode)

.PARAMETER Generate
    Generates lib/types/supabase.ts (overwrites committed file).

.PARAMETER Verify
    Generates types to temp file, compares with committed version.
    Exit 0 if identical, Exit 1 if different (with full diagnostics).

.PARAMETER OutFile
    Optional: Specify custom output file path (default: lib/types/supabase.ts for -Generate mode).

.EXAMPLE
    pwsh -File scripts/db/typegen.ps1 -Generate
    Generates lib/types/supabase.ts

.EXAMPLE
    pwsh -File scripts/db/typegen.ps1 -Verify
    Verifies committed file matches generated output
#>

param(
    [switch]$Generate,
    [switch]$Verify,
    [string]$OutFile = ""
)

# Pinned Supabase CLI version (deterministic, no drift)
$PINNED_SUPABASE_VERSION = "2.63.1"

# Get repository root (script is in scripts/db)
function Get-RepositoryRoot {
    if ($PSScriptRoot) {
        $scriptDir = $PSScriptRoot
    } else {
        $scriptDir = (Get-Location).Path
    }
    
    $repoRoot = (Resolve-Path (Join-Path $scriptDir "../..")).Path
    return $repoRoot
}

$repoRoot = Get-RepositoryRoot
$committedTypesFile = Join-Path $repoRoot "lib/types/supabase.ts"

# Console output helpers
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Failure { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }

# Resolve npx executable for current platform
function Resolve-NpxPath {
    try {
        $npxCommand = Get-Command npx -ErrorAction Stop
        return $npxCommand.Source
    } catch {
        if (-not $IsWindows) {
            throw
        }
    }

    $npxCommand = Get-Command npx.cmd -ErrorAction Stop
    return $npxCommand.Source
}

$npxPath = Resolve-NpxPath
Write-Info "Using npx: $npxPath"

# Validate mode
if (-not $Generate -and -not $Verify) {
    Write-Failure "Must specify either -Generate or -Verify mode"
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  Generate types:  pwsh -File scripts/db/typegen.ps1 -Generate"
    Write-Host "  Verify types:    pwsh -File scripts/db/typegen.ps1 -Verify"
    exit 1
}

Write-Info "Deterministic Supabase TypeGen (Hard Gate)"
Write-Info "Pinned CLI: supabase@$PINNED_SUPABASE_VERSION"
Write-Info "Mode: --local"
Write-Host ""

# Execute typegen with deterministic ProcessStartInfo
function Invoke-SupabaseTypegen {
    param(
        [string]$NpxPath,
        [string]$PinnedVersion,
        [string]$StderrFile
    )

    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $NpxPath
    $processInfo.Arguments = "supabase@$PinnedVersion gen types typescript --local"
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.UseShellExecute = $false
    $processInfo.CreateNoWindow = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null

    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    $exitCode = $process.ExitCode

    $stderrBytes = 0
    if ($stderr) {
        $stderr | Out-File -FilePath $StderrFile -Encoding utf8
        $stderrBytes = (Get-Item $StderrFile).Length
    }

    return @{
        Stdout = $stdout
        Stderr = $stderr
        ExitCode = $exitCode
        StderrBytes = $stderrBytes
    }
}

function Invoke-SupabaseCli {
    param(
        [string]$NpxPath,
        [string]$PinnedVersion,
        [string]$Arguments
    )

    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $NpxPath
    $processInfo.Arguments = "supabase@$PinnedVersion $Arguments"
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.UseShellExecute = $false
    $processInfo.CreateNoWindow = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null

    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    return @{
        Stdout = $stdout
        Stderr = $stderr
        ExitCode = $process.ExitCode
    }
}

function Ensure-SupabaseRunning {
    $statusArgs = "status"
    $statusCommand = "npx supabase@$PINNED_SUPABASE_VERSION $statusArgs"

    $statusResult = Invoke-SupabaseCli -NpxPath $npxPath -PinnedVersion $PINNED_SUPABASE_VERSION -Arguments $statusArgs
    $statusOk = $statusResult.ExitCode -eq 0 -and ($statusResult.Stdout -notmatch "not running")

    if (-not $statusOk) {
        Write-Host "Supabase not running → starting…" -ForegroundColor Yellow
        $startResult = Invoke-SupabaseCli -NpxPath $npxPath -PinnedVersion $PINNED_SUPABASE_VERSION -Arguments "start"
        if ($startResult.ExitCode -ne 0) {
            Write-Failure "Supabase start failed"
            Write-Host "StatusCmd:     $statusCommand"
            Write-Host "ExitCode:      $($startResult.ExitCode)"
            $statusLines = ($statusResult.Stdout -split "`r?`n" | Select-Object -First 5) -join "`n"
            if ($statusLines) {
                Write-Host "StatusOutput:"
                Write-Host $statusLines
            }
            if ($startResult.Stderr) {
                Write-Host "STDERR:" -ForegroundColor Yellow
                Write-Host $startResult.Stderr
            }
            exit 1
        }

        $statusResult = Invoke-SupabaseCli -NpxPath $npxPath -PinnedVersion $PINNED_SUPABASE_VERSION -Arguments $statusArgs
        $statusOk = $statusResult.ExitCode -eq 0 -and ($statusResult.Stdout -notmatch "not running")
    }

    if (-not $statusOk) {
        Write-Failure "Supabase is not running after start"
        Write-Host "StatusCmd:     $statusCommand"
        Write-Host "ExitCode:      $($statusResult.ExitCode)"
        $statusLines = ($statusResult.Stdout -split "`r?`n" | Select-Object -First 5) -join "`n"
        if ($statusLines) {
            Write-Host "StatusOutput:"
            Write-Host $statusLines
        }
        if ($statusResult.Stderr) {
            Write-Host "STDERR:" -ForegroundColor Yellow
            Write-Host $statusResult.Stderr
        }
        exit 1
    }
}

# Determine output file
if ($Generate) {
    if ($OutFile) {
        $targetFile = $OutFile
    } else {
        $targetFile = $committedTypesFile
    }
    
    Write-Info "Generating TypeScript types..."
    Write-Info "Output: $targetFile"

    Ensure-SupabaseRunning
    
    # Generate types using pinned CLI version
    $command = "npx supabase@$PINNED_SUPABASE_VERSION gen types typescript --local"
    Write-Info "Command: $command > $targetFile"
    
    try {
        # Capture stderr separately for diagnostics
        $stderrFile = Join-Path $repoRoot "artifacts/typegen/stderr.log"
        $stderrDir = Split-Path $stderrFile -Parent
        if (-not (Test-Path $stderrDir)) {
            New-Item -ItemType Directory -Path $stderrDir -Force | Out-Null
        }
        
        # Execute generation with direct file redirection (not PowerShell capture)
        # This ensures FULL stdout is written to the file
        $result = Invoke-SupabaseTypegen -NpxPath $npxPath -PinnedVersion $PINNED_SUPABASE_VERSION -StderrFile $stderrFile
        $stdout = $result.Stdout
        $stderr = $result.Stderr
        $exitCode = $result.ExitCode
        $stderrBytes = $result.StderrBytes
        
        # Evidence output - always print for transparency
        Write-Host ""
        Write-Host "━━━ Evidence (Generate Mode) ━━━" -ForegroundColor Cyan
        Write-Host "ExitCode:      $exitCode"
        Write-Host "StderrBytes:   $stderrBytes"
        Write-Host "StderrLog:     $stderrFile"
        Write-Host ""
        
        if ($exitCode -ne 0) {
            Write-Failure "Supabase typegen failed with exit code $exitCode"
            if ($stderr) {
                Write-Host "STDERR:" -ForegroundColor Yellow
                Write-Host $stderr
            }
            if ($stdout) {
                Write-Host "STDOUT:" -ForegroundColor Yellow
                Write-Host $stdout
            }
            exit 1
        }
        
        # Verify we got output
        if ([string]::IsNullOrWhiteSpace($stdout)) {
            Write-Failure "Supabase typegen produced no output"
            if ($stderr) {
                Write-Host "STDERR:" -ForegroundColor Yellow
                Write-Host $stderr
            }
            exit 1
        }
        
        # Write stdout to target file
        $stdout | Out-File -FilePath $targetFile -Encoding utf8 -NoNewline
        
        # Show file hash and size for verification
        $hash = (Get-FileHash -Path $targetFile -Algorithm SHA256).Hash
        $fileInfo = Get-Item $targetFile
        $stdoutBytes = $fileInfo.Length
        
        Write-Host "StdoutBytes:   $stdoutBytes" -ForegroundColor Cyan
        Write-Host "GeneratedFile: $targetFile" -ForegroundColor Cyan
        Write-Host "SHA256:        $hash" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Success "Types generated successfully"
        
    } catch {
        Write-Failure "Generation failed: $_"
        exit 1
    }
    
} elseif ($Verify) {
    Write-Info "Verifying committed types match generated output..."
    
    # Create temp directory for generated file
    $tempDir = Join-Path $repoRoot "artifacts/typegen"
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
    
    $tempFile = Join-Path $tempDir "supabase.generated.ts"
    
    Write-Info "Generating to temp file: $tempFile"

    Ensure-SupabaseRunning
    
    # Generate types using pinned CLI version
    $command = "npx supabase@$PINNED_SUPABASE_VERSION gen types typescript --local"
    Write-Info "Command: $command"
    
    try {
        # Capture stderr separately for diagnostics
        $stderrFile = Join-Path $tempDir "stderr.log"
        
        # Execute generation with direct file redirection (not PowerShell capture)
        # This ensures FULL stdout is written to the file
        $result = Invoke-SupabaseTypegen -NpxPath $npxPath -PinnedVersion $PINNED_SUPABASE_VERSION -StderrFile $stderrFile
        $stdout = $result.Stdout
        $stderr = $result.Stderr
        $exitCode = $result.ExitCode
        $stderrBytes = $result.StderrBytes
        
        # Evidence output - always print for transparency
        Write-Host ""
        Write-Host "━━━ Evidence (Verify Mode) ━━━" -ForegroundColor Cyan
        Write-Host "ExitCode:      $exitCode"
        Write-Host "StderrBytes:   $stderrBytes"
        Write-Host "StderrLog:     $stderrFile"
        Write-Host ""
        
        if ($exitCode -ne 0) {
            Write-Failure "Supabase typegen failed with exit code $exitCode"
            if ($stderr) {
                Write-Host "STDERR:" -ForegroundColor Yellow
                Write-Host $stderr
            }
            if ($stdout) {
                Write-Host "STDOUT:" -ForegroundColor Yellow
                Write-Host $stdout
            }
            exit 1
        }
        
        # Verify we got output
        if ([string]::IsNullOrWhiteSpace($stdout)) {
            Write-Failure "Supabase typegen produced no output"
            if ($stderr) {
                Write-Host "STDERR:" -ForegroundColor Yellow
                Write-Host $stderr
            }
            exit 1
        }
        
        # Write stdout to temp file
        $stdout | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
        
        # Show file size for verification
        $fileInfo = Get-Item $tempFile
        $stdoutBytes = $fileInfo.Length
        
        Write-Host "StdoutBytes:   $stdoutBytes" -ForegroundColor Cyan
        Write-Host "GeneratedFile: $tempFile" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Success "Generated temp file successfully"
        
    } catch {
        Write-Failure "Generation failed: $_"
        exit 1
    }
    
    # Compare files
    Write-Info "Comparing generated vs committed..."
    
    if (-not (Test-Path $committedTypesFile)) {
        Write-Failure "Committed types file not found: $committedTypesFile"
        exit 1
    }
    
    function Get-NormalizedSha256 {
        param([string]$Path)

        $text = Get-Content -Path $Path -Raw
        $normalizedText = $text -replace "\r\n", "\n" -replace "\r", "\n"
        $normalizedText = $normalizedText.TrimEnd("`n") + "`n"

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($normalizedText)
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        try {
            $hashBytes = $sha256.ComputeHash($bytes)
        } finally {
            $sha256.Dispose()
        }
        return ([System.BitConverter]::ToString($hashBytes)).Replace('-', '')
    }

    $committedHash = Get-NormalizedSha256 -Path $committedTypesFile
    $generatedHash = Get-NormalizedSha256 -Path $tempFile
    
    Write-Host ""
    Write-Info "Committed:  $committedHash"
    Write-Info "Generated:  $generatedHash"
    Write-Host ""
    
    if ($committedHash -eq $generatedHash) {
        Write-Success "✓ Types match! Files are identical."
        Write-Host ""
        exit 0
    } else {
        Write-Failure "✗ Types differ! Generated output does not match committed version."
        Write-Host ""
        Write-Host "DIAGNOSTICS:" -ForegroundColor Yellow
        Write-Host "  Pinned CLI:     supabase@$PINNED_SUPABASE_VERSION"
        Write-Host "  Command:        $command"
        Write-Host "  Committed hash: $committedHash"
        Write-Host "  Generated hash: $generatedHash"
        Write-Host "  Committed file: $committedTypesFile"
        Write-Host "  Generated file: $tempFile"
        Write-Host ""
        Write-Host "To fix:" -ForegroundColor Yellow
        Write-Host "  1. Run:  pwsh -File scripts/db/typegen.ps1 -Generate"
        Write-Host "  2. Commit the updated lib/types/supabase.ts file"
        Write-Host ""
        Write-Host "Diff preview:" -ForegroundColor Yellow
        
        # Show diff preview (first 50 lines)
        try {
            $diffOutput = git diff --no-index --color=always $committedTypesFile $tempFile 2>&1 | Select-Object -First 50
            Write-Host $diffOutput
        } catch {
            Write-Warning "Could not generate diff preview"
        }
        
        Write-Host ""
        exit 1
    }
}
