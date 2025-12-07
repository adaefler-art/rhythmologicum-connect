# RLS Quick Reference

## Quick Policy Overview

| Table | Patient Access | Clinician Access | Service Access |
|-------|---------------|------------------|----------------|
| `patient_profiles` | Own only (SELECT, UPDATE, INSERT) | All (SELECT only) | - |
| `assessments` | Own only (SELECT, UPDATE, INSERT) | All (SELECT only) | - |
| `assessment_answers` | Own only (SELECT, INSERT) | All (SELECT only) | - |
| `reports` | Own only (SELECT) | All (SELECT only) | Full (INSERT, UPDATE) |
| `patient_measures` | Own only (SELECT) | All (SELECT only) | Full (INSERT, UPDATE) |

## Helper Functions

```sql
-- Check if current user is clinician
SELECT public.is_clinician();
-- Returns: true/false

-- Get my patient profile ID
SELECT public.get_my_patient_profile_id();
-- Returns: UUID or NULL

-- Log RLS violation
SELECT public.log_rls_violation('table_name', 'SELECT', '<record_id>');
```

## Common Queries

### As Patient - View My Data

```sql
-- My profile
SELECT * FROM patient_profiles;

-- My assessments
SELECT * FROM assessments;

-- My reports
SELECT r.*, a.funnel 
FROM reports r 
JOIN assessments a ON r.assessment_id = a.id;

-- My measures
SELECT * FROM patient_measures;
```

### As Clinician - View All Patients

```sql
-- All patient profiles
SELECT * FROM patient_profiles ORDER BY created_at DESC;

-- All assessments with patient names
SELECT a.*, p.full_name, p.user_id
FROM assessments a
JOIN patient_profiles p ON a.patient_id = p.id
ORDER BY a.started_at DESC;

-- All measures with patient info
SELECT pm.*, p.full_name
FROM patient_measures pm
JOIN patient_profiles p ON pm.patient_id = p.id
ORDER BY pm.created_at DESC;
```

## Quick Tests

### Test 1: Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('patient_profiles', 'assessments', 'assessment_answers', 'reports', 'patient_measures');
```

Expected: All should show `rowsecurity = true`

### Test 2: Verify My Role

```sql
-- Check if I'm a clinician
SELECT public.is_clinician();

-- Check my role in metadata
SELECT 
  email,
  raw_app_meta_data->>'role' as role
FROM auth.users
WHERE id = auth.uid();
```

### Test 3: Verify I Can Only See My Data (Patient)

```sql
-- Count my records
SELECT 
  (SELECT COUNT(*) FROM patient_profiles) as my_profiles,
  (SELECT COUNT(*) FROM assessments) as my_assessments,
  (SELECT COUNT(*) FROM patient_measures) as my_measures;
```

Expected: Should match actual count of MY records only

### Test 4: Verify I Can See All Data (Clinician)

```sql
-- Count all records (as clinician)
SELECT 
  (SELECT COUNT(*) FROM patient_profiles) as all_profiles,
  (SELECT COUNT(*) FROM assessments) as all_assessments,
  (SELECT COUNT(*) FROM patient_measures) as all_measures;
```

Expected: Should show ALL records in database

## Setting Up Clinician Role

```sql
-- Method 1: Use helper function
SELECT set_user_role('clinician@example.com', 'clinician');

-- Method 2: Direct update
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"clinician"'
)
WHERE email = 'clinician@example.com';

-- Verify
SELECT email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE email = 'clinician@example.com';
```

## Troubleshooting

### No data returned (but should have data)

```sql
-- Check authentication
SELECT auth.uid();  -- Should return your user ID

-- Check patient profile exists
SELECT * FROM patient_profiles WHERE user_id = auth.uid();

-- Check role
SELECT public.is_clinician();
```

### Clinician cannot see data

```sql
-- Verify clinician role is set
SELECT email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE email = 'your@email.com';

-- If NULL or wrong, fix it:
SELECT set_user_role('your@email.com', 'clinician');
```

### Unexpected access to other patient data

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## RLS Violation Logs

### Check for violations

In Supabase Dashboard:
1. Go to Logs
2. Filter by WARNING level
3. Search for "RLS_VIOLATION"

### Log format

```
RLS_VIOLATION: user=<uuid> table=<table> operation=<op> id=<id> timestamp=<time>
```

## Policy Details by Table

### patient_profiles

- ✅ `Patients can view own profile` (SELECT)
- ✅ `Clinicians can view all profiles` (SELECT)
- ✅ `Patients can update own profile` (UPDATE)
- ✅ `Patients can insert own profile` (INSERT)

### assessments

- ✅ `Patients can view own assessments` (SELECT)
- ✅ `Clinicians can view all assessments` (SELECT)
- ✅ `Patients can insert own assessments` (INSERT)
- ✅ `Patients can update own assessments` (UPDATE)

### assessment_answers

- ✅ `Patients can view own assessment answers` (SELECT)
- ✅ `Clinicians can view all assessment answers` (SELECT)
- ✅ `Patients can insert own assessment answers` (INSERT)

### reports

- ✅ `Patients can view own reports` (SELECT)
- ✅ `Clinicians can view all reports` (SELECT)
- ✅ `Service can insert reports` (INSERT)
- ✅ `Service can update reports` (UPDATE)

### patient_measures

- ✅ `Patients can view own measures` (SELECT)
- ✅ `Clinicians can view all measures` (SELECT)
- ✅ `Service can insert measures` (INSERT)
- ✅ `Service can update measures` (UPDATE)

## Emergency Procedures

### Temporarily Disable RLS (NOT RECOMMENDED)

```sql
-- Only for debugging - REMOVES ALL SECURITY
ALTER TABLE public.patient_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
```

**Warning:** Only disable RLS temporarily for debugging. Never disable in production.

### Check What User Can See

```sql
-- As current user, what can I see?
SELECT 'patient_profiles' as table, COUNT(*) FROM patient_profiles
UNION ALL
SELECT 'assessments', COUNT(*) FROM assessments
UNION ALL
SELECT 'assessment_answers', COUNT(*) FROM assessment_answers
UNION ALL
SELECT 'reports', COUNT(*) FROM reports
UNION ALL
SELECT 'patient_measures', COUNT(*) FROM patient_measures;
```

## Migration Files

- `20251207094000_enable_comprehensive_rls.sql` - Main RLS implementation
- `20251207094100_rls_tests.sql` - Test scenarios

## Documentation

- `docs/D4_RLS_IMPLEMENTATION.md` - Full implementation guide
- `docs/RLS_TESTING_GUIDE.md` - Testing procedures
- `docs/CLINICIAN_AUTH.md` - Clinician authentication

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review full documentation in `docs/D4_RLS_IMPLEMENTATION.md`
3. Check Supabase logs for RLS violations
4. Verify role assignments with queries above
