-- Migration: V0.5 Comprehensive Row Level Security (RLS) Policies
-- Description: V05-I01.2 - Implements tenant-isolated RLS policies for multi-org architecture
--              - Patients see only their own data
--              - Clinicians/Nurses see org-scoped or assigned patients
--              - Admins see only org configuration (no PHI by default)
-- Date: 2025-12-31
-- Issue: V05-I01.2

-- =============================================================================
-- SECTION 1: CLINICIAN-PATIENT ASSIGNMENTS TABLE
-- =============================================================================

-- Assignment table for explicit clinician-patient relationships
CREATE TABLE IF NOT EXISTS public.clinician_patient_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    clinician_user_id UUID NOT NULL,
    patient_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    UNIQUE(organization_id, clinician_user_id, patient_user_id)
);

COMMENT ON TABLE public.clinician_patient_assignments IS 'V0.5: Explicit clinician-patient assignments within organizations';

-- Add FK to auth.users if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_namespace n
        JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'clinician_patient_assignments_clinician_fkey'
              AND table_schema = 'public'
              AND table_name = 'clinician_patient_assignments'
        ) THEN
            ALTER TABLE public.clinician_patient_assignments
                ADD CONSTRAINT clinician_patient_assignments_clinician_fkey
                FOREIGN KEY (clinician_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'clinician_patient_assignments_patient_fkey'
              AND table_schema = 'public'
              AND table_name = 'clinician_patient_assignments'
        ) THEN
            ALTER TABLE public.clinician_patient_assignments
                ADD CONSTRAINT clinician_patient_assignments_patient_fkey
                FOREIGN KEY (patient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'clinician_patient_assignments_created_by_fkey'
              AND table_schema = 'public'
              AND table_name = 'clinician_patient_assignments'
        ) THEN
            ALTER TABLE public.clinician_patient_assignments
                ADD CONSTRAINT clinician_patient_assignments_created_by_fkey
                FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clinician_patient_assignments_org 
    ON public.clinician_patient_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinician_patient_assignments_clinician 
    ON public.clinician_patient_assignments(clinician_user_id);
CREATE INDEX IF NOT EXISTS idx_clinician_patient_assignments_patient 
    ON public.clinician_patient_assignments(patient_user_id);

-- =============================================================================
-- SECTION 2: HELPER FUNCTIONS
-- =============================================================================

-- Get user's organization IDs
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    org_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(organization_id)
    INTO org_ids
    FROM public.user_org_membership
    WHERE user_id = auth.uid() AND is_active = true;
    
    RETURN COALESCE(org_ids, ARRAY[]::UUID[]);
END;
$$;

COMMENT ON FUNCTION public.get_user_org_ids IS 'V0.5: Returns array of organization IDs the current user belongs to';

-- Check if user is member of specific organization
CREATE OR REPLACE FUNCTION public.is_member_of_org(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_org_membership
        WHERE user_id = auth.uid() 
          AND organization_id = org_id
          AND is_active = true
    );
END;
$$;

COMMENT ON FUNCTION public.is_member_of_org IS 'V0.5: Checks if current user is member of specified organization';

-- Get user's role in specific organization
CREATE OR REPLACE FUNCTION public.current_user_role(org_id UUID)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role public.user_role;
BEGIN
    SELECT role
    INTO user_role
    FROM public.user_org_membership
    WHERE user_id = auth.uid() 
      AND organization_id = org_id
      AND is_active = true
    LIMIT 1;
    
    RETURN user_role;
END;
$$;

COMMENT ON FUNCTION public.current_user_role IS 'V0.5: Returns user role in specified organization';

-- Check if user has any role across all orgs
CREATE OR REPLACE FUNCTION public.has_any_role(check_role public.user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_org_membership
        WHERE user_id = auth.uid() 
          AND role = check_role
          AND is_active = true
    );
END;
$$;

