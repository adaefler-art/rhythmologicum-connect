-- Migration: V05-I05.5 (Follow-up) - Add ruleset_hash and update uniqueness constraint
-- Description: Add ruleset_hash column for deterministic ruleset identification and support versioned reruns
-- Author: GitHub Copilot
-- Date: 2026-01-04
-- Issue: V05-I05.5 (review feedback)

-- ============================================================
-- SECTION 1: ADD RULESET_HASH COLUMN
-- ============================================================

-- Add ruleset_hash column (nullable first for backfill)
ALTER TABLE public.medical_validation_results 
ADD COLUMN IF NOT EXISTS ruleset_hash TEXT;

-- Backfill existing rows with a placeholder hash
-- (Real hash will be computed on next validation run)
UPDATE public.medical_validation_results 
SET ruleset_hash = '00000000000000000000000000000000'
WHERE ruleset_hash IS NULL;

-- Make column NOT NULL after backfill
ALTER TABLE public.medical_validation_results 
ALTER COLUMN ruleset_hash SET NOT NULL;

COMMENT ON COLUMN public.medical_validation_results.ruleset_hash IS 'Deterministic SHA-256 hash of active ruleset (first 32 hex chars)';

-- ============================================================
-- SECTION 2: UPDATE UNIQUE CONSTRAINT FOR VERSIONED RERUNS
-- ============================================================

-- Drop old unique constraint (job_id only)
ALTER TABLE public.medical_validation_results 
DROP CONSTRAINT IF EXISTS medical_validation_results_job_id_unique;

-- Drop old index (will be replaced)
DROP INDEX IF EXISTS idx_medical_validation_results_job_id;

-- Create new composite unique constraint: (job_id, validation_version, ruleset_hash)
-- This allows different ruleset versions to coexist without overwriting
CREATE UNIQUE INDEX IF NOT EXISTS idx_medical_validation_results_job_version_hash
  ON public.medical_validation_results(job_id, validation_version, ruleset_hash);

COMMENT ON INDEX idx_medical_validation_results_job_version_hash IS 'Composite uniqueness: allows versioned reruns with different rulesets';

-- Add constraint using the index
ALTER TABLE public.medical_validation_results
ADD CONSTRAINT medical_validation_results_job_version_hash_unique 
  UNIQUE USING INDEX idx_medical_validation_results_job_version_hash;

-- ============================================================
-- SECTION 3: ADD NON-UNIQUE INDEX FOR JOB_ID QUERIES
-- ============================================================

-- Add non-unique index for job_id lookups (for latest result queries)
CREATE INDEX IF NOT EXISTS idx_medical_validation_results_job_id_lookup
  ON public.medical_validation_results(job_id, validated_at DESC);

COMMENT ON INDEX idx_medical_validation_results_job_id_lookup IS 'Non-unique index for querying latest validation by job_id';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
