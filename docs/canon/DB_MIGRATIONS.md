# Database Migrations Guide

**Type:** Canon  
**Purpose:** Standards for database schema changes  
**Source:** Consolidated from docs/_archive_0_3/MIGRATIONS_GUIDE.md

---

## DB Stack Decision

**Stack:** Supabase CLI + PostgreSQL  
**Migration Tool:** Supabase CLI (`supabase db reset`, `supabase db push`)  
**Type Generation:** Supabase CLI (`supabase gen types typescript`)  
**Version Control:** Git-tracked migrations in `supabase/migrations/`  

**Rationale:**
- Supabase CLI provides integrated workflow for local development, migrations, and type generation
- Native TypeScript type generation ensures type safety across codebase
- Built-in drift detection via `supabase db diff`
- Consistent tooling from local development through CI/CD

---

## Core Principles

1. **Migrations are append-only** - Never edit existing migration files after they're merged
2. **Migrations are idempotent** - Safe to run multiple times
3. **Schema is canonical** - `schema/schema.sql` is the single source of truth
4. **Forward-only** - No rollback scripts; fix forward with new migrations
5. **Migration-first** - Schema changes must be defined in migrations, never manually applied
6. **Type-safe** - Generated types must be kept in sync with database schema

---

## Workflow

### 1. Create Migration File

```powershell
# Use timestamp format: YYYYMMDDHHMMSS_description.sql
# Example: 20251230164500_add_sleep_funnel.sql
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$description = "add_sleep_funnel"  # Replace with your description
Copy-Item tools\migration-template.sql supabase\migrations\${timestamp}_${description}.sql
```

### 2. Write Migration

Use the template structure:

```sql
-- Migration: Add sleep assessment funnel
-- Created: 2025-12-30
-- Author: Developer Name

-- Tables
CREATE TABLE IF NOT EXISTS public.sleep_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score INTEGER CHECK (score >= 0 AND score <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sleep_assessments_user_id 
  ON public.sleep_assessments(user_id);

-- RLS
ALTER TABLE public.sleep_assessments ENABLE ROW LEVEL SECURITY;

-- Policies (use DO block for idempotency)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sleep_assessments' 
    AND policyname = 'Users can view own assessments'
  ) THEN
    CREATE POLICY "Users can view own assessments" 
      ON public.sleep_assessments
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;
```

### 3. Test Locally

```powershell
# Reset database and apply all migrations
supabase db reset

# Verify no drift
supabase db diff
```

### 4. Generate Types

```powershell
# Generate TypeScript types
npm run db:typegen

# Review the generated types
git diff lib\types\supabase.ts
```

### 5. Validate

```powershell
# Check migration files haven't been edited
npm run lint:migrations

# Run full determinism check
npm run db:verify
```

### 6. Commit

```powershell
git add supabase\migrations\*.sql
git add lib\types\supabase.ts
git commit -m "feat: add sleep assessment funnel"
```

---

## Best Practices

### Table Creation

```sql
-- Always use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_updated_at' 
    AND tgrelid = 'public.my_table'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.my_table
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
```

### Foreign Keys

```sql
-- Check schema and table exist before adding FK
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.my_table
      ADD CONSTRAINT fk_user
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Create policies with idempotency check
DO $$ 
BEGIN
  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'my_table' 
    AND policyname = 'Users select own rows'
  ) THEN
    CREATE POLICY "Users select own rows"
      ON public.my_table
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'my_table' 
    AND policyname = 'Users insert own rows'
  ) THEN
    CREATE POLICY "Users insert own rows"
      ON public.my_table
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
```

### Helper Functions

```sql
-- Create or replace functions (naturally idempotent)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'patient'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Common Patterns

### Adding a Column

```sql
-- Add column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'my_table' 
    AND column_name = 'new_column'
  ) THEN
    ALTER TABLE public.my_table 
      ADD COLUMN new_column TEXT;
  END IF;
END $$;
```

### Modifying Data

```sql
-- Always check if data exists first
UPDATE public.my_table 
SET status = 'active'
WHERE status IS NULL;

-- For large tables, consider batching
DO $$ 
DECLARE
  batch_size INT := 1000;
  affected INT;
BEGIN
  LOOP
    UPDATE public.my_table 
    SET status = 'active'
    WHERE id IN (
      SELECT id FROM public.my_table
      WHERE status IS NULL
      LIMIT batch_size
    );
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    COMMIT;
  END LOOP;
END $$;
```

### Renaming Carefully

```sql
-- Avoid renames in production; prefer add + backfill + drop
-- If you must rename:
ALTER TABLE public.old_name RENAME TO new_name;

