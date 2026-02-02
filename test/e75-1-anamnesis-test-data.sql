-- E75.1 Test Data and RLS Verification Script
-- Purpose: Create test data and verify RLS policies work correctly
-- Date: 2026-02-02
-- Issue: E75.1
-- 
-- USAGE: This script creates test data to verify RLS policies for anamnesis tables.
--        Run AFTER migration 20260202074325_e75_1_create_anamnesis_tables.sql
-- 
-- WARNING: This is TEST DATA ONLY. Do not run in production.

\echo '=== E75.1 Test Data Setup ==='
\echo ''

-- =============================================================================
-- SECTION 1: Create Test Organizations
-- =============================================================================

\echo '--- Creating test organizations ---'

-- Create Org A
INSERT INTO public.organizations (id, name, settings)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Organization A', '{"test": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create Org B
INSERT INTO public.organizations (id, name, settings)
VALUES ('22222222-2222-2222-2222-222222222222', 'Test Organization B', '{"test": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

\echo 'Created 2 test organizations'
\echo ''

-- =============================================================================
-- SECTION 2: Create Test Users (using auth.users if available)
-- =============================================================================

\echo '--- Creating test users ---'
\echo 'NOTE: In production, users are created via Supabase Auth.'
\echo 'For testing, we assume users exist with the following IDs:'
\echo '  Patient A1: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\echo '  Patient A2: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab'
\echo '  Patient B1: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
\echo '  Clinician C1: cccccccc-cccc-cccc-cccc-cccccccccccc'
\echo '  Clinician C2: cccccccc-cccc-cccc-cccc-cccccccccccd'
\echo '  Admin D1: dddddddd-dddd-dddd-dddd-dddddddddddd'
\echo ''

-- NOTE: In a real environment, these users would be created via Supabase Auth
-- For this test, we'll just create patient_profiles and assume users exist

-- =============================================================================
-- SECTION 3: Create Patient Profiles
-- =============================================================================

\echo '--- Creating patient profiles ---'

-- Patient A1 (Org A)
INSERT INTO public.patient_profiles (id, user_id, first_name, last_name)
VALUES (
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Alice',
    'Anderson'
)
ON CONFLICT (id) DO NOTHING;

-- Patient A2 (Org A)
INSERT INTO public.patient_profiles (id, user_id, first_name, last_name)
VALUES (
    'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    'Aaron',
    'Adams'
)
ON CONFLICT (id) DO NOTHING;

-- Patient B1 (Org B)
INSERT INTO public.patient_profiles (id, user_id, first_name, last_name)
VALUES (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Bob',
    'Brown'
)
ON CONFLICT (id) DO NOTHING;

\echo 'Created 3 patient profiles'
\echo ''

-- =============================================================================
-- SECTION 4: Create User-Org Memberships
-- =============================================================================

\echo '--- Creating user-org memberships ---'

-- Patient A1 → Org A (patient role)
INSERT INTO public.user_org_membership (user_id, organization_id, role)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'patient')
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Patient A2 → Org A (patient role)
INSERT INTO public.user_org_membership (user_id, organization_id, role)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '11111111-1111-1111-1111-111111111111', 'patient')
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Patient B1 → Org B (patient role)
INSERT INTO public.user_org_membership (user_id, organization_id, role)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'patient')
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Clinician C1 → Org A (clinician role)
INSERT INTO public.user_org_membership (user_id, organization_id, role)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'clinician')
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Clinician C2 → Org A (clinician role, NOT assigned to any patient)
INSERT INTO public.user_org_membership (user_id, organization_id, role)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccd', '11111111-1111-1111-1111-111111111111', 'clinician')
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Admin D1 → Org A (admin role)
INSERT INTO public.user_org_membership (user_id, organization_id, role)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'admin')
ON CONFLICT (user_id, organization_id) DO NOTHING;

\echo 'Created 6 user-org memberships'
\echo ''