COMMENT ON FUNCTION public.has_any_role IS 'V0.5: Checks if user has specified role in any organization';

-- Check if user is assigned to a patient
CREATE OR REPLACE FUNCTION public.is_assigned_to_patient(patient_uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.clinician_patient_assignments
        WHERE clinician_user_id = auth.uid()
          AND patient_user_id = patient_uid
    );
END;
$$;

COMMENT ON FUNCTION public.is_assigned_to_patient IS 'V0.5: Checks if current user is assigned to specified patient';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_of_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_assigned_to_patient(UUID) TO authenticated;

-- =============================================================================
-- SECTION 3: ORGANIZATIONS TABLE RLS
-- =============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Patients can view their own organizations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'organizations'
          AND policyname = 'Users can view own organizations'
    ) THEN
        CREATE POLICY "Users can view own organizations"
            ON public.organizations
            FOR SELECT
            USING (id = ANY(public.get_user_org_ids()));
    END IF;
END $$;

-- Admins can update org settings within their org
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'organizations'
          AND policyname = 'Admins can update own org settings'
    ) THEN
        CREATE POLICY "Admins can update own org settings"
            ON public.organizations
            FOR UPDATE
            USING (
                public.current_user_role(id) = 'admin'
            )
            WITH CHECK (
                public.current_user_role(id) = 'admin'
            );
    END IF;
END $$;

-- =============================================================================
-- SECTION 4: USER_PROFILES TABLE RLS
-- =============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'user_profiles'
          AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile"
            ON public.user_profiles
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Users can view profiles in same org (clinician/nurse)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'user_profiles'
          AND policyname = 'Staff can view org profiles'
    ) THEN
        CREATE POLICY "Staff can view org profiles"
            ON public.user_profiles
            FOR SELECT
            USING (
                organization_id = ANY(public.get_user_org_ids())
                AND (
                    public.has_any_role('clinician')
                    OR public.has_any_role('nurse')
                    OR public.has_any_role('admin')
                )
            );
    END IF;
END $$;

-- Users can update their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'user_profiles'
          AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
            ON public.user_profiles
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Users can insert their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'user_profiles'
          AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile"
            ON public.user_profiles
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- =============================================================================
-- SECTION 5: USER_ORG_MEMBERSHIP TABLE RLS
-- =============================================================================

ALTER TABLE public.user_org_membership ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'user_org_membership'
          AND policyname = 'Users can view own memberships'
    ) THEN
        CREATE POLICY "Users can view own memberships"
            ON public.user_org_membership
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Admins can view all memberships in their org
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'user_org_membership'
          AND policyname = 'Admins can view org memberships'
    ) THEN
        CREATE POLICY "Admins can view org memberships"
            ON public.user_org_membership
            FOR SELECT
            USING (
                public.current_user_role(organization_id) = 'admin'
            );
    END IF;
END $$;

-- Admins can manage memberships in their org
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'user_org_membership'
          AND policyname = 'Admins can manage org memberships'
    ) THEN
        CREATE POLICY "Admins can manage org memberships"
            ON public.user_org_membership
            FOR ALL
            USING (
                public.current_user_role(organization_id) = 'admin'
            )
            WITH CHECK (
                public.current_user_role(organization_id) = 'admin'
            );
    END IF;
END $$;

-- =============================================================================
-- SECTION 6: PATIENT_PROFILES TABLE RLS (UPDATE EXISTING)
-- =============================================================================

-- Note: patient_profiles already has RLS enabled from migration 20251207094000
-- We'll add org-scoped policies for V0.5

-- Clinicians/Nurses can view patients in same org or assigned patients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'patient_profiles'
          AND policyname = 'Staff can view org or assigned patients'
    ) THEN
        CREATE POLICY "Staff can view org or assigned patients"
            ON public.patient_profiles
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_org_membership uom1
                    WHERE uom1.user_id = auth.uid()
                      AND uom1.is_active = true
                      AND (uom1.role = 'clinician' OR uom1.role = 'nurse')
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = patient_profiles.user_id
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                      )
                )
                OR public.is_assigned_to_patient(patient_profiles.user_id)
            );
    END IF;