-- Update all foreign key references
-- Update all function references
-- Update all policy references
```

---

## Emergency Procedures

### Migration Broke Production

1. **Don't panic** - Database state is recoverable
2. **Create hotfix migration** - Fix forward, never rollback
3. **Test hotfix locally** first
4. **Set environment variable**: `ALLOW_MIGRATION_EDITS=1` (only for emergencies)
5. **Apply hotfix** to production
6. **Document incident** in `docs/memory/incidents/`

### Conflicting Migrations

If two migrations with same timestamp:

```powershell
# Rename one with new timestamp
Move-Item supabase\migrations\20251230120000_feature_a.sql `
          supabase\migrations\20251230120001_feature_a.sql

# Test locally
supabase db reset

# Commit changes
git add supabase\migrations\
git commit -m "fix: resolve migration timestamp conflict"
```

---

## CI/CD Integration

### GitHub Actions

The CI workflow (`.github/workflows/db-determinism.yml`) enforces migration-first discipline and prevents schema drift:

**Workflow runs on:**
- Pull requests affecting migrations, types, or schema files
- Manual workflow dispatch

**Checks performed:**
1. **Migration Immutability** - Ensures no existing migrations were edited
   - Compares against merge-base with target branch
   - Shows specific files that were modified (not just added)
   - Fails with clear list of affected files

2. **Migration Application** - Applies all migrations cleanly
   - Starts Supabase with deterministic lifecycle
   - Shows Supabase status for debugging
   - Runs `supabase db reset` to apply all migrations

3. **Drift Detection** - Verifies no manual schema changes
   - Runs `supabase db diff --exit-code`
   - Fails if schema differs from what migrations produce

4. **Type Synchronization** - Ensures types match schema
   - Generates types via `npm run db:typegen`
   - Compares with committed version using `git diff --exit-code`

**Cleanup:**
- Always stops Supabase at the end (success or failure)
- Uses `supabase stop --no-backup` for clean teardown

**CI Failures:**
- Migration edited (not added) → Shows which files were modified
- Migration syntax error → Shows error from `db reset`
- Schema drift detected → Shows drift details from `db diff`
- Generated types out of sync → Shows diff of type changes

---

## PowerShell Runbook (Windows Development)

### Prerequisites

```powershell
# Install Supabase CLI (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via NPM
npm install -g supabase
```

### Local Development Workflow

```powershell
# Start local Supabase instance
supabase start

# Reset database and apply all migrations
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > .\lib\types\supabase.ts

# Verify no drift or uncommitted type changes
git diff --exit-code
# Exit code 0 = clean, exit code 1 = changes detected
```

### Pre-Commit Verification

```powershell
# Run full verification before committing schema changes
function Test-DbDeterminism {
    Write-Host "Starting DB determinism check..." -ForegroundColor Cyan
    
    # 1. Reset database
    Write-Host "→ Resetting database..." -ForegroundColor Yellow
    supabase db reset
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Database reset failed" -ForegroundColor Red
        return $false
    }
    
    # 2. Check for drift
    Write-Host "→ Checking for drift..." -ForegroundColor Yellow
    supabase db diff
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Schema drift detected" -ForegroundColor Red
        return $false
    }
    
    # 3. Generate types
    Write-Host "→ Generating types..." -ForegroundColor Yellow
    supabase gen types typescript --local > .\lib\types\supabase.ts
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Type generation failed" -ForegroundColor Red
        return $false
    }
    
    # 4. Check for uncommitted changes
    Write-Host "→ Checking for uncommitted changes..." -ForegroundColor Yellow
    git diff --exit-code lib\types\supabase.ts
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Generated types have uncommitted changes" -ForegroundColor Red
        Write-Host "  Run: git add lib\types\supabase.ts" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    return $true
}

# Run the check
Test-DbDeterminism
```

### Creating a New Migration

```powershell
# Generate timestamp
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$description = "add_new_feature"  # Replace with your description
$filename = "supabase\migrations\${timestamp}_${description}.sql"

# Copy template
Copy-Item "tools\migration-template.sql" $filename

# Edit the migration
code $filename

# Test migration
supabase db reset

# Generate updated types
supabase gen types typescript --local > .\lib\types\supabase.ts

# Verify
git status
git diff lib\types\supabase.ts
```

### Troubleshooting

```powershell
# Stop Supabase if it's hanging
supabase stop

# Start fresh
supabase start

# View logs
supabase logs

# Check Supabase status
supabase status
```

---

## Related Documentation

- [Principles](PRINCIPLES.md) - Core development principles
- [Review Checklist](REVIEW_CHECKLIST.md) - Migration review standards
- [RLS Patterns](../releases/v0.4/rls-patterns.md) - Row Level Security examples

---

## Template Location

Use `tools/migration-template.sql` as your starting point for all migrations.