-- =============================================================================
-- SECTION 5: Create Clinician-Patient Assignments
-- =============================================================================

\echo '--- Creating clinician-patient assignments ---'

-- Clinician C1 assigned to Patient A1 in Org A
INSERT INTO public.clinician_patient_assignments (organization_id, clinician_user_id, patient_user_id)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT (organization_id, clinician_user_id, patient_user_id) DO NOTHING;

-- NOTE: Clinician C2 has NO assignments (used to test "unassigned clinician cannot see")

\echo 'Created 1 clinician-patient assignment'
\echo ''

-- =============================================================================
-- SECTION 6: Create Test Anamnesis Entries
-- =============================================================================

\echo '--- Creating test anamnesis entries ---'

-- Entry for Patient A1 (Org A)
INSERT INTO public.anamnesis_entries (
    id,
    patient_id,
    organization_id,
    title,
    content,
    entry_type,
    tags,
    created_by
)
VALUES (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    '11111111-1111-1111-1111-111111111111',
    'Medical History - Patient A1',
    '{"conditions": ["hypertension", "diabetes"], "medications": ["metformin", "lisinopril"]}'::jsonb,
    'medical_history',
    ARRAY['hypertension', 'diabetes'],
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT (id) DO NOTHING;

-- Entry for Patient A2 (Org A)
INSERT INTO public.anamnesis_entries (
    id,
    patient_id,
    organization_id,
    title,
    content,
    entry_type,
    tags,
    created_by
)
VALUES (
    'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
    'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',
    '11111111-1111-1111-1111-111111111111',
    'Allergy Record - Patient A2',
    '{"allergies": ["penicillin", "sulfa drugs"]}'::jsonb,
    'allergies',
    ARRAY['allergies'],
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab'
)
ON CONFLICT (id) DO NOTHING;

-- Entry for Patient B1 (Org B) - DIFFERENT ORG
INSERT INTO public.anamnesis_entries (
    id,
    patient_id,
    organization_id,
    title,
    content,
    entry_type,
    tags,
    created_by
)
VALUES (
    'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
    '22222222-2222-2222-2222-222222222222',
    'Symptoms - Patient B1',
    '{"symptoms": ["chest pain", "shortness of breath"]}'::jsonb,
    'symptoms',
    ARRAY['cardiac'],
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)
ON CONFLICT (id) DO NOTHING;

\echo 'Created 3 test anamnesis entries'
\echo ''

-- =============================================================================
-- SECTION 7: Verify Test Data Created Successfully
-- =============================================================================

\echo '--- Verifying test data ---'

SELECT 
    'Organizations' as entity,
    COUNT(*) as count
FROM public.organizations
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 
    'Patient Profiles' as entity,
    COUNT(*) as count
FROM public.patient_profiles
WHERE id IN ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1')
UNION ALL
SELECT 
    'User-Org Memberships' as entity,
    COUNT(*) as count
FROM public.user_org_membership
WHERE user_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'cccccccc-cccc-cccc-cccc-cccccccccccd',
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
)
UNION ALL
SELECT 
    'Clinician Assignments' as entity,
    COUNT(*) as count
FROM public.clinician_patient_assignments
WHERE clinician_user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
UNION ALL
SELECT 
    'Anamnesis Entries' as entity,
    COUNT(*) as count
FROM public.anamnesis_entries
WHERE id IN ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3')
UNION ALL
SELECT 
    'Anamnesis Versions' as entity,
    COUNT(*) as count
FROM public.anamnesis_entry_versions
WHERE entry_id IN ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3');

\echo ''
\echo '=== Test Data Setup Complete ==='
\echo ''

-- =============================================================================
-- SECTION 8: RLS Policy Verification Queries (Run with Service Role)
-- =============================================================================

\echo '=== RLS Policy Verification Queries ==='
\echo 'NOTE: These queries run with service role (RLS bypassed).'
\echo 'For actual RLS testing, use Supabase client with different user contexts.'
\echo ''

