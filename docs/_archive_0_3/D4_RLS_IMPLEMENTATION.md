# D4: Row Level Security (RLS) Implementation

## Overview

This document describes the comprehensive Row Level Security (RLS) implementation for Rhythmologicum Connect. RLS ensures that:

- **Patients** can only access their own data
- **Clinicians** can access all pilot patient data
- **Unauthorized access** is prevented and logged

## Implementation Date

2025-12-07

## Tables Protected by RLS

All public tables now have RLS enabled:

1. `patient_profiles` - Patient demographic and profile data
2. `assessments` - Patient stress/sleep assessments
3. `assessment_answers` - Individual question answers
4. `reports` - AI-generated assessment reports
5. `patient_measures` - Aggregated patient measurements
6. `user_consents` - User consent records (already had RLS)

## Policy Structure

### Patient Policies

Patients have restricted access to only their own data:

- **SELECT**: Can view only their own records
- **INSERT**: Can create only their own records
- **UPDATE**: Can update only their own records
- **DELETE**: Not explicitly allowed (cascade deletes handled by foreign keys)

### Clinician Policies

Clinicians have broad read access to all pilot patient data:

- **SELECT**: Can view all patient records
- **INSERT/UPDATE/DELETE**: Limited to prevent accidental data modification

### Service/API Policies

Backend services (authenticated with service role key) can:

- **INSERT/UPDATE**: Create and modify records for reports and measures
- These operations bypass RLS when using service role authentication

## Helper Functions

### `public.is_clinician()`

Returns `true` if the current authenticated user has the `clinician` role.

```sql
SELECT public.is_clinician();  -- Returns boolean
```

**Usage in policies:**
```sql
USING (public.is_clinician())
```

### `public.get_my_patient_profile_id()`

Returns the `patient_profile.id` for the current authenticated user.

```sql
SELECT public.get_my_patient_profile_id();  -- Returns UUID
```

**Usage in policies:**
```sql
USING (patient_id = public.get_my_patient_profile_id())
```

### `public.log_rls_violation()`

Logs RLS policy violations for security monitoring.

```sql
SELECT public.log_rls_violation('table_name', 'operation', attempted_id);
```

**Parameters:**
- `table_name` (text): Name of the table where violation occurred
- `operation` (text): Type of operation (SELECT, INSERT, UPDATE, DELETE)
- `attempted_id` (uuid, optional): ID of the record involved

**Logging:**
- Violations are logged to PostgreSQL logs (visible in Supabase logs)
- Format: `RLS_VIOLATION: user=<uuid> table=<name> operation=<op> id=<uuid> timestamp=<time>`

## Policy Details

### patient_profiles

| Policy Name | Operation | Who | Condition |
|------------|-----------|-----|-----------|
| Patients can view own profile | SELECT | Patients | `user_id = auth.uid()` |
| Clinicians can view all profiles | SELECT | Clinicians | `is_clinician()` |
| Patients can update own profile | UPDATE | Patients | `user_id = auth.uid()` |
| Patients can insert own profile | INSERT | Patients | `user_id = auth.uid()` |

### assessments

| Policy Name | Operation | Who | Condition |
|------------|-----------|-----|-----------|
| Patients can view own assessments | SELECT | Patients | `patient_id = get_my_patient_profile_id()` |
| Clinicians can view all assessments | SELECT | Clinicians | `is_clinician()` |
| Patients can insert own assessments | INSERT | Patients | `patient_id = get_my_patient_profile_id()` |
| Patients can update own assessments | UPDATE | Patients | `patient_id = get_my_patient_profile_id()` |

### assessment_answers

| Policy Name | Operation | Who | Condition |
|------------|-----------|-----|-----------|
| Patients can view own assessment answers | SELECT | Patients | Via assessment linkage |
| Clinicians can view all assessment answers | SELECT | Clinicians | `is_clinician()` |
| Patients can insert own assessment answers | INSERT | Patients | Via assessment linkage |

### reports

| Policy Name | Operation | Who | Condition |
|------------|-----------|-----|-----------|
| Patients can view own reports | SELECT | Patients | Via assessment linkage |
| Clinicians can view all reports | SELECT | Clinicians | `is_clinician()` |
| Service can insert reports | INSERT | Service | `true` (backend API) |
| Service can update reports | UPDATE | Service | `true` (backend API) |

### patient_measures

| Policy Name | Operation | Who | Condition |
|------------|-----------|-----|-----------|
| Patients can view own measures | SELECT | Patients | `patient_id = get_my_patient_profile_id()` |
| Clinicians can view all measures | SELECT | Clinicians | `is_clinician()` |
| Service can insert measures | INSERT | Service | `true` (backend API) |
| Service can update measures | UPDATE | Service | `true` (backend API) |

## Testing RLS Policies

### Test Setup

Create test users with different roles:

```sql
-- Create test patient users
-- Use Supabase Auth UI or API to create users

-- Assign clinician role
SELECT set_user_role('clinician@test.com', 'clinician');
```

### Manual Test Scenarios

All test queries are documented in the migration file:
`supabase/migrations/20251207094100_rls_tests.sql`

#### Test Categories

1. **Patient Self-Access Tests**
   - Verify patients can view/update their own data
   - Verify patients cannot view other patients' data

2. **Clinician Access Tests**
   - Verify clinicians can view all patient data
   - Verify read-only access where appropriate

3. **Cross-Patient Access Tests (Should Fail)**
   - Verify patient1 cannot access patient2's data
   - Verify INSERT/UPDATE/DELETE restrictions

4. **Unauthenticated Access Tests (Should Fail)**
   - Verify no data is accessible without authentication

5. **Helper Function Tests**
   - Verify `is_clinician()` returns correct values
   - Verify `get_my_patient_profile_id()` works correctly

