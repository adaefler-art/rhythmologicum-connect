-- E75.1 RLS Verification Tests for Anamnesis Tables
-- Purpose: Verify RLS policies correctly isolate patient data and enforce access control
-- Date: 2026-02-02
-- Issue: E75.1

\echo '=== E75.1 Anamnesis RLS Verification Tests ==='
\echo ''

-- =============================================================================
-- TEST 1: Verify RLS is enabled on anamnesis tables
-- =============================================================================

\echo '--- Test 1: Verify RLS enabled on anamnesis tables ---'

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('anamnesis_entries', 'anamnesis_entry_versions')
ORDER BY tablename;

\echo ''

-- =============================================================================
-- TEST 2: Count policies per anamnesis table
-- =============================================================================

\echo '--- Test 2: Count policies per anamnesis table ---'

SELECT 
    tablename, 
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('anamnesis_entries', 'anamnesis_entry_versions')
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- =============================================================================
-- TEST 3: Verify indexes exist
-- =============================================================================

\echo '--- Test 3: Verify required indexes exist ---'

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('anamnesis_entries', 'anamnesis_entry_versions')
  AND indexname LIKE 'idx_anamnesis%'
ORDER BY tablename, indexname;

\echo ''

-- =============================================================================
-- TEST 4: Verify foreign key constraints
-- =============================================================================

\echo '--- Test 4: Verify foreign key constraints ---'

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('anamnesis_entries', 'anamnesis_entry_versions')
ORDER BY tc.table_name, tc.constraint_name;

\echo ''

-- =============================================================================
-- TEST 5: Verify triggers exist
-- =============================================================================

\echo '--- Test 5: Verify versioning and audit triggers exist ---'

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'anamnesis_entries'
  AND trigger_name LIKE '%anamnesis%'
ORDER BY trigger_name;

\echo ''

-- =============================================================================
-- TEST 6: Verify unique constraints
-- =============================================================================

\echo '--- Test 6: Verify unique constraints on versions table ---'

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'anamnesis_entry_versions'
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_name;

\echo ''

-- =============================================================================
-- TEST 7: Simulate patient isolation (requires test data)
-- =============================================================================

\echo '--- Test 7: Patient isolation check (conceptual) ---'
\echo 'NOTE: This test requires test data to be created.'
\echo 'Verification: Patient A should NOT see Patient B entries'
\echo 'Implementation: Use patient_profiles.user_id = auth.uid() in RLS policies'
\echo ''

-- Conceptual test query (would fail without proper test users):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims TO '{"sub": "<patient_a_user_id>"}';
-- SELECT COUNT(*) as visible_entries FROM public.anamnesis_entries;
-- -- Should only return Patient A's entries

\echo ''

-- =============================================================================
-- TEST 8: Verify clinician assignment access (requires test data)
-- =============================================================================

\echo '--- Test 8: Clinician assignment access check (conceptual) ---'
\echo 'NOTE: This test requires test data with clinician_patient_assignments.'
\echo 'Verification: Clinician should ONLY see entries for assigned patients'
\echo 'Implementation: JOIN with clinician_patient_assignments in RLS policies'
\echo ''

-- Conceptual test query (would fail without proper test users):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims TO '{"sub": "<clinician_user_id>", "role": "clinician"}';
-- SELECT COUNT(*) as visible_entries FROM public.anamnesis_entries;
-- -- Should only return entries for assigned patients

\echo ''

-- =============================================================================
-- TEST 9: Verify admin org access (requires test data)
-- =============================================================================

\echo '--- Test 9: Admin org access check (conceptual) ---'
\echo 'NOTE: This test requires test data with user_org_membership.'
\echo 'Verification: Admin should ONLY see entries within their org'
\echo 'Implementation: current_user_role(organization_id) = admin in RLS policies'
\echo ''

-- Conceptual test query (would fail without proper test users):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>", "role": "admin"}';
-- SELECT COUNT(*) as visible_entries FROM public.anamnesis_entries;
-- -- Should only return entries for admin's org

\echo ''

-- =============================================================================
-- TEST 10: Verify version immutability
-- =============================================================================

\echo '--- Test 10: Version immutability check ---'
\echo 'NOTE: anamnesis_entry_versions has NO UPDATE/DELETE policies'
\echo 'Versions are immutable and can only be created by triggers'
\echo ''

SELECT 
    tablename,
    policyname,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'anamnesis_entry_versions'
ORDER BY policyname;

\echo ''
\echo 'Expected: Only SELECT policies, NO INSERT/UPDATE/DELETE policies for versions'
\echo ''

-- =============================================================================
-- TEST 11: Check table comments/documentation
-- =============================================================================

\echo '--- Test 11: Verify table documentation ---'

SELECT 
    c.relname as table_name,
    pg_catalog.obj_description(c.oid, 'pg_class') as table_comment
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('anamnesis_entries', 'anamnesis_entry_versions')
ORDER BY c.relname;

\echo ''

-- =============================================================================
-- SUMMARY
-- =============================================================================

\echo '--- Summary ---'

DO $$
DECLARE
    rls_enabled_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
    expected_tables INTEGER := 2;
    expected_policies INTEGER := 11;  -- Based on R-E75.1-1 through R-E75.1-11
    expected_indexes INTEGER := 6;
    expected_triggers INTEGER := 2;  -- versioning + audit
BEGIN
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('anamnesis_entries', 'anamnesis_entry_versions')
      AND rowsecurity = true;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('anamnesis_entries', 'anamnesis_entry_versions');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('anamnesis_entries', 'anamnesis_entry_versions')
      AND indexname LIKE 'idx_anamnesis%';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'anamnesis_entries'
      AND trigger_name LIKE '%anamnesis%';
    
    RAISE NOTICE 'RLS Enabled Tables: % of %', rls_enabled_count, expected_tables;
    RAISE NOTICE 'Total Policies: % (expected: %)', policy_count, expected_policies;
    RAISE NOTICE 'Indexes: % (expected: %)', index_count, expected_indexes;
    RAISE NOTICE 'Triggers: % (expected: %)', trigger_count, expected_triggers;
    
    IF rls_enabled_count < expected_tables THEN
        RAISE WARNING 'FAIL (violates R-E75.1-12): Only % of % tables have RLS enabled', rls_enabled_count, expected_tables;
    ELSIF policy_count < expected_policies THEN
        RAISE WARNING 'FAIL (violates R-E75.1-13): Only % policies found (expected %)', policy_count, expected_policies;
    ELSIF index_count < expected_indexes THEN
        RAISE WARNING 'FAIL (violates R-E75.1-14): Only % indexes found (expected %)', index_count, expected_indexes;
    ELSIF trigger_count < expected_triggers THEN
        RAISE WARNING 'FAIL (violates R-E75.1-15): Only % triggers found (expected %)', trigger_count, expected_triggers;
    ELSE
        RAISE NOTICE 'PASS: All E75.1 RLS verification checks passed';
    END IF;
END $$;

\echo ''
\echo '=== E75.1 Verification Complete ==='
\echo ''
\echo 'NEXT STEPS:'
\echo '1. Create test data (organizations, users, patient_profiles, clinician_patient_assignments)'
\echo '2. Run isolation tests with different user contexts (patient/clinician/admin)'
\echo '3. Verify no cross-org data leaks'
\echo '4. Test versioning trigger creates immutable history'
\echo '5. Verify audit_log entries are created'