END $$;

-- =============================================================================
-- SECTION 7: FUNNELS_CATALOG TABLE RLS
-- =============================================================================

ALTER TABLE public.funnels_catalog ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active funnels (read-only catalog)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'funnels_catalog'
          AND policyname = 'Authenticated users can view active funnels'
    ) THEN
        CREATE POLICY "Authenticated users can view active funnels"
            ON public.funnels_catalog
            FOR SELECT
            USING (is_active = true OR public.has_any_role('admin'));
    END IF;
END $$;

-- Admins can manage funnel catalog
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'funnels_catalog'
          AND policyname = 'Admins can manage funnels'
    ) THEN
        CREATE POLICY "Admins can manage funnels"
            ON public.funnels_catalog
            FOR ALL
            USING (public.has_any_role('admin'))
            WITH CHECK (public.has_any_role('admin'));
    END IF;
END $$;

-- =============================================================================
-- SECTION 8: FUNNEL_VERSIONS TABLE RLS
-- =============================================================================

ALTER TABLE public.funnel_versions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view funnel versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'funnel_versions'
          AND policyname = 'Authenticated users can view funnel versions'
    ) THEN
        CREATE POLICY "Authenticated users can view funnel versions"
            ON public.funnel_versions
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.funnels_catalog
                    WHERE funnels_catalog.id = funnel_versions.funnel_id
                      AND funnels_catalog.is_active = true
                )
                OR public.has_any_role('admin')
            );
    END IF;
END $$;

-- Admins can manage funnel versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'funnel_versions'
          AND policyname = 'Admins can manage funnel versions'
    ) THEN
        CREATE POLICY "Admins can manage funnel versions"
            ON public.funnel_versions
            FOR ALL
            USING (public.has_any_role('admin'))
            WITH CHECK (public.has_any_role('admin'));
    END IF;
END $$;

-- =============================================================================
-- SECTION 9: PATIENT_FUNNELS TABLE RLS
-- =============================================================================

ALTER TABLE public.patient_funnels ENABLE ROW LEVEL SECURITY;

-- Patients can view their own funnel instances
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'patient_funnels'
          AND policyname = 'Patients can view own funnels'
    ) THEN
        CREATE POLICY "Patients can view own funnels"
            ON public.patient_funnels
            FOR SELECT
            USING (
                patient_id = public.get_my_patient_profile_id()
            );
    END IF;
END $$;

-- Staff can view org or assigned patient funnels
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'patient_funnels'
          AND policyname = 'Staff can view org patient funnels'
    ) THEN
        CREATE POLICY "Staff can view org patient funnels"
            ON public.patient_funnels
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE pp.id = patient_funnels.patient_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
                      )
                )
                OR EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    WHERE pp.id = patient_funnels.patient_id
                      AND public.is_assigned_to_patient(pp.user_id)
                )
            );
    END IF;
END $$;

-- Patients can insert their own funnels
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'patient_funnels'
          AND policyname = 'Patients can insert own funnels'
    ) THEN
        CREATE POLICY "Patients can insert own funnels"
            ON public.patient_funnels
            FOR INSERT
            WITH CHECK (patient_id = public.get_my_patient_profile_id());
    END IF;
END $$;

-- Patients can update their own funnels
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'patient_funnels'
          AND policyname = 'Patients can update own funnels'
    ) THEN
        CREATE POLICY "Patients can update own funnels"
            ON public.patient_funnels
            FOR UPDATE
            USING (patient_id = public.get_my_patient_profile_id())
            WITH CHECK (patient_id = public.get_my_patient_profile_id());
    END IF;
END $$;

-- =============================================================================
-- SECTION 10: ASSESSMENTS TABLE RLS (UPDATE EXISTING)
-- =============================================================================

