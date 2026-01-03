-- Migration: V05-I05.4b - Add Prompt Versioning to Report Sections
-- Description: Enable version evolution tracking for prompt changes
-- Author: GitHub Copilot
-- Date: 2026-01-03
-- Issue: V05-I05.4

-- ============================================================
-- Add Prompt Version Tracking Columns
-- ============================================================

-- Add columns for prompt identity tracking
ALTER TABLE public.report_sections
  ADD COLUMN IF NOT EXISTS prompt_bundle_version TEXT,
  ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;

-- Update existing rows to have content_version = 1
UPDATE public.report_sections SET content_version = 1 WHERE content_version IS NULL;

-- Make content_version NOT NULL after backfill
ALTER TABLE public.report_sections ALTER COLUMN content_version SET NOT NULL;

-- ============================================================
-- Update Unique Constraint
-- ============================================================

-- Drop old unique index on job_id only
DROP INDEX IF EXISTS public.idx_report_sections_job_id;

-- Create new composite unique index: (job_id, content_version)
-- This allows multiple versions per job when prompt changes
CREATE UNIQUE INDEX idx_report_sections_job_content_version 
ON public.report_sections(job_id, content_version);

-- Add index on job_id for lookups (non-unique now)
CREATE INDEX idx_report_sections_job_id_lookup 
ON public.report_sections(job_id);

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON COLUMN public.report_sections.prompt_bundle_version IS 
'Composite version string of all prompts used in generation (e.g., "overview-v1.0.0,recommendations-v1.0.0"). Enables audit trail.';

COMMENT ON COLUMN public.report_sections.content_version IS 
'Monotonic version number for this job. Increments when re-run with different prompt versions. Enables version evolution tracking.';

-- ============================================================
-- Validation
-- ============================================================

DO $$
BEGIN
  -- Verify new columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'report_sections' 
    AND column_name = 'content_version'
  ) THEN
    RAISE EXCEPTION 'Migration failed: content_version column not created';
  END IF;
  
  -- Verify new unique index exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'report_sections' 
    AND indexname = 'idx_report_sections_job_content_version'
  ) THEN
    RAISE EXCEPTION 'Migration failed: idx_report_sections_job_content_version not created';
  END IF;
  
  RAISE NOTICE 'Migration V05-I05.4b: prompt versioning columns added successfully';
END $$;
