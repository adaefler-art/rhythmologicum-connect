-- Migration: E76.4 - Diagnosis Run Execution Worker
-- Description: Creates table for diagnosis runs with status tracking and artifact persistence
--              Follows processing_jobs pattern for consistency
--              Provides LLM/MCP integration with context pack handling
-- Date: 2026-02-02
-- Issue: E76.4

-- =============================================================================
-- SECTION 1: CREATE DIAGNOSIS RUN STATUS ENUM
-- =============================================================================

-- Diagnosis run status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'diagnosis_run_status') THEN
        CREATE TYPE public.diagnosis_run_status AS ENUM (
            'queued',
            'in_progress',
            'completed',
            'failed'
        );
    END IF;
END $$;

COMMENT ON TYPE public.diagnosis_run_status IS 'E76.4: Diagnosis run status tracking';

-- =============================================================================
-- SECTION 2: CREATE DIAGNOSIS_RUNS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.diagnosis_runs (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Assessment reference (soft reference, no FK)
    assessment_id UUID NOT NULL,
    
    -- Idempotency key
    correlation_id TEXT NOT NULL,
    
    -- Status tracking
    status public.diagnosis_run_status NOT NULL DEFAULT 'queued',
    
    -- Retry tracking
    attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt >= 1 AND attempt <= 10),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1 AND attempt <= max_attempts),
    
    -- Context pack (input data for LLM/MCP)
    -- Structure: { assessment_data: {...}, funnel_config: {...}, patient_context: {...} }
    context_pack JSONB,
    
    -- Diagnosis result (LLM/MCP output)
    -- Structure: { diagnosis: {...}, confidence: number, metadata: {...} }
    diagnosis_result JSONB,
    
    -- PHI-free error tracking (JSONB array of redacted errors)
    -- Structure: [{ code: 'ERROR_CODE', message: 'PHI-free message', timestamp: '...' }]
    errors JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Schema version for contract evolution
    schema_version TEXT NOT NULL DEFAULT 'v1',
    
    -- Constraints
    -- Idempotency: (assessment_id, correlation_id, schema_version)
    CONSTRAINT diagnosis_runs_assessment_correlation_version_unique 
        UNIQUE (assessment_id, correlation_id, schema_version)
);

-- Table and column comments
COMMENT ON TABLE public.diagnosis_runs IS 'E76.4: Diagnosis run execution worker - tracks LLM/MCP diagnosis processing';
COMMENT ON COLUMN public.diagnosis_runs.id IS 'Run unique identifier';
COMMENT ON COLUMN public.diagnosis_runs.assessment_id IS 'Assessment being diagnosed (soft reference, no FK)';
COMMENT ON COLUMN public.diagnosis_runs.correlation_id IS 'Idempotency key for preventing duplicate runs';
COMMENT ON COLUMN public.diagnosis_runs.schema_version IS 'Contract version - allows re-runs when algorithm/schema changes';
COMMENT ON COLUMN public.diagnosis_runs.status IS 'Run status (queued, in_progress, completed, failed)';
COMMENT ON COLUMN public.diagnosis_runs.attempt IS 'Current attempt number (1-indexed)';
COMMENT ON COLUMN public.diagnosis_runs.max_attempts IS 'Maximum retry attempts allowed';
COMMENT ON COLUMN public.diagnosis_runs.context_pack IS 'Input data for LLM/MCP (assessment answers, funnel config, patient context)';
COMMENT ON COLUMN public.diagnosis_runs.diagnosis_result IS 'LLM/MCP output artifact (diagnosis, confidence, metadata)';
COMMENT ON COLUMN public.diagnosis_runs.errors IS 'PHI-free redacted error log (JSONB array)';

-- =============================================================================
-- SECTION 3: CREATE INDEXES
-- =============================================================================

-- Primary lookup: by assessment_id
CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_assessment_id 
    ON public.diagnosis_runs(assessment_id);

-- Idempotency lookup: by correlation_id
CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_correlation_id 
    ON public.diagnosis_runs(correlation_id);

-- Status filtering (for worker queue processing)
CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_status 
    ON public.diagnosis_runs(status) 
    WHERE status IN ('queued', 'in_progress');

-- Timestamp queries (for monitoring/cleanup)
CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_created_at 
    ON public.diagnosis_runs(created_at DESC);

-- Composite index for common queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_status_created 
    ON public.diagnosis_runs(status, created_at DESC);

-- =============================================================================
-- SECTION 4: CREATE UPDATED_AT TRIGGER
-- =============================================================================

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_diagnosis_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_diagnosis_runs_updated_at ON public.diagnosis_runs;
CREATE TRIGGER trigger_diagnosis_runs_updated_at
    BEFORE UPDATE ON public.diagnosis_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_diagnosis_runs_updated_at();

-- =============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.diagnosis_runs ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own diagnosis runs (by assessment ownership)
DROP POLICY IF EXISTS diagnosis_runs_patient_select ON public.diagnosis_runs;
CREATE POLICY diagnosis_runs_patient_select ON public.diagnosis_runs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            JOIN public.patient_profiles pp ON pp.id = a.patient_id
            WHERE a.id = diagnosis_runs.assessment_id
              AND pp.user_id = auth.uid()
        )
    );

-- Policy: Clinicians can view diagnosis runs for their assigned patients only
DROP POLICY IF EXISTS diagnosis_runs_clinician_select ON public.diagnosis_runs;
CREATE POLICY diagnosis_runs_clinician_select ON public.diagnosis_runs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN public.clinician_patient_assignments cpa ON cpa.clinician_user_id = u.id
            JOIN public.assessments a ON a.id = diagnosis_runs.assessment_id
            JOIN public.patient_profiles pp ON pp.id = a.patient_id
                AND pp.user_id = cpa.patient_user_id
            WHERE u.id = auth.uid()
              AND (u.raw_app_meta_data->>'role' IN ('clinician', 'admin'))
        )
    );

-- Policy: Only system (service role) can insert/update diagnosis runs
-- Patient/clinician trigger runs via API which uses service role internally
DROP POLICY IF EXISTS diagnosis_runs_system_insert ON public.diagnosis_runs;
CREATE POLICY diagnosis_runs_system_insert ON public.diagnosis_runs
    FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS diagnosis_runs_system_update ON public.diagnosis_runs;
CREATE POLICY diagnosis_runs_system_update ON public.diagnosis_runs
    FOR UPDATE
    USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- SECTION 6: GRANTS
-- =============================================================================

-- Grant read access to authenticated users (RLS policies enforce ownership)
GRANT SELECT ON public.diagnosis_runs TO authenticated;

-- Service role gets full access (for API/worker to manage runs)
GRANT ALL ON public.diagnosis_runs TO service_role;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