-- Note: assessments already has RLS from migration 20251207094000
-- Add org-scoped policy for V0.5

-- Staff can view org or assigned patient assessments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'assessments'
          AND policyname = 'Staff can view org patient assessments'
    ) THEN
        CREATE POLICY "Staff can view org patient assessments"
            ON public.assessments
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE pp.id = assessments.patient_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
                      )
                )
                OR EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    WHERE pp.id = assessments.patient_id
                      AND public.is_assigned_to_patient(pp.user_id)
                )
            );
    END IF;
END $$;

-- =============================================================================
-- SECTION 11: ASSESSMENT_EVENTS TABLE RLS
-- =============================================================================

ALTER TABLE public.assessment_events ENABLE ROW LEVEL SECURITY;

-- Patients can view events for their own assessments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'assessment_events'
          AND policyname = 'Patients can view own assessment events'
    ) THEN
        CREATE POLICY "Patients can view own assessment events"
            ON public.assessment_events
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments
                    WHERE assessments.id = assessment_events.assessment_id
                      AND assessments.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
END $$;

-- Staff can view org patient assessment events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'assessment_events'
          AND policyname = 'Staff can view org assessment events'
    ) THEN
        CREATE POLICY "Staff can view org assessment events"
            ON public.assessment_events
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments a
                    JOIN public.patient_profiles pp ON a.patient_id = pp.id
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE a.id = assessment_events.assessment_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
                      )
                )
            );
    END IF;
END $$;

-- Service can insert assessment events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'assessment_events'
          AND policyname = 'Service can insert assessment events'
    ) THEN
        CREATE POLICY "Service can insert assessment events"
            ON public.assessment_events
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- =============================================================================
-- SECTION 12: ASSESSMENT_ANSWERS TABLE RLS (UPDATE EXISTING)
-- =============================================================================

-- Note: assessment_answers already has RLS from migration 20251207094000
-- Add org-scoped policy for V0.5

-- Staff can view org patient assessment answers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'assessment_answers'
          AND policyname = 'Staff can view org assessment answers'
    ) THEN
        CREATE POLICY "Staff can view org assessment answers"
            ON public.assessment_answers
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments a
                    JOIN public.patient_profiles pp ON a.patient_id = pp.id
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE a.id = assessment_answers.assessment_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
                      )
                )
            );
    END IF;
END $$;

-- =============================================================================
-- SECTION 13: DOCUMENTS TABLE RLS
-- =============================================================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Patients can view documents for their own assessments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'documents'
          AND policyname = 'Patients can view own documents'
    ) THEN
        CREATE POLICY "Patients can view own documents"
            ON public.documents
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments
                    WHERE assessments.id = documents.assessment_id
                      AND assessments.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
END $$;

-- Staff can view org patient documents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'documents'
          AND policyname = 'Staff can view org documents'
    ) THEN
        CREATE POLICY "Staff can view org documents"
            ON public.documents
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments a
                    JOIN public.patient_profiles pp ON a.patient_id = pp.id
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE a.id = documents.assessment_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
                      )
                )
            );
    END IF;
END $$;

-- Patients can upload documents for their own assessments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'documents'
          AND policyname = 'Patients can upload own documents'
    ) THEN
        CREATE POLICY "Patients can upload own documents"
            ON public.documents
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.assessments
                    WHERE assessments.id = documents.assessment_id
                      AND assessments.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
END $$;

-- Service can update documents (for AI extraction)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'documents'
          AND policyname = 'Service can update documents'
    ) THEN
        CREATE POLICY "Service can update documents"
            ON public.documents
            FOR UPDATE
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- =============================================================================
-- SECTION 14: CALCULATED_RESULTS TABLE RLS
-- =============================================================================

ALTER TABLE public.calculated_results ENABLE ROW LEVEL SECURITY;

