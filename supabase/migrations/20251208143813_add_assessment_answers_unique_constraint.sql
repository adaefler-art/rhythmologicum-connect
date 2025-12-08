-- Migration: Add unique constraint to assessment_answers for save-on-tap functionality
-- This ensures that each question can only have one answer per assessment (no duplicates)
-- Supports upsert operations for mobile funnel integration

-- Add unique constraint on assessment_id + question_id combination
-- This prevents duplicate answers for the same question in the same assessment
ALTER TABLE public.assessment_answers
  ADD CONSTRAINT assessment_answers_assessment_question_unique 
  UNIQUE (assessment_id, question_id);

-- Create an index to optimize lookups by assessment_id and question_id
-- This improves performance for the upsert operations
CREATE INDEX IF NOT EXISTS idx_assessment_answers_lookup 
  ON public.assessment_answers (assessment_id, question_id);

-- Comment explaining the constraint
COMMENT ON CONSTRAINT assessment_answers_assessment_question_unique 
  ON public.assessment_answers IS 
  'Ensures each question has exactly one answer per assessment. Used for save-on-tap upsert logic in mobile funnel.';
