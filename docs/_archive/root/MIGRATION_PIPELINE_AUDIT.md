# Migration Pipeline Audit - V05-I05.9

## Audit Date: 2026-01-04

## Summary

Comprehensive audit of the Supabase migration deployment pipeline to ensure safety, determinism, and prevent CI loops or environment mistakes.

---

## ✅ PASS Items

### 1. Actor Guard (CI Loop Prevention)
**Status**: ✅ PASS (with minor enhancement recommended)

**Finding**: The repo already uses the `github-actions[bot]` actor guard pattern in `update-schema-on-merge.yml` (line 21-24):
```yaml
if: "github.actor == 'github-actions[bot]'"
run: |
  echo "Run triggered by github-actions[bot]; exiting to avoid loop."
  exit 0
```

**Evidence**: `apply-migrations.yml` already uses `[skip ci]` in commit message (line 216), which prevents the workflow from re-triggering.

**Recommendation**: Add explicit actor guard as defense-in-depth (follows repo pattern).

---

### 2. Skip CI Pattern
**Status**: ✅ PASS

**Finding**: Line 216 of `apply-migrations.yml` includes `[skip ci]` in commit message:
```yaml
git commit -m "chore: regenerate types after migration deployment [skip ci]"
```

**Evidence**: This prevents infinite loops even if actor guard fails.

---

### 3. Least-Privilege Permissions
**Status**: ⚠️ NEEDS CHANGE

**Finding**: `apply-migrations.yml` line 32-33:
```yaml
permissions:
  contents: read
```

**Problem**: Auto-commit step (lines 209-218) requires `contents: write` but only has `read`.

**Impact**: The workflow will fail at commit step with permission denied error.

**Fix Required**: Change to `contents: write` (matches repo pattern in `update-schema-on-merge.yml`).

---

### 4. Node Version Pin + Lockfile
**Status**: ⚠️ NOT APPLICABLE (but could be enhanced)

**Finding**: Workflow doesn't use Node.js currently.

**Recommendation**: If adding Node.js for npm scripts, use:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
- run: npm ci  # Not npm install
```

---

### 5. Stage/Prod Separation
**Status**: ❌ NEEDS CHANGE

**Finding**: No GitHub Environments configured. Uses same secret names for all deployments.

**Problem**:
- Cannot have separate staging/production projects
- No manual approval gates for production
- Risk of deploying to wrong environment

**Current Secrets** (from workflow):
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID` or `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_URL`

**Fix Required**: Add GitHub Environments with protection rules.

---

### 6. Concurrency Controls
**Status**: ❌ NEEDS CHANGE

**Finding**: No `concurrency:` key in workflow.

**Problem**: Two migration runs can race if:
1. Manual workflow dispatch while auto-run is in progress
2. Multiple commits pushed rapidly to main

**Risk**: Database corruption or partial migration application.

**Fix Required**: Add concurrency group to serialize migration runs.

---

### 7. Paths Filter
**Status**: ✅ PASS

**Finding**: Line 6-7 filters to only migrations:
```yaml
paths:
  - 'supabase/migrations/**'
```

**Evidence**: Won't trigger on unrelated changes (prevents unnecessary runs).

---

## ⚠️ Verification Script Issues

### scripts/verify-migration-sync.ps1

**Status**: ⚠️ NEEDS CHANGES

#### Issue 1: Local Supabase Start (Lines 86-90)
**Problem**: Script automatically starts local Supabase, which:
- Takes 30-60 seconds
- Requires Docker
- May fail in CI without Docker socket

**Current Code**:
```powershell
if ($supabaseStatus -match "not running") {
    Write-Host "  ⚠️  Local Supabase is not running" -ForegroundColor Yellow
    Write-Host "  Starting local Supabase..." -ForegroundColor Gray
    supabase start | Out-Null
}
```

**Fix**: Add parameter to control auto-start behavior; fail fast in CI.

#### Issue 2: Exit Code Always 0 (Line 159)
**Problem**: Script exits with success even when critical errors occur:
- Types out of sync (line 102-107): ❌ but exits 0
- Schema drift detected (line 128-139): ⚠️ but exits 0

**Current Code**:
```powershell
# Exit with success if no critical errors
exit 0
```

**Fix**: Exit 1 when types are out of sync or when critical remote check fails.

#### Issue 3: Missing CI Mode
**Problem**: No way to run in strict CI mode where:
- All checks must pass
- Remote linking is required
- No graceful degradation

**Fix**: Add `-CI` parameter that enforces strict checks.

---

## 📋 Recommended Changes

### Priority 1: Critical Fixes

#### 1.1 Fix Workflow Permissions
**File**: `.github/workflows/apply-migrations.yml`
**Line**: 32-33

