-- =============================================================================
-- V05-I04.2: AI Extraction Pipeline + Confidence Metadata
-- =============================================================================
--
-- Issue: V05-I04.2 — AI Extraction Pipeline + Confidence Metadata
-- Date: 2026-01-03
--
-- This migration adds extraction pipeline fields to the documents table:
-- - extractor_version: Versioned identifier for the extraction algorithm
-- - input_hash: SHA-256 hash of inputs for idempotent extraction
-- - extracted_json: Structured extracted data from AI
-- - confidence_json: Per-field confidence scores + evidence pointers
--
-- Idempotency: The unique constraint on (document_id, extractor_version, input_hash)
-- ensures that the same document with the same extractor version and inputs
-- will not create duplicate extraction results.
--
-- =============================================================================

-- Add extraction pipeline columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS extractor_version TEXT,
ADD COLUMN IF NOT EXISTS input_hash TEXT,
ADD COLUMN IF NOT EXISTS extracted_json JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS confidence_json JSONB DEFAULT '{}'::jsonb;

-- Add comments for new columns
COMMENT ON COLUMN public.documents.extractor_version IS 'V05-I04.2: Version identifier for the extraction algorithm (e.g., "v1.0.0")';
COMMENT ON COLUMN public.documents.input_hash IS 'V05-I04.2: SHA-256 hash of extraction inputs for idempotent behavior';
COMMENT ON COLUMN public.documents.extracted_json IS 'V05-I04.2: AI-extracted structured data (e.g., lab values, medications)';
COMMENT ON COLUMN public.documents.confidence_json IS 'V05-I04.2: Per-field confidence scores + PHI-safe evidence pointers';

-- Create index for faster lookups by extractor version
CREATE INDEX IF NOT EXISTS idx_documents_extractor_version 
ON public.documents(extractor_version) 
WHERE extractor_version IS NOT NULL;

-- Create index for faster lookups by input hash
CREATE INDEX IF NOT EXISTS idx_documents_input_hash 
ON public.documents(input_hash) 
WHERE input_hash IS NOT NULL;

-- Create unique constraint for idempotency
-- Note: Using a partial unique index to allow NULL values
-- (documents without extraction results don't participate in the constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_extraction_idempotency
ON public.documents(id, extractor_version, input_hash)
WHERE extractor_version IS NOT NULL AND input_hash IS NOT NULL;

COMMENT ON INDEX idx_documents_extraction_idempotency IS 'V05-I04.2: Ensures idempotent extraction - same document + version + inputs = one result';

-- =============================================================================
-- End of V05-I04.2 migration
-- =============================================================================
