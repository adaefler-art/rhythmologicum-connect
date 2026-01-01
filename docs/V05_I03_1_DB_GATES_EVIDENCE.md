# DB Gates Evidence - V05-I03.1

## Environment Setup

This document provides evidence of database operations for the V05-I03.1 onboarding implementation.

**Note**: These commands require a local Supabase instance running with Docker. They cannot be executed in the CI environment.

## Required Commands

The following commands must be executed locally to verify database integrity:

```powershell
# Start local Supabase instance
npx supabase start

# Reset database with all migrations
npm run db:reset

# Check for schema drift
npm run db:diff

# Regenerate TypeScript types from schema
npm run db:typegen
```

## Expected Outcomes

### 1. `npx supabase start`
- Should start all Supabase services (PostgreSQL, Auth, Storage, etc.)
- Should apply all migrations from `supabase/migrations/`
- Should be accessible at http://localhost:54323

### 2. `npm run db:reset`
- Drops and recreates the database
- Applies all migrations in order
- Seeds any initial data
- Should complete without errors

**Expected Tables Confirmed**:
- `user_consents` - with columns: `id`, `user_id`, `consent_version`, `consented_at`, `ip_address`, `user_agent`
- `patient_profiles` - with columns: `id`, `user_id`, `created_at`, `full_name`, `birth_year`, `sex` (TEXT type)

**Expected Constraints**:
- `unique_user_profile` on `patient_profiles(user_id)` - ensures idempotency
- No unique constraint on `user_consents` for version (allows multiple versions per user)

### 3. `npm run db:diff`
- Should show NO differences between migrations and actual schema
- Confirms schema.sql is in sync with migrations
- Empty output = success

### 4. `npm run db:typegen`
- Generates TypeScript types in `lib/types/supabase.ts`
- Should complete without errors
- Types should match schema definitions

## Schema Verification

### Sex Field Type Check

From `schema/schema.sql`:
```sql
CREATE TABLE public.patient_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
    birth_year integer,
    sex text  -- TEXT field, not enum
);
```

**Conclusion**: The `sex` field is stored as TEXT in the database, making `PATIENT_SEX` in the contracts registry the canonical source of truth. No DB enum exists, so there is no drift risk.

### RLS Policies Verification

Expected RLS policies on `patient_profiles`:
```sql
-- Patients can view own profile
CREATE POLICY "Patients can view own profile" 
  ON public.patient_profiles FOR SELECT 
  USING ((user_id = auth.uid()));

-- Patients can insert own profile
CREATE POLICY "Patients can insert own profile" 
  ON public.patient_profiles FOR INSERT 
  WITH CHECK ((user_id = auth.uid()));

-- Patients can update own profile
CREATE POLICY "Patients can update own profile" 
  ON public.patient_profiles FOR UPDATE 
  USING ((user_id = auth.uid())) 
  WITH CHECK ((user_id = auth.uid()));

-- Clinicians can view all profiles
CREATE POLICY "Clinicians can view all profiles" 
  ON public.patient_profiles FOR SELECT 
  USING (public.is_clinician());
```

Expected RLS policies on `user_consents`:
```sql
-- Users can view own consents
CREATE POLICY "Users can view own consents" 
  ON public.user_consents FOR SELECT 
  USING ((auth.uid() = user_id));

-- Users can insert own consents
CREATE POLICY "Users can insert own consents" 
  ON public.user_consents FOR INSERT 
  WITH CHECK ((auth.uid() = user_id));
```

## No Migration Required

**Verification**: All required database objects already exist in the schema:
- ✅ `user_consents` table exists with all required columns
- ✅ `patient_profiles` table exists with all required columns
- ✅ Unique constraint on `patient_profiles.user_id` ensures idempotency
- ✅ RLS policies enforce user-scoped access
- ✅ No new tables, columns, or enums needed

Therefore, **no new migration files were created** for this feature. The implementation uses only existing database structures.

## Manual Verification Steps

For manual verification in a local environment:

1. Start Supabase: `npx supabase start`
2. Reset DB: `npm run db:reset`
3. Verify no errors in migration output
4. Run diff: `npm run db:diff` - should be empty
5. Regenerate types: `npm run db:typegen`
6. Check `lib/types/supabase.ts` was updated
7. Run tests: `npm test` - should pass all 233 tests
8. Build: `npm run build` - should succeed

## DB Commands Not Run in CI

These commands require Docker and a local Supabase instance, which are not available in the GitHub Actions CI environment. They must be run manually by a developer with a local Supabase setup.

**Status**: ⏸️ Pending local verification by developer with Supabase instance.
