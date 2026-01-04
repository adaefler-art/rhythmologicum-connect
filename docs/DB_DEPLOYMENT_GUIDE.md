# Database Deployment and Migration Verification Guide

## Problem Statement

Remote Supabase database stopped receiving new migrations after `20260102153000`, while the repository contains newer migrations. This document provides the solution to sync remote DB with repository state and prevent future drift.

## Root Cause Analysis

1. **Migration History Mismatch**: Remote `supabase_migrations.schema_migrations` table may be out of sync
2. **Workflow Gaps**: Existing workflow applies migrations but doesn't verify type regeneration
3. **Manual Intervention Needed**: Remote DB needs baseline repair to catch up with repository

## Solution Overview

### 1. Immediate Fix: Apply Pending Migrations

**Manual Approach (PowerShell)**:

```powershell
# Step 1: Link to the correct Supabase project
$env:SUPABASE_ACCESS_TOKEN = "your-personal-access-token"  # sbp_...
supabase link --project-ref "your-project-ref"

# Step 2: Check migration status
supabase migration list

# Expected output shows which migrations are:
# - Applied remotely (✓)
# - Pending locally (no checkmark)

# Step 3: Apply pending migrations
supabase db push

# If migrations are out of order (inserted before last remote migration):
supabase db push --include-all

# Step 4: Verify all migrations applied
supabase migration list
```

**Automated Approach (GitHub Actions)**:

The repository has a workflow at `.github/workflows/apply-migrations.yml` that automatically applies migrations when they are merged to `main`. To manually trigger:

1. Go to GitHub Actions → "Apply Supabase migrations"
2. Click "Run workflow"
3. Select `main` branch
4. Leave default options (unless you need `--include-all`)
5. Click "Run workflow"

### 2. Verify Migration Sync

**Check remote migration history**:

```powershell
# Using psql (requires SUPABASE_DB_URL)
$env:SUPABASE_DB_URL = "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

psql $env:SUPABASE_DB_URL -c "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"

# Expected: Latest version should be 20260104163022 (or newer)
```

**Check for missing migrations**:

```powershell
# List all local migrations
Get-ChildItem supabase/migrations/*.sql | Sort-Object Name | Select-Object -Last 10

# Compare with remote list
supabase migration list
```

### 3. Regenerate Types

After migrations are applied, types must be regenerated:

```powershell
# Step 1: Ensure local DB is in sync
supabase db reset

# Step 2: Generate types
npm run db:typegen

# Step 3: Check if types changed
git diff lib/types/supabase.ts

# Step 4: If changes exist, commit them
git add lib/types/supabase.ts
git commit -m "chore: regenerate types after migrations"
git push
```

### 4. Baseline Repair (If Needed)

If remote DB is missing baseline migrations that were applied before the workflow existed:

**Using GitHub Actions Workflow**:

1. Go to GitHub Actions → "Apply Supabase migrations"
2. Click "Run workflow"
3. Select `main` branch
4. Set `baseline_repair` to `true`
5. Click "Run workflow"

This will mark the following migrations as applied without executing them:
- `01_create_funnel_tables`
- `02_add_funnel_id_to_assessments`
- `03_create_content_pages`
- `20241203110000_init_patient_profiles_and_assessments`

**Using PowerShell + psql**:

```powershell
$env:SUPABASE_DB_URL = "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

psql $env:SUPABASE_DB_URL -c @"
INSERT INTO supabase_migrations.schema_migrations(version, name)
VALUES
  ('01', '01_create_funnel_tables'),
  ('02', '02_add_funnel_id_to_assessments'),
  ('03', '03_create_content_pages'),
  ('20241203110000', '20241203110000_init_patient_profiles_and_assessments')
ON CONFLICT (version) DO NOTHING;
"@
```

### 5. Mark Specific Migrations as Applied (Advanced)

If you need to mark specific migrations as applied without executing them:

**Using GitHub Actions**:

1. Go to GitHub Actions → "Apply Supabase migrations"
2. Click "Run workflow"
3. Select `main` branch
4. Set `repair_versions` to comma-separated list (e.g., `20260102153000,20260103075000`)
5. Click "Run workflow"

**Using PowerShell**:

```powershell
$env:SUPABASE_DB_URL = "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
$version = "20260102153000"

psql $env:SUPABASE_DB_URL -c "INSERT INTO supabase_migrations.schema_migrations(version, name) VALUES ('$version', '$version') ON CONFLICT (version) DO NOTHING;"
```

