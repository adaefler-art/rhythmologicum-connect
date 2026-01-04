-- Migration: V05-I05.5 - Create Medical Validation Results Table
-- Description: Storage for Medical Validation Layer 1 results (rules-based checks)
-- Author: GitHub Copilot
-- Date: 2026-01-04
-- Issue: V05-I05.5

-- ============================================================
-- SECTION 1: CREATE VALIDATION STATUS ENUM
-- ============================================================

-- Overall validation status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_status') THEN
        CREATE TYPE public.validation_status AS ENUM (
            'pass',
            'flag',
            'fail'
        );
    END IF;
END $$;

COMMENT ON TYPE public.validation_status IS 'V05-I05.5: Medical validation overall status';

-- ============================================================
-- SECTION 2: CREATE MEDICAL_VALIDATION_RESULTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.medical_validation_results (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Processing job reference (links to processing_jobs)
    job_id UUID NOT NULL,
    
    -- Report sections reference (links to report_sections, optional if sections not generated)
    sections_id UUID,
    
    -- Version tracking
    validation_version TEXT NOT NULL DEFAULT 'v1',
    engine_version TEXT NOT NULL,
    
    -- Overall validation status
    overall_status public.validation_status NOT NULL,
    overall_passed BOOLEAN NOT NULL,
    
    -- Validation results (JSONB)
    -- Structure: { flags: [...], sectionResults: [...], metadata: {...} }
    validation_data JSONB NOT NULL,
    
    -- Metadata (for quick queries without parsing JSONB)
    flags_raised_count INTEGER NOT NULL DEFAULT 0,
    critical_flags_count INTEGER NOT NULL DEFAULT 0,
    warning_flags_count INTEGER NOT NULL DEFAULT 0,
    info_flags_count INTEGER NOT NULL DEFAULT 0,
    rules_evaluated_count INTEGER NOT NULL DEFAULT 0,
    validation_time_ms INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    validated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    -- Each job should have at most one validation result
    CONSTRAINT medical_validation_results_job_id_unique UNIQUE (job_id)
);

-- Table and column comments
COMMENT ON TABLE public.medical_validation_results IS 'V05-I05.5: Medical Validation Layer 1 results - rules-based contraindication/plausibility checks';
COMMENT ON COLUMN public.medical_validation_results.id IS 'Validation result unique identifier';
COMMENT ON COLUMN public.medical_validation_results.job_id IS 'Processing job reference (unique per job)';
COMMENT ON COLUMN public.medical_validation_results.sections_id IS 'Report sections reference (optional)';
COMMENT ON COLUMN public.medical_validation_results.validation_version IS 'Validation schema version (v1)';
COMMENT ON COLUMN public.medical_validation_results.engine_version IS 'Validation engine/rules version used';
COMMENT ON COLUMN public.medical_validation_results.overall_status IS 'Overall validation status (pass/flag/fail)';
COMMENT ON COLUMN public.medical_validation_results.overall_passed IS 'True if no critical flags (allows progression)';
COMMENT ON COLUMN public.medical_validation_results.validation_data IS 'Complete validation result (flags, section results, metadata)';
COMMENT ON COLUMN public.medical_validation_results.flags_raised_count IS 'Total number of flags raised';
COMMENT ON COLUMN public.medical_validation_results.critical_flags_count IS 'Number of critical flags (blocks progression)';
COMMENT ON COLUMN public.medical_validation_results.warning_flags_count IS 'Number of warning flags';
COMMENT ON COLUMN public.medical_validation_results.info_flags_count IS 'Number of info flags';
COMMENT ON COLUMN public.medical_validation_results.rules_evaluated_count IS 'Number of rules evaluated';
COMMENT ON COLUMN public.medical_validation_results.validation_time_ms IS 'Validation execution time in milliseconds';

-- ============================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================

-- Primary lookup: by job_id (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_medical_validation_results_job_id 
    ON public.medical_validation_results(job_id);

-- Lookup by sections_id
CREATE INDEX IF NOT EXISTS idx_medical_validation_results_sections_id 
    ON public.medical_validation_results(sections_id)
    WHERE sections_id IS NOT NULL;

-- Filter by overall status
CREATE INDEX IF NOT EXISTS idx_medical_validation_results_overall_status 
    ON public.medical_validation_results(overall_status);

-- Filter by overall passed (for finding failures)
CREATE INDEX IF NOT EXISTS idx_medical_validation_results_overall_passed 
    ON public.medical_validation_results(overall_passed)
    WHERE overall_passed = false;

-- Timestamp queries (for monitoring/reporting)
CREATE INDEX IF NOT EXISTS idx_medical_validation_results_validated_at 
    ON public.medical_validation_results(validated_at DESC);

-- Composite index for common queries (status + timestamp)
CREATE INDEX IF NOT EXISTS idx_medical_validation_results_status_validated 
    ON public.medical_validation_results(overall_status, validated_at DESC);

-- ============================================================
-- SECTION 4: CREATE UPDATED_AT TRIGGER
-- ============================================================

-- Reuse existing trigger function if available, otherwise create
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_medical_validation_results_updated_at'
    ) THEN
        CREATE OR REPLACE FUNCTION public.update_medical_validation_results_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_medical_validation_results_updated_at ON public.medical_validation_results;
CREATE TRIGGER trigger_medical_validation_results_updated_at
    BEFORE UPDATE ON public.medical_validation_results
    FOR EACH ROW
    EXECUTE FUNCTION public.update_medical_validation_results_updated_at();

-- ============================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE public.medical_validation_results ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view validation results for their own jobs
-- (via processing_jobs → assessments → patient ownership)
DROP POLICY IF EXISTS medical_validation_results_patient_select ON public.medical_validation_results;
CREATE POLICY medical_validation_results_patient_select ON public.medical_validation_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_jobs pj
            JOIN public.assessments a ON a.id = pj.assessment_id
            JOIN public.patient_profiles pp ON pp.id = a.patient_id
            WHERE pj.id = medical_validation_results.job_id
              AND pp.user_id = auth.uid()
        )
    );

-- Policy: Clinicians can view validation results for assigned patients only
DROP POLICY IF EXISTS medical_validation_results_clinician_select ON public.medical_validation_results;
CREATE POLICY medical_validation_results_clinician_select ON public.medical_validation_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN public.clinician_patient_assignments cpa ON cpa.clinician_user_id = u.id
            JOIN public.processing_jobs pj ON pj.id = medical_validation_results.job_id
            JOIN public.assessments a ON a.id = pj.assessment_id
            JOIN public.patient_profiles pp ON pp.id = a.patient_id
                AND pp.user_id = cpa.patient_user_id
            WHERE u.id = auth.uid()
              AND (u.raw_app_meta_data->>'role' IN ('clinician', 'admin'))
        )
    );

-- Policy: Only system (service role) can insert/update validation results
-- Validation is triggered by processing pipeline using service role
DROP POLICY IF EXISTS medical_validation_results_system_insert ON public.medical_validation_results;
CREATE POLICY medical_validation_results_system_insert ON public.medical_validation_results
    FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS medical_validation_results_system_update ON public.medical_validation_results;
CREATE POLICY medical_validation_results_system_update ON public.medical_validation_results
    FOR UPDATE
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- SECTION 6: GRANTS
-- ============================================================

-- Grant read access to authenticated users (RLS policies enforce ownership)
GRANT SELECT ON public.medical_validation_results TO authenticated;

-- Service role gets full access (for processing pipeline)
GRANT ALL ON public.medical_validation_results TO service_role;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
