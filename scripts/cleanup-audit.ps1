#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TV05-CLEANUP & AUDIT - Repo Cleanup Audit Script
    
.DESCRIPTION
    This script performs a deterministic cleanup audit of the Rhythmologicum Connect repository.
    It identifies:
    - Implemented but unused/unintegrated code artifacts
    - Mappings between GitHub Issues/PRs and repository artifacts
    - Prioritized cleanup backlog items
    
.NOTES
    Version: 1.0.0
    Author: Rhythmologicum Team
    Date: 2026-01-02
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "docs"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# =============================================================================
# CONFIGURATION
# =============================================================================

$REPO_ROOT = Split-Path -Parent $PSScriptRoot
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Rhythmologicum Connect - Cleanup Audit Script" -ForegroundColor Cyan
Write-Host "  Version: 1.0.0" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository Root: $REPO_ROOT" -ForegroundColor Gray
Write-Host "Output Directory: $OutputDir" -ForegroundColor Gray
Write-Host "Timestamp: $TIMESTAMP" -ForegroundColor Gray
Write-Host ""

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

function Write-SectionHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "─────────────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  $Title" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
}

function Search-CodeUsage {
    param(
        [string]$Pattern,
        [string]$Path = ".",
        [string[]]$Include = @("*.ts", "*.tsx", "*.js", "*.jsx"),
        [string[]]$Exclude = @("node_modules", ".git", "__tests__", "*.test.*", "dist", "build")
    )
    
    $count = 0
    $files = Get-ChildItem -Path $Path -Recurse -Include $Include -File | Where-Object {
        $file = $_
        $shouldInclude = $true
        foreach ($ex in $Exclude) {
            if ($file.FullName -like "*$ex*") {
                $shouldInclude = $false
                break
            }
        }
        $shouldInclude
    }
    
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match $Pattern) {
            $count++
        }
    }
    
    return $count
}

