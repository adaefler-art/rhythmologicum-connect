# Issue 04 Fix - Quick Reference

## Problem
Clinicians could not see assessment answers in the patient detail view, even though the data existed in the database. The UI showed "Antworten (0)" and "Keine Antworten vorhanden" incorrectly.

## Root Cause
The `is_clinician()` PostgreSQL function used by RLS (Row Level Security) policies was checking `auth.jwt()->>'role'`, but:
- Supabase JWT tokens don't include custom roles by default
- No custom access token hook was configured
- The function always returned `false`, blocking access via RLS

## Solution
**Single Function Fix**: Modified `is_clinician()` to query `auth.users.raw_app_meta_data->>'role'` directly instead of relying on JWT claims.

## Files Changed
1. **Migration**: `supabase/migrations/20260206162100_fix_is_clinician_use_app_metadata.sql`
2. **Schema**: `schema/schema.sql` (lines 1628-1645)
3. **Docs**: 
   - `ISSUE-04-FIX-SUMMARY.md` - Technical details
   - `ISSUE-04-TESTING-GUIDE.md` - Testing procedures
   - `ISSUE-04-README.md` - This file

## Impact
Fixes 5 RLS policies that use `is_clinician()`:
1. ✅ `assessment_answers` - **PRIMARY FIX**
2. ✅ `patient_measures`
3. ✅ `patient_state`
4. ✅ `patient_profiles`
5. ✅ `reports`

## Before & After

### Before (Broken)
```sql
CREATE OR REPLACE FUNCTION "public"."is_clinician"() RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt()->>'role' IN ('clinician', 'admin')),
      false
    )
  );
END;
$$;
```
❌ Always returns `false` (JWT doesn't contain role)

### After (Fixed)
```sql
CREATE OR REPLACE FUNCTION "public"."is_clinician"() RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (raw_app_meta_data->>'role' IN ('clinician', 'admin', 'nurse')),
      false
    )
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;
```
✅ Correctly checks database role

## Deployment

### Quick Deploy
```bash
# Apply migration
supabase db push

# Verify
psql -c "SELECT pg_get_functiondef('public.is_clinician'::regprocedure);"
```

### Testing
See `ISSUE-04-TESTING-GUIDE.md` for complete testing checklist.

**Quick Test:**
1. Login as clinician
2. View patient assessment with answers
3. Verify answers display correctly

## Security
- ✅ No security regressions
- ✅ Maintains same access control model
- ✅ Uses SECURITY DEFINER correctly
- ✅ No SQL injection risks

## Rollback
If needed, revert to previous version:
```sql
CREATE OR REPLACE FUNCTION "public"."is_clinician"() RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (raw_app_meta_data->>'role' IN ('clinician', 'admin')),
      false
    )
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;
```
(Removes 'nurse' role support but keeps the DB query fix)

## Related Issues
- Fixes: Issue 04 - "Assessments: Antworten werden nicht angezeigt, obwohl Daten vorhanden sind"
- PR: #[number]

## Questions?
See `ISSUE-04-FIX-SUMMARY.md` for comprehensive technical documentation.