**Change**:
```yaml
permissions:
  contents: write  # Required for auto-commit of regenerated types
```

#### 1.2 Add Concurrency Control
**File**: `.github/workflows/apply-migrations.yml`
**After**: Line 31 (after `permissions:`)

**Add**:
```yaml
concurrency:
  group: supabase-migrations-${{ github.ref }}
  cancel-in-progress: false  # Don't cancel; wait for completion
```

#### 1.3 Add Actor Guard (Defense-in-Depth)
**File**: `.github/workflows/apply-migrations.yml`
**After**: Line 39 (after `- name: Checkout`)

**Add**:
```yaml
- name: Exit if triggered by bot
  if: "github.actor == 'github-actions[bot]'"
  run: |
    echo "Run triggered by github-actions[bot]; exiting to avoid loop."
    exit 0
```

---

### Priority 2: Environment Safety

#### 2.1 Add GitHub Environments
**Location**: GitHub Repository Settings → Environments

**Create Two Environments**:

**Environment: `staging`**
- No protection rules (auto-deploy)
- Secrets:
  - `SUPABASE_ACCESS_TOKEN_STAGING`
  - `SUPABASE_PROJECT_REF_STAGING`
  - `SUPABASE_DB_URL_STAGING`

**Environment: `production`**
- Protection rules:
  - Required reviewers: 1+
  - Deployment branches: `main` only
- Secrets:
  - `SUPABASE_ACCESS_TOKEN_PRODUCTION`
  - `SUPABASE_PROJECT_REF_PRODUCTION`
  - `SUPABASE_DB_URL_PRODUCTION`

#### 2.2 Update Workflow to Use Environments
**File**: `.github/workflows/apply-migrations.yml`

**Add Input**:
```yaml
workflow_dispatch:
  inputs:
    environment:
      description: 'Target environment'
      required: true
      default: 'staging'
      type: choice
      options:
        - staging
        - production
```

**Add Environment to Job**:
```yaml
jobs:
  apply-migrations:
    runs-on: ubuntu-latest
    environment: ${{ github.event_name == 'workflow_dispatch' && inputs.environment || 'staging' }}
```

**Update Secret References**:
```yaml
SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
```

---

### Priority 3: Verification Script Hardening

#### 3.1 Add CI Mode
**File**: `scripts/verify-migration-sync.ps1`

**Add Parameter**:
```powershell
param(
    [switch]$Verbose,
    [switch]$CI,
    [switch]$NoAutoStart
)
```

**Update Auto-Start Logic** (around line 86):
```powershell
if ($supabaseStatus -match "not running" -or $supabaseStatus -match "No local") {
    if ($CI -or $NoAutoStart) {
        Write-Host "  ❌ Local Supabase is not running (CI mode: no auto-start)" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ⚠️  Local Supabase is not running" -ForegroundColor Yellow
    Write-Host "  Starting local Supabase..." -ForegroundColor Gray
    supabase start | Out-Null
}
```

#### 3.2 Fix Exit Code Logic
**File**: `scripts/verify-migration-sync.ps1`

**Replace Line 159** with:
```powershell
# Determine exit code based on CI mode
if ($CI) {
    # In CI mode, fail if types are out of sync or critical checks failed
    if ($typesDiff) {
        Write-Host "`n❌ CI Mode: Types out of sync" -ForegroundColor Red
        exit 1
    }
    exit 0
} else {
    # In local mode, always exit 0 (informational only)
    exit 0
}
```

#### 3.3 Add Early Remote Check Failure
**File**: `scripts/verify-migration-sync.ps1`

**After Line 75** (in remote check):
```powershell
if ($CI -and -not $isLinked) {
    Write-Host "  ❌ CI Mode: Project must be linked" -ForegroundColor Red
    exit 1
}
```

---

## 🧪 Verification Commands

### Test Actor Guard (Requires Push Access)
```powershell
# This should exit early without running migrations
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git commit --allow-empty -m "test: actor guard"
git push
# Check Actions log: should see "Run triggered by github-actions[bot]; exiting"
```

### Test Concurrency Control
```powershell
# Trigger two workflow runs manually in quick succession
# Go to: Actions → "Apply Supabase migrations" → Run workflow
# Click "Run workflow" twice quickly
# Second run should wait for first to complete (not cancel)
```

### Test Verification Script (Local Mode)
```powershell
# Should exit 0 even with issues (informational)
npm run db:verify-sync
echo $LASTEXITCODE  # Should be 0

# Verbose output
npm run db:verify-sync -- -Verbose
```

### Test Verification Script (CI Mode)
```powershell
# Should exit 1 if types out of sync
npm run db:verify-sync -- -CI

