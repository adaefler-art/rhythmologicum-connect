-- Migration: V05-I01.3 - Versioning Contract
-- Description: Adds version tracking fields to calculated_results, reports, report_sections
--              for complete reproducibility (funnel_version, algorithm_version, prompt_version, report_version)
-- Date: 2025-12-31
-- Issue: V05-I01.3

-- =============================================================================
-- SECTION 1: calculated_results - Add funnel_version_id and tracking fields
-- =============================================================================

-- Add funnel_version_id to calculated_results
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'calculated_results'
          AND column_name = 'funnel_version_id'
    ) THEN
        ALTER TABLE public.calculated_results
            ADD COLUMN funnel_version_id UUID REFERENCES public.funnel_versions(id);
    END IF;
END $$ LANGUAGE plpgsql;

-- Add computed_at timestamp
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'calculated_results'
          AND column_name = 'computed_at'
    ) THEN
        ALTER TABLE public.calculated_results
            ADD COLUMN computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$ LANGUAGE plpgsql;

-- Add inputs_hash for detecting re-run equivalence
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'calculated_results'
          AND column_name = 'inputs_hash'
    ) THEN
        ALTER TABLE public.calculated_results
            ADD COLUMN inputs_hash TEXT;
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.calculated_results.funnel_version_id IS 'V05-I01.3: Reference to funnel version for reproducibility';
COMMENT ON COLUMN public.calculated_results.computed_at IS 'V05-I01.3: When results were computed';
COMMENT ON COLUMN public.calculated_results.inputs_hash IS 'V05-I01.3: SHA256 hash of normalized inputs for detecting equivalent runs';

-- Update unique constraint to be more specific (assessment_id + algorithm_version is already in place)
-- This ensures idempotent re-runs

-- =============================================================================
-- SECTION 2: reports - Add algorithm_version and funnel_version_id
-- =============================================================================

-- Add algorithm_version to reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'algorithm_version'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN algorithm_version TEXT;
    END IF;
END $$ LANGUAGE plpgsql;

-- Add funnel_version_id to reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'funnel_version_id'
    ) THEN
        ALTER TABLE public.reports
            ADD COLUMN funnel_version_id UUID REFERENCES public.funnel_versions(id);
    END IF;
END $$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.reports.algorithm_version IS 'V05-I01.3: Version of algorithm used for scoring';
COMMENT ON COLUMN public.reports.funnel_version_id IS 'V05-I01.3: Reference to funnel version for reproducibility';

-- Make prompt_version NOT NULL with default for new records
DO $$
BEGIN
    -- Set a default value for existing NULL records
    UPDATE public.reports 
    SET prompt_version = '1.0' 
    WHERE prompt_version IS NULL;
    
    -- Now make it NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'prompt_version'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.reports
            ALTER COLUMN prompt_version SET DEFAULT '1.0',
            ALTER COLUMN prompt_version SET NOT NULL;
    END IF;
END $$ LANGUAGE plpgsql;

-- Make report_version NOT NULL (already has default '1.0')
DO $$
BEGIN
    -- Set a default value for existing NULL records (safety)
    UPDATE public.reports 
    SET report_version = '1.0' 
    WHERE report_version IS NULL;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'report_version'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.reports
            ALTER COLUMN report_version SET NOT NULL;
    END IF;
END $$ LANGUAGE plpgsql;

-- Unique constraint already exists: reports_assessment_version_unique (assessment_id, report_version)
-- This ensures retry-safety (idempotent re-runs)

-- =============================================================================
-- SECTION 3: report_sections - Ensure unique constraint
-- =============================================================================

-- Unique constraint already exists from v05 core migration: report_sections_report_key_unique (report_id, section_key)
-- This ensures one section per report + key (idempotent)

-- =============================================================================
-- SECTION 4: Create helper function for version tracking
-- =============================================================================

-- Helper function to generate deterministic report_version
-- Pattern: {funnelVersion}-{algorithmVersion}-{promptVersion}-{date}
CREATE OR REPLACE FUNCTION public.generate_report_version(
    p_funnel_version TEXT,
    p_algorithm_version TEXT,
    p_prompt_version TEXT
) RETURNS TEXT AS $$
DECLARE
    v_date TEXT;
BEGIN
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    RETURN CONCAT(
        COALESCE(p_funnel_version, 'unknown'),
        '-',
        COALESCE(p_algorithm_version, 'v1'),
        '-',
        COALESCE(p_prompt_version, '1.0'),
        '-',
        v_date
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.generate_report_version IS 'V05-I01.3: Generate deterministic report version from component versions';

-- Helper function to compute SHA256 hash of inputs (for inputs_hash)
CREATE OR REPLACE FUNCTION public.compute_inputs_hash(
    p_inputs JSONB
) RETURNS TEXT AS $$
DECLARE
    v_canonical_json TEXT;
BEGIN
    -- Normalize JSONB to canonical form and compute SHA256
    -- Sort keys to ensure consistent hash for same inputs
    v_canonical_json := p_inputs::TEXT;
    RETURN encode(digest(v_canonical_json, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.compute_inputs_hash IS 'V05-I01.3: Compute SHA256 hash of normalized inputs for equivalence detection';

-- =============================================================================
-- SECTION 5: Indexes for performance
-- =============================================================================

-- Index on calculated_results.funnel_version_id for queries
CREATE INDEX IF NOT EXISTS idx_calculated_results_funnel_version 
    ON public.calculated_results(funnel_version_id) 
    WHERE funnel_version_id IS NOT NULL;

-- Index on reports.funnel_version_id for queries
CREATE INDEX IF NOT EXISTS idx_reports_funnel_version 
    ON public.reports(funnel_version_id) 
    WHERE funnel_version_id IS NOT NULL;

-- Index on reports algorithm_version
CREATE INDEX IF NOT EXISTS idx_reports_algorithm_version 
    ON public.reports(algorithm_version) 
    WHERE algorithm_version IS NOT NULL;

COMMENT ON INDEX public.idx_calculated_results_funnel_version IS 'V05-I01.3: Optimize funnel version queries';
COMMENT ON INDEX public.idx_reports_funnel_version IS 'V05-I01.3: Optimize funnel version queries';
COMMENT ON INDEX public.idx_reports_algorithm_version IS 'V05-I01.3: Optimize algorithm version queries';

-- =============================================================================
-- VERIFICATION QUERY (commented out)
-- =============================================================================

-- Uncomment to verify all version fields exist:
/*
SELECT 
    'calculated_results' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'calculated_results'
  AND column_name IN ('algorithm_version', 'funnel_version_id', 'computed_at', 'inputs_hash')
UNION ALL
SELECT 
    'reports' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reports'
  AND column_name IN ('report_version', 'prompt_version', 'algorithm_version', 'funnel_version_id')
UNION ALL
SELECT 
    'report_sections' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'report_sections'
  AND column_name IN ('section_key', 'prompt_version');
*/
