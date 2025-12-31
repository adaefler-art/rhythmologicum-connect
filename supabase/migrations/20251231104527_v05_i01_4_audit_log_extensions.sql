-- Migration: V0.5 Audit Log Extensions for Decision Events
-- Description: Extends audit_log table with org_id, source, and metadata fields
--              for comprehensive audit trail of decision-relevant events
-- Date: 2025-12-31
-- Issue: V05-I01.4

-- =============================================================================
-- SECTION 1: EXTEND AUDIT_LOG TABLE
-- =============================================================================

-- Add org_id for multi-tenant audit trails
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_log'
          AND column_name = 'org_id'
    ) THEN
        ALTER TABLE public.audit_log
            ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.audit_log.org_id IS 'V0.5: Organization context for multi-tenant audit isolation';

-- Add source field to track where the action originated
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_log'
          AND column_name = 'source'
    ) THEN
        ALTER TABLE public.audit_log
            ADD COLUMN source TEXT CHECK (source IN ('api', 'job', 'admin-ui', 'system'));
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.audit_log.source IS 'V0.5: Source of the action (api, job, admin-ui, system)';

-- Add metadata for additional context (versions, correlation IDs, etc.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_log'
          AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.audit_log
            ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.audit_log.metadata IS 'V0.5: Additional context (request_id, algorithm_version, prompt_version, report_version, correlation_ids, etc.)';

-- =============================================================================
-- SECTION 2: INDEXES FOR EFFICIENT QUERYING
-- =============================================================================

-- Index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id 
    ON public.audit_log(org_id) 
    WHERE org_id IS NOT NULL;

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_audit_log_source 
    ON public.audit_log(source) 
    WHERE source IS NOT NULL;

-- Composite index for common query patterns (org + entity_type + created_at)
CREATE INDEX IF NOT EXISTS idx_audit_log_org_entity_created 
    ON public.audit_log(org_id, entity_type, created_at DESC) 
    WHERE org_id IS NOT NULL;

-- Composite index for entity lookups (entity_type + entity_id)
-- Note: This already exists from previous migration, but ensure it's there
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type_id 
    ON public.audit_log(entity_type, entity_id);

-- =============================================================================
-- SECTION 3: UPDATE RLS POLICIES (IF NEEDED)
-- =============================================================================

-- Note: RLS policies for audit_log were set in migration 20251231072346
-- Current policy: Admins can view org audit logs
-- This should already work with org_id field, but we'll verify it handles NULL org_id

-- Update admin policy to handle org_id filtering
DROP POLICY IF EXISTS "Admins can view org audit logs" ON public.audit_log;

CREATE POLICY "Admins can view org audit logs"
    ON public.audit_log
    FOR SELECT
    USING (
        public.has_any_role('admin')
        AND (
            org_id IS NULL  -- System-level events visible to all admins
            OR org_id = ANY(public.get_user_org_ids())  -- Org-specific events
        )
    );

-- Clinicians/Nurses can view audit logs for their assigned patients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'audit_log'
          AND policyname = 'Staff can view patient audit logs'
    ) THEN
        CREATE POLICY "Staff can view patient audit logs"
            ON public.audit_log
            FOR SELECT
            USING (
                (public.has_any_role('clinician') OR public.has_any_role('nurse'))
                AND (
                    entity_type IN ('assessment', 'report', 'task')
                    AND EXISTS (
                        SELECT 1 FROM public.assessments a
                        JOIN public.patient_profiles pp ON a.patient_id = pp.id
                        WHERE a.id = audit_log.entity_id
                          AND public.is_assigned_to_patient(pp.user_id)
                    )
                )
            );
    END IF;
END $$;

-- Patients can view audit logs for their own entities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = 'audit_log'
          AND policyname = 'Patients can view own entity audit logs'
    ) THEN
        CREATE POLICY "Patients can view own entity audit logs"
            ON public.audit_log
            FOR SELECT
            USING (
                entity_type IN ('assessment', 'report')
                AND EXISTS (
                    SELECT 1 FROM public.assessments a
                    WHERE a.id = audit_log.entity_id
                      AND a.patient_id = public.get_my_patient_profile_id()
                )
            );
    END IF;
END $$;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

COMMENT ON TABLE public.audit_log IS 'V0.5: Comprehensive audit trail for all decision-relevant system changes. Extended with org_id, source, and metadata for V05-I01.4.';