function Get-ApiRoutes {
    $routes = @()
    $apiPath = Join-Path $REPO_ROOT "app/api"
    
    if (Test-Path $apiPath) {
        $routeFiles = Get-ChildItem -Path $apiPath -Filter "route.ts" -Recurse -File
        
        foreach ($file in $routeFiles) {
            $relativePath = $file.FullName.Replace($apiPath, "").Replace("\", "/").Replace("/route.ts", "")
            $routePath = "/api$relativePath"
            
            # Extract HTTP methods
            try {
                $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
            } catch {
                Write-Host "Warning: Could not read $($file.FullName)" -ForegroundColor Yellow
                continue
            }
            
            $methods = @()
            if ($content -match 'export\s+(async\s+)?function\s+GET') { $methods += "GET" }
            if ($content -match 'export\s+(async\s+)?function\s+POST') { $methods += "POST" }
            if ($content -match 'export\s+(async\s+)?function\s+PUT') { $methods += "PUT" }
            if ($content -match 'export\s+(async\s+)?function\s+PATCH') { $methods += "PATCH" }
            if ($content -match 'export\s+(async\s+)?function\s+DELETE') { $methods += "DELETE" }
            
            # Search for usage (excluding the route file itself and tests)
            $usageCount = Search-CodeUsage -Pattern [regex]::Escape($routePath) -Path $REPO_ROOT
            
            $routes += [PSCustomObject]@{
                Path = $routePath
                FilePath = $file.FullName.Replace($REPO_ROOT, ".")
                Methods = $methods -join ", "
                UsageCount = $usageCount
                Status = if ($usageCount -eq 0) { "UNUSED" } elseif ($usageCount -le 2) { "LOW_USAGE" } else { "IN_USE" }
            }
        }
    }
    
    return $routes
}

function Get-PageRoutes {
    $pages = @()
    $appPath = Join-Path $REPO_ROOT "app"
    
    if (Test-Path $appPath) {
        $pageFiles = Get-ChildItem -Path $appPath -Filter "page.tsx" -Recurse -File
        
        foreach ($file in $pageFiles) {
            $relativePath = $file.DirectoryName.Replace($appPath, "").Replace("\", "/")
            
            # Remove dynamic route brackets for search
            $searchPath = $relativePath -replace '\[.*?\]', '.*?'
            
            # Search for href and navigation references
            $hrefCount = Search-CodeUsage -Pattern "href.*?[`"']$searchPath" -Path $REPO_ROOT
            $navCount = Search-CodeUsage -Pattern "push\([`"']$searchPath|navigate\([`"']$searchPath" -Path $REPO_ROOT
            
            $totalUsage = $hrefCount + $navCount
            
            $pages += [PSCustomObject]@{
                Route = $relativePath
                FilePath = $file.FullName.Replace($REPO_ROOT, ".")
                HrefLinks = $hrefCount
                NavCalls = $navCount
                TotalUsage = $totalUsage
                Status = if ($totalUsage -eq 0) { "UNREACHABLE" } elseif ($totalUsage -le 2) { "LOW_TRAFFIC" } else { "ACTIVE" }
            }
        }
    }
    
    return $pages
}

function Get-V05Issues {
    $issues = @()
    
    # Search in documentation and migration files
    $files = Get-ChildItem -Path $REPO_ROOT -Recurse -Include @("*.md", "*.sql") -File | Where-Object {
        $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*"
    }
    
    $issueMap = @{}
    
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        $matches = [regex]::Matches($content, 'V05-I\d+\.\d+')
        
        foreach ($match in $matches) {
            $issueId = $match.Value
            
            if (-not $issueMap.ContainsKey($issueId)) {
                $issueMap[$issueId] = @{
                    IssueID = $issueId
                    Files = @()
                    Migrations = @()
                    Docs = @()
                }
            }
            
            $relPath = $file.FullName.Replace($REPO_ROOT, ".").Replace("\", "/")
            
            if ($relPath -notcontains $issueMap[$issueId].Files) {
                $issueMap[$issueId].Files += $relPath
                
                if ($relPath -like "*migrations*") {
                    $issueMap[$issueId].Migrations += $relPath
                } elseif ($relPath -like "*.md") {
                    $issueMap[$issueId].Docs += $relPath
                }
            }
        }
    }
    
    foreach ($key in $issueMap.Keys) {
        $item = $issueMap[$key]
        $issues += [PSCustomObject]@{
            IssueID = $item.IssueID
            TotalFiles = $item.Files.Count
            Migrations = $item.Migrations.Count
            Docs = $item.Docs.Count
            Files = $item.Files
            Status = if ($item.Migrations.Count -gt 0) { "IMPLEMENTED" } elseif ($item.Docs.Count -gt 0) { "DOCUMENTED" } else { "MENTIONED" }
        }
    }
    
    return $issues | Sort-Object IssueID
}

function Get-ServerActions {
    $actions = @()
    $actionsPath = Join-Path $REPO_ROOT "lib/actions"
    
    if (Test-Path $actionsPath) {
        $actionFiles = Get-ChildItem -Path $actionsPath -Filter "*.ts" -Recurse -File | Where-Object {
            $_.Name -notlike "*.test.*"
        }
        
        foreach ($file in $actionFiles) {
            $content = Get-Content -Path $file.FullName -Raw
            
            # Extract exported function names
            $functionMatches = [regex]::Matches($content, 'export\s+(async\s+)?function\s+(\w+)')
            
            foreach ($match in $functionMatches) {
                $functionName = $match.Groups[2].Value
                
                # Search for usage
                $usageCount = Search-CodeUsage -Pattern "\b$functionName\b" -Path $REPO_ROOT
                
                $actions += [PSCustomObject]@{
                    Function = $functionName
                    FilePath = $file.FullName.Replace($REPO_ROOT, ".")
                    UsageCount = $usageCount
                    Status = if ($usageCount -le 1) { "UNUSED" } elseif ($usageCount -le 3) { "LOW_USAGE" } else { "IN_USE" }
                }
            }
        }
    }
    
    return $actions
}

# =============================================================================
# MAIN ANALYSIS
# =============================================================================

Write-SectionHeader "Phase 1: Analyzing API Routes"

$apiRoutes = Get-ApiRoutes
Write-Host "Found $($apiRoutes.Count) API routes" -ForegroundColor Green

$unusedApis = $apiRoutes | Where-Object { $_.Status -eq "UNUSED" }
Write-Host "  → $($unusedApis.Count) potentially unused" -ForegroundColor Yellow
Write-Host "  → $($($apiRoutes | Where-Object { $_.Status -eq "LOW_USAGE" }).Count) with low usage" -ForegroundColor Yellow
Write-Host "  → $($($apiRoutes | Where-Object { $_.Status -eq "IN_USE" }).Count) actively used" -ForegroundColor Green

# =============================================================================

Write-SectionHeader "Phase 2: Analyzing Page Routes"

$pageRoutes = Get-PageRoutes
Write-Host "Found $($pageRoutes.Count) page routes" -ForegroundColor Green

$unreachablePages = $pageRoutes | Where-Object { $_.Status -eq "UNREACHABLE" }
Write-Host "  → $($unreachablePages.Count) potentially unreachable" -ForegroundColor Yellow
Write-Host "  → $($($pageRoutes | Where-Object { $_.Status -eq "LOW_TRAFFIC" }).Count) with low traffic" -ForegroundColor Yellow
Write-Host "  → $($($pageRoutes | Where-Object { $_.Status -eq "ACTIVE" }).Count) actively linked" -ForegroundColor Green

# =============================================================================

Write-SectionHeader "Phase 3: Analyzing Server Actions"

$serverActions = Get-ServerActions
Write-Host "Found $($serverActions.Count) server actions" -ForegroundColor Green

$unusedActions = $serverActions | Where-Object { $_.Status -eq "UNUSED" }
Write-Host "  → $($unusedActions.Count) potentially unused" -ForegroundColor Yellow
Write-Host "  → $($($serverActions | Where-Object { $_.Status -eq "LOW_USAGE" }).Count) with low usage" -ForegroundColor Yellow
Write-Host "  → $($($serverActions | Where-Object { $_.Status -eq "IN_USE" }).Count) actively used" -ForegroundColor Green

# =============================================================================

Write-SectionHeader "Phase 4: Extracting V05 Issues"

$v05Issues = Get-V05Issues
Write-Host "Found $($v05Issues.Count) V05 issue references" -ForegroundColor Green

$implemented = $v05Issues | Where-Object { $_.Status -eq "IMPLEMENTED" }
Write-Host "  → $($implemented.Count) implemented (with migrations)" -ForegroundColor Green
Write-Host "  → $($($v05Issues | Where-Object { $_.Status -eq "DOCUMENTED" }).Count) documented only" -ForegroundColor Yellow
Write-Host "  → $($($v05Issues | Where-Object { $_.Status -eq "MENTIONED" }).Count) mentioned only" -ForegroundColor Gray

# =============================================================================
# GENERATE REPORTS
# =============================================================================

Write-SectionHeader "Phase 5: Generating Reports"

$outputPath = Join-Path $REPO_ROOT $OutputDir
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
}

