-- Migration: V0.5 RLS Policy Verification Tests
-- Description: V05-I01.2 - Test queries to verify RLS policies work correctly
--              These are documented test scenarios for manual verification
-- Date: 2025-12-31
-- Issue: V05-I01.2

-- =============================================================================
-- TEST SETUP INSTRUCTIONS
-- =============================================================================

-- Before running tests, create test users in each role:
--
-- 1. Create organizations:
--    INSERT INTO public.organizations (name, slug) VALUES 
--      ('Test Org Alpha', 'test-org-alpha'),
--      ('Test Org Beta', 'test-org-beta');
--
-- 2. Create test users (via Supabase Auth Dashboard or API):
--    - patient1@test.com  (org: alpha)
--    - patient2@test.com  (org: alpha)
--    - patient3@test.com  (org: beta)
--    - clinician1@test.com (org: alpha, role: clinician)
--    - nurse1@test.com (org: alpha, role: nurse)
--    - admin1@test.com (org: alpha, role: admin)
--
-- 3. Set up user_org_membership:
--    (Use user UUIDs from auth.users table)
--
-- 4. Create patient_profiles for patients
--
-- 5. Create test assessments and data

-- =============================================================================
-- HELPER: Create test data setup function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.setup_rls_test_data()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    org_alpha_id UUID;
    org_beta_id UUID;
    result TEXT := '';
BEGIN
    -- This function can be called to set up test data
    -- Note: Actual user creation must be done via Supabase Auth
    
    result := 'Test data setup function ready. ';
    result := result || 'Create users via Supabase Auth, then populate user_org_membership and patient_profiles manually.';
    
    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.setup_rls_test_data IS 'Helper to document RLS test data setup process';

-- =============================================================================
-- TEST CATEGORY 1: PATIENT DATA ISOLATION
-- =============================================================================

-- TEST 1.1: Patient can only see their own patient_profile
-- Expected: Returns only patient1's profile
-- Run as: patient1@test.com
-- SELECT * FROM public.patient_profiles;

-- TEST 1.2: Patient cannot see other patient's profile
-- Expected: Returns 0 rows
-- Run as: patient1@test.com
-- SELECT * FROM public.patient_profiles WHERE user_id != auth.uid();

-- TEST 1.3: Patient can only see their own assessments
-- Expected: Returns only patient1's assessments
-- Run as: patient1@test.com
-- SELECT * FROM public.assessments;

-- TEST 1.4: Patient can only see their own assessment_answers
-- Expected: Returns only patient1's answers
-- Run as: patient1@test.com
-- SELECT * FROM public.assessment_answers;

-- TEST 1.5: Patient can only see their own reports
-- Expected: Returns only patient1's reports
-- Run as: patient1@test.com
-- SELECT * FROM public.reports;

-- TEST 1.6: Patient can only see their own documents
-- Expected: Returns only patient1's documents
-- Run as: patient1@test.com
-- SELECT * FROM public.documents;

-- =============================================================================
-- TEST CATEGORY 2: ORGANIZATION ISOLATION
-- =============================================================================

-- TEST 2.1: Clinician in org alpha cannot see patient in org beta
-- Expected: Returns only org alpha patients
-- Run as: clinician1@test.com (org: alpha)
-- SELECT pp.*, up.display_name 
-- FROM public.patient_profiles pp
-- LEFT JOIN public.user_profiles up ON pp.user_id = up.user_id;

-- TEST 2.2: Clinician can see all patients in same org
-- Expected: Returns patient1 and patient2 (both in org alpha)
-- Run as: clinician1@test.com (org: alpha)
-- SELECT COUNT(*) as patient_count FROM public.patient_profiles;

-- TEST 2.3: Nurse can see org patients
-- Expected: Returns org alpha patients
-- Run as: nurse1@test.com (org: alpha)
-- SELECT * FROM public.patient_profiles;

-- =============================================================================
-- TEST CATEGORY 3: ASSIGNMENT-BASED ACCESS
-- =============================================================================