# Should exit 1 if not linked (simulated)
supabase unlink
npm run db:verify-sync -- -CI
echo $LASTEXITCODE  # Should be 1
```

### Test Environment Separation (After Environment Setup)
```powershell
# Manual dispatch to staging (should work immediately)
# Actions → "Apply Supabase migrations" → Run workflow
# Select: environment = staging

# Manual dispatch to production (should require approval)
# Actions → "Apply Supabase migrations" → Run workflow
# Select: environment = production
# Should show "Waiting for approval" in Actions UI
```

---

## 📊 Risk Assessment

| Risk | Likelihood | Impact | Mitigation Status |
|------|-----------|--------|-------------------|
| Infinite CI loop | Low | High | ✅ MITIGATED (`[skip ci]` + actor guard) |
| Permission denied on commit | High | Medium | ⚠️ NEEDS FIX (permissions) |
| Race condition | Medium | High | ❌ NOT MITIGATED (no concurrency) |
| Wrong environment deploy | Medium | Critical | ❌ NOT MITIGATED (no environments) |
| Type drift after deploy | Low | Medium | ✅ MITIGATED (auto-regen) |
| Failed migration leaves partial state | Low | High | ✅ MITIGATED (Supabase transactional) |

---

## ✅ Checklist

### Critical (Must Fix Before Merge)
- [ ] Fix workflow permissions (`contents: write`)
- [ ] Add concurrency control
- [ ] Add actor guard (defense-in-depth)
- [ ] Fix verification script exit codes
- [ ] Add CI mode to verification script

### Important (Recommended)
- [ ] Set up GitHub Environments (staging/production)
- [ ] Update workflow to use environments
- [ ] Add NoAutoStart parameter to script
- [ ] Document environment setup in deployment guide

### Optional (Nice to Have)
- [ ] Add workflow status badge to README
- [ ] Add Slack/email notification on failure
- [ ] Add metric tracking for migration duration

---

## 📝 Expected Outputs After Fix

### Workflow Run (Success)
```
✓ Required secrets are configured
✓ Project linked
Local + remote migration status: [shows list]
Applying migrations to Supabase project...
✓ Migrations applied successfully
🔧 Regenerating TypeScript types from remote schema...
✓ Types generated from remote schema
✓ Types are already in sync with remote schema
📊 Querying remote migration history...
Last 5 applied migrations: [shows table]
✅ Migration deployment complete
```

### Workflow Run (Types Out of Sync - Auto-Fixed)
```
...
⚠️  Types changed after migration deployment
This suggests types were not regenerated before merge
Committing regenerated types...
✓ Types committed and pushed
...
```

### Verification Script (Local - All Good)
```powershell
PS> npm run db:verify-sync

=== Migration Sync Verification ===
[1/6] Counting local migrations...
  ✓ Found 20 local migrations
[2/6] Identifying latest local migration...
  ✓ Latest local migration: 20260104163022_v05_i05_9_add_idempotency_constraints
[3/6] Checking Supabase CLI...
  ✓ Supabase CLI is installed: 2.63.1
[4/6] Checking remote migration status...
  ✓ Project is linked
  ✓ Latest migration is applied remotely
[5/6] Verifying TypeScript types...
  ✓ Types are in sync with migrations
[6/6] Checking for schema drift...
  ✓ No schema drift detected

=== Verification Complete ===
```

### Verification Script (CI Mode - Types Out of Sync)
```powershell
PS> npm run db:verify-sync -- -CI

=== Migration Sync Verification ===
...
[5/6] Verifying TypeScript types...
  ❌ Types are out of sync with database!

  Suggested fix:
    npm run db:typegen
    git add lib/types/supabase.ts
    git commit -m 'chore: regenerate types after migrations'

❌ CI Mode: Types out of sync

PS> echo $LASTEXITCODE
1
```

---

## 🔒 Security Considerations

### Secrets Not Logged
✅ Workflow validates token format (line 56-64) but doesn't log the actual token value.

### Fail-Closed on Missing Secrets
✅ Workflow exits early if required secrets are missing (lines 48-77).

### Limited Blast Radius
⚠️ Without environments, a compromised token can affect all deployments.
✅ After environment setup, production requires approval (manual safety gate).

### Audit Trail
✅ Auto-commit creates clear audit trail of type regeneration.
✅ Migration history query (lines 220-239) provides verification.

---

## 📚 References

- Repo Pattern: `.github/workflows/update-schema-on-merge.yml` (actor guard, auto-commit)
- GitHub Docs: [Using environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- GitHub Docs: [Using concurrency](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#concurrency)
- Supabase Docs: [CLI - db push](https://supabase.com/docs/reference/cli/supabase-db-push)

---

**Audit Completed By**: GitHub Copilot  
**Audit Date**: 2026-01-04  
**Status**: ⚠️ NEEDS CHANGES (4 critical, 3 recommended)