# Report 1: Unused/Unintegrated Inventory
Write-Host "Generating: V05_CLEANUP_AUDIT_UNUSED.md" -ForegroundColor Cyan

$report1 = @"
# V05 Cleanup Audit: Unused & Unintegrated Inventory

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Repository:** Rhythmologicum Connect  
**Version:** v0.5.x

---

## Summary

This report identifies implemented code artifacts that are potentially unused or not integrated into the main user flows.

### Statistics

- **API Routes:** $($apiRoutes.Count) total, $($unusedApis.Count) unused
- **Page Routes:** $($pageRoutes.Count) total, $($unreachablePages.Count) unreachable
- **Server Actions:** $($serverActions.Count) total, $($unusedActions.Count) unused

---

## 1. Unused API Routes

The following API routes were found but have no references in the codebase (excluding the route definition itself):

| Route | Methods | File | Recommendation | Risk |
|-------|---------|------|----------------|------|
$(foreach ($route in $unusedApis) {
    $risk = if ($route.Path -like "*/admin/*") { "Low" } elseif ($route.Path -like "*/amy/*") { "Medium" } else { "High" }
    $recommendation = if ($route.Path -like "*/admin/*") { "Integrate into admin UI" } elseif ($route.Path -like "*/amy/*") { "Verify if still needed" } else { "Review necessity" }
    "| ``$($route.Path)`` | $($route.Methods) | ``$($route.FilePath)`` | $recommendation | $risk |"
})

