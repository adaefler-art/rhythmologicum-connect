# Quick Reference: DB Migration Deployment

## TL;DR - Fix Stuck Migrations Now

```powershell
# Option 1: Manual via CLI (fastest)
supabase link --project-ref <your-project-ref>
supabase db push

# Option 2: Via GitHub Actions (recommended for production)
# Go to: Actions → "Apply Supabase migrations" → Run workflow (main branch)

# Option 3: If migrations are out of order
supabase db push --include-all
```

## Daily Workflow

### Creating a New Migration

```powershell
# 1. Create migration file with timestamp
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
New-Item "supabase/migrations/${timestamp}_your_migration_name.sql"

# 2. Write your migration (with IF NOT EXISTS guards)

# 3. Test locally
supabase db reset
npm run db:typegen

# 4. Verify no drift
supabase db diff --local

# 5. Commit changes
git add supabase/migrations/ lib/types/supabase.ts
git commit -m "feat: add migration for XYZ"
git push

# 6. After merge to main, GitHub Actions will deploy automatically
```

### Verifying Migration Status

```powershell
# Quick check
npm run db:verify-sync

# Detailed check
npm run db:verify-sync -- -Verbose

# Manual check
supabase migration list
```

## Troubleshooting

### "Migrations not applying to remote"

```powershell
# Check if linked
supabase migration list

# If not linked
$env:SUPABASE_ACCESS_TOKEN = "sbp_your_token"
supabase link --project-ref "your-project-ref"

# Apply migrations
supabase db push
```

### "Types out of sync"

```powershell
supabase db reset
npm run db:typegen
git add lib/types/supabase.ts
git commit -m "chore: regenerate types"
```

### "Schema drift detected"

```powershell
# Generate migration from drift
supabase db diff --file fix_drift.sql

# Review and add timestamp
mv fix_drift.sql supabase/migrations/$(Get-Date -Format "yyyyMMddHHmmss")_fix_drift.sql

# Apply
supabase db reset
npm run db:typegen
```

### "Migration version conflict"

```powershell
# Migrations inserted before last remote migration
supabase db push --include-all
```

## GitHub Actions

### Workflows

1. **apply-migrations.yml** - Auto-deploys on merge to main
2. **db-determinism.yml** - Checks PRs for drift/type sync
3. **update-schema-on-merge.yml** - Updates canonical schema

### Required Secrets

- `SUPABASE_ACCESS_TOKEN` - Personal access token (sbp_...)
- `SUPABASE_PROJECT_ID` - Project reference (20-char alphanumeric)
- `SUPABASE_DB_URL` - Connection string (for repair operations)

### Manual Workflow Triggers

**Apply pending migrations:**
```
GitHub → Actions → "Apply Supabase migrations" → Run workflow
```

**Repair baseline:**
```
GitHub → Actions → "Apply Supabase migrations" → Run workflow
  ✓ Set baseline_repair: true
```

**Mark specific versions as applied:**
```
GitHub → Actions → "Apply Supabase migrations" → Run workflow
  ✓ Set repair_versions: "20260102153000,20260103075000"
```

## Commands Reference

### Supabase CLI

```powershell
# Project management
supabase link --project-ref <ref>
supabase unlink
supabase status

# Migrations
supabase migration list
supabase migration new <name>
supabase db push
supabase db push --include-all
supabase db reset
supabase db diff
supabase db diff --linked

# Types
supabase gen types typescript --local > lib/types/supabase.ts
supabase gen types typescript --linked > lib/types/supabase.ts
```

### npm Scripts

```powershell
# Database
npm run db:reset          # Reset local DB
npm run db:typegen        # Generate types from local
npm run db:diff           # Check for drift
npm run db:verify         # Verify determinism
npm run db:verify-sync    # Verify migration sync (NEW)

# Linting
npm run lint:schema       # Lint migrations against manifest

# Testing
npm test                  # Run tests
npm run build             # Build (runs type checks)
```

## Best Practices

✅ **DO:**
- Always use `IF NOT EXISTS` in migrations
- Test locally before pushing (`supabase db reset`)
- Regenerate types after migrations (`npm run db:typegen`)
- Verify sync before merge (`npm run db:verify-sync`)
- Use GitHub Actions for production deployments

❌ **DON'T:**
- Edit existing migration files after merge
- Make manual changes to remote database
- Skip type regeneration
- Force push migration edits
- Use anon keys as access tokens

## Emergency Procedures

### Rollback (Forward-Fix Only)

```powershell
# 1. Create a new migration that reverses changes
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
New-Item "supabase/migrations/${timestamp}_revert_previous_change.sql"

# 2. Write SQL to undo changes (DROP, ALTER, DELETE, etc.)

# 3. Apply normally
supabase db reset
npm run db:typegen
git add .
git commit -m "fix: revert problematic migration"
git push
```

### Complete Re-sync

```powershell
# 1. Backup remote database first!

# 2. Reset local to match remote
supabase db pull

# 3. If remote is behind, apply all migrations
supabase db push --include-all

# 4. Regenerate everything
supabase db reset
npm run db:typegen
npm run build
```

## Getting Help

**Documentation:**
- Full guide: `docs/DB_DEPLOYMENT_GUIDE.md`
- Canonical migrations: `docs/canon/DB_MIGRATIONS.md`
- Determinism flow: `docs/DB_DETERMINISM_CI_FLOW.md`

**Logs:**
- GitHub Actions: Repository → Actions tab
- Local Supabase: `supabase status` + check Docker logs

**Verification:**
```powershell
# Complete health check
npm run db:verify-sync -- -Verbose
npm test
npm run build
```
