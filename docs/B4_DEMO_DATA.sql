-- B4 Demo Data: Example Conditional Validation Rules
-- This file contains example rules that can be used for testing the B4 Dynamic Validation feature
-- 
-- IMPORTANT: These are examples only. Do NOT run this in production without proper review.
-- These examples assume certain questions exist in your database.

-- Example 1: Simple Conditional Required
-- If stress_frequency >= 3, then stress_duration becomes required
--
-- Assumes:
-- - Question with key 'stress_frequency' exists
-- - Question with key 'stress_duration' exists
-- - Both questions are in the same step

/*
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload,
  priority
)
SELECT 
  q.id AS question_id,
  fsq.funnel_step_id,
  'conditional_required' AS rule_type,
  '{
    "type": "conditional_required",
    "conditions": [
      {
        "question_key": "stress_frequency",
        "operator": "gte",
        "value": 3
      }
    ]
  }'::jsonb AS rule_payload,
  10 AS priority
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
WHERE q.key = 'stress_duration'
AND EXISTS (
  SELECT 1 FROM questions WHERE key = 'stress_frequency'
);
*/

-- Example 2: Multiple Conditions with AND Logic
-- If stress_frequency >= 3 AND sleep_quality <= 1, then health_impact becomes required
--
-- Assumes:
-- - Questions 'stress_frequency', 'sleep_quality', 'health_impact' exist

/*
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload,
  priority
)
SELECT 
  q.id AS question_id,
  fsq.funnel_step_id,
  'conditional_required' AS rule_type,
  '{
    "type": "conditional_required",
    "logic": "AND",
    "conditions": [
      {
        "question_key": "stress_frequency",
        "operator": "gte",
        "value": 3
      },
      {
        "question_key": "sleep_quality",
        "operator": "lte",
        "value": 1
      }
    ]
  }'::jsonb AS rule_payload,
  20 AS priority
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
WHERE q.key = 'health_impact'
AND EXISTS (
  SELECT 1 FROM questions WHERE key IN ('stress_frequency', 'sleep_quality')
  HAVING COUNT(*) = 2
);
*/

-- Example 3: IN Operator for Multiple Values
-- If stress_frequency is 3 or 4, then stress_triggers becomes required
--
-- Assumes:
-- - Questions 'stress_frequency' and 'stress_triggers' exist

/*
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload,
  priority
)
SELECT 
  q.id AS question_id,
  fsq.funnel_step_id,
  'conditional_required' AS rule_type,
  '{
    "type": "conditional_required",
    "conditions": [
      {
        "question_key": "stress_frequency",
        "operator": "in",
        "values": [3, 4]
      }
    ]
  }'::jsonb AS rule_payload,
  10 AS priority
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
WHERE q.key = 'stress_triggers'
AND EXISTS (
  SELECT 1 FROM questions WHERE key = 'stress_frequency'
);
*/

-- Example 4: OR Logic for Risk Screening
-- If stress_frequency >= 4 OR sleep_quality = 0, then medical_consultation becomes required
--
-- Assumes:
-- - Questions exist for risk assessment step

/*
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload,
  priority
)
SELECT 
  q.id AS question_id,
  fsq.funnel_step_id,
  'conditional_required' AS rule_type,
  '{
    "type": "conditional_required",
    "logic": "OR",
    "conditions": [
      {
        "question_key": "stress_frequency",
        "operator": "gte",
        "value": 4
      },
      {
        "question_key": "sleep_quality",
        "operator": "eq",
        "value": 0
      }
    ]
  }'::jsonb AS rule_payload,
  30 AS priority
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
WHERE q.key = 'medical_consultation'
AND EXISTS (
  SELECT 1 FROM questions WHERE key IN ('stress_frequency', 'sleep_quality')
  HAVING COUNT(*) = 2
);
*/

-- Helper Query: List all active rules
/*
SELECT 
  fqr.id,
  q.key AS question_key,
  q.label AS question_label,
  fs.title AS step_title,
  fqr.rule_type,
  fqr.rule_payload,
  fqr.priority,
  fqr.is_active
FROM funnel_question_rules fqr
JOIN questions q ON fqr.question_id = q.id
JOIN funnel_steps fs ON fqr.funnel_step_id = fs.id
WHERE fqr.is_active = true
ORDER BY fs.order_index, fqr.priority DESC, q.label;
*/

-- Helper Query: Test rule evaluation for a specific assessment
/*
SELECT 
  q.key AS question_key,
  q.label AS question_label,
  aa.answer_value,
  fqr.rule_payload,
  fqr.rule_type
FROM questions q
LEFT JOIN assessment_answers aa ON aa.question_id = q.key AND aa.assessment_id = 'YOUR-ASSESSMENT-UUID'
LEFT JOIN funnel_question_rules fqr ON fqr.question_id = q.id AND fqr.is_active = true
WHERE q.key IN ('stress_frequency', 'sleep_quality', 'stress_duration', 'health_impact')
ORDER BY q.label;
*/

-- Helper Query: Disable a rule temporarily
/*
UPDATE funnel_question_rules
SET is_active = false
WHERE id = 'RULE-UUID';
*/

-- Helper Query: Re-enable a rule
/*
UPDATE funnel_question_rules
SET is_active = true
WHERE id = 'RULE-UUID';
*/

-- Helper Query: Delete all test rules (DANGEROUS - use with caution)
/*
DELETE FROM funnel_question_rules
WHERE id IN (
  SELECT fqr.id
  FROM funnel_question_rules fqr
  JOIN questions q ON fqr.question_id = q.id
  WHERE q.key LIKE 'test_%'
);
*/