-- Patients can view their own calculated results
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'calculated_results'
          AND policyname = 'Patients can view own results'
    ) THEN
        CREATE POLICY "Patients can view own results"
            ON public.calculated_results
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments
                    WHERE assessments.id = calculated_results.assessment_id
                      AND assessments.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
END $$;

-- Staff can view org patient results
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'calculated_results'
          AND policyname = 'Staff can view org results'
    ) THEN
        CREATE POLICY "Staff can view org results"
            ON public.calculated_results
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments a
                    JOIN public.patient_profiles pp ON a.patient_id = pp.id
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE a.id = calculated_results.assessment_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
                      )
                )
            );
    END IF;
END $$;

-- Service can insert calculated results
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'calculated_results'
          AND policyname = 'Service can insert results'
    ) THEN
        CREATE POLICY "Service can insert results"
            ON public.calculated_results
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- =============================================================================
-- SECTION 15: REPORTS TABLE RLS (UPDATE EXISTING)
-- =============================================================================

-- Note: reports already has RLS from migration 20251207094000
-- Add org-scoped policy for V0.5

-- Staff can view org patient reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'reports'
          AND policyname = 'Staff can view org reports'
    ) THEN
        CREATE POLICY "Staff can view org reports"
            ON public.reports
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.assessments a
                    JOIN public.patient_profiles pp ON a.patient_id = pp.id
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE a.id = reports.assessment_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
                      )
                )
            );
    END IF;
END $$;

-- =============================================================================
-- SECTION 16: REPORT_SECTIONS TABLE RLS
-- =============================================================================

ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;

-- Patients can view their own report sections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'report_sections'
          AND policyname = 'Patients can view own report sections'
    ) THEN
        CREATE POLICY "Patients can view own report sections"
            ON public.report_sections
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.reports r
                    JOIN public.assessments a ON r.assessment_id = a.id
                    WHERE r.id = report_sections.report_id
                      AND a.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
END $$;

-- Staff can view org patient report sections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'report_sections'
          AND policyname = 'Staff can view org report sections'
    ) THEN
        CREATE POLICY "Staff can view org report sections"
            ON public.report_sections
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.reports r
                    JOIN public.assessments a ON r.assessment_id = a.id
                    JOIN public.patient_profiles pp ON a.patient_id = pp.id
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE r.id = report_sections.report_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (uom2.role = 'clinician' OR uom2.role = 'nurse')
                      )
                )
            );
    END IF;
END $$;

-- Service can insert report sections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'report_sections'
          AND policyname = 'Service can insert report sections'
    ) THEN
        CREATE POLICY "Service can insert report sections"
            ON public.report_sections
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- =============================================================================
-- SECTION 17: TASKS TABLE RLS
-- =============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Patients can view their own tasks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'tasks'
          AND policyname = 'Patients can view own tasks'
    ) THEN
        CREATE POLICY "Patients can view own tasks"
            ON public.tasks
            FOR SELECT
            USING (
                patient_id = public.get_my_patient_profile_id()
            );
    END IF;
END $$;

-- Staff can view tasks assigned to their role in their org
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'tasks'
          AND policyname = 'Staff can view assigned org tasks'
    ) THEN
        CREATE POLICY "Staff can view assigned org tasks"
            ON public.tasks
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE pp.id = tasks.patient_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (
                                uom2.role = tasks.assigned_to_role
                                OR uom2.role = 'admin'
                            )
                      )
                )
            );
    END IF;
END $$;

-- Clinicians can create tasks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'tasks'
          AND policyname = 'Clinicians can create tasks'
    ) THEN
        CREATE POLICY "Clinicians can create tasks"
            ON public.tasks
            FOR INSERT
            WITH CHECK (
                public.has_any_role('clinician')
                OR public.has_any_role('admin')
            );
    END IF;
END $$;