-- TEST 3.1: Clinician can see explicitly assigned patient from another org
-- Setup: Create assignment for clinician1 -> patient3 (cross-org)
-- Expected: Returns patient3 even though different org
-- Run as: clinician1@test.com
-- First insert: INSERT INTO public.clinician_patient_assignments 
--   (organization_id, clinician_user_id, patient_user_id)
--   VALUES ('<org_beta_id>', '<clinician1_id>', '<patient3_id>');
-- Then query:
-- SELECT * FROM public.patient_profiles WHERE user_id = '<patient3_id>';

-- TEST 3.2: Clinician cannot see unassigned patient from other org
-- Expected: Returns 0 rows (patient3 not assigned)
-- Run as: clinician1@test.com (before assignment created)
-- SELECT * FROM public.patient_profiles pp
-- WHERE pp.user_id IN (
--   SELECT uom.user_id FROM public.user_org_membership uom
--   WHERE uom.organization_id = '<org_beta_id>'
-- );

-- =============================================================================
-- TEST CATEGORY 4: ROLE-BASED PERMISSIONS
-- =============================================================================

-- TEST 4.1: Admin can view org settings
-- Expected: Returns org alpha
-- Run as: admin1@test.com
-- SELECT * FROM public.organizations;

-- TEST 4.2: Admin can update org settings
-- Expected: UPDATE succeeds
-- Run as: admin1@test.com
-- UPDATE public.organizations 
-- SET settings = '{"feature_flags": {"new_feature": true}}'::jsonb
-- WHERE slug = 'test-org-alpha';

-- TEST 4.3: Patient cannot update org settings
-- Expected: UPDATE affects 0 rows or fails
-- Run as: patient1@test.com
-- UPDATE public.organizations SET name = 'Hacked Org';

-- TEST 4.4: Admin can view user_org_membership for their org
-- Expected: Returns all memberships in org alpha
-- Run as: admin1@test.com
-- SELECT * FROM public.user_org_membership 
-- WHERE organization_id = (
--   SELECT organization_id FROM public.user_org_membership 
--   WHERE user_id = auth.uid() LIMIT 1
-- );

-- TEST 4.5: Admin can manage funnels_catalog
-- Expected: SELECT returns all funnels, UPDATE/INSERT allowed
-- Run as: admin1@test.com
-- SELECT * FROM public.funnels_catalog;

-- TEST 4.6: Patient can view active funnels only
-- Expected: Returns only active funnels
-- Run as: patient1@test.com
-- SELECT * FROM public.funnels_catalog;

-- =============================================================================
-- TEST CATEGORY 5: TASK MANAGEMENT
-- =============================================================================

-- TEST 5.1: Nurse can view tasks assigned to nurse role
-- Expected: Returns tasks where assigned_to_role = 'nurse'
-- Run as: nurse1@test.com
-- SELECT * FROM public.tasks WHERE assigned_to_role = 'nurse';

-- TEST 5.2: Nurse can update task status
-- Expected: UPDATE succeeds for nurse tasks
-- Run as: nurse1@test.com
-- UPDATE public.tasks 
-- SET status = 'in_progress'
-- WHERE assigned_to_role = 'nurse' AND status = 'pending'
-- LIMIT 1;

-- TEST 5.3: Patient can view their own tasks
-- Expected: Returns patient's tasks
-- Run as: patient1@test.com
-- SELECT * FROM public.tasks;

-- TEST 5.4: Clinician can create tasks
-- Expected: INSERT succeeds
-- Run as: clinician1@test.com
-- INSERT INTO public.tasks (patient_id, assigned_to_role, task_type, payload)
-- VALUES ('<patient1_profile_id>', 'nurse', 'followup', '{"notes": "test"}'::jsonb);

-- =============================================================================
-- TEST CATEGORY 6: MULTI-TENANT FUNNEL ACCESS
-- =============================================================================

-- TEST 6.1: Patient can view their own patient_funnels
-- Expected: Returns only patient1's funnel instances
-- Run as: patient1@test.com
-- SELECT * FROM public.patient_funnels;

-- TEST 6.2: Clinician can view org patient funnels
-- Expected: Returns funnels for org alpha patients
-- Run as: clinician1@test.com
-- SELECT pf.*, pp.user_id 
-- FROM public.patient_funnels pf
-- JOIN public.patient_profiles pp ON pf.patient_id = pp.id;