### Running Tests

Tests should be run manually with different user contexts:

1. **Via Supabase SQL Editor:**
   - Run queries as different users (requires user impersonation)
   
2. **Via Application:**
   - Login as different users and verify API responses
   
3. **Via psql with JWT:**
   ```bash
   # Set JWT token in session
   SET request.jwt.claims = '{"sub": "<user_id>", "role": "authenticated"}';
   
   # Run test queries
   SELECT * FROM patient_profiles;
   ```

### Expected Test Results

| Test | User | Expected Result |
|------|------|----------------|
| View own profile | Patient | ✓ Returns 1 row |
| View other profile | Patient | ✗ Returns 0 rows |
| View all profiles | Clinician | ✓ Returns all rows |
| Insert own assessment | Patient | ✓ Succeeds |
| Insert other's assessment | Patient | ✗ Fails with RLS violation |
| Update other's data | Patient | ✗ Affects 0 rows or fails |
| View data unauthenticated | None | ✗ Returns 0 rows or auth error |

## Security Monitoring

### Viewing RLS Violation Logs

RLS violations are logged to PostgreSQL logs. Access them via:

1. **Supabase Dashboard:**
   - Navigate to Logs section
   - Filter for warnings containing "RLS_VIOLATION"

2. **Query Logs Table:**
   ```sql
   -- If you've enabled pg_stat_statements
   SELECT * FROM pg_stat_statements
   WHERE query LIKE '%RLS_VIOLATION%';
   ```

### Log Format

```
RLS_VIOLATION: user=<user_uuid> table=<table_name> operation=<operation> id=<record_id> timestamp=<timestamp>
```

### Monitoring Recommendations

1. **Set up alerts** for RLS_VIOLATION logs in production
2. **Review logs weekly** for suspicious access patterns
3. **Investigate** any violations from clinician accounts
4. **Track** unauthenticated access attempts

## Application Impact

### Client-Side Queries

With RLS enabled, client-side queries (using anon/authenticated role) are automatically filtered:

```typescript
// Patient accessing their own data
const { data, error } = await supabase
  .from('patient_measures')
  .select('*')  // Automatically filtered to user's own data
```

```typescript
// Clinician accessing all data
const { data, error } = await supabase
  .from('patient_measures')
  .select(`
    *,
    patient_profiles (
      full_name,
      user_id
    )
  `)  // Returns all patients' data if user is clinician
```

### Server-Side API Routes

Server-side routes using service role key bypass RLS:

```typescript
// In API routes with service role
const { data, error } = await supabase
  .from('reports')
  .insert({ ...reportData })  // Can insert for any patient
```

### No Code Changes Required

The RLS implementation is **transparent** to existing application code:
- Queries continue to work as before
- RLS automatically filters results based on authenticated user
- No changes needed to API routes or client components

## Migration Files

1. **`20251207094000_enable_comprehensive_rls.sql`**
   - Enables RLS on all tables
   - Creates helper functions
   - Defines all RLS policies
   - Grants necessary permissions

2. **`20251207094100_rls_tests.sql`**
   - Documents test scenarios
   - Provides test queries
   - Creates optional test results table

## Rollback Procedure

If RLS causes issues, it can be disabled per table:

```sql
-- Disable RLS on a specific table
ALTER TABLE public.patient_profiles DISABLE ROW LEVEL SECURITY;

-- Drop specific policies
DROP POLICY "Patients can view own profile" ON public.patient_profiles;

-- Re-enable without policies (open access, not recommended)
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
```

**Warning:** Disabling RLS removes all access restrictions. Only do this temporarily for debugging.

## Performance Considerations

### Policy Performance

RLS policies are evaluated on every query. To maintain performance:

1. **Indexes**: Ensure foreign keys and user_id columns are indexed
2. **Helper Functions**: Use `STABLE` or `IMMUTABLE` where appropriate
3. **Query Planning**: PostgreSQL optimizes RLS policy checks

### Existing Indexes

All necessary indexes are already in place:
- `patient_profiles.user_id` (unique constraint)
- `patient_measures.patient_id` (indexed)
- `assessments.patient_id` (foreign key, indexed)

### Monitoring Performance

```sql
-- Check query performance with EXPLAIN
EXPLAIN ANALYZE
SELECT * FROM patient_measures
WHERE patient_id = get_my_patient_profile_id();
```

## Troubleshooting

### Issue: "Permission denied for table X"

**Cause:** User role lacks table permissions
**Solution:** Check GRANT statements in migration

### Issue: "New row violates row-level security policy"

**Cause:** Attempting to INSERT data that violates policy
**Solution:** Verify WITH CHECK conditions in policy

### Issue: Empty result sets for valid data

**Cause:** RLS policy too restrictive or helper function error
**Solution:** 
1. Check `is_clinician()` returns expected value
2. Verify `get_my_patient_profile_id()` returns correct ID
3. Check user's `raw_app_meta_data.role` is set correctly

### Issue: Clinicians cannot see data

**Cause:** Role not set in app_metadata
**Solution:**
```sql
SELECT set_user_role('clinician@example.com', 'clinician');
```

## Best Practices

1. **Always test** RLS policies with multiple user contexts
2. **Monitor logs** regularly for violations
3. **Use helper functions** for role checks (don't duplicate logic)
4. **Document** any policy changes in migration comments
5. **Test before deploy** using Supabase local development
6. **Review policies** when adding new tables or columns

## Related Documentation

- [CLINICIAN_AUTH.md](./CLINICIAN_AUTH.md) - Clinician authentication setup
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Acceptance Criteria Status

- ✅ Patient sees only own Reports & Measures
- ✅ Clinician sees all pilot patients data
- ✅ Tests for forbidden access (should-fail) implemented
- ✅ Logging for RLS violations implemented