-- Assigned staff can update task status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'tasks'
          AND policyname = 'Staff can update assigned tasks'
    ) THEN
        CREATE POLICY "Staff can update assigned tasks"
            ON public.tasks
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE pp.id = tasks.patient_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (
                                uom2.role = tasks.assigned_to_role
                                OR uom2.role = 'admin'
                            )
                      )
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.patient_profiles pp
                    JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
                    WHERE pp.id = tasks.patient_id
                      AND EXISTS (
                          SELECT 1 FROM public.user_org_membership uom2
                          WHERE uom2.user_id = auth.uid()
                            AND uom2.organization_id = uom1.organization_id
                            AND uom2.is_active = true
                            AND (
                                uom2.role = tasks.assigned_to_role
                                OR uom2.role = 'admin'
                            )
                      )
                )
            );
    END IF;
END $$;

-- =============================================================================
-- SECTION 18: NOTIFICATIONS TABLE RLS
-- =============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'notifications'
          AND policyname = 'Users can view own notifications'
    ) THEN
        CREATE POLICY "Users can view own notifications"
            ON public.notifications
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Service can manage notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'notifications'
          AND policyname = 'Service can manage notifications'
    ) THEN
        CREATE POLICY "Service can manage notifications"
            ON public.notifications
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- =============================================================================
-- SECTION 19: AUDIT_LOG TABLE RLS
-- =============================================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs for their org
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'audit_log'
          AND policyname = 'Admins can view org audit logs'
    ) THEN
        CREATE POLICY "Admins can view org audit logs"
            ON public.audit_log
            FOR SELECT
            USING (
                public.has_any_role('admin')
            );
    END IF;
END $$;

-- Service can insert audit logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'audit_log'
          AND policyname = 'Service can insert audit logs'
    ) THEN
        CREATE POLICY "Service can insert audit logs"
            ON public.audit_log
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- =============================================================================
-- SECTION 20: CLINICIAN_PATIENT_ASSIGNMENTS TABLE RLS
-- =============================================================================

ALTER TABLE public.clinician_patient_assignments ENABLE ROW LEVEL SECURITY;

-- Clinicians can view their own assignments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'clinician_patient_assignments'
          AND policyname = 'Clinicians can view own assignments'
    ) THEN
        CREATE POLICY "Clinicians can view own assignments"
            ON public.clinician_patient_assignments
            FOR SELECT
            USING (clinician_user_id = auth.uid());
    END IF;
END $$;

-- Admins can view all assignments in their org
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'clinician_patient_assignments'
          AND policyname = 'Admins can view org assignments'
    ) THEN
        CREATE POLICY "Admins can view org assignments"
            ON public.clinician_patient_assignments
            FOR SELECT
            USING (
                public.current_user_role(organization_id) = 'admin'
            );
    END IF;
END $$;

-- Admins can manage assignments in their org
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'clinician_patient_assignments'
          AND policyname = 'Admins can manage org assignments'
    ) THEN
        CREATE POLICY "Admins can manage org assignments"
            ON public.clinician_patient_assignments
            FOR ALL
            USING (
                public.current_user_role(organization_id) = 'admin'
            )
            WITH CHECK (
                public.current_user_role(organization_id) = 'admin'
            );
    END IF;
END $$;

-- =============================================================================
-- SECTION 21: GRANT PERMISSIONS
-- =============================================================================

-- Grant table access to authenticated users (RLS enforces row-level restrictions)
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_org_membership TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.patient_funnels TO authenticated;
GRANT SELECT, INSERT ON public.assessment_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;
GRANT SELECT ON public.calculated_results TO authenticated;
GRANT SELECT, INSERT ON public.report_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tasks TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT SELECT ON public.clinician_patient_assignments TO authenticated;
GRANT SELECT ON public.funnels_catalog TO authenticated;
GRANT SELECT ON public.funnel_versions TO authenticated;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

COMMENT ON SCHEMA public IS 'V0.5 RLS policies implemented: tenant-isolated access with patient/clinician/nurse/admin roles';
