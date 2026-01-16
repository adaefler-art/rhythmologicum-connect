-- E6.6.6: Triage Sessions RLS Verification
-- Purpose: Verify RLS policies work correctly for triage_sessions table
-- AC2: Patient can only read own; clinician/admin can read all

\echo '=== E6.6.6 Triage Sessions RLS Tests ==='
\echo ''

-- =============================================================================
-- TEST 1: Verify RLS is enabled on triage_sessions
-- =============================================================================

\echo '--- Test 1: Verify RLS enabled on triage_sessions ---'

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'triage_sessions';

\echo ''

-- =============================================================================
-- TEST 2: Count policies on triage_sessions
-- =============================================================================

\echo '--- Test 2: Count policies on triage_sessions ---'

SELECT 
    policyname,
    cmd as operation,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'triage_sessions'
ORDER BY policyname;

\echo ''

-- =============================================================================
-- TEST 3: Verify table structure and constraints
-- =============================================================================

\echo '--- Test 3: Verify triage_sessions table structure ---'

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'triage_sessions'
ORDER BY ordinal_position;

\echo ''

-- =============================================================================
-- TEST 4: Verify constraints (AC1: no raw text, bounded fields)
-- =============================================================================

\echo '--- Test 4: Verify constraints on triage_sessions ---'

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.triage_sessions'::regclass
ORDER BY contype, conname;

\echo ''

-- =============================================================================
-- TEST 5: Verify indexes exist
-- =============================================================================

\echo '--- Test 5: Verify indexes on triage_sessions ---'

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'triage_sessions'
ORDER BY indexname;

\echo ''

-- =============================================================================
-- SUMMARY
-- =============================================================================

\echo '--- Summary ---'

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
    constraint_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check RLS enabled
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'triage_sessions';
    
    -- Count policies (expected: 3 - patient read own, clinician/admin read all, insert)
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'triage_sessions';
    
    -- Count constraints (expected: at least 4 - tier, next_action, rationale length, input_hash)
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint
    WHERE conrelid = 'public.triage_sessions'::regclass
      AND contype = 'c'; -- CHECK constraints
    
    -- Count indexes (expected: 4 - patient_id, correlation_id, created_at, input_hash)
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'triage_sessions';
    
    RAISE NOTICE 'RLS Enabled: %', rls_enabled;
    RAISE NOTICE 'Policy Count: %', policy_count;
    RAISE NOTICE 'Constraint Count: %', constraint_count;
    RAISE NOTICE 'Index Count: %', index_count;
    
    IF NOT rls_enabled THEN
        RAISE WARNING 'FAIL: RLS not enabled on triage_sessions';
    ELSIF policy_count < 3 THEN
        RAISE WARNING 'FAIL: Expected at least 3 policies, found %', policy_count;
    ELSIF constraint_count < 4 THEN
        RAISE WARNING 'FAIL: Expected at least 4 check constraints, found %', constraint_count;
    ELSIF index_count < 4 THEN
        RAISE WARNING 'FAIL: Expected at least 4 indexes, found %', index_count;
    ELSE
        RAISE NOTICE 'PASS: All E6.6.6 triage_sessions RLS checks passed';
    END IF;
END $$;

\echo ''
\echo '=== E6.6.6 Triage Sessions RLS Verification Complete ==='
