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
**Schema Validation:** Migration linter (`scripts/db/lint-migrations.ps1`)

**Rationale:**
- Supabase CLI provides integrated workflow for local development, migrations, and type generation
- Native TypeScript type generation ensures type safety across codebase
- Built-in drift detection via `supabase db diff`
- Consistent tooling from local development through CI/CD
- Migration linter enforces canonical schema object usage

---

## Schema Manifest (V0.5+)

**Purpose:** Hard guardrail to prevent non-canonical DB objects from being introduced.

**Location:** `docs/canon/DB_SCHEMA_MANIFEST.json`

**Contents:**
- **tables**: Canonical list of allowed table names
- **enums**: Canonical list of allowed enum/type names
- **deprecated**: Objects that exist but should not be used in new migrations
- **columns**: Per-table column definitions (optional, for reference)
- **constraints**: Per-table constraint names (optional, for reference)

**Usage:**
```powershell
# Lint all migrations against canonical manifest
.\scripts\db\lint-migrations.ps1

# Verbose output
.\scripts\db\lint-migrations.ps1 -Verbose
```

**Validation Scope:**
The linter validates the following SQL statements:
- `CREATE TABLE` - Ensures new tables are in the canonical manifest
- `CREATE TYPE ... AS ENUM` - Ensures new enums are in the canonical manifest
- `ALTER TABLE` - Ensures tables being altered are canonical (prevents altering non-existent tables)

**Exit Codes:**
- `0` = All checks passed
- `1` = Non-canonical objects detected (blocks PR)
- `2` = Script execution error

**Adding New Schema Objects:**

When introducing a new canonical table or enum:

1. Create the migration file
2. Add the table/enum name to `docs/canon/DB_SCHEMA_MANIFEST.json`
3. Run linter to validate: `.\scripts\db\lint-migrations.ps1`
4. Document the change in this file (DB_MIGRATIONS.md)
5. Commit both migration and manifest together

**Recent canonical additions:**
- `pre_screening_calls` (V05-I08.2)
- `device_shipments`, `shipment_events` (V05-I08.3)
- `shipment_status` (V05-I08.3)
- `support_cases` (V05-I08.4)
- `support_case_status`, `support_case_priority`, `support_case_category` (V05-I08.4)
- `navigation_items`, `navigation_item_configs` (V05-I09.1)
- `design_tokens` (V05-I09.2)

**Example manifest entry:**
```json
{
  "tables": [
    "assessments",
    "funnels_catalog",
    "new_canonical_table"
  ],
  "enums": [
    "user_role",
    "new_canonical_enum"
  ]
}
```

---

## Core Principles

1. **Migrations are append-only** - Never edit existing migration files after they're merged
2. **Migrations are idempotent** - Safe to run multiple times
3. **Schema is canonical** - `schema/schema.sql` is the single source of truth
4. **Forward-only** - No rollback scripts; fix forward with new migrations
5. **Migration-first** - Schema changes must be defined in migrations, never manually applied
6. **Type-safe** - Generated types must be kept in sync with database schema
7. **Schema manifest** - All DB objects must be in the canonical manifest (V0.5+)

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
# Lint migrations against canonical manifest (V0.5+)
.\scripts\db\lint-migrations.ps1

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

**V0.5 Multi-Tenant RLS Architecture:**

The V0.5 schema implements comprehensive Row Level Security with organization-based isolation:

**Access Model:**
- **Patients**: See only their own data
- **Clinicians/Nurses**: See data for patients in their organization OR explicitly assigned patients
- **Admins**: See organization configuration (no PHI access by default)

**Helper Functions (use these in policies):**
```sql
-- Get user's organization IDs
public.get_user_org_ids() RETURNS UUID[]

-- Check org membership
public.is_member_of_org(org_id UUID) RETURNS BOOLEAN

-- Get user's role in org
public.current_user_role(org_id UUID) RETURNS user_role

-- Check if user has role in any org
public.has_any_role(check_role user_role) RETURNS BOOLEAN

-- Check patient assignment
public.is_assigned_to_patient(patient_uid UUID) RETURNS BOOLEAN
```

**Policy Pattern for Patient Data:**
```sql
-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Patient can see own data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'my_table' 
    AND policyname = 'Patients can view own data'
  ) THEN
    CREATE POLICY "Patients can view own data"
      ON public.my_table
      FOR SELECT
      USING (
        -- Direct ownership check
        patient_id = public.get_my_patient_profile_id()
      );
  END IF;
END $$;

-- Staff can see org or assigned patient data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'my_table' 
    AND policyname = 'Staff can view org patient data'
  ) THEN
    CREATE POLICY "Staff can view org patient data"
      ON public.my_table
      FOR SELECT
      USING (
        -- Same org check
        EXISTS (
          SELECT 1 FROM public.patient_profiles pp
          JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
          WHERE pp.id = my_table.patient_id
            AND EXISTS (
              SELECT 1 FROM public.user_org_membership uom2
              WHERE uom2.user_id = auth.uid()
                AND uom2.organization_id = uom1.organization_id
                AND uom2.is_active = true
                AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
            )
        )
        -- OR explicit assignment
        OR EXISTS (
          SELECT 1 FROM public.patient_profiles pp
          WHERE pp.id = my_table.patient_id
            AND public.is_assigned_to_patient(pp.user_id)
        )
      );
  END IF;
END $$;
```

**Policy Pattern for Config Tables:**
```sql
-- Admins can manage org config
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Admins can update org settings'
  ) THEN
    CREATE POLICY "Admins can update org settings"
      ON public.organizations
      FOR UPDATE
      USING (public.current_user_role(id) = 'admin')
      WITH CHECK (public.current_user_role(id) = 'admin');
  END IF;
END $$;
```

**Service Role Handling:**

Server-side operations (reports, AI processing, notifications, audit logging) use the Supabase `service_role` key which **bypasses RLS entirely**. No JWT-based "service" policies are needed or recommended.

```typescript
// Server-side code uses service role (bypasses RLS)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Service role bypasses RLS
)

// This INSERT bypasses all RLS policies
await supabase.from('reports').insert({ ... })
```

**Important:** Never expose the service_role key to client-side code. RLS policies only apply to authenticated users (not service role).

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
