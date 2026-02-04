-- E76.7: RLS Tests for Diagnosis Tables
-- Tests for assignment-based access control policies
-- Run with: psql -U postgres -d rhythmologicum_connect -f test/e76-7-diagnosis-rls-tests.sql

-- =============================================================================
-- TEST SETUP
-- =============================================================================

BEGIN;

-- Set schema
SET search_path TO public, auth;

-- =============================================================================
-- TEST 1: Verify RLS is enabled on diagnosis tables
-- =============================================================================

DO $$
DECLARE
  diagnosis_runs_rls_enabled BOOLEAN;
  diagnosis_artifacts_rls_enabled BOOLEAN;
BEGIN
  -- Check if RLS is enabled on diagnosis_runs
  SELECT relrowsecurity INTO diagnosis_runs_rls_enabled
  FROM pg_class
  WHERE relname = 'diagnosis_runs'
    AND relnamespace = 'public'::regnamespace;

  -- Check if RLS is enabled on diagnosis_artifacts
  SELECT relrowsecurity INTO diagnosis_artifacts_rls_enabled
  FROM pg_class
  WHERE relname = 'diagnosis_artifacts'
    AND relnamespace = 'public'::regnamespace;

  -- Assert both are enabled
  IF NOT diagnosis_runs_rls_enabled THEN
    RAISE EXCEPTION 'violates R-E76.7-1: RLS not enabled on diagnosis_runs';
  END IF;

  IF NOT diagnosis_artifacts_rls_enabled THEN
    RAISE EXCEPTION 'violates R-E76.7-2: RLS not enabled on diagnosis_artifacts';
  END IF;

  RAISE NOTICE 'TEST 1 PASSED: RLS enabled on both tables';
END $$;

-- =============================================================================
-- TEST 2: Count RLS policies on diagnosis_runs
-- =============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Expected policies:
  -- 1. diagnosis_runs_clinician_assigned_read (SELECT)
  -- 2. diagnosis_runs_patient_read (SELECT)
  -- 3. diagnosis_runs_clinician_insert (INSERT)
  -- 4. diagnosis_runs_system_update (UPDATE)
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'diagnosis_runs';

  IF policy_count < 4 THEN
    RAISE EXCEPTION 'violates R-E76.7-3: Expected at least 4 policies on diagnosis_runs, found %', policy_count;
  END IF;

  RAISE NOTICE 'TEST 2 PASSED: Found % policies on diagnosis_runs', policy_count;
END $$;

-- =============================================================================
-- TEST 3: Count RLS policies on diagnosis_artifacts
-- =============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Expected policies:
  -- 1. diagnosis_artifacts_clinician_assigned_read (SELECT)
  -- 2. diagnosis_artifacts_patient_read (SELECT)
  -- 3. diagnosis_artifacts_system_insert (INSERT)
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'diagnosis_artifacts';

  IF policy_count < 3 THEN
    RAISE EXCEPTION 'violates R-E76.7-4: Expected at least 3 policies on diagnosis_artifacts, found %', policy_count;
  END IF;

  RAISE NOTICE 'TEST 3 PASSED: Found % policies on diagnosis_artifacts', policy_count;
END $$;

-- =============================================================================
-- TEST 4: Verify indexes exist on diagnosis_runs
-- =============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Expected indexes:
  -- - idx_diagnosis_runs_patient_id
  -- - idx_diagnosis_runs_clinician_id
  -- - idx_diagnosis_runs_status
  -- - idx_diagnosis_runs_created_at
  -- - idx_diagnosis_runs_inputs_hash
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'diagnosis_runs'
    AND indexname LIKE 'idx_diagnosis_runs_%';

  IF index_count < 5 THEN
    RAISE EXCEPTION 'violates R-E76.7-5: Expected at least 5 indexes on diagnosis_runs, found %', index_count;
  END IF;

  RAISE NOTICE 'TEST 4 PASSED: Found % indexes on diagnosis_runs', index_count;
END $$;

