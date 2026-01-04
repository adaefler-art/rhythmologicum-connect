-- Migration: V05-I05.8 - Add PDF columns to processing_jobs
-- Description: Adds columns for storing PDF generation metadata
--              PDF paths are PHI-free using deterministic hashing
--              Supports signed URL generation for secure access
-- Date: 2026-01-04
-- Issue: V05-I05.8

-- =============================================================================
-- SECTION 1: ADD PDF COLUMNS TO PROCESSING_JOBS
-- =============================================================================

-- Add PDF storage path column (PHI-free path)
ALTER TABLE public.processing_jobs
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add PDF metadata column (JSONB for extensibility)
-- Stores: fileSize, generatedAt, version, hash (for determinism verification)
ALTER TABLE public.processing_jobs
ADD COLUMN IF NOT EXISTS pdf_metadata JSONB;

-- Add PDF signed URL expiry tracking (optional, for cleanup)
ALTER TABLE public.processing_jobs
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- =============================================================================
-- SECTION 2: COLUMN COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.processing_jobs.pdf_path IS 
    'V05-I05.8: PHI-free storage path for generated PDF (format: reports/{job_id_hash}/{timestamp}.pdf)';

COMMENT ON COLUMN public.processing_jobs.pdf_metadata IS 
    'V05-I05.8: PDF generation metadata (fileSize, generatedAt, version, hash) - PHI-free';

COMMENT ON COLUMN public.processing_jobs.pdf_generated_at IS 
    'V05-I05.8: Timestamp when PDF was generated (for cache/cleanup tracking)';

-- =============================================================================
-- SECTION 3: CREATE INDEX FOR PDF LOOKUPS
-- =============================================================================

-- Index for finding jobs with PDFs
CREATE INDEX IF NOT EXISTS idx_processing_jobs_pdf_path 
    ON public.processing_jobs(pdf_path) 
    WHERE pdf_path IS NOT NULL;

-- Index for PDF generation timestamp queries (cleanup, monitoring)
CREATE INDEX IF NOT EXISTS idx_processing_jobs_pdf_generated 
    ON public.processing_jobs(pdf_generated_at DESC) 
    WHERE pdf_generated_at IS NOT NULL;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
