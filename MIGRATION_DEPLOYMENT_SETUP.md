# Migration Deployment Setup - Quick Start Guide

## Problem Fixed

✅ **Funnel slug mismatch**: Original migration created funnel with slug `stress`, but application and seed scripts expected `stress-assessment`  
✅ **Missing deployment workflow**: No automated way to apply migrations to production Supabase  
✅ **Missing content pages**: 10 seed pages weren't deployed because migrations weren't applied

## What Was Added

### 1. Corrective Migration
**File:** `supabase/migrations/20251211065000_fix_stress_funnel_slug.sql`

This migration updates the funnel slug from `stress` to `stress-assessment`. It runs:
- AFTER `20251207150000_populate_stress_questions.sql` (which creates the `stress` funnel)
- BEFORE `20251211070000_seed_stress_funnel_base_pages.sql` (which expects `stress-assessment`)

### 2. Automated Deployment Workflow
**File:** `.github/workflows/apply-migrations.yml`

This GitHub Actions workflow:
- Automatically applies migrations when changes are pushed to `main`
- Can be manually triggered from GitHub Actions UI
- Uses Supabase CLI to push migrations
- Validates required secrets before running

### 3. Verification Tools

**Pre-deployment check:**
```bash
./scripts/check-migration-status.sh
```
Verifies all files are present and in correct order.

**Post-deployment verification:**
- `scripts/verify-migrations.sql` - Comprehensive SQL verification
- Run in Supabase Dashboard → SQL Editor after deployment

### 4. Documentation

- `docs/DEPLOYMENT_MIGRATIONS.md` - Complete deployment guide
- `README.md` - New "Database & Migrations" section
- This file - Quick start guide

---

## Setup Instructions (Repository Owner)

### Step 1: Configure GitHub Secrets

You need to add two secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

#### SUPABASE_ACCESS_TOKEN
- **Where to find it:** Supabase Dashboard → Settings → API → Service Role Key
- **Description:** Service role token with full database access
- ⚠️ **Important:** This is a sensitive secret - keep it secure!

#### SUPABASE_PROJECT_ID
- **Where to find it:** Supabase Dashboard → Project Settings → General → Reference ID
- **Description:** Your Supabase project reference ID (looks like `abcdefghijklmnop`)

### Step 2: Verify Files Are Ready

Run the pre-deployment check:

```bash
./scripts/check-migration-status.sh
```

You should see:
```
✓ All critical files present
```

### Step 3: Deploy Migrations

#### Option A: Automatic (Recommended)
When this PR is merged to `main`, the workflow will automatically run and apply migrations.

#### Option B: Manual Trigger
1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Apply Supabase migrations** workflow
4. Click **Run workflow** button
5. Select `main` branch
6. Click **Run workflow**

### Step 4: Verify Deployment

After the workflow completes successfully:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `scripts/verify-migrations.sql`
3. Run the query
4. Check that all tests show `✓ PASS`

Expected results:
- ✅ Funnel slug is `stress-assessment` (not `stress`)
- ✅ 10 content pages exist
- ✅ All pages have status `published`

You can also run quick checks:

```sql
-- Check funnel
SELECT slug, title FROM public.funnels WHERE slug = 'stress-assessment';

-- Check pages (should return 10)
SELECT COUNT(*) FROM public.content_pages 
WHERE funnel_id = (SELECT id FROM funnels WHERE slug = 'stress-assessment');
```

---

## Troubleshooting

### Workflow fails with "Secret not set"

**Problem:** The workflow can't find `SUPABASE_ACCESS_TOKEN` or `SUPABASE_PROJECT_ID`.

**Solution:** 
1. Verify secrets are set in GitHub: Settings → Secrets and variables → Actions
2. Secrets must be named exactly as shown (case-sensitive)
3. Re-run the workflow after adding secrets

### Migration fails with "funnel not found"

**Problem:** The corrective migration can't find the `stress` funnel.

**Solution:**
1. Check if the populate_stress_questions migration ran first
2. Verify migration order: Run `ls -1 supabase/migrations/ | grep 2025121`
3. Should show: 065000 (fix) before 070000 (seed)

### No content pages after deployment

**Problem:** Query shows 0 pages for stress-assessment funnel.

**Solution:**
1. Check if funnel exists: `SELECT * FROM funnels WHERE slug = 'stress-assessment'`
2. If funnel exists but no pages, the seed migration may have failed
3. Check workflow logs in GitHub Actions for error messages
4. You can manually run the seed migration in Supabase SQL Editor

### Old "stress" slug still exists

**Problem:** Both `stress` and `stress-assessment` funnels exist.

**Solution:**
The corrective migration only updates, doesn't check for duplicates. Manually remove:
```sql
DELETE FROM public.funnels WHERE slug = 'stress';
```

---

## Future Migrations

After this is set up, all future migrations will be automatically deployed when merged to `main`.

**To add a new migration:**

1. Create file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write idempotent SQL (safe to run multiple times)
3. Test locally: `supabase db push`
4. Commit and push to `main`
5. Workflow automatically applies it ✨

See [docs/MIGRATIONS_GUIDE.md](docs/MIGRATIONS_GUIDE.md) for detailed migration writing guidelines.

---

## Summary

✅ **Funnel slug fixed**: `stress` → `stress-assessment`  
✅ **Automated deployment**: GitHub Actions workflow added  
✅ **10 content pages**: Will be seeded after migrations apply  
✅ **Verification tools**: Pre and post-deployment checks included  
✅ **Documentation**: Comprehensive guides added

**Action Required:** Set the two GitHub secrets and run the workflow! 🚀

---

## Questions?

- **Deployment Guide:** [docs/DEPLOYMENT_MIGRATIONS.md](docs/DEPLOYMENT_MIGRATIONS.md)
- **Migration Guide:** [docs/MIGRATIONS_GUIDE.md](docs/MIGRATIONS_GUIDE.md)
- **Seed Pages Info:** [docs/F11_SEED_PAGES.md](docs/F11_SEED_PAGES.md)
- **Database Section:** [README.md#database--migrations](README.md#database--migrations)