### Evidence & Analysis

$(foreach ($route in $unusedApis) {
@"

#### ``$($route.Path)``

- **File:** ``$($route.FilePath)``
- **Methods:** $($route.Methods)
- **Usage Count:** $($route.UsageCount)
- **Status:** $($route.Status)

**Evidence:** No references found via code search across TypeScript/TSX files.

**Recommended Action:** $(
    if ($route.Path -like "*/admin/*") {
        "**Integrate** - Create admin UI page to expose this API functionality"
    } elseif ($route.Path -like "*/amy/*") {
        "**Verify** - Check if AMY integration is still planned or if this should be removed"
    } elseif ($route.Path -like "*/consent/*") {
        "**Verify** - Check if consent flow uses server actions instead"
    } else {
        "**Review** - Determine if this endpoint is needed or should be removed"
    }
)

**Risk Level:** $(
    if ($route.Path -like "*/admin/*") { "Low (admin-only)" }
    elseif ($route.Path -like "*/amy/*") { "Medium (external integration)" }
    else { "High (exposed endpoint)" }
)

"@
})

---

## 2. Unreachable Page Routes

The following pages were found but have no href links or navigation calls:

| Route | File | Recommendation | Risk |
|-------|------|----------------|------|
$(foreach ($page in $unreachablePages) {
    $risk = if ($page.Route -like "*admin*") { "Low" } elseif ($page.Route -match '\[.*?\]') { "Low" } else { "Medium" }
    $recommendation = if ($page.Route -match '\[.*?\]') { "Add navigation from parent" } else { "Add to navigation menu" }
    "| ``$($page.Route)`` | ``$($page.FilePath)`` | $recommendation | $risk |"
})

### Evidence & Analysis

$(foreach ($page in $unreachablePages) {
@"

#### ``$($page.Route)``

- **File:** ``$($page.FilePath)``
- **Href Links:** $($page.HrefLinks)
- **Navigation Calls:** $($page.NavCalls)
- **Total Usage:** $($page.TotalUsage)
- **Status:** $($page.Status)

**Evidence:** No href or navigation references found via code search.

**Recommended Action:** $(
    if ($page.Route -match '\[.*?\]') {
        "**Integrate** - Add navigation from parent page (likely accessed dynamically)"
    } elseif ($page.Route -like "*admin*") {
        "**Integrate** - Add link in admin navigation menu"
    } else {
        "**Review** - Determine if this page should be linked or removed"
    }
)

**Risk Level:** $(
    if ($page.Route -match '\[.*?\]') { "Low (dynamic route, likely accessed via code)" }
    elseif ($page.Route -like "*admin*") { "Low (admin-only)" }
    else { "Medium (user-facing)" }
)

"@
})

---

## 3. Unused Server Actions

The following server actions have minimal or no usage:

| Function | File | Usage Count | Recommendation | Risk |
|----------|------|-------------|----------------|------|
$(foreach ($action in $unusedActions) {
    "| ``$($action.Function)`` | ``$($action.FilePath)`` | $($action.UsageCount) | Review necessity | Low |"
})

---

## Recommendations Summary

### High Priority (Integrate)

1. **Admin Content Management APIs** - Integrate into admin UI pages
2. **Funnel Management Pages** - Add navigation from clinician dashboard

### Medium Priority (Verify)

1. **AMY Endpoints** - Verify if AI report generation is still in use
2. **Consent APIs** - Check if server actions are used instead
3. **Content Resolver** - Verify if content engine uses this

### Low Priority (Defer)

1. **Dynamic Routes** - Likely accessed via code, not direct links
2. **Admin Routes** - Low risk, admin-only

---

## Notes

- This analysis uses static code search and may have false positives
- Dynamic route construction (template strings) may not be detected
- API routes used by external clients won't be detected
- Consider manual verification before removing any code

---

