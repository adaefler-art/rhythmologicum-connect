-- Migration: E74.7 - Start/Resume Idempotency
-- Purpose: Prevent duplicate assessment runs, enforce one in-progress assessment per patient+funnel
-- Issue: E74.7 — Start/Resume Idempotency: No duplicate runs, deterministic "new vs resume"

-- Rule R-E74.7-001: ONE in-progress assessment per patient+funnel
-- Create unique partial index to enforce constraint
-- This prevents creating multiple in-progress assessments for same patient+funnel combination
-- Note: Index created without CONCURRENTLY to ensure transactional safety in migration
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessments_one_in_progress_per_patient_funnel
  ON assessments (patient_id, funnel)
  WHERE completed_at IS NULL;

COMMENT ON INDEX idx_assessments_one_in_progress_per_patient_funnel IS 
  'E74.7-R-001: Enforces exactly one in-progress assessment per patient+funnel combination. Prevents duplicate runs.';

-- Rule R-E74.7-002: Index for efficient lookup of in-progress assessments
-- This index was already created in earlier migration (idx_assessments_patient_in_progress)
-- We verify it exists and add comment if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_assessments_patient_in_progress'
  ) THEN
    COMMENT ON INDEX idx_assessments_patient_in_progress IS 
      'E6.4.2 + E74.7-R-002: Optimizes query for finding in-progress assessments by patient. Used for resume/create logic.';
  END IF;
END $$;
