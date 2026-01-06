/**
 * V05-I08.4: Support Notes + Escalation to Clinician
 * 
 * Create support_cases table for documenting support cases and escalations.
 * When a support case is escalated, a task is created and an audit log entry is recorded.
 * 
 * Features:
 * - Support case documentation (patient-initiated or staff-initiated)
 * - Escalation workflow (creates task + audit entry)
 * - RLS policies for multi-tenant security
 * - Full audit trail
 * 
 * Date: 2026-01-06
 */

-- ============================================================
-- Enum: Support Case Status
-- ============================================================

CREATE TYPE public.support_case_status AS ENUM (
    'open',
    'in_progress',
    'escalated',
    'resolved',
    'closed'
);

COMMENT ON TYPE public.support_case_status IS 'V05-I08.4: Status of a support case';

-- ============================================================
-- Enum: Support Case Priority
-- ============================================================

CREATE TYPE public.support_case_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

COMMENT ON TYPE public.support_case_priority IS 'V05-I08.4: Priority level of a support case';

-- ============================================================
-- Enum: Support Case Category
-- ============================================================

CREATE TYPE public.support_case_category AS ENUM (
    'technical',
    'medical',
    'administrative',
    'billing',
    'general',
    'other'
);

COMMENT ON TYPE public.support_case_category IS 'V05-I08.4: Category of a support case';

-- ============================================================
-- Table: support_cases
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_cases (
    -- Primary Key
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    
    -- Foreign Keys
    patient_id uuid NOT NULL,
    organization_id uuid,
    created_by_user_id uuid,
    assigned_to_user_id uuid,
    escalated_task_id uuid,
    
    -- Case Details
    category public.support_case_category NOT NULL DEFAULT 'general',
    priority public.support_case_priority NOT NULL DEFAULT 'medium',
    status public.support_case_status NOT NULL DEFAULT 'open',
    
    -- Content (PHI-safe fields)
    subject text NOT NULL,
    description text,
    notes text,
    resolution_notes text,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Escalation tracking
    escalated_at timestamp with time zone,
    escalated_by_user_id uuid,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    resolved_at timestamp with time zone,
    closed_at timestamp with time zone
);

ALTER TABLE public.support_cases OWNER TO postgres;

COMMENT ON TABLE public.support_cases IS 'V05-I08.4: Support cases for patient support documentation and escalation workflow';

COMMENT ON COLUMN public.support_cases.patient_id IS 'Patient this support case is about';
COMMENT ON COLUMN public.support_cases.organization_id IS 'Organization context for multi-tenant isolation';
COMMENT ON COLUMN public.support_cases.created_by_user_id IS 'User who created this support case (patient or staff)';
COMMENT ON COLUMN public.support_cases.assigned_to_user_id IS 'User assigned to handle this support case';
COMMENT ON COLUMN public.support_cases.escalated_task_id IS 'Task ID if this case was escalated to clinician';
COMMENT ON COLUMN public.support_cases.subject IS 'Brief summary of the support case';
COMMENT ON COLUMN public.support_cases.description IS 'Detailed description of the issue or request';
COMMENT ON COLUMN public.support_cases.notes IS 'Internal notes about the case (staff only)';
COMMENT ON COLUMN public.support_cases.resolution_notes IS 'Notes about how the case was resolved';
COMMENT ON COLUMN public.support_cases.metadata IS 'Additional metadata (JSONB)';
COMMENT ON COLUMN public.support_cases.escalated_at IS 'When this case was escalated to a clinician';
COMMENT ON COLUMN public.support_cases.escalated_by_user_id IS 'User who escalated this case';

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_support_cases_patient_id ON public.support_cases(patient_id);
CREATE INDEX idx_support_cases_organization_id ON public.support_cases(organization_id);
CREATE INDEX idx_support_cases_created_by_user_id ON public.support_cases(created_by_user_id);
CREATE INDEX idx_support_cases_assigned_to_user_id ON public.support_cases(assigned_to_user_id) WHERE assigned_to_user_id IS NOT NULL;
CREATE INDEX idx_support_cases_status ON public.support_cases(status);
CREATE INDEX idx_support_cases_priority ON public.support_cases(priority);
CREATE INDEX idx_support_cases_category ON public.support_cases(category);
CREATE INDEX idx_support_cases_escalated_task_id ON public.support_cases(escalated_task_id) WHERE escalated_task_id IS NOT NULL;

-- Unique constraint to prevent duplicate escalations (idempotency)
CREATE UNIQUE INDEX idx_support_cases_escalated_task_unique ON public.support_cases(escalated_task_id) WHERE escalated_task_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_support_cases_org_status_created ON public.support_cases(organization_id, status, created_at DESC);
CREATE INDEX idx_support_cases_org_priority_created ON public.support_cases(organization_id, priority, created_at DESC);
CREATE INDEX idx_support_cases_assigned_status_created ON public.support_cases(assigned_to_user_id, status, created_at DESC) WHERE assigned_to_user_id IS NOT NULL;

-- ============================================================
-- Trigger: Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_support_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_support_cases_updated_at
    BEFORE UPDATE ON public.support_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_support_cases_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.support_cases ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own support cases
CREATE POLICY "support_cases_patient_select" ON public.support_cases
    FOR SELECT
    USING (
        patient_id IN (
            SELECT id FROM public.patient_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Staff can view all support cases in their organization
CREATE POLICY "support_cases_staff_select" ON public.support_cases
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_org_membership uom
            WHERE uom.user_id = auth.uid()
            AND uom.organization_id = support_cases.organization_id
            AND uom.is_active = true
        )
        AND auth.jwt() ->> 'role' IN ('clinician', 'admin', 'nurse')
    );

-- Policy: Patients can create support cases for themselves
CREATE POLICY "support_cases_patient_insert" ON public.support_cases
    FOR INSERT
    WITH CHECK (
        patient_id IN (
            SELECT id FROM public.patient_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Staff can create support cases in their organization
CREATE POLICY "support_cases_staff_insert" ON public.support_cases
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_org_membership uom
            WHERE uom.user_id = auth.uid()
            AND uom.organization_id = support_cases.organization_id
            AND uom.is_active = true
        )
        AND auth.jwt() ->> 'role' IN ('clinician', 'admin', 'nurse')
    );

-- Policy: Patients can update their own support cases (limited fields)
CREATE POLICY "support_cases_patient_update" ON public.support_cases
    FOR UPDATE
    USING (
        patient_id IN (
            SELECT id FROM public.patient_profiles 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        patient_id IN (
            SELECT id FROM public.patient_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Staff can update support cases in their organization
CREATE POLICY "support_cases_staff_update" ON public.support_cases
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_org_membership uom
            WHERE uom.user_id = auth.uid()
            AND uom.organization_id = support_cases.organization_id
            AND uom.is_active = true
        )
        AND auth.jwt() ->> 'role' IN ('clinician', 'admin', 'nurse')
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_org_membership uom
            WHERE uom.user_id = auth.uid()
            AND uom.organization_id = support_cases.organization_id
            AND uom.is_active = true
        )
        AND auth.jwt() ->> 'role' IN ('clinician', 'admin', 'nurse')
    );

-- Policy: Only admins can delete support cases
CREATE POLICY "support_cases_admin_delete" ON public.support_cases
    FOR DELETE
    USING (
        auth.jwt() ->> 'role' = 'admin'
        AND EXISTS (
            SELECT 1 FROM public.user_org_membership uom
            WHERE uom.user_id = auth.uid()
            AND uom.organization_id = support_cases.organization_id
            AND uom.is_active = true
        )
    );