-- =============================================================================
-- TEST 5: Verify indexes exist on diagnosis_artifacts
-- =============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Expected indexes:
  -- - idx_diagnosis_artifacts_run_id
  -- - idx_diagnosis_artifacts_patient_id
  -- - idx_diagnosis_artifacts_created_at
  -- - idx_diagnosis_artifacts_risk_level
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'diagnosis_artifacts'
    AND indexname LIKE 'idx_diagnosis_artifacts_%';

  IF index_count < 4 THEN
    RAISE EXCEPTION 'violates R-E76.7-6: Expected at least 4 indexes on diagnosis_artifacts, found %', index_count;
  END IF;

  RAISE NOTICE 'TEST 5 PASSED: Found % indexes on diagnosis_artifacts', index_count;
END $$;

-- =============================================================================
-- TEST 6: Verify audit trigger exists on diagnosis_runs
-- =============================================================================

DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'diagnosis_runs'
      AND trigger_name = 'trigger_diagnosis_runs_audit'
  ) INTO trigger_exists;

  IF NOT trigger_exists THEN
    RAISE EXCEPTION 'violates R-E76.7-7: Audit trigger not found on diagnosis_runs';
  END IF;

  RAISE NOTICE 'TEST 6 PASSED: Audit trigger exists on diagnosis_runs';
END $$;

-- =============================================================================
-- TEST 7: Verify audit trigger exists on diagnosis_artifacts
-- =============================================================================

DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'diagnosis_artifacts'
      AND trigger_name = 'trigger_diagnosis_artifacts_audit'
  ) INTO trigger_exists;

  IF NOT trigger_exists THEN
    RAISE EXCEPTION 'violates R-E76.7-8: Audit trigger not found on diagnosis_artifacts';
  END IF;

  RAISE NOTICE 'TEST 7 PASSED: Audit trigger exists on diagnosis_artifacts';
END $$;

-- =============================================================================
-- TEST 8: Verify assignment-based policy exists (not broad clinician access)
-- =============================================================================

DO $$
DECLARE
  assignment_policy_exists BOOLEAN;
  broad_policy_exists BOOLEAN;
BEGIN
  -- Check that assignment-based policy exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diagnosis_runs'
      AND policyname = 'diagnosis_runs_clinician_assigned_read'
  ) INTO assignment_policy_exists;

  -- Check that old broad policy does NOT exist
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diagnosis_runs'
      AND policyname = 'diagnosis_runs_clinician_read'
  ) INTO broad_policy_exists;

  IF NOT assignment_policy_exists THEN
    RAISE EXCEPTION 'violates R-E76.7-9: Assignment-based policy not found on diagnosis_runs';
  END IF;

  IF broad_policy_exists THEN
    RAISE EXCEPTION 'violates R-E76.7-10: Broad clinician policy should be removed from diagnosis_runs';
  END IF;

  RAISE NOTICE 'TEST 8 PASSED: Assignment-based policy exists, broad policy removed';
END $$;

-- =============================================================================
-- TEST 9: Verify audit_log table can receive diagnosis events
-- =============================================================================

DO $$
DECLARE
  audit_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'audit_log'
  ) INTO audit_table_exists;

  IF NOT audit_table_exists THEN
    RAISE EXCEPTION 'violates R-E76.7-11: audit_log table not found';
  END IF;

  RAISE NOTICE 'TEST 9 PASSED: audit_log table exists';
END $$;

-- =============================================================================
-- TEST 10: Verify clinician_patient_assignments table exists
-- =============================================================================

DO $$
DECLARE
  assignments_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'clinician_patient_assignments'
  ) INTO assignments_table_exists;

  IF NOT assignments_table_exists THEN
    RAISE EXCEPTION 'violates R-E76.7-12: clinician_patient_assignments table not found (required for RLS)';
  END IF;

  RAISE NOTICE 'TEST 10 PASSED: clinician_patient_assignments table exists';
END $$;

-- =============================================================================
-- TEST SUMMARY
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'E76.7 RLS Tests - Summary';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'All tests PASSED';
  RAISE NOTICE '- RLS enabled on both tables';
  RAISE NOTICE '- Assignment-based policies in place';
  RAISE NOTICE '- Audit triggers configured';
  RAISE NOTICE '- Required indexes exist';
  RAISE NOTICE '- Supporting tables verified';
  RAISE NOTICE '======================================';
END $$;

ROLLBACK;
