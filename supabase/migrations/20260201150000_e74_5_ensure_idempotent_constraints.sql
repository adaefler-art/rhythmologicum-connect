-- E74.5: Ensure Idempotent Constraints for Assessment Persistence
-- Purpose: Make key constraints idempotent to support safe re-runs and avoid migration failures
-- 
-- This migration ensures that critical constraints can be safely re-applied:
-- 1. assessment_answers unique constraint (assessment_id, question_id)
-- 2. Related indexes for performance
--
-- Idempotency Strategy: Use DO blocks to check for constraint existence before adding

-- Make the unique constraint idempotent
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'assessment_answers_assessment_question_unique'
        AND conrelid = 'public.assessment_answers'::regclass
    ) THEN
        -- Add the unique constraint
        ALTER TABLE public.assessment_answers
            ADD CONSTRAINT assessment_answers_assessment_question_unique 
            UNIQUE (assessment_id, question_id);
        
        -- Add comment
        COMMENT ON CONSTRAINT assessment_answers_assessment_question_unique 
            ON public.assessment_answers IS 
            'Ensures each question has exactly one answer per assessment. Used for save-on-tap upsert logic in mobile funnel.';
    END IF;
END $$;

-- Index already uses IF NOT EXISTS, so it's already idempotent
CREATE INDEX IF NOT EXISTS idx_assessment_answers_lookup 
    ON public.assessment_answers (assessment_id, question_id);

-- Verify the constraint exists (helpful for debugging)
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'assessment_answers_assessment_question_unique'
        AND conrelid = 'public.assessment_answers'::regclass
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'E74.5: Unique constraint assessment_answers_assessment_question_unique verified';
    ELSE
        RAISE EXCEPTION 'E74.5: Failed to create unique constraint assessment_answers_assessment_question_unique';
    END IF;
END $$;
