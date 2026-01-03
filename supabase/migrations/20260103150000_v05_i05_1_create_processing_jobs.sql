-- Migration: V05-I05.1 - Processing Orchestrator Tables
-- Description: Creates tables for processing job orchestration and status tracking
--              Funnel-independent, deterministic, idempotent processing pipeline
--              NOTE: This migration provides job tracking and status only.
--              Actual stage execution/workers are handled separately (I05.2-I05.9).
-- Date: 2026-01-03
-- Issue: V05-I05.1

-- =============================================================================
-- SECTION 1: CREATE PROCESSING STAGE ENUM
-- =============================================================================

-- Processing stages enum (deterministic progression)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_stage') THEN
        CREATE TYPE public.processing_stage AS ENUM (
            'pending',
            'risk',
            'ranking',
            'content',
            'validation',
            'review',
            'pdf',
            'delivery',
            'completed',
            'failed'
        );
    END IF;
END $$;

COMMENT ON TYPE public.processing_stage IS 'V05-I05.1: Processing pipeline stages (deterministic order)';

-- Processing status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_status') THEN
        CREATE TYPE public.processing_status AS ENUM (
            'queued',
            'in_progress',
            'completed',
            'failed'
        );
    END IF;
END $$;

COMMENT ON TYPE public.processing_status IS 'V05-I05.1: Overall processing job status';

-- =============================================================================
-- SECTION 2: CREATE PROCESSING_JOBS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.processing_jobs (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Assessment reference (no direct FK to avoid blocking on assessment deletion)
    assessment_id UUID NOT NULL,
    
    -- Idempotency key
    correlation_id TEXT NOT NULL,
    
    -- Status and stage
    status public.processing_status NOT NULL DEFAULT 'queued',
    stage public.processing_stage NOT NULL DEFAULT 'pending',
    
    -- Retry tracking
    attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt >= 1 AND attempt <= 10),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1 AND max_attempts <= 10),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- PHI-free error tracking (JSONB array of redacted errors)
    errors JSONB DEFAULT '[]'::jsonb,
    
    -- Schema version for contract evolution
    schema_version TEXT NOT NULL DEFAULT 'v1',
    
    -- Constraints
    -- Idempotency: (assessment_id, correlation_id, schema_version)
    -- This allows re-runs when schema/algorithm versions change
    CONSTRAINT processing_jobs_assessment_correlation_version_unique 
        UNIQUE (assessment_id, correlation_id, schema_version)
);

-- Table and column comments
COMMENT ON TABLE public.processing_jobs IS 'V05-I05.1: Processing orchestrator jobs - tracks assessment processing pipeline';
COMMENT ON COLUMN public.processing_jobs.id IS 'Job unique identifier';
COMMENT ON COLUMN public.processing_jobs.assessment_id IS 'Assessment being processed (soft reference, no FK)';
COMMENT ON COLUMN public.processing_jobs.correlation_id IS 'Idempotency key for preventing duplicate jobs (combined with schema_version)';
COMMENT ON COLUMN public.processing_jobs.schema_version IS 'Contract version - allows re-runs when algorithm/schema changes';
COMMENT ON COLUMN public.processing_jobs.status IS 'Overall job status (queued, in_progress, completed, failed)';
COMMENT ON COLUMN public.processing_jobs.stage IS 'Current processing stage (deterministic progression)';
COMMENT ON COLUMN public.processing_jobs.attempt IS 'Current attempt number (1-indexed)';
COMMENT ON COLUMN public.processing_jobs.max_attempts IS 'Maximum retry attempts allowed';
COMMENT ON COLUMN public.processing_jobs.errors IS 'PHI-free redacted error log (JSONB array)';
COMMENT ON COLUMN public.processing_jobs.schema_version IS 'Contract version for schema evolution';

-- =============================================================================
-- SECTION 3: CREATE INDEXES
-- =============================================================================

-- Primary lookup: by assessment_id
CREATE INDEX IF NOT EXISTS idx_processing_jobs_assessment_id 
    ON public.processing_jobs(assessment_id);

-- Idempotency lookup: by correlation_id
CREATE INDEX IF NOT EXISTS idx_processing_jobs_correlation_id 
    ON public.processing_jobs(correlation_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status 
    ON public.processing_jobs(status) 
    WHERE status IN ('queued', 'in_progress');

-- Stage filtering
CREATE INDEX IF NOT EXISTS idx_processing_jobs_stage 
    ON public.processing_jobs(stage);

-- Timestamp queries (for monitoring/cleanup)
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at 
    ON public.processing_jobs(created_at DESC);

-- Composite index for common queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status_created 
    ON public.processing_jobs(status, created_at DESC);

-- =============================================================================
-- SECTION 4: CREATE UPDATED_AT TRIGGER
-- =============================================================================

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_processing_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_processing_jobs_updated_at ON public.processing_jobs;
CREATE TRIGGER trigger_processing_jobs_updated_at
    BEFORE UPDATE ON public.processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_processing_jobs_updated_at();

-- =============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own jobs (by assessment ownership)
-- Note: This requires joining with assessments table for ownership check
DROP POLICY IF EXISTS processing_jobs_patient_select ON public.processing_jobs;
CREATE POLICY processing_jobs_patient_select ON public.processing_jobs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            JOIN public.patient_profiles pp ON pp.id = a.patient_id
            WHERE a.id = processing_jobs.assessment_id
              AND pp.user_id = auth.uid()
        )
    );

-- Policy: Clinicians can view jobs for their assigned patients only
-- This enforces that clinicians must have an explicit relationship via clinician_patient_assignments
DROP POLICY IF EXISTS processing_jobs_clinician_select ON public.processing_jobs;
CREATE POLICY processing_jobs_clinician_select ON public.processing_jobs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN public.clinician_patient_assignments cpa ON cpa.clinician_user_id = u.id
            JOIN public.assessments a ON a.id = processing_jobs.assessment_id
            JOIN public.patient_profiles pp ON pp.id = a.patient_id
                AND pp.user_id = cpa.patient_user_id
            WHERE u.id = auth.uid()
              AND (u.raw_app_meta_data->>'role' IN ('clinician', 'admin'))
        )
    );

-- Policy: Only system (service role) can insert/update jobs
-- Patient/clinician create jobs via API which uses service role internally
DROP POLICY IF EXISTS processing_jobs_system_insert ON public.processing_jobs;
CREATE POLICY processing_jobs_system_insert ON public.processing_jobs
    FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS processing_jobs_system_update ON public.processing_jobs;
CREATE POLICY processing_jobs_system_update ON public.processing_jobs
    FOR UPDATE
    USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- SECTION 6: GRANTS
-- =============================================================================

-- Grant read access to authenticated users (RLS policies enforce ownership)
GRANT SELECT ON public.processing_jobs TO authenticated;

-- Service role gets full access (for API to manage jobs)
GRANT ALL ON public.processing_jobs TO service_role;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
