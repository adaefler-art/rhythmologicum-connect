-- RLS Policy Verification Script
-- Purpose: Verify V0.5 RLS policies work correctly
-- Usage: Run via scripts/rls/verify-rls.ps1 after npm run db:reset
-- Date: 2025-12-31
-- Issue: V05-I01.2

\echo '=== V0.5 RLS Verification Tests ==='
\echo ''

-- =============================================================================
-- SMOKE TEST 1: Verify RLS is enabled on all tables
-- =============================================================================

\echo '--- Test 1: Verify RLS enabled on all tables ---'

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'organizations', 'user_profiles', 'user_org_membership', 
    'patient_profiles', 'funnels_catalog', 'funnel_versions',
    'patient_funnels', 'assessments', 'assessment_events',
    'assessment_answers', 'documents', 'calculated_results',
    'reports', 'report_sections', 'tasks', 'notifications',
    'audit_log', 'clinician_patient_assignments'
  )
ORDER BY tablename;

\echo ''

-- =============================================================================
-- SMOKE TEST 2: Count policies per table
-- =============================================================================

\echo '--- Test 2: Count policies per table ---'

SELECT 
    tablename, 
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

\echo ''

-- =============================================================================
-- SMOKE TEST 3: Verify helper functions exist
-- =============================================================================

\echo '--- Test 3: Verify RLS helper functions exist ---'

SELECT 
    proname as function_name,
    CASE provolatile 
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility,
    CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security
FROM pg_proc
WHERE proname IN (
  'get_user_org_ids', 'is_member_of_org', 'current_user_role',
  'has_any_role', 'is_assigned_to_patient', 
  'get_my_patient_profile_id', 'is_clinician'
)
ORDER BY proname;

\echo ''

-- =============================================================================
-- SMOKE TEST 4: Verify no tables are missing RLS
-- =============================================================================

\echo '--- Test 4: Check for tables that should have RLS but dont ---'

SELECT 
    tablename,
    'MISSING RLS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'organizations', 'user_profiles', 'user_org_membership', 
    'patient_profiles', 'funnels_catalog', 'funnel_versions',
    'patient_funnels', 'assessments', 'assessment_events',
    'assessment_answers', 'documents', 'calculated_results',
    'reports', 'report_sections', 'tasks', 'notifications',
    'audit_log', 'clinician_patient_assignments'
  )
  AND rowsecurity = false
ORDER BY tablename;

\echo ''

-- =============================================================================
-- SMOKE TEST 5: Verify clinician_patient_assignments constraints
-- =============================================================================

\echo '--- Test 5: Verify clinician_patient_assignments table structure ---'

SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.clinician_patient_assignments'::regclass
ORDER BY contype, conname;

\echo ''

-- =============================================================================
-- SUMMARY
-- =============================================================================

\echo '--- Summary ---'

DO $$
DECLARE
    missing_rls_count INTEGER;
    total_expected INTEGER := 19;
    rls_enabled_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'organizations', 'user_profiles', 'user_org_membership', 
        'patient_profiles', 'funnels_catalog', 'funnel_versions',
        'patient_funnels', 'assessments', 'assessment_events',
        'assessment_answers', 'documents', 'calculated_results',
        'reports', 'report_sections', 'tasks', 'notifications',
        'audit_log', 'clinician_patient_assignments'
      )
      AND rowsecurity = true;
    
    -- Count tables missing RLS
    SELECT COUNT(*) INTO missing_rls_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'organizations', 'user_profiles', 'user_org_membership', 
        'patient_profiles', 'funnels_catalog', 'funnel_versions',
        'patient_funnels', 'assessments', 'assessment_events',
        'assessment_answers', 'documents', 'calculated_results',
        'reports', 'report_sections', 'tasks', 'notifications',
        'audit_log', 'clinician_patient_assignments'
      )
      AND rowsecurity = false;
    
    -- Count total policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Count helper functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN (
      'get_user_org_ids', 'is_member_of_org', 'current_user_role',
      'has_any_role', 'is_assigned_to_patient'
    );
    
    RAISE NOTICE 'RLS Enabled Tables: % of %', rls_enabled_count, total_expected;
    RAISE NOTICE 'Missing RLS: %', missing_rls_count;
    RAISE NOTICE 'Total Policies: %', policy_count;
    RAISE NOTICE 'Helper Functions: % of 5', function_count;
    
    IF missing_rls_count > 0 THEN
        RAISE WARNING 'FAIL: % tables are missing RLS policies', missing_rls_count;
    ELSIF rls_enabled_count < total_expected THEN
        RAISE WARNING 'FAIL: Only % of % expected tables have RLS enabled', rls_enabled_count, total_expected;
    ELSIF policy_count < 40 THEN
        RAISE WARNING 'FAIL: Only % policies found (expected 40+)', policy_count;
    ELSIF function_count < 5 THEN
        RAISE WARNING 'FAIL: Only % helper functions found (expected 5)', function_count;
    ELSE
        RAISE NOTICE 'PASS: All RLS verification checks passed';
    END IF;
END $$;

\echo ''
\echo '=== Verification Complete ==='