## Workflow Architecture

### Current Workflow Safety Features

1. **`apply-migrations.yml`** - Production-grade migration deployment
   - **Triggers**:
     - Push to `main` (when `supabase/migrations/**` changes)
     - Manual workflow dispatch
   - **Safety Controls**:
     - ✅ Actor guard: Skips execution if triggered by `github-actions[bot]` (prevents CI loops)
     - ✅ Concurrency control: Only one migration run at a time (prevents race conditions)
     - ✅ `[skip ci]` in auto-commits: Prevents infinite loop on type regeneration
     - ✅ Permission validation: Least-privilege `contents: write` for auto-commits
     - ✅ Secret format validation: Rejects invalid token formats
   - **Actions**:
     - Links to Supabase project
     - Shows migration status (local vs remote)
     - Applies pending migrations
     - Auto-regenerates TypeScript types from remote schema
     - Auto-commits types if changed (prevents type drift)
     - Queries remote migration history for verification

2. **`db-determinism.yml`** - Enforces migration discipline in PRs
   - Triggered on: Pull requests (when DB files change)
   - Actions:
     - Checks migration immutability
     - Applies migrations locally
     - Detects schema drift
     - Verifies types are in sync

3. **`update-schema-on-merge.yml`** - Updates canonical schema after merge
   - Triggered on: Push to `main`
   - Actor guard: Skips if triggered by bot
   - Actions:
     - Dumps remote schema
     - Updates `schema/schema.sql`
     - Commits changes

### Safety Guarantees

| Risk | Mitigation | Implementation |
|------|-----------|----------------|
| CI Loop (auto-commit triggers workflow) | `[skip ci]` + actor guard | Workflow line 216, 42-47 |
| Race condition (parallel runs) | Concurrency group | Workflow line 35-37 |
| Permission escalation | Least-privilege permissions | Workflow line 32-33 |
| Wrong environment deployment | Environment-based secrets | See "Environment Setup" below |
| Type drift after deployment | Auto-regenerate types | Workflow line 189-218 |
| Partial migration state | Supabase transactional | Built-in Supabase feature |

### Workflow Enhancement (Completed)

Add a post-migration type regeneration step to `apply-migrations.yml`:

```yaml
- name: Regenerate types and verify
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  run: |
    echo "Regenerating TypeScript types from remote schema..."
    supabase gen types typescript --linked > lib/types/supabase.ts
    
    if ! git diff --exit-code lib/types/supabase.ts; then
      echo "⚠️ Types changed after migration application"
      echo "This suggests types were not regenerated before merge"
      echo ""
      echo "Types will be committed automatically..."
      git config user.name "github-actions[bot]"
      git config user.email "github-actions[bot]@users.noreply.github.com"
      git add lib/types/supabase.ts
      git commit -m "chore: regenerate types after migration deployment"
      git push
    else
      echo "✅ Types are already in sync"
    fi
```

## Verification Commands

### PowerShell Verification Script

```powershell
# verify-migration-sync.ps1

Write-Host "=== Migration Sync Verification ===" -ForegroundColor Cyan

# Step 1: Count local migrations
$localMigrations = Get-ChildItem supabase/migrations/*.sql | Measure-Object
Write-Host "Local migrations: $($localMigrations.Count)" -ForegroundColor Yellow

# Step 2: Get latest local migration
$latestLocal = Get-ChildItem supabase/migrations/*.sql | Sort-Object Name | Select-Object -Last 1
Write-Host "Latest local: $($latestLocal.BaseName)" -ForegroundColor Yellow

# Step 3: Check remote status
Write-Host "`nChecking remote status..." -ForegroundColor Cyan
supabase migration list

# Step 4: Verify types are in sync
Write-Host "`nVerifying types..." -ForegroundColor Cyan
supabase db reset
npm run db:typegen
$typesDiff = git diff lib/types/supabase.ts
if ($typesDiff) {
    Write-Host "❌ Types are out of sync!" -ForegroundColor Red
    Write-Host "Run: npm run db:typegen && git add lib/types/supabase.ts && git commit -m 'chore: regen types'" -ForegroundColor Yellow
} else {
    Write-Host "✅ Types are in sync" -ForegroundColor Green
}