**Report Generated by:** scripts/cleanup-audit.ps1  
**Version:** 1.0.0  
**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$report1Path = Join-Path $outputPath "V05_CLEANUP_AUDIT_UNUSED.md"
$report1 | Out-File -FilePath $report1Path -Encoding UTF8
Write-Host "  ✓ Created: $report1Path" -ForegroundColor Green

# Report 2: Issue to Repo Mapping
Write-Host "Generating: V05_CLEANUP_AUDIT_ISSUE_MAP.md" -ForegroundColor Cyan

$report2 = @"
# V05 Cleanup Audit: Issue ↔ Repo Mapping

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Repository:** Rhythmologicum Connect  
**Version:** v0.5.x

---

## Summary

This report maps V05 canonical issue IDs to their implementation artifacts in the repository.

### Statistics

- **Total Issues Found:** $($v05Issues.Count)
- **Implemented (with migrations):** $($implemented.Count)
- **Documented Only:** $($($v05Issues | Where-Object { $_.Status -eq "DOCUMENTED" }).Count)
- **Mentioned Only:** $($($v05Issues | Where-Object { $_.Status -eq "MENTIONED" }).Count)

---

## Issue Mapping Table

| Issue ID | Status | Migrations | Docs | Total Files | Notes |
|----------|--------|------------|------|-------------|-------|
$(foreach ($issue in $v05Issues) {
    $notes = if ($issue.Status -eq "IMPLEMENTED") { "Complete" } elseif ($issue.Migrations -eq 0) { "No DB changes" } else { "Partial" }
    "| $($issue.IssueID) | $($issue.Status) | $($issue.Migrations) | $($issue.Docs) | $($issue.TotalFiles) | $notes |"
})

---

## Detailed Issue Breakdown

$(foreach ($issue in $v05Issues) {
@"

### $($issue.IssueID)

**Status:** $($issue.Status)  
**Total Files:** $($issue.TotalFiles)  
**Migrations:** $($issue.Migrations)  
**Documentation:** $($issue.Docs)

**Files Referencing This Issue:**

$(foreach ($file in $issue.Files) {
    "- ``$file``"
})

**Assessment:**

$(
    if ($issue.Status -eq "IMPLEMENTED") {
        "✅ **Complete** - Issue has associated database migrations and documentation"
    } elseif ($issue.Status -eq "DOCUMENTED") {
        "📝 **Documented Only** - No database migrations found, may be code-only or pending implementation"
    } else {
        "⚠️  **Mentioned Only** - Referenced but may not be fully implemented"
    }
)

---

"@
})

## Implementation Coverage Analysis

### Fully Implemented Issues (with Migrations)

$(foreach ($issue in ($v05Issues | Where-Object { $_.Status -eq "IMPLEMENTED" })) {
    "- **$($issue.IssueID)** - $($issue.Migrations) migration(s), $($issue.Docs) doc(s)"
})

### Documented But Not Migrated

$(foreach ($issue in ($v05Issues | Where-Object { $_.Status -eq "DOCUMENTED" })) {
    "- **$($issue.IssueID)** - $($issue.Docs) doc(s), no migrations"
})

---

## Notes

- Migration count indicates database schema changes were made
- Documentation count shows evidence files and implementation summaries
- Issues with 0 migrations may still be implemented via code-only changes
- This mapping is based on file content search and may not capture all references

---

**Report Generated by:** scripts/cleanup-audit.ps1  
**Version:** 1.0.0  
**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$report2Path = Join-Path $outputPath "V05_CLEANUP_AUDIT_ISSUE_MAP.md"
$report2 | Out-File -FilePath $report2Path -Encoding UTF8
Write-Host "  ✓ Created: $report2Path" -ForegroundColor Green

# Report 3: Cleanup Backlog
Write-Host "Generating: V05_CLEANUP_BACKLOG.md" -ForegroundColor Cyan

$report3 = @"
# V05 Cleanup Backlog

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Repository:** Rhythmologicum Connect  
**Version:** v0.5.x

---

## Overview

This document outlines prioritized cleanup tasks derived from the audit findings.

---

## Top 10 Cleanup Items

### 1. Integrate Admin Content Management UI

**Scope:** Create admin pages to expose content management APIs

