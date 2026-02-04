-- =============================================================================
-- E76.8: Add inputs_meta column to diagnosis_runs table
-- =============================================================================
--
-- Purpose: Store metadata about context pack inputs for transparency and debugging
-- - Enables tracking which specific data went into the diagnosis
-- - Supports idempotency verification
-- - Provides audit trail for deterministic hash calculation
--
-- Migration created: 2026-02-04
-- =============================================================================

-- Add inputs_meta column to diagnosis_runs table
ALTER TABLE public.diagnosis_runs
  ADD COLUMN IF NOT EXISTS inputs_meta jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.diagnosis_runs.inputs_meta IS 'E76.8: Metadata about context pack inputs (patient_id, anamnesis_ids, funnel_run_ids, demographics, measures) - enables audit trail and idempotency verification';

-- Create index for JSONB queries on inputs_meta
CREATE INDEX IF NOT EXISTS idx_diagnosis_runs_inputs_meta ON public.diagnosis_runs USING gin (inputs_meta);

-- Add constraint to ensure inputs_meta is a JSON object (not array or primitive)
ALTER TABLE public.diagnosis_runs
  ADD CONSTRAINT diagnosis_runs_inputs_meta_is_object
  CHECK (jsonb_typeof(inputs_meta) = 'object');
