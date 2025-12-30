# Database Migrations Guide

**Type:** Canon  
**Purpose:** Standards for database schema changes  
**Source:** Consolidated from docs/_archive_0_3/MIGRATIONS_GUIDE.md

---

## Core Principles

1. **Migrations are append-only** - Never edit existing migration files after they're merged
2. **Migrations are idempotent** - Safe to run multiple times
3. **Schema is canonical** - `schema/schema.sql` is the single source of truth
4. **Forward-only** - No rollback scripts; fix forward with new migrations

---

## Workflow

### 1. Create Migration File

```bash
# Use timestamp format: YYYYMMDDHHMMSS_description.sql
# Example: 20251230164500_add_sleep_funnel.sql
cp tools/migration-template.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_your_description.sql
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

```bash
# Reset database and apply all migrations
supabase db reset

# Or apply just new migrations
./scripts/apply-migrations.sh

# Verify
supabase db diff
```

### 4. Update Schema

```bash
# Generate canonical schema
./scripts/generate-schema.sh

# Review the diff
git diff schema/schema.sql
```

### 5. Validate

```bash
# Check migration files haven't been edited
npm run lint:migrations

# Run in CI context
npm run lint:migrations -- --base-ref origin/main
```

### 6. Commit

```bash
git add supabase/migrations/YYYYMMDDHHMMSS_description.sql
git add schema/schema.sql
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

```bash
# Rename one with new timestamp
mv supabase/migrations/20251230120000_feature_a.sql \
   supabase/migrations/20251230120001_feature_a.sql

# Update references in migration if needed
# Test locally
# Commit changes
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Validate migrations
  run: npm run lint:migrations -- --base-ref origin/main

- name: Apply migrations
  run: supabase db reset

- name: Verify schema
  run: |
    ./scripts/generate-schema.sh
    git diff --exit-code schema/schema.sql
```

---

## Related Documentation

- [Principles](PRINCIPLES.md) - Core development principles
- [Review Checklist](REVIEW_CHECKLIST.md) - Migration review standards
- [RLS Patterns](../releases/v0.4/rls-patterns.md) - Row Level Security examples

---

## Template Location

Use `tools/migration-template.sql` as your starting point for all migrations.