-- TEST 6.3: Patient can create funnel instance
-- Expected: INSERT succeeds
-- Run as: patient1@test.com
-- INSERT INTO public.patient_funnels (patient_id, funnel_id)
-- VALUES ('<patient1_profile_id>', '<some_funnel_id>');

-- =============================================================================
-- TEST CATEGORY 7: ASSESSMENT LIFECYCLE
-- =============================================================================

-- TEST 7.1: Patient can view assessment_events for their assessments
-- Expected: Returns events for patient1's assessments
-- Run as: patient1@test.com
-- SELECT ae.* FROM public.assessment_events ae
-- JOIN public.assessments a ON ae.assessment_id = a.id;

-- TEST 7.2: Clinician can view org patient assessment_events
-- Expected: Returns events for org alpha patients
-- Run as: clinician1@test.com
-- SELECT ae.*, a.patient_id FROM public.assessment_events ae
-- JOIN public.assessments a ON ae.assessment_id = a.id;

-- TEST 7.3: Service can insert assessment_events
-- Expected: INSERT succeeds (when called via service role)
-- Run as: service_role
-- INSERT INTO public.assessment_events (assessment_id, event_type, payload)
-- VALUES ('<assessment_id>', 'step_completed', '{"step": 1}'::jsonb);

-- =============================================================================
-- TEST CATEGORY 8: DOCUMENT & EXTRACTION
-- =============================================================================

-- TEST 8.1: Patient can upload document
-- Expected: INSERT succeeds
-- Run as: patient1@test.com
-- INSERT INTO public.documents (assessment_id, storage_path, doc_type)
-- VALUES ('<patient1_assessment_id>', 'path/to/doc.pdf', 'lab_report');

-- TEST 8.2: Patient can view their documents
-- Expected: Returns only patient1's documents
-- Run as: patient1@test.com
-- SELECT * FROM public.documents;

-- TEST 8.3: Clinician can view org patient documents
-- Expected: Returns documents for org alpha patients
-- Run as: clinician1@test.com
-- SELECT d.*, a.patient_id FROM public.documents d
-- JOIN public.assessments a ON d.assessment_id = a.id;

-- =============================================================================
-- TEST CATEGORY 9: CALCULATED RESULTS & REPORTS
-- =============================================================================

-- TEST 9.1: Patient can view their calculated_results
-- Expected: Returns only patient1's results
-- Run as: patient1@test.com
-- SELECT * FROM public.calculated_results;

-- TEST 9.2: Clinician can view org patient results
-- Expected: Returns results for org alpha patients
-- Run as: clinician1@test.com
-- SELECT cr.*, a.patient_id FROM public.calculated_results cr
-- JOIN public.assessments a ON cr.assessment_id = a.id;

-- TEST 9.3: Patient can view their report_sections
-- Expected: Returns only patient1's report sections
-- Run as: patient1@test.com
-- SELECT rs.* FROM public.report_sections rs
-- JOIN public.reports r ON rs.report_id = r.id;

-- =============================================================================
-- TEST CATEGORY 10: AUDIT & NOTIFICATIONS
-- =============================================================================

-- TEST 10.1: User can view their own notifications
-- Expected: Returns only patient1's notifications
-- Run as: patient1@test.com
-- SELECT * FROM public.notifications;

-- TEST 10.2: Admin can view audit_log
-- Expected: Returns audit entries for org
-- Run as: admin1@test.com
-- SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 20;

-- TEST 10.3: Patient cannot view audit_log
-- Expected: Returns 0 rows
-- Run as: patient1@test.com
-- SELECT * FROM public.audit_log;

-- =============================================================================
-- TEST CATEGORY 11: NEGATIVE TESTS (SHOULD FAIL)
-- =============================================================================

-- TEST 11.1: Patient cannot insert data for another patient
-- Expected: INSERT fails or affects 0 rows
-- Run as: patient1@test.com
-- INSERT INTO public.assessments (patient_id, funnel)
-- VALUES ('<patient2_profile_id>', 'stress');

-- TEST 11.2: Patient cannot update another patient's data
-- Expected: UPDATE affects 0 rows
-- Run as: patient1@test.com
-- UPDATE public.patient_profiles 
-- SET full_name = 'Hacked Name'
-- WHERE user_id != auth.uid();

