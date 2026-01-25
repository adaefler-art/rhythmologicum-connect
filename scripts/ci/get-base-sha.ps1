<#
.SYNOPSIS
Deterministic BASE_SHA resolution for CI workflows

.DESCRIPTION
This script provides a single, consistent way to determine BASE_SHA across all CI workflows.
It handles both PR and push events with deterministic fallback logic.

Behavior:
- PR event: Use GitHub-provided base SHA, fallback to merge-base if needed
- Push event: Use GITHUB_EVENT_BEFORE, fallback to HEAD~1 if available
- Fail-closed: Exit with error if BASE_SHA cannot be determined reliably

Output: JSON with BASE_SHA, HEAD_SHA, and context metadata

.PARAMETER EventName
GitHub event name (pull_request, push, etc.)

.PARAMETER PullRequestBaseSha
Base SHA from PR event (github.event.pull_request.base.sha)

.PARAMETER EventBefore
SHA before push event (github.event.before)

.PARAMETER HeadSha
Current HEAD SHA (github.sha)

.PARAMETER DefaultBranch
Default branch name for merge-base fallback (default: main)

.EXAMPLE
pwsh -File scripts/ci/get-base-sha.ps1 -EventName "pull_request" -PullRequestBaseSha "${{ github.event.pull_request.base.sha }}" -HeadSha "${{ github.sha }}"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$EventName,
    
    [Parameter(Mandatory=$false)]
    [string]$PullRequestBaseSha = "",
    
    [Parameter(Mandatory=$false)]
    [string]$EventBefore = "",
    
    [Parameter(Mandatory=$true)]
    [string]$HeadSha,
    
    [Parameter(Mandatory=$false)]
    [string]$DefaultBranch = "main"
)

$ErrorActionPreference = "Stop"

# Track context for evidence output
$context = @{
    event_name = $EventName
    head_sha = $HeadSha
    default_branch = $DefaultBranch
    method = ""
    fallback_used = $false
    warnings = @()
}

function Test-GitObject {
    param([string]$Ref)
    if ([string]::IsNullOrWhiteSpace($Ref)) {
        return $false
    }
    
    $result = & git cat-file -e "$Ref" 2>&1
    return $LASTEXITCODE -eq 0
}

function Get-MergeBase {
    param(
        [string]$Head,
        [string]$Base
    )
    
    $mergeBase = & git merge-base "$Head" "$Base" 2>&1
    if ($LASTEXITCODE -eq 0 -and ![string]::IsNullOrWhiteSpace($mergeBase)) {
        return $mergeBase.Trim()
    }
    return $null
}

# Determine BASE_SHA based on event type
$baseSha = $null

