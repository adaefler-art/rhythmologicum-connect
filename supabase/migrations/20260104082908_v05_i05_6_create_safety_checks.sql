-- Migration: V05-I05.6 - Create Safety Check Results Table
-- Description: Storage for Medical Validation Layer 2 results (AI-powered safety checks)
-- Author: GitHub Copilot
-- Date: 2026-01-04
-- Issue: V05-I05.6

-- ============================================================
-- SECTION 1: CREATE SAFETY ACTION ENUM
-- ============================================================

-- Safety check action enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_action') THEN
        CREATE TYPE public.safety_action AS ENUM (
            'PASS',
            'FLAG',
            'BLOCK',
            'UNKNOWN'
        );
    END IF;
END $$;

COMMENT ON TYPE public.safety_action IS 'V05-I05.6: Safety check recommended action';

-- ============================================================
-- SECTION 2: CREATE SAFETY_CHECK_RESULTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.safety_check_results (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Processing job reference (links to processing_jobs)
    job_id UUID NOT NULL,
    
    -- Report sections reference (links to report_sections)
    sections_id UUID NOT NULL,
    
    -- Version tracking
    safety_version TEXT NOT NULL DEFAULT 'v1',
    prompt_version TEXT NOT NULL,
    
    -- Model configuration (stored for reproducibility)
    model_provider TEXT NOT NULL,  -- anthropic, openai, template
    model_name TEXT,
    model_temperature NUMERIC(3,2),
    model_max_tokens INTEGER,
    
    -- Overall safety results
    overall_action public.safety_action NOT NULL,
    safety_score INTEGER NOT NULL CHECK (safety_score >= 0 AND safety_score <= 100),
    overall_severity TEXT NOT NULL,
    
    -- Complete safety check result (JSONB)
    -- Structure: { findings: [...], summaryReasoning: "...", metadata: {...} }
    check_data JSONB NOT NULL,
    
    -- Metadata (for quick queries without parsing JSONB)
    findings_count INTEGER NOT NULL DEFAULT 0,
    critical_findings_count INTEGER NOT NULL DEFAULT 0,
    high_findings_count INTEGER NOT NULL DEFAULT 0,
    medium_findings_count INTEGER NOT NULL DEFAULT 0,
    low_findings_count INTEGER NOT NULL DEFAULT 0,
    
    -- Execution metadata
    evaluation_time_ms INTEGER NOT NULL DEFAULT 0,
    llm_call_count INTEGER NOT NULL DEFAULT 0,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Deterministic evaluation tracking
    -- Hash of (sectionsId + promptVersion) for idempotent behavior
    evaluation_key_hash TEXT,
    
    -- Timestamps
    evaluated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    -- Each job should have at most one safety check result
    CONSTRAINT safety_check_results_job_id_unique UNIQUE (job_id),
    -- Deterministic evaluation: same sections + prompt version → same record
    CONSTRAINT safety_check_results_evaluation_key_unique UNIQUE (evaluation_key_hash)
);

-- Table and column comments
COMMENT ON TABLE public.safety_check_results IS 'V05-I05.6: Medical Validation Layer 2 results - AI-powered safety assessments';
COMMENT ON COLUMN public.safety_check_results.id IS 'Safety check result unique identifier';
COMMENT ON COLUMN public.safety_check_results.job_id IS 'Processing job reference (unique per job)';
COMMENT ON COLUMN public.safety_check_results.sections_id IS 'Report sections reference';
COMMENT ON COLUMN public.safety_check_results.safety_version IS 'Safety check schema version (v1)';
COMMENT ON COLUMN public.safety_check_results.prompt_version IS 'Prompt version used for evaluation';
COMMENT ON COLUMN public.safety_check_results.overall_action IS 'Recommended action (PASS/FLAG/BLOCK/UNKNOWN)';
COMMENT ON COLUMN public.safety_check_results.safety_score IS 'Overall safety score (0-100, higher = safer)';
COMMENT ON COLUMN public.safety_check_results.overall_severity IS 'Overall severity level';
COMMENT ON COLUMN public.safety_check_results.check_data IS 'Complete safety check result (findings, reasoning, metadata)';
COMMENT ON COLUMN public.safety_check_results.evaluation_key_hash IS 'Hash for idempotent evaluation (sectionsId + promptVersion)';

-- ============================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================

-- Primary lookup: by job_id (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_safety_check_results_job_id 
    ON public.safety_check_results(job_id);

-- Lookup by sections_id
CREATE INDEX IF NOT EXISTS idx_safety_check_results_sections_id 
    ON public.safety_check_results(sections_id);

-- Filter by overall action
CREATE INDEX IF NOT EXISTS idx_safety_check_results_overall_action 
    ON public.safety_check_results(overall_action);

-- Filter by safety score (for queries like "score < 60")
CREATE INDEX IF NOT EXISTS idx_safety_check_results_safety_score 
    ON public.safety_check_results(safety_score);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_safety_check_results_evaluated_at 
    ON public.safety_check_results(evaluated_at DESC);

-- Composite index for finding flagged/blocked checks
CREATE INDEX IF NOT EXISTS idx_safety_check_results_action_evaluated 
    ON public.safety_check_results(overall_action, evaluated_at DESC);

-- Deterministic evaluation lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_safety_check_results_evaluation_key 
    ON public.safety_check_results(evaluation_key_hash)
    WHERE evaluation_key_hash IS NOT NULL;

-- ============================================================
-- SECTION 4: CREATE RLS POLICIES
-- ============================================================

-- Enable Row Level Security
ALTER TABLE public.safety_check_results ENABLE ROW LEVEL SECURITY;

-- Policy 1: Patients can read their own safety check results (via processing_jobs → assessments)
CREATE POLICY safety_check_results_select_own ON public.safety_check_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_jobs pj
            JOIN public.assessments a ON a.id = pj.assessment_id
            WHERE pj.id = safety_check_results.job_id
            AND a.user_id = auth.uid()
        )
    );

-- Policy 2: Clinicians can read safety check results for assigned patients
CREATE POLICY safety_check_results_select_clinician ON public.safety_check_results
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' IN ('clinician', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.processing_jobs pj
            JOIN public.assessments a ON a.id = pj.assessment_id
            WHERE pj.id = safety_check_results.job_id
            AND auth.jwt() ->> 'role' = 'clinician'
        )
    );

-- Policy 3: Service role can insert (for processing pipeline)
CREATE POLICY safety_check_results_insert_service ON public.safety_check_results
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy 4: Service role can update (for reprocessing)
CREATE POLICY safety_check_results_update_service ON public.safety_check_results
    FOR UPDATE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
    )
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- ============================================================
-- SECTION 5: CREATE TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_safety_check_results_updated_at
    BEFORE UPDATE ON public.safety_check_results
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SECTION 6: CREATE HELPER FUNCTIONS
-- ============================================================

/**
 * Compute evaluation key hash for idempotent behavior
 * Hash is based on sections_id + prompt_version
 */
CREATE OR REPLACE FUNCTION public.compute_safety_evaluation_key_hash(
    p_sections_id UUID,
    p_prompt_version TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        digest(
            p_sections_id::TEXT || '|' || p_prompt_version,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.compute_safety_evaluation_key_hash IS 'V05-I05.6: Compute hash for idempotent safety evaluations';

-- ============================================================
-- SECTION 7: GRANTS
-- ============================================================

-- Grant necessary permissions
GRANT SELECT ON public.safety_check_results TO anon, authenticated;
GRANT INSERT, UPDATE ON public.safety_check_results TO service_role;
GRANT USAGE ON SEQUENCE safety_check_results_id_seq TO service_role;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
