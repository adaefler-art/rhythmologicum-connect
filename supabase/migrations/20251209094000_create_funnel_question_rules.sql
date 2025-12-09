-- Migration: Create funnel_question_rules table for B4 Dynamic Validation
-- This enables conditional required fields and dynamic question visibility

-- Create the funnel_question_rules table
CREATE TABLE IF NOT EXISTS public.funnel_question_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    question_id uuid NOT NULL,
    funnel_step_id uuid NOT NULL,
    rule_type text NOT NULL,
    rule_payload jsonb NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT funnel_question_rules_question_id_fkey 
        FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE,
    CONSTRAINT funnel_question_rules_funnel_step_id_fkey 
        FOREIGN KEY (funnel_step_id) REFERENCES public.funnel_steps(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT valid_rule_type 
        CHECK (rule_type IN ('conditional_required', 'conditional_visible'))
);

-- Add indexes for performance
CREATE INDEX idx_funnel_question_rules_question_id ON public.funnel_question_rules(question_id);
CREATE INDEX idx_funnel_question_rules_funnel_step_id ON public.funnel_question_rules(funnel_step_id);
CREATE INDEX idx_funnel_question_rules_type ON public.funnel_question_rules(rule_type);
CREATE INDEX idx_funnel_question_rules_active ON public.funnel_question_rules(is_active) WHERE is_active = true;

-- Add comment for documentation
COMMENT ON TABLE public.funnel_question_rules IS 'B4: Stores conditional validation rules for dynamic funnel questions';
COMMENT ON COLUMN public.funnel_question_rules.rule_type IS 'Type of rule: conditional_required or conditional_visible';
COMMENT ON COLUMN public.funnel_question_rules.rule_payload IS 'JSONB structure defining conditions and logic. Example: {"type": "conditional_required", "conditions": [{"question_id": "q1", "operator": "in", "values": [1, 2]}], "logic": "AND"}';
COMMENT ON COLUMN public.funnel_question_rules.priority IS 'Higher priority rules are evaluated first (default: 0)';
COMMENT ON COLUMN public.funnel_question_rules.is_active IS 'Allows disabling rules without deleting them';

-- Example rule payload structures (for documentation):
-- 
-- Conditional Required (single condition):
-- {
--   "type": "conditional_required",
--   "conditions": [
--     {
--       "question_key": "stress_frequency",
--       "operator": "in",
--       "values": [3, 4]
--     }
--   ]
-- }
--
-- Conditional Required (multiple conditions with AND logic):
-- {
--   "type": "conditional_required",
--   "logic": "AND",
--   "conditions": [
--     {
--       "question_key": "stress_frequency",
--       "operator": "gte",
--       "value": 3
--     },
--     {
--       "question_key": "sleep_quality",
--       "operator": "lte",
--       "value": 1
--     }
--   ]
-- }
--
-- Conditional Required (multiple conditions with OR logic):
-- {
--   "type": "conditional_required",
--   "logic": "OR",
--   "conditions": [
--     {
--       "question_key": "has_health_issue",
--       "operator": "eq",
--       "value": 1
--     },
--     {
--       "question_key": "age",
--       "operator": "gte",
--       "value": 65
--     }
--   ]
-- }
