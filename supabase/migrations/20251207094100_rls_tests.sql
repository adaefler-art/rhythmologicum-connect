-- Migration: RLS Policy Tests
-- Description: D4 - Tests for Row Level Security policies (should-fail tests)
-- This migration contains test queries that verify RLS policies work correctly
-- Date: 2025-12-07
--
-- NOTE: These tests are documented SQL queries that can be run manually
-- They are not executed automatically during migration

-- ============================================================================
-- TEST SETUP
-- ============================================================================

-- Test users should be created with these roles:
-- 1. patient1@test.com - role: patient (or no role)
-- 2. patient2@test.com - role: patient (or no role)
-- 3. clinician@test.com - role: clinician
--
-- Use the set_user_role function:
-- SELECT set_user_role('clinician@test.com', 'clinician');

-- ============================================================================
-- TEST 1: Patient can only see their own profile
-- ============================================================================

-- Expected: Should only return patient1's profile
-- Run as: patient1@test.com
-- SELECT * FROM patient_profiles;

-- Expected: Should return 0 rows (patient1 cannot see patient2's profile)
-- Run as: patient1@test.com
-- SELECT * FROM patient_profiles WHERE user_id != auth.uid();

-- ============================================================================
-- TEST 2: Clinician can see all patient profiles
-- ============================================================================

-- Expected: Should return all patient profiles
-- Run as: clinician@test.com
-- SELECT id, full_name, user_id FROM patient_profiles ORDER BY created_at;

-- ============================================================================
-- TEST 3: Patient can only see their own assessments
-- ============================================================================

-- Expected: Should only return patient1's assessments
-- Run as: patient1@test.com
-- SELECT * FROM assessments;

-- Expected: Should return 0 rows (patient1 cannot see patient2's assessments)
-- Run as: patient1@test.com
-- SELECT * FROM assessments a
-- WHERE a.patient_id != (SELECT id FROM patient_profiles WHERE user_id = auth.uid());

-- ============================================================================
-- TEST 4: Clinician can see all assessments
-- ============================================================================

-- Expected: Should return all assessments
-- Run as: clinician@test.com
-- SELECT a.id, a.patient_id, a.funnel, a.started_at 
-- FROM assessments a 
-- ORDER BY a.created_at DESC;

-- ============================================================================
-- TEST 5: Patient can only see their own reports
-- ============================================================================

-- Expected: Should only return patient1's reports
-- Run as: patient1@test.com
-- SELECT r.* 
-- FROM reports r
-- JOIN assessments a ON r.assessment_id = a.id
-- JOIN patient_profiles p ON a.patient_id = p.id
-- WHERE p.user_id = auth.uid();

-- Expected: Should return 0 rows (cannot access other patient's reports)
-- Run as: patient1@test.com
-- SELECT r.* 
-- FROM reports r
-- JOIN assessments a ON r.assessment_id = a.id
-- JOIN patient_profiles p ON a.patient_id = p.id
-- WHERE p.user_id != auth.uid();

-- ============================================================================
-- TEST 6: Clinician can see all reports
-- ============================================================================

-- Expected: Should return all reports with patient info
-- Run as: clinician@test.com
-- SELECT r.id, r.score_numeric, r.risk_level, a.patient_id, p.full_name
-- FROM reports r
-- JOIN assessments a ON r.assessment_id = a.id
-- JOIN patient_profiles p ON a.patient_id = p.id
-- ORDER BY r.created_at DESC;

-- ============================================================================
-- TEST 7: Patient can only see their own patient_measures
-- ============================================================================

-- Expected: Should only return patient1's measures
-- Run as: patient1@test.com
-- SELECT * FROM patient_measures;

-- Expected: Should return 0 rows
-- Run as: patient1@test.com
-- SELECT * FROM patient_measures 
-- WHERE patient_id != (SELECT id FROM patient_profiles WHERE user_id = auth.uid());

-- ============================================================================
-- TEST 8: Clinician can see all patient_measures
-- ============================================================================

-- Expected: Should return all measures with patient names
-- Run as: clinician@test.com
-- SELECT pm.id, pm.stress_score, pm.risk_level, p.full_name, pm.created_at
-- FROM patient_measures pm
-- JOIN patient_profiles p ON pm.patient_id = p.id
-- ORDER BY pm.created_at DESC;

-- ============================================================================
-- TEST 9: Unauthenticated user cannot access any data
-- ============================================================================

-- Expected: Should return 0 rows for all tables (or authentication error)
-- Run as: not authenticated
-- SELECT * FROM patient_profiles;
-- SELECT * FROM assessments;
-- SELECT * FROM assessment_answers;
-- SELECT * FROM reports;
-- SELECT * FROM patient_measures;

-- ============================================================================
-- TEST 10: Patient cannot insert data for another patient
-- ============================================================================

-- Expected: Should fail with RLS violation
-- Run as: patient1@test.com (get their profile_id first)
-- First get patient2's profile_id:
-- SELECT id FROM patient_profiles WHERE email != (SELECT email FROM auth.users WHERE id = auth.uid()) LIMIT 1;
-- 
-- Then try to insert assessment for patient2:
-- INSERT INTO assessments (patient_id, funnel)
-- VALUES ('<patient2_profile_id>', 'test_funnel');

-- ============================================================================
-- TEST 11: Helper function tests
-- ============================================================================

-- Expected: Returns false for patients, true for clinicians
-- Run as: patient1@test.com
-- SELECT public.is_clinician();  -- Should return false

-- Run as: clinician@test.com
-- SELECT public.is_clinician();  -- Should return true

-- Expected: Returns patient's profile ID
-- Run as: patient1@test.com
-- SELECT public.get_my_patient_profile_id();

-- ============================================================================
-- TEST 12: Cross-patient data access attempts (should fail)
-- ============================================================================

-- Setup: Create test data for two patients
-- Then run as patient1 to try accessing patient2's data

-- Expected: UPDATE should fail or affect 0 rows
-- Run as: patient1@test.com
-- UPDATE patient_profiles 
-- SET full_name = 'Hacked Name'
-- WHERE user_id != auth.uid();

-- Expected: DELETE should fail or affect 0 rows
-- Run as: patient1@test.com
-- DELETE FROM assessments
-- WHERE patient_id != (SELECT id FROM patient_profiles WHERE user_id = auth.uid());

-- ============================================================================
-- TEST DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA public IS 'RLS tests documented in migration 20251207094100_rls_tests.sql. Run tests manually with appropriate user contexts.';

-- Create a test results table (optional, for tracking manual test runs)
CREATE TABLE IF NOT EXISTS public.rls_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  test_user text NOT NULL,
  expected_result text NOT NULL,
  actual_result text,
  passed boolean,
  tested_at timestamptz DEFAULT NOW(),
  notes text
);

COMMENT ON TABLE public.rls_test_results IS 'Optional table for documenting manual RLS test results';

-- Don't enable RLS on test results table (clinicians should manage it)
GRANT SELECT, INSERT, UPDATE ON public.rls_test_results TO authenticated;
