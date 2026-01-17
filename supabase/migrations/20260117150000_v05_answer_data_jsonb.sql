-- Migration: Add answer_data JSONB column for V0.5 Catalog Funnels
-- Purpose: Support multiple answer types (string, number, boolean) for manifest-based funnels
-- Backward Compatibility: answer_value INTEGER remains for Legacy funnels
-- 
-- V0.5 Catalog Funnels use questionnaire_config manifests with various question types:
-- - number: e.g., age (18-120)
-- - radio: e.g., gender ("male", "female", "other")
-- - scale: e.g., exercise days (0-7)
-- - checkbox, text, etc.
--
-- The new answer_data column stores the raw value as JSONB, preserving type information.

-- Add answer_data column (nullable for backward compatibility)
ALTER TABLE public.assessment_answers
  ADD COLUMN IF NOT EXISTS answer_data JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.assessment_answers.answer_data IS 
  'V0.5+: Stores answer value as JSONB to support multiple types (string, number, boolean). For Legacy funnels, answer_value INTEGER is used.';

-- Create index for JSONB queries (useful for reporting)
CREATE INDEX IF NOT EXISTS idx_assessment_answers_data
  ON public.assessment_answers USING GIN (answer_data)
  WHERE answer_data IS NOT NULL;
