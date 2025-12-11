# Supabase Migration Deployment Guide

## Overview

This guide explains how migrations are automatically applied to production Supabase when changes are merged to the `main` branch.

## Automated Deployment

### Workflow: `apply-migrations.yml`

The workflow automatically applies pending migrations to Supabase when:
- Changes are pushed to the `main` branch that affect `supabase/migrations/**`
- The workflow is manually triggered via GitHub Actions UI

### Required Secrets

The following secrets must be configured in GitHub repository settings:

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `SUPABASE_ACCESS_TOKEN` | Service role token with migration rights | Supabase Dashboard → Settings → API → Service Role Key |
| `SUPABASE_PROJECT_ID` | Supabase project reference ID | Supabase Dashboard → Project Settings → General → Reference ID |

### Setting Up Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add both secrets listed above

## Manual Migration Deployment

### Via GitHub Actions UI

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Select **Apply Supabase migrations** workflow
4. Click **Run workflow**
5. Select the `main` branch
6. Click **Run workflow**

### Via Supabase CLI (Local)

If you have the Supabase CLI installed and configured:

```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply all pending migrations
supabase db push
```

### Via psql Script

Using the included `apply-migrations.sh` script:

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Run the script
./scripts/apply-migrations.sh
```

## Migration Order and Dependencies

### Current Migration Sequence

1. **20251207150000_populate_stress_questions.sql** - Creates funnel with slug `stress`
2. **20251211065000_fix_stress_funnel_slug.sql** - Updates slug to `stress-assessment`
3. **20251211070000_seed_stress_funnel_base_pages.sql** - Seeds 10 content pages (depends on slug being `stress-assessment`)

### Why the Corrective Migration?

The original migration created a funnel with slug `stress`, but downstream migrations and application code expect `stress-assessment`. The corrective migration fixes this discrepancy.

## Verification

### Quick Status Check

Before deployment, verify all files are in place:

```bash
./scripts/check-migration-status.sh
```

This script checks:
- ✓ All critical migration files are present
- ✓ Migration order is correct
- ✓ GitHub workflow file exists
- ✓ Documentation is complete

### Check if Migrations Were Applied

After deployment, run the comprehensive verification script in Supabase Dashboard → SQL Editor:

```bash
# Copy and paste the contents of this file into SQL Editor
cat scripts/verify-migrations.sql
```

Or run this quick SQL query:

```sql
-- Check funnel slug
SELECT slug, title, is_active 
FROM public.funnels 
WHERE slug = 'stress-assessment';

-- Check content pages count
SELECT COUNT(*) as page_count
FROM public.content_pages
WHERE funnel_id = (
  SELECT id FROM public.funnels WHERE slug = 'stress-assessment'
);

-- Expected result: page_count = 10
```

### Verify All Pages

```sql
SELECT slug, title, status, layout
FROM public.content_pages
WHERE funnel_id = (
  SELECT id FROM public.funnels WHERE slug = 'stress-assessment'
)
ORDER BY slug;
```

Expected pages:
1. `burnout-praevention`
2. `info-wissenschaftliche-grundlage`
3. `intro-vorbereitung`
4. `resilienz-aufbauen`
5. `result-naechste-schritte`
6. `schlaf-und-resilienz`
7. `stressbewaeltigung-techniken`
8. `ueber-das-assessment`
9. `was-ist-stress`
10. `work-life-balance`

## Troubleshooting

### Workflow Fails with "Secret not set"

**Problem**: The workflow fails with an error about missing secrets.

**Solution**: Add the required secrets (`SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`) in GitHub repository settings.

### Migration Order Issues

**Problem**: A migration fails because it depends on a previous migration that hasn't run.

**Solution**: Migrations are applied in lexicographic order by filename. The corrective migration (20251211065000) is timestamped to run after populate_stress_questions (20251207150000) but before seed_stress_funnel_base_pages (20251211070000).

Current timestamps ensure correct order:
- 20251207150000 (populate - creates funnel with slug 'stress')
- 20251211065000 (fix slug - updates to 'stress-assessment')
- 20251211070000 (seed pages - expects 'stress-assessment')

### No Pages Found

**Problem**: Query shows 0 pages for the stress-assessment funnel.

**Solution**: 
1. Verify the funnel slug was updated: `SELECT * FROM funnels WHERE slug = 'stress-assessment'`
2. If funnel exists but no pages, manually run the seed migration
3. Check for errors in migration logs

## Best Practices

1. **Always test migrations locally** before merging to main
2. **Keep migrations idempotent** - they should be safe to run multiple times
3. **Never modify existing migrations** - create new corrective migrations instead
4. **Document breaking changes** in migration comments
5. **Verify in production** after deployment

## Related Documentation

- [Migrations Guide](./MIGRATIONS_GUIDE.md)
- [F11 Seed Pages](./F11_SEED_PAGES.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
