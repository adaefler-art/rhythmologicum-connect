# RLS Testing Guide

This guide helps you test the Row Level Security (RLS) policies implemented in D4.

## Prerequisites

1. Supabase project set up locally or in cloud
2. Test users created with different roles
3. Database migrations applied

## Setup Test Users

### Step 1: Create Test Accounts

Create three test users via Supabase Auth:

1. **patient1@test.com** - Regular patient
2. **patient2@test.com** - Another patient (for cross-patient tests)
3. **clinician@test.com** - Clinician with full access

You can create them via:
- Supabase Dashboard → Authentication → Users → Add User
- Or your application's signup flow

### Step 2: Assign Clinician Role

```sql
-- In Supabase SQL Editor
SELECT set_user_role('clinician@test.com', 'clinician');

-- Verify role assignment
SELECT email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE email = 'clinician@test.com';
```

### Step 3: Create Test Data

```sql
-- Get user IDs
SELECT id, email FROM auth.users WHERE email LIKE '%@test.com';

-- Create patient profiles (replace <user_id> with actual UUIDs)
INSERT INTO patient_profiles (user_id, full_name, birth_year, sex)
VALUES 
  ('<patient1_user_id>', 'Test Patient 1', 1990, 'female'),
  ('<patient2_user_id>', 'Test Patient 2', 1985, 'male');

-- Create assessments for patient1
INSERT INTO assessments (patient_id, funnel, completed_at)
SELECT id, 'stress_test', NOW()
FROM patient_profiles
WHERE user_id = '<patient1_user_id>';

-- Create assessments for patient2
INSERT INTO assessments (patient_id, funnel, completed_at)
SELECT id, 'stress_test', NOW()
FROM patient_profiles
WHERE user_id = '<patient2_user_id>';
```

## Test Scenarios

### Test 1: Patient Can Only See Own Profile

**Login as:** patient1@test.com

**Run query:**
```sql
SELECT * FROM patient_profiles;
```

