-- Migration: Optimize indexes for B3 assessment navigation
-- Created: 2024-12-09
-- Purpose: Add/verify indexes for performant navigation queries

-- Assessment answers lookup by assessment_id
-- This index already exists as idx_assessment_answers_lookup
-- but let's ensure it's optimal for our queries
-- CREATE INDEX IF NOT EXISTS idx_assessment_answers_lookup 
--   ON public.assessment_answers (assessment_id, question_id);

-- Additional index for faster question_id lookups in SET operations
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question_id 
  ON public.assessment_answers (question_id);

-- Funnel steps lookup and ordering
-- These indexes already exist but verifying they're optimal
-- CREATE INDEX IF NOT EXISTS funnel_steps_funnel_id_idx 
--   ON public.funnel_steps (funnel_id);
-- CREATE INDEX IF NOT EXISTS funnel_steps_order_index_idx 
--   ON public.funnel_steps (order_index);

-- Composite index for faster step ordering queries
CREATE INDEX IF NOT EXISTS idx_funnel_steps_funnel_order 
  ON public.funnel_steps (funnel_id, order_index);

-- Funnel step questions lookup
-- CREATE INDEX IF NOT EXISTS funnel_step_questions_funnel_step_id_idx 
--   ON public.funnel_step_questions (funnel_step_id);

-- Composite index for step questions with ordering
CREATE INDEX IF NOT EXISTS idx_funnel_step_questions_with_order 
  ON public.funnel_step_questions (funnel_step_id, order_index, is_required);

-- Assessment funnel_id lookup for navigation queries
-- CREATE INDEX IF NOT EXISTS assessments_funnel_id_idx 
--   ON public.assessments (funnel_id);

-- Comment on performance considerations
COMMENT ON INDEX idx_assessment_answers_question_id IS 
  'B3: Optimizes question_id lookups for navigation state calculations';

COMMENT ON INDEX idx_funnel_steps_funnel_order IS 
  'B3: Optimizes funnel step ordering queries for next/previous navigation';

COMMENT ON INDEX idx_funnel_step_questions_with_order IS 
  'B3: Optimizes step question queries with required flag for validation';

-- Add check for index usage statistics (for monitoring)
-- Run this query to monitor index effectiveness:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' 
-- AND tablename IN ('assessments', 'assessment_answers', 'funnel_steps', 'funnel_step_questions')
-- ORDER BY idx_scan DESC;