\echo '--- Query 1: All entries (service role view) ---'
SELECT 
    ae.title,
    pp.first_name || ' ' || pp.last_name as patient_name,
    o.name as organization,
    ae.entry_type,
    ae.created_at
FROM public.anamnesis_entries ae
JOIN public.patient_profiles pp ON pp.id = ae.patient_id
JOIN public.organizations o ON o.id = ae.organization_id
ORDER BY ae.created_at;

\echo ''

\echo '--- Query 2: Entries by organization ---'
SELECT 
    o.name as organization,
    COUNT(ae.id) as entry_count
FROM public.organizations o
LEFT JOIN public.anamnesis_entries ae ON ae.organization_id = o.id
WHERE o.id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
GROUP BY o.name
ORDER BY o.name;

\echo ''

\echo '--- Query 3: Version history for Patient A1 entry ---'
SELECT 
    aev.version_number,
    aev.title,
    aev.changed_at,
    aev.content
FROM public.anamnesis_entry_versions aev
WHERE aev.entry_id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'
ORDER BY aev.version_number;

\echo ''

\echo '--- Query 4: Clinician assignments ---'
SELECT 
    cpa.clinician_user_id,
    cpa.patient_user_id,
    pp.first_name || ' ' || pp.last_name as patient_name,
    o.name as organization
FROM public.clinician_patient_assignments cpa
JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
JOIN public.organizations o ON o.id = cpa.organization_id
ORDER BY cpa.clinician_user_id, pp.last_name;

\echo ''
\echo '=== Verification Complete ==='
\echo ''

-- =============================================================================
-- SECTION 9: Expected RLS Behavior Summary
-- =============================================================================

\echo '=== Expected RLS Behavior (when using authenticated user context) ==='
\echo ''
\echo 'R-E75.1-1 to R-E75.1-3: Patient A1 (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)'
\echo '  ✓ CAN see/update entry e1e1e1e1 (own entry)'
\echo '  ✗ CANNOT see entries e2e2e2e2, e3e3e3e3 (other patients)'
\echo ''
\echo 'R-E75.1-4 to R-E75.1-6: Clinician C1 (cccccccc-cccc-cccc-cccc-cccccccccccc)'
\echo '  ✓ CAN see/update entry e1e1e1e1 (assigned to Patient A1)'
\echo '  ✗ CANNOT see entries e2e2e2e2 (Patient A2, not assigned)'
\echo '  ✗ CANNOT see entry e3e3e3e3 (Patient B1, different org)'
\echo ''
\echo 'Clinician C2 (cccccccc-cccc-cccc-cccc-cccccccccccd)'
\echo '  ✗ CANNOT see any entries (no assignments)'
\echo ''
\echo 'R-E75.1-7 to R-E75.1-8: Admin D1 (dddddddd-dddd-dddd-dddd-dddddddddddd)'
\echo '  ✓ CAN see/update entries e1e1e1e1, e2e2e2e2 (Org A)'
\echo '  ✗ CANNOT see entry e3e3e3e3 (Org B)'
\echo ''
\echo 'R-E75.1-9 to R-E75.1-11: Version History'
\echo '  Same access rules apply to anamnesis_entry_versions'
\echo ''

-- =============================================================================
-- SECTION 10: Cleanup Script (Optional)
-- =============================================================================

\echo '=== Cleanup Commands (run separately if needed) ==='
\echo ''
\echo 'To remove test data, run:'
\echo ''
\echo "DELETE FROM public.anamnesis_entries WHERE id IN ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3');"
\echo "DELETE FROM public.clinician_patient_assignments WHERE clinician_user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';"
\echo "DELETE FROM public.user_org_membership WHERE user_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 'dddddddd-dddd-dddd-dddd-dddddddddddd');"
\echo "DELETE FROM public.patient_profiles WHERE id IN ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1');"
\echo "DELETE FROM public.organizations WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');"
\echo ''
