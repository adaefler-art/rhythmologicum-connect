-- Migration: V05-I05.4 - Create Report Sections Table
-- Description: Storage for modular, versioned report sections with prompt tracking
-- Author: GitHub Copilot
-- Date: 2026-01-03
-- Issue: V05-I05.4

-- ============================================================
-- Table: report_sections
-- ============================================================

CREATE TABLE IF NOT EXISTS public.report_sections (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job reference (links to processing_jobs)
  job_id UUID NOT NULL,
  
  -- Risk bundle reference
  risk_bundle_id UUID NOT NULL,
  
  -- Priority ranking reference (optional)
  ranking_id UUID,
  
  -- Version tracking
  sections_version TEXT NOT NULL DEFAULT 'v1',
  
  -- Program tier (optional)
  program_tier TEXT,
  
  -- Complete sections data (JSONB)
  sections_data JSONB NOT NULL,
  
  -- Generation metadata
  generation_time_ms INTEGER,
  llm_call_count INTEGER DEFAULT 0,
  fallback_count INTEGER DEFAULT 0,
  
  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Primary lookup by job_id (unique per job)
CREATE UNIQUE INDEX idx_report_sections_job_id 
ON public.report_sections(job_id);

-- Lookup by risk_bundle_id
CREATE INDEX idx_report_sections_risk_bundle_id 
ON public.report_sections(risk_bundle_id);

-- Lookup by ranking_id (for reports with rankings)
CREATE INDEX idx_report_sections_ranking_id 
ON public.report_sections(ranking_id)
WHERE ranking_id IS NOT NULL;

-- Time-based queries (e.g., recent reports)
CREATE INDEX idx_report_sections_generated_at 
ON public.report_sections(generated_at DESC);

-- Program tier filtering
CREATE INDEX idx_report_sections_program_tier 
ON public.report_sections(program_tier)
WHERE program_tier IS NOT NULL;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can read their own report sections
-- Via: report_sections -> risk_bundles -> assessments -> auth.users
CREATE POLICY report_sections_select_own
ON public.report_sections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.risk_bundles rb
    JOIN public.assessments a ON a.id = rb.assessment_id
    WHERE rb.id = report_sections.risk_bundle_id
    AND a.user_id = auth.uid()
  )
);

-- Policy: Clinicians can read all report sections
CREATE POLICY report_sections_select_clinician
ON public.report_sections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_app_meta_data->>'role' IN ('clinician', 'admin')
  )
);

-- Policy: Service role can insert/update (via processing pipeline)
-- Note: Service role bypasses RLS, but this is for documentation
CREATE POLICY report_sections_insert_service
ON public.report_sections
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY report_sections_update_service
ON public.report_sections
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- Triggers
-- ============================================================

-- Trigger: Update updated_at on modification
CREATE OR REPLACE FUNCTION update_report_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER report_sections_updated_at
BEFORE UPDATE ON public.report_sections
FOR EACH ROW
EXECUTE FUNCTION update_report_sections_updated_at();

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE public.report_sections IS 
'V05-I05.4: Stores modular, versioned report sections generated from risk bundles and rankings. Includes prompt version tracking for reproducibility.';

COMMENT ON COLUMN public.report_sections.job_id IS 
'Reference to processing_jobs table. One report sections bundle per job.';

COMMENT ON COLUMN public.report_sections.sections_data IS 
'Complete JSONB structure containing all sections with metadata, prompt versions, and generation details. Schema: ReportSectionsV1.';

COMMENT ON COLUMN public.report_sections.sections_version IS 
'Schema version for the sections data structure (e.g., v1). Enables schema evolution.';

COMMENT ON COLUMN public.report_sections.generation_time_ms IS 
'Total time taken to generate all sections in milliseconds.';

COMMENT ON COLUMN public.report_sections.llm_call_count IS 
'Number of LLM API calls made during generation (0 for template-only).';

COMMENT ON COLUMN public.report_sections.fallback_count IS 
'Number of times fallback/template generation was used instead of LLM.';

-- ============================================================
-- Grant Permissions
-- ============================================================

-- Grant SELECT to authenticated users (RLS policies apply)
GRANT SELECT ON public.report_sections TO authenticated;

-- Grant INSERT/UPDATE to service_role only (for processing pipeline)
GRANT INSERT, UPDATE ON public.report_sections TO service_role;

-- ============================================================
-- Validation
-- ============================================================

-- Verify table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'report_sections'
  ) THEN
    RAISE EXCEPTION 'Migration failed: report_sections table not created';
  END IF;
  
  -- Verify indexes exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'report_sections' 
    AND indexname = 'idx_report_sections_job_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: idx_report_sections_job_id not created';
  END IF;
  
  RAISE NOTICE 'Migration V05-I05.4: report_sections table created successfully';
END $$;