**Expected result:** ✅ Returns 1 row (patient1's profile only)

**Verify:**
```sql
-- This should return 0 rows
SELECT * FROM patient_profiles WHERE user_id != auth.uid();
```

---

### Test 2: Clinician Can See All Profiles

**Login as:** clinician@test.com

**Run query:**
```sql
SELECT id, full_name, user_id FROM patient_profiles ORDER BY created_at;
```

**Expected result:** ✅ Returns 2 rows (both patients)

---

### Test 3: Patient Cannot Access Other Patient's Data

**Login as:** patient1@test.com

**Run query:**
```sql
-- Try to access patient2's assessments
SELECT * FROM assessments 
WHERE patient_id != (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
);
```

**Expected result:** ✅ Returns 0 rows (cross-patient access blocked)

---

### Test 4: Helper Function - is_clinician()

**Login as:** patient1@test.com
```sql
SELECT public.is_clinician();  -- Should return: false
```

**Login as:** clinician@test.com
```sql
SELECT public.is_clinician();  -- Should return: true
```

---

### Test 5: Helper Function - get_my_patient_profile_id()

**Login as:** patient1@test.com
```sql
SELECT public.get_my_patient_profile_id();
-- Should return: patient1's profile UUID
```

**Verify it matches:**
```sql
SELECT id FROM patient_profiles WHERE user_id = auth.uid();
-- Should return the same UUID
```

---

### Test 6: Patient Cannot Insert Data for Another Patient

**Login as:** patient1@test.com

```sql
-- Get patient2's profile ID
DO $$
DECLARE
  patient2_id uuid;
BEGIN
  SELECT id INTO patient2_id
  FROM patient_profiles 
  WHERE user_id != auth.uid() 
  LIMIT 1;
  
  -- Try to insert assessment for patient2 (should fail)
  INSERT INTO assessments (patient_id, funnel)
  VALUES (patient2_id, 'unauthorized_test');
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Expected error: %', SQLERRM;
END $$;
```

**Expected result:** ✅ Error or RLS policy violation

---

### Test 7: Clinician Can View All Reports

**Login as:** clinician@test.com

```sql
SELECT 
  r.id, 
  r.score_numeric, 
  r.risk_level, 
  a.patient_id, 
  p.full_name
FROM reports r
JOIN assessments a ON r.assessment_id = a.id
JOIN patient_profiles p ON a.patient_id = p.id
ORDER BY r.created_at DESC;
```

**Expected result:** ✅ Returns all reports from all patients

---

### Test 8: Patient Can Only See Own Reports

**Login as:** patient1@test.com

```sql
SELECT 
  r.id, 
  r.score_numeric, 
  r.risk_level, 
  a.patient_id
FROM reports r
JOIN assessments a ON r.assessment_id = a.id;
```

**Expected result:** ✅ Returns only patient1's reports

---

### Test 9: Unauthenticated Access Blocked

**Logout** (or open incognito/new session)

**Run query:**
```sql
SELECT * FROM patient_profiles;
SELECT * FROM assessments;
SELECT * FROM patient_measures;
```

**Expected result:** ✅ Returns 0 rows or authentication error

---

### Test 10: Patient Cannot Update Other Patient's Data

**Login as:** patient1@test.com

```sql
-- Try to update patient2's profile (should affect 0 rows)
UPDATE patient_profiles 
SET full_name = 'Hacked Name'
WHERE user_id != auth.uid();

-- Check how many rows were affected
GET DIAGNOSTICS row_count = ROW_COUNT;
SELECT row_count;  -- Should be 0
```

**Expected result:** ✅ 0 rows updated

---

## Testing via Application

### Test with Patient Account

1. **Login as patient1@test.com**
2. Navigate to `/patient/history`
3. Verify you only see your own assessment history
4. Open browser DevTools → Network tab
5. Check the API response contains only your data

### Test with Clinician Account

1. **Login as clinician@test.com**
2. Navigate to `/clinician`
3. Verify you see all patients in the overview
4. Click on a patient
5. Verify you can see their detailed data
6. Open browser DevTools → Network tab
7. Check the API response contains data for all patients

### Test Cross-Account Access (Should Fail)

1. Login as patient1@test.com
2. Get patient2's ID from database
3. Try to manually navigate to `/patient/history?patientId=<patient2_id>`
4. Verify you still only see your own data (or error)

## Verifying RLS Violation Logs

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to Logs section
3. Filter by "WARNING"
4. Search for "RLS_VIOLATION"
5. Verify violations are logged with:
   - User ID
   - Table name
   - Operation
   - Timestamp

### Example Log Entry

```
WARNING: RLS_VIOLATION: user=a1b2c3d4-... table=patient_profiles operation=SELECT id=e5f6g7h8-... timestamp=2025-12-07T10:30:00Z
```

## Automated Testing Script

For convenience, you can create a test script:

```bash
#!/bin/bash
# test-rls.sh

echo "Testing RLS Policies..."

# Test 1: Patient access
echo "Test 1: Patient can see own data"
# Execute SQL as patient1...

# Test 2: Clinician access
echo "Test 2: Clinician can see all data"
# Execute SQL as clinician...

# etc.
```

## Troubleshooting

### Issue: "No rows returned" for valid data

**Check:**
1. User is authenticated: `SELECT auth.uid();`
2. Patient profile exists: `SELECT * FROM patient_profiles WHERE user_id = auth.uid();`
3. Role is correct: `SELECT public.is_clinician();`

### Issue: Clinician cannot see data

**Check:**
```sql
-- Verify role is set
SELECT 
  email, 
  raw_app_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'clinician@test.com';

-- If role is NULL or wrong, fix it:
SELECT set_user_role('clinician@test.com', 'clinician');
```

### Issue: Unexpected access to other patients' data

**Check:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('patient_profiles', 'assessments', 'reports', 'patient_measures');

-- All should show rowsecurity = true
```

## Cleanup

To remove test data:

```sql
-- Delete test data
DELETE FROM assessment_answers 
WHERE assessment_id IN (
  SELECT id FROM assessments 
  WHERE patient_id IN (
    SELECT id FROM patient_profiles 
    WHERE user_id IN (
      SELECT id FROM auth.users 
      WHERE email LIKE '%@test.com'
    )
  )
);

DELETE FROM reports 
WHERE assessment_id IN (
  SELECT id FROM assessments 
  WHERE patient_id IN (
    SELECT id FROM patient_profiles 
    WHERE user_id IN (
      SELECT id FROM auth.users 
      WHERE email LIKE '%@test.com'
    )
  )
);

DELETE FROM patient_measures
WHERE patient_id IN (
  SELECT id FROM patient_profiles 
  WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%@test.com'
  )
);

DELETE FROM assessments 
WHERE patient_id IN (
  SELECT id FROM patient_profiles 
  WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%@test.com'
  )
);

DELETE FROM patient_profiles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@test.com'
);

-- Delete test users (via Supabase Dashboard)
```

## Success Criteria

✅ All tests pass
✅ Patients can only see their own data
✅ Clinicians can see all patient data
✅ Cross-patient access attempts fail
✅ Unauthenticated access is blocked
✅ RLS violations are logged
✅ Helper functions work correctly
✅ Application continues to work normally

## Next Steps

After successful testing:

1. Deploy migrations to production
2. Monitor RLS violation logs
3. Update application documentation
4. Train clinicians on data access capabilities
5. Set up alerts for unusual RLS violations