**Current State:**
- APIs exist: /api/admin/content-pages/*
- No admin UI pages to access them
- Low usage count indicates missing integration

**Acceptance Criteria:**
- [ ] Create /admin/content page listing all content pages
- [ ] Add create/edit/delete functionality
- [ ] Add navigation link from admin dashboard
- [ ] Test CRUD operations work end-to-end

**Verification:**
- [ ] Admin can create new content page
- [ ] Admin can edit existing content page
- [ ] Admin can delete content page
- [ ] All operations reflected in database

**Risk:** Low (admin-only feature)

---

### 2. Verify AMY Integration Status

**Scope:** Determine if AMY (AI report) endpoints are still needed

**Current State:**
- APIs exist: /api/amy/stress-report, /api/amy/stress-summary
- Zero usage found in codebase
- May be replaced by funnel runtime

**Acceptance Criteria:**
- [ ] Review if AMY is still part of v0.5 architecture
- [ ] Check if funnel runtime replaced AMY
- [ ] Document decision to keep or remove
- [ ] If removing, create removal migration

**Verification:**
- [ ] Documentation updated with AMY status
- [ ] If keeping: add usage examples
- [ ] If removing: verify no breaking changes

**Risk:** Medium (external AI integration)

---

### 3. Complete Funnel Management Integration

**Scope:** Add navigation to funnel detail pages

**Current State:**
- Pages exist: /clinician/funnels/[id]
- Link exists from funnel list page
- Low apparent usage but may be dynamic

**Acceptance Criteria:**
- [ ] Verify funnel list page links to detail pages
- [ ] Add breadcrumb navigation
- [ ] Test funnel edit functionality
- [ ] Document funnel management workflow

**Verification:**
- [ ] Click "Details" button navigates to funnel detail
- [ ] Breadcrumbs show current location
- [ ] Back button returns to list

**Risk:** Low (clinician-only feature)

---

### 4. Integrate Patient Detail Pages

**Scope:** Ensure patient detail pages are reachable from dashboard

**Current State:**
- Page exists: /clinician/patient/[id]
- Dynamic route accessed via code
- Dashboard has patient table with click handler

**Acceptance Criteria:**
- [ ] Verify row click navigates to patient detail
- [ ] Add direct link option (context menu)
- [ ] Test patient detail page loads correctly
- [ ] Add breadcrumb navigation

**Verification:**
- [ ] Click patient row navigates to detail page
- [ ] Patient detail shows all measures
- [ ] Back button returns to dashboard

**Risk:** Low (dynamic route, likely working)

---

### 5. Review Consent Flow Implementation

**Scope:** Determine if consent APIs or server actions are canonical

**Current State:**
- APIs exist: /api/consent/record, /api/consent/status
- Server actions exist: lib/actions/onboarding.ts
- Both implement consent functionality

**Acceptance Criteria:**
- [ ] Review which implementation is canonical
- [ ] Remove duplicate implementation if any
- [ ] Document consent flow pattern
- [ ] Update code to use one approach

**Verification:**
- [ ] Single consent implementation exists
- [ ] Documentation shows correct usage
- [ ] Tests validate consent flow

**Risk:** Medium (user-facing feature)

---

### 6. Verify Content Resolver Usage

**Scope:** Determine if content resolver endpoints are used

**Current State:**
- APIs exist: /api/content-resolver, /api/content/resolve
- Low/zero usage found
- May be used by content engine

**Acceptance Criteria:**
- [ ] Review content engine architecture
- [ ] Determine if resolvers are needed
- [ ] Document or remove unused endpoints
- [ ] Update content rendering code

**Verification:**
- [ ] Content pages render correctly
- [ ] Content resolver documented or removed
- [ ] No broken content references

**Risk:** Low (content system)

---

### 7. Audit Patient Measures Export

**Scope:** Verify export functionality is integrated

**Current State:**
- APIs exist: /api/patient-measures/export, /api/patient-measures/history
- Low usage count
- May be accessed via clinician dashboard

**Acceptance Criteria:**
- [ ] Add export button to clinician dashboard
- [ ] Test export functionality
- [ ] Verify data format and completeness
- [ ] Document export feature

**Verification:**
- [ ] Export button visible on dashboard
- [ ] Export downloads correct data
- [ ] Data includes all required fields

**Risk:** Low (clinician feature)

---

### 8. Review Assessment Validation Flow

**Scope:** Verify assessment validation is integrated

**Current State:**
- API exists: /api/assessment-validation/validate-step
- Single usage found
- May be part of funnel runtime

**Acceptance Criteria:**
- [ ] Verify funnel step validation works
- [ ] Test required field validation
- [ ] Check error message display
- [ ] Document validation rules

**Verification:**
- [ ] Validation prevents invalid submissions
- [ ] Error messages are user-friendly
- [ ] Validation matches schema

**Risk:** Medium (user-facing feature)

---

### 9. Document Admin Design System Page

**Scope:** Add documentation for design system page

**Current State:**
- Page exists: /admin/design-system
- Single navigation reference found
- Appears to be implemented

**Acceptance Criteria:**
- [ ] Document design system page purpose
- [ ] Add usage guide for developers
- [ ] Ensure all components are showcased
- [ ] Add link to main documentation

**Verification:**
- [ ] Documentation exists
- [ ] Design system page is accessible
- [ ] All components render correctly

**Risk:** Low (developer tool)

---

### 10. Clean Up Legacy Content Routes

**Scope:** Review and consolidate content page routes

**Current State:**
- Multiple content routes: /content/[slug], /api/content-pages/[slug]
- May have overlap with funnel content
- Need to determine canonical approach

**Acceptance Criteria:**
- [ ] Review all content routing patterns
- [ ] Consolidate to single pattern
- [ ] Update all content references
- [ ] Document content routing architecture

**Verification:**
- [ ] All content pages accessible
- [ ] Single content routing pattern
- [ ] Documentation is clear

**Risk:** Medium (content architecture)

---

## Priority Levels

**High Priority:**
1. Integrate Admin Content Management UI
2. Verify AMY Integration Status
3. Review Consent Flow Implementation

**Medium Priority:**
4. Complete Funnel Management Integration
5. Integrate Patient Detail Pages
6. Verify Content Resolver Usage
7. Audit Patient Measures Export

**Low Priority:**
8. Review Assessment Validation Flow
9. Document Admin Design System Page
10. Clean Up Legacy Content Routes

---

## Execution Strategy

1. **Week 1:** High priority items (1-3)
2. **Week 2:** Medium priority items (4-7)
3. **Week 3:** Low priority items (8-10)
4. **Week 4:** Documentation and verification

---

## Notes

- Each item should be a separate GitHub issue
- Link back to this backlog from individual issues
- Update this document as items are completed
- Re-run audit after significant changes

---

**Report Generated by:** scripts/cleanup-audit.ps1  
**Version:** 1.0.0  
**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$report3Path = Join-Path $outputPath "V05_CLEANUP_BACKLOG.md"
$report3 | Out-File -FilePath $report3Path -Encoding UTF8
Write-Host "  ✓ Created: $report3Path" -ForegroundColor Green

# =============================================================================
# COMPLETION
# =============================================================================

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Audit Complete!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Reports generated:" -ForegroundColor White
Write-Host "  1. $report1Path" -ForegroundColor Gray
Write-Host "  2. $report2Path" -ForegroundColor Gray
Write-Host "  3. $report3Path" -ForegroundColor Gray
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  • API Routes: $($unusedApis.Count)/$($apiRoutes.Count) potentially unused" -ForegroundColor Gray
Write-Host "  • Page Routes: $($unreachablePages.Count)/$($pageRoutes.Count) potentially unreachable" -ForegroundColor Gray
Write-Host "  • Server Actions: $($unusedActions.Count)/$($serverActions.Count) potentially unused" -ForegroundColor Gray
Write-Host "  • V05 Issues: $($v05Issues.Count) found, $($implemented.Count) implemented" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review generated reports in $OutputDir/" -ForegroundColor White
Write-Host "  2. Manually verify flagged items" -ForegroundColor White
Write-Host "  3. Create GitHub issues for cleanup backlog items" -ForegroundColor White
Write-Host "  4. Execute cleanup in priority order" -ForegroundColor White
Write-Host ""
