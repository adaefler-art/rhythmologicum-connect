# Issue 04 - Testing & Verification Guide

## Pre-Deployment Checklist

### 1. Review Changes
- [x] Migration file created: `20260206162100_fix_is_clinician_use_app_metadata.sql`
- [x] Schema updated: `schema/schema.sql`
- [x] Documentation complete: `ISSUE-04-FIX-SUMMARY.md`
- [x] Code review completed
- [x] Security review completed (CodeQL not applicable for SQL)

### 2. Verify Migration Syntax
```bash
# Check SQL syntax (if psql is available)
psql -f supabase/migrations/20260206162100_fix_is_clinician_use_app_metadata.sql --dry-run
```

## Deployment Steps

### Step 1: Deploy to Test/Staging Environment
```bash
# Apply migration using Supabase CLI
supabase db push

# OR if using production/remote
supabase db push --linked
```

### Step 2: Verify Function Update
```sql
-- Check that function was updated
SELECT pg_get_functiondef('public.is_clinician'::regprocedure);

-- Should include:
-- FROM auth.users
-- WHERE id = auth.uid()
-- AND check for ('clinician', 'admin', 'nurse')
```

## Manual Testing Checklist

### Test Case 1: Clinician Views Assessment with Answers ✅ PRIMARY TEST
**Setup:**
1. Ensure test database has:
   - User with `raw_app_meta_data.role = 'clinician'`
   - Patient with completed assessment
   - Assessment has multiple answers in `assessment_answers` table

**Steps:**
1. Login as clinician user
2. Navigate to `/clinician/patient/[patient-id]`
3. Click on an assessment that has answers
4. Wait for AssessmentRunDetails to load

**Expected Results:**
- ✅ Answer count shows correct number (e.g., "Antworten (15)")
- ✅ All answers are displayed in timeline
- ✅ Each answer shows:
  - Question text
  - Answer value
  - Timestamp
- ✅ NO "Keine Antworten vorhanden" message

**Before Fix:**
- ❌ Shows "Antworten (0)"
- ❌ Shows "Keine Antworten vorhanden"
- ❌ No answers displayed

### Test Case 2: Clinician Views Assessment WITHOUT Answers
**Steps:**
1. Login as clinician user
2. Navigate to patient with an assessment that has NO answers
3. Open that assessment

**Expected Results:**
- ✅ Shows "Antworten (0)"
- ✅ Shows "Keine Antworten vorhanden"
- ✅ No errors in console

### Test Case 3: Patient Views Own Assessment Answers
**Purpose:** Verify patient RLS still works

**Steps:**
1. Login as patient user
2. Navigate to own assessment page
3. View own answers

**Expected Results:**
- ✅ Patient can see their own answers
- ✅ Patient CANNOT see other patients' answers

### Test Case 4: Nurse Role Access
**Purpose:** Verify nurse role was added correctly

**Setup:**
- User with `raw_app_meta_data.role = 'nurse'`

**Steps:**
1. Login as nurse user
2. Navigate to patient assessment page
3. View assessment answers

**Expected Results:**
- ✅ Nurse can view assessment answers
- ✅ Same access as clinician

### Test Case 5: Unauthenticated Access Blocked
**Steps:**
1. Logout
2. Try to access `/api/clinician/assessments/[id]/details`

**Expected Results:**
- ✅ Returns 401 Unauthorized
- ✅ No data leaked

### Test Case 6: Patient Role Cannot Access Clinician API
**Steps:**
1. Login as patient user
2. Try to access `/api/clinician/assessments/[other-patient-assessment-id]/details`

**Expected Results:**
- ✅ Returns 403 Forbidden OR empty data
- ✅ RLS blocks cross-patient access

## Automated Testing (if available)