if ($EventName -eq "pull_request") {
    $context.method = "pr_event"
    
    # Try GitHub-provided base SHA first
    if (![string]::IsNullOrWhiteSpace($PullRequestBaseSha) -and (Test-GitObject $PullRequestBaseSha)) {
        $baseSha = $PullRequestBaseSha
        Write-Host "✓ Using PR base SHA: $baseSha" -ForegroundColor Green
    }
    else {
        # Fallback: compute merge-base
        $context.fallback_used = $true
        $context.warnings += "GitHub-provided base SHA not available or invalid"
        
        Write-Host "⚠️  PR base SHA not available or invalid, attempting merge-base fallback" -ForegroundColor Yellow
        
        # Try merge-base with origin/{default_branch}
        $remoteBranch = "origin/$DefaultBranch"
        $baseSha = Get-MergeBase -Head $HeadSha -Base $remoteBranch
        
        if ($null -eq $baseSha) {
            # Try with FETCH_HEAD as last resort
            $baseSha = Get-MergeBase -Head $HeadSha -Base "FETCH_HEAD"
        }
        
        if ($null -eq $baseSha) {
            Write-Host "❌ Failed to determine BASE_SHA via merge-base. Ensure fetch-depth: 0 is set in checkout." -ForegroundColor Red
            $context.method = "failed_pr_fallback"
            
            # Output failure JSON for observability
            $output = @{
                success = $false
                error = "Unable to determine BASE_SHA for PR event. Missing git history (shallow clone?)."
                context = $context
            } | ConvertTo-Json -Depth 5 -Compress
            
            Write-Host $output
            exit 1
        }
        
        Write-Host "✓ Computed BASE_SHA via merge-base: $baseSha" -ForegroundColor Green
        $context.method = "pr_merge_base"
    }
}
elseif ($EventName -eq "push") {
    $context.method = "push_event"
    
    # Try GITHUB_EVENT_BEFORE first
    if (![string]::IsNullOrWhiteSpace($EventBefore) -and $EventBefore -ne "0000000000000000000000000000000000000000" -and (Test-GitObject $EventBefore)) {
        $baseSha = $EventBefore
        Write-Host "✓ Using event.before SHA: $baseSha" -ForegroundColor Green
    }
    else {
        # Fallback: HEAD~1 if history available
        $context.fallback_used = $true
        $context.warnings += "event.before not available or is zero SHA"
        
        Write-Host "⚠️  event.before not available, attempting HEAD~1 fallback" -ForegroundColor Yellow
        
        if (Test-GitObject "HEAD~1") {
            $baseSha = (& git rev-parse "HEAD~1").Trim()
            Write-Host "✓ Using HEAD~1: $baseSha" -ForegroundColor Green
            $context.method = "push_head_minus_1"
        }
        else {
            Write-Host "❌ Failed to determine BASE_SHA for push event. Insufficient git history." -ForegroundColor Red
            $context.method = "failed_push_fallback"
            
            # Output failure JSON for observability
            $output = @{
                success = $false
                error = "Unable to determine BASE_SHA for push event. Missing git history (shallow clone?)."
                context = $context
            } | ConvertTo-Json -Depth 5 -Compress
            
            Write-Host $output
            exit 1
        }
    }
}
else {
    # Unsupported event type - fail-closed
    Write-Host "❌ Unsupported event type: $EventName" -ForegroundColor Red
    $context.method = "unsupported_event"
    
    $output = @{
        success = $false
        error = "Unsupported event type: $EventName. Only 'pull_request' and 'push' are supported."
        context = $context
    } | ConvertTo-Json -Depth 5 -Compress
    
    Write-Host $output
    exit 1
}

# Final validation
if (![string]::IsNullOrWhiteSpace($baseSha) -and (Test-GitObject $baseSha)) {
    Write-Host "" -ForegroundColor Green
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "BASE_SHA Resolution Summary" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Event:      $EventName" -ForegroundColor White
    Write-Host "Method:     $($context.method)" -ForegroundColor White
    Write-Host "BASE_SHA:   $baseSha" -ForegroundColor Green
    Write-Host "HEAD_SHA:   $HeadSha" -ForegroundColor Green
    if ($context.fallback_used) {
        Write-Host "Fallback:   Used" -ForegroundColor Yellow
    }
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Green
    
    # Output structured JSON for CI consumption
    $output = @{
        success = $true
        base_sha = $baseSha
        head_sha = $HeadSha
        context = $context
    } | ConvertTo-Json -Depth 5 -Compress
    
    # GitHub Actions output (not deprecated method)
    Write-Host "BASE_SHA=$baseSha"
    Write-Host "HEAD_SHA=$HeadSha"
    
    exit 0
}
else {
    Write-Host "❌ Computed BASE_SHA is invalid or not a valid git object: $baseSha" -ForegroundColor Red
    $context.method = "failed_validation"
    
    $output = @{
        success = $false
        error = "Computed BASE_SHA is not a valid git object."
        computed_sha = $baseSha
        context = $context
    } | ConvertTo-Json -Depth 5 -Compress
    
    Write-Host $output
    exit 1
}