# Step 5: Check schema drift
Write-Host "`nChecking schema drift..." -ForegroundColor Cyan
$drift = supabase db diff --local 2>&1
if ($drift -match "No schema changes") {
    Write-Host "✅ No schema drift" -ForegroundColor Green
} else {
    Write-Host "⚠️ Schema drift detected:" -ForegroundColor Yellow
    Write-Host $drift
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
```

### Usage

**Local Development (Informational)**:
```powershell
# Basic check (always exits 0, informational only)
npm run db:verify-sync

# Detailed output with migration list
npm run db:verify-sync -- -Verbose

# Don't auto-start local Supabase
npm run db:verify-sync -- -NoAutoStart
```

**CI/Automated Checks (Strict)**:
```powershell
# Strict mode - fails if types out of sync or project not linked
npm run db:verify-sync -- -CI

# CI mode with verbose output
npm run db:verify-sync -- -CI -Verbose

# Example in CI workflow:
# - run: npm run db:verify-sync -- -CI
#   This will exit 1 if types are out of sync
```

**Expected Output (Success)**:
```
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

## Required Secrets

### Current Setup (Single Environment)

Ensure these GitHub Secrets are configured:

1. **`SUPABASE_ACCESS_TOKEN`** - Personal Access Token from Supabase Dashboard
   - Format: `sbp_...`
   - Location: Supabase Dashboard → Account → Access Tokens
   - Permissions: Full access to project

2. **`SUPABASE_PROJECT_ID`** or **`SUPABASE_PROJECT_REF`** - Project reference
   - Format: 20-character alphanumeric string
   - Location: Supabase Dashboard → Project Settings → General → Reference ID

3. **`SUPABASE_DB_URL`** - Direct database connection string (for repair operations)
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - Location: Supabase Dashboard → Project Settings → Database → Connection string (Transaction pooling mode)

### Recommended Setup (Multi-Environment)

For production safety, use GitHub Environments to separate staging and production:

#### Step 1: Create Environments

1. Go to: Repository Settings → Environments
2. Create two environments:
   - **`staging`** (no protection rules - auto-deploy)
   - **`production`** (protection rules - manual approval required)

#### Step 2: Configure Environment Secrets

**Staging Environment** secrets:
- `SUPABASE_ACCESS_TOKEN` → Your staging project token
- `SUPABASE_PROJECT_REF` → Staging project ref
- `SUPABASE_DB_URL` → Staging DB connection string

**Production Environment** secrets:
- `SUPABASE_ACCESS_TOKEN` → Your production project token
- `SUPABASE_PROJECT_REF` → Production project ref
- `SUPABASE_DB_URL` → Production DB connection string

#### Step 3: Update Workflow (Optional)

To use environments, update `.github/workflows/apply-migrations.yml`:

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

jobs:
  apply-migrations:
    runs-on: ubuntu-latest
    environment: ${{ github.event_name == 'workflow_dispatch' && inputs.environment || 'staging' }}
```

This ensures production deployments require manual approval.

## Troubleshooting

### Problem: Migrations show as pending but won't apply

**Cause**: Migration version is older than the last applied migration on remote.

**Solution**:
```powershell
supabase db push --include-all
```

### Problem: Type generation fails

**Cause**: Local database not in sync.

**Solution**:
```powershell
supabase db reset
npm run db:typegen
```

### Problem: Workflow fails with "SUPABASE_ACCESS_TOKEN has an invalid format"

**Cause**: Using anon key instead of personal access token.

**Solution**: Create a Personal Access Token in Supabase Dashboard (not the anon key from project settings).

### Problem: Remote schema differs from migrations

**Cause**: Manual changes were made to remote DB.

**Solution**:
1. Dump the difference: `supabase db diff --linked`
2. Create a new migration to capture the changes
3. Apply the migration

## Best Practices

1. **Always regenerate types after creating migrations**:
   ```powershell
   supabase db reset && npm run db:typegen
   ```

2. **Verify locally before pushing**:
   ```powershell
   npm test && npm run build
   ```

3. **Check migration status regularly**:
   ```powershell
   supabase migration list
   ```

4. **Never manually edit remote DB** - All changes through migrations

5. **Keep migrations idempotent** - Use `IF NOT EXISTS`, `ON CONFLICT`, etc.

6. **Test migrations locally first** - Always run `supabase db reset` before committing

## References

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Migration Best Practices](https://supabase.com/docs/guides/database/migrations)
- Repository: `.github/workflows/apply-migrations.yml`
- Repository: `docs/canon/DB_MIGRATIONS.md`
