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

# Determine output file
if ($Generate) {
    if ($OutFile) {
        $targetFile = $OutFile
    } else {
        $targetFile = $committedTypesFile
    }
    
    Write-Info "Generating TypeScript types..."
    Write-Info "Output: $targetFile"
    
    # Generate types using pinned CLI version
    $command = "npx supabase@$PINNED_SUPABASE_VERSION gen types typescript --local"
    Write-Info "Command: $command > $targetFile"
    
    try {
        # Execute generation
        $output = & npx "supabase@$PINNED_SUPABASE_VERSION" gen types typescript --local 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "Supabase typegen failed with exit code $LASTEXITCODE"
            Write-Host $output
            exit 1
        }
        
        # Write output to file
        $output | Out-File -FilePath $targetFile -Encoding utf8 -NoNewline
        
        # Add trailing newline (Supabase CLI 2.63.1 convention)
        Add-Content -Path $targetFile -Value "" -NoNewline
        
        Write-Success "Types generated successfully"
        Write-Info "File: $targetFile"
        
        # Show file hash for verification
        $hash = (Get-FileHash -Path $targetFile -Algorithm SHA256).Hash
        Write-Info "SHA256: $hash"
        
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
    
    # Generate types using pinned CLI version
    $command = "npx supabase@$PINNED_SUPABASE_VERSION gen types typescript --local"
    Write-Info "Command: $command"
    
    try {
        # Execute generation
        $output = & npx "supabase@$PINNED_SUPABASE_VERSION" gen types typescript --local 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "Supabase typegen failed with exit code $LASTEXITCODE"
            Write-Host $output
            exit 1
        }
        
        # Write output to temp file
        $output | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
        
        # Add trailing newline (Supabase CLI 2.63.1 convention)
        Add-Content -Path $tempFile -Value "" -NoNewline
        
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
    
    $committedHash = (Get-FileHash -Path $committedTypesFile -Algorithm SHA256).Hash
    $generatedHash = (Get-FileHash -Path $tempFile -Algorithm SHA256).Hash
    
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