### SQL Test for is_clinician()
```sql
-- Test 1: Clinician role returns true
WITH test_user AS (
  SELECT id FROM auth.users 
  WHERE raw_app_meta_data->>'role' = 'clinician' 
  LIMIT 1
)
SELECT 
  is_clinician() AS result,
  CASE 
    WHEN is_clinician() THEN 'PASS' 
    ELSE 'FAIL' 
  END AS test_status
FROM test_user;

-- Test 2: Admin role returns true
-- Test 3: Nurse role returns true
-- Test 4: Patient role returns false
-- Test 5: No role returns false
```

### Integration Test for Assessment Answers API
```typescript
describe('GET /api/clinician/assessments/[id]/details', () => {
  it('should return answers for clinician', async () => {
    // Login as clinician
    const { user } = await signInAsRole('clinician')
    
    // Get assessment with known answers
    const assessment = await createTestAssessment()
    const answers = await createTestAnswers(assessment.id, 5)
    
    // Call API
    const response = await fetch(`/api/clinician/assessments/${assessment.id}/details`)
    const data = await response.json()
    
    // Assert
    expect(data.success).toBe(true)
    expect(data.data.answers).toHaveLength(5)
    expect(data.data.answers[0].questionText).toBeDefined()
  })
  
  it('should return answers for nurse', async () => {
    // Similar test for nurse role
  })
  
  it('should return empty answers when none exist', async () => {
    // Test empty state
  })
})
```

## Regression Testing

### Tables Using is_clinician()
Verify these still work correctly:

1. **assessment_answers** ✅
   ```sql
   -- As clinician, should see all answers
   SELECT COUNT(*) FROM assessment_answers;
   ```

2. **patient_measures** ✅
   ```sql
   -- As clinician, should see all measures
   SELECT COUNT(*) FROM patient_measures;
   ```

3. **patient_state** ✅
   ```sql
   -- As clinician, should see all states
   SELECT COUNT(*) FROM patient_state;
   ```

4. **patient_profiles** ✅
   ```sql
   -- As clinician, should see all profiles
   SELECT COUNT(*) FROM patient_profiles;
   ```

5. **reports** ✅
   ```sql
   -- As clinician, should see all reports
   SELECT COUNT(*) FROM reports;
   ```

## Performance Testing

### Query Performance Check
```sql
EXPLAIN ANALYZE
SELECT *
FROM assessment_answers
WHERE assessment_id = '[test-uuid]';

-- Verify:
-- - Query plan is efficient
-- - is_clinician() doesn't cause significant overhead
-- - Indexes are being used
```

## Rollback Plan

If issues are discovered after deployment:

### Option 1: Revert Migration
```sql
-- Restore original function (without nurse role)
CREATE OR REPLACE FUNCTION "public"."is_clinician"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
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

### Option 2: Emergency Hotfix
If is_clinician() is causing issues, temporarily grant direct access:
```sql
-- EMERGENCY ONLY - bypasses RLS completely
GRANT SELECT ON assessment_answers TO authenticated;
```

## Post-Deployment Monitoring

### Metrics to Watch
1. **Error rates** in API endpoint `/api/clinician/assessments/*/details`
2. **Response times** for assessment detail pages
3. **User feedback** - clinicians reporting empty answers
4. **Database performance** - is_clinician() execution time

### Success Criteria
- ✅ Zero reports of "Keine Antworten vorhanden" for assessments with data
- ✅ All 5 RLS policies using is_clinician() function correctly
- ✅ No increase in error rates
- ✅ No performance degradation

## Known Limitations
- Migration does NOT fix historical JWT tokens (not an issue since we query DB)
- Migration does NOT add custom access token hook (not needed with this fix)
- Nurse role access is new - ensure nurses are properly assigned this role

## Support Documentation
- Full technical details: `ISSUE-04-FIX-SUMMARY.md`
- Migration file: `supabase/migrations/20260206162100_fix_is_clinician_use_app_metadata.sql`
- Schema changes: `schema/schema.sql` (lines 1628-1645)