-- TEST 11.3: Clinician cannot access patient from different org (no assignment)
-- Expected: Returns 0 rows
-- Run as: clinician1@test.com (org alpha)
-- SELECT * FROM public.patient_profiles pp
-- WHERE pp.user_id IN (
--   SELECT user_id FROM public.user_org_membership
--   WHERE organization_id = '<org_beta_id>'
-- );

-- TEST 11.4: Nurse cannot update clinician tasks
-- Expected: UPDATE affects 0 rows
-- Run as: nurse1@test.com
-- UPDATE public.tasks 
-- SET status = 'completed'
-- WHERE assigned_to_role = 'clinician';

-- TEST 11.5: Patient cannot view funnels_catalog when is_active = false
-- Expected: Returns 0 rows for inactive funnels (unless admin)
-- Run as: patient1@test.com
-- SELECT * FROM public.funnels_catalog WHERE is_active = false;

-- =============================================================================
-- TEST CATEGORY 12: HELPER FUNCTION TESTS
-- =============================================================================

-- TEST 12.1: get_user_org_ids returns correct orgs
-- Expected: Returns array with org_alpha_id
-- Run as: patient1@test.com
-- SELECT public.get_user_org_ids();

-- TEST 12.2: is_member_of_org works correctly
-- Expected: Returns true for own org, false for other org
-- Run as: patient1@test.com
-- SELECT 
--   public.is_member_of_org('<org_alpha_id>') as in_alpha,
--   public.is_member_of_org('<org_beta_id>') as in_beta;

-- TEST 12.3: current_user_role returns correct role
-- Expected: Returns 'patient' for patient1
-- Run as: patient1@test.com
-- SELECT public.current_user_role('<org_alpha_id>');

-- TEST 12.4: has_any_role works correctly
-- Expected: Returns true for patient role, false for clinician
-- Run as: patient1@test.com
-- SELECT 
--   public.has_any_role('patient') as is_patient,
--   public.has_any_role('clinician') as is_clinician;

-- TEST 12.5: is_assigned_to_patient works
-- Expected: Returns true if assignment exists
-- Run as: clinician1@test.com
-- SELECT public.is_assigned_to_patient('<patient1_user_id>');

-- =============================================================================
-- VERIFICATION SUMMARY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rls_v05_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_category TEXT NOT NULL,
    test_number TEXT NOT NULL,
    test_description TEXT NOT NULL,
    test_user_role public.user_role NOT NULL,
    expected_result TEXT NOT NULL,
    actual_result TEXT,
    passed BOOLEAN,
    tested_at TIMESTAMPTZ DEFAULT NOW(),
    tested_by UUID,
    notes TEXT
);

COMMENT ON TABLE public.rls_v05_test_results IS 'V0.5: Manual RLS test verification results';

-- Grant access to authenticated users to log test results
GRANT SELECT, INSERT, UPDATE ON public.rls_v05_test_results TO authenticated;

-- =============================================================================
-- SMOKE TEST: Quick verification queries
-- =============================================================================

-- Run these as a quick check after migration:

-- 1. Verify all tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN (
--     'organizations', 'user_profiles', 'user_org_membership', 
--     'patient_profiles', 'funnels_catalog', 'funnel_versions',
--     'patient_funnels', 'assessments', 'assessment_events',
--     'assessment_answers', 'documents', 'calculated_results',
--     'reports', 'report_sections', 'tasks', 'notifications',
--     'audit_log', 'clinician_patient_assignments'
--   )
-- ORDER BY tablename;

-- 2. Count policies per table:
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY policy_count DESC;

-- 3. List all RLS helper functions:
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE proname IN (
--   'get_user_org_ids', 'is_member_of_org', 'current_user_role',
--   'has_any_role', 'is_assigned_to_patient', 'get_my_patient_profile_id', 'is_clinician'
-- );

-- =============================================================================
-- END OF VERIFICATION TESTS
-- =============================================================================

COMMENT ON SCHEMA public IS 'V0.5 RLS verification tests documented. Run tests manually with appropriate user contexts. See migration 20251231072347_v05_rls_verification_tests.sql';
