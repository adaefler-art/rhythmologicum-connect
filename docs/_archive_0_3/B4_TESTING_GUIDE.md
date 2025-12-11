# B4 Dynamic Validation Rules - Testing Guide

## Overview

This guide provides comprehensive testing scenarios for the B4 Dynamic Validation Rules feature. Use this to verify that conditional required fields work correctly in all scenarios.

## Prerequisites

1. Development environment running (`npm run dev`)
2. Database with migrations applied (including `20251209094000_create_funnel_question_rules.sql`)
3. At least one funnel with questions defined
4. A test user account with patient role

## Test Setup

### 1. Verify Migration Applied

```sql
-- Check if funnel_question_rules table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'funnel_question_rules'
);
-- Should return: true

-- Check table structure
\d funnel_question_rules;
```

### 2. Verify Existing Questions

For these tests, we'll assume a stress funnel with these questions:
- `stress_frequency` (key: "stress_frequency", answers 0-4)
- `sleep_quality` (key: "sleep_quality", answers 0-4)
- `stress_duration` (key: "stress_duration", optional by default)
- `health_impact` (key: "health_impact", optional by default)

```sql
-- List questions in stress funnel
SELECT 
  q.key,
  q.label,
  fsq.is_required,
  fs.title AS step_title
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
JOIN funnel_steps fs ON fs.id = fsq.funnel_step_id
JOIN funnels f ON f.id = fs.funnel_id
WHERE f.slug = 'stress'
ORDER BY fs.order_index, fsq.order_index;
```

## Test Scenarios

### Scenario 1: Baseline - No Rules (B2 Compatibility)

**Goal**: Verify that without any rules, the system behaves exactly like B2.

**Setup**:
```sql
-- Ensure no rules exist
DELETE FROM funnel_question_rules;
```

**Test Steps**:
1. Navigate to `/patient/stress-check`
2. Answer all `is_required=true` questions
3. Leave optional questions unanswered
4. Click "Weiter" to proceed

**Expected Result**:
- ✅ Can proceed with only required questions answered
- ✅ No conditional required errors shown
- ✅ Optional questions can remain unanswered

**Verification**:
```sql
-- Check API response structure
-- POST /api/assessment-validation/validate-step
-- Response should have reason: 'required' for all missing questions
```

---

### Scenario 2: Simple Conditional Required (Single Condition)

**Goal**: Verify that a question becomes required when a condition is met.

**Setup**:
```sql
-- Add rule: stress_duration required if stress_frequency >= 3
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload
)
SELECT 
  q.id,
  fsq.funnel_step_id,
  'conditional_required',
  '{
    "type": "conditional_required",
    "conditions": [
      {
        "question_key": "stress_frequency",
        "operator": "gte",
        "value": 3
      }
    ]
  }'::jsonb
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
WHERE q.key = 'stress_duration';
```

**Test 2a: Condition Met**
1. Answer `stress_frequency` = 3 or 4
2. Leave `stress_duration` unanswered
3. Try to proceed to next step

**Expected Result**:
- ❌ Cannot proceed
- ⚠️ Error message: "Diese Frage muss beantwortet werden, weil Ihre Antwort war mindestens 3"
- 🟠 Badge shows "Pflicht (abhängig)"
- 🎯 Validation response has `reason: 'conditional_required'`

**Test 2b: Condition Not Met**
1. Answer `stress_frequency` = 0, 1, or 2
2. Leave `stress_duration` unanswered
3. Try to proceed

**Expected Result**:
- ✅ Can proceed
- ℹ️ No error shown for `stress_duration`
- 📝 Question shows "Optional" badge

---

### Scenario 3: Multiple Conditions with AND Logic

**Goal**: Verify that ALL conditions must be true for the rule to apply.

**Setup**:
```sql
-- Add rule: health_impact required if stress >= 3 AND sleep <= 1
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload,
  priority
)
SELECT 
  q.id,
  fsq.funnel_step_id,
  'conditional_required',
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
  }'::jsonb,
  20
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
WHERE q.key = 'health_impact';
```

**Test 3a: Both Conditions Met**
1. Answer `stress_frequency` = 3
2. Answer `sleep_quality` = 1
3. Leave `health_impact` unanswered
4. Try to proceed

**Expected Result**:
- ❌ Cannot proceed
- ⚠️ Error: "...weil Ihre Antwort war mindestens 3 UND Ihre Antwort war höchstens 1"

**Test 3b: Only First Condition Met**
1. Answer `stress_frequency` = 3
2. Answer `sleep_quality` = 3
3. Leave `health_impact` unanswered

**Expected Result**:
- ✅ Can proceed (AND logic requires BOTH conditions)

**Test 3c: Only Second Condition Met**
1. Answer `stress_frequency` = 1
2. Answer `sleep_quality` = 0
3. Leave `health_impact` unanswered

**Expected Result**:
- ✅ Can proceed (AND logic requires BOTH conditions)

**Test 3d: Neither Condition Met**
1. Answer `stress_frequency` = 1
2. Answer `sleep_quality` = 3
3. Leave `health_impact` unanswered

**Expected Result**:
- ✅ Can proceed

---

### Scenario 4: Multiple Conditions with OR Logic

**Goal**: Verify that ANY condition can trigger the rule.

**Setup**:
```sql
-- Add rule: medical_consultation required if stress >= 4 OR sleep = 0
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload,
  priority
)
SELECT 
  q.id,
  fsq.funnel_step_id,
  'conditional_required',
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
  }'::jsonb,
  30
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
WHERE q.key = 'medical_consultation';
```

**Test 4a: First Condition Met**
1. Answer `stress_frequency` = 4
2. Answer `sleep_quality` = 2
3. Leave `medical_consultation` unanswered

**Expected Result**:
- ❌ Cannot proceed
- ⚠️ Error shown (OR logic triggered)

**Test 4b: Second Condition Met**
1. Answer `stress_frequency` = 2
2. Answer `sleep_quality` = 0
3. Leave `medical_consultation` unanswered

**Expected Result**:
- ❌ Cannot proceed
- ⚠️ Error shown (OR logic triggered)

**Test 4c: Both Conditions Met**
1. Answer `stress_frequency` = 4
2. Answer `sleep_quality` = 0
3. Leave `medical_consultation` unanswered

**Expected Result**:
- ❌ Cannot proceed

**Test 4d: Neither Condition Met**
1. Answer `stress_frequency` = 2
2. Answer `sleep_quality` = 2
3. Leave `medical_consultation` unanswered

**Expected Result**:
- ✅ Can proceed

---

### Scenario 5: IN Operator

**Goal**: Verify that the IN operator works with multiple values.

**Setup**:
```sql
-- Add rule: triggers required if stress is 3 OR 4
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload
)
SELECT 
  q.id,
  fsq.funnel_step_id,
  'conditional_required',
  '{
    "type": "conditional_required",
    "conditions": [
      {
        "question_key": "stress_frequency",
        "operator": "in",
        "values": [3, 4]
      }
    ]
  }'::jsonb
FROM questions q
JOIN funnel_step_questions fsq ON fsq.question_id = q.id
WHERE q.key = 'stress_triggers';
```

**Test 5a: Value in List (3)**
1. Answer `stress_frequency` = 3
2. Leave `stress_triggers` unanswered

**Expected Result**:
- ❌ Cannot proceed

**Test 5b: Value in List (4)**
1. Answer `stress_frequency` = 4
2. Leave `stress_triggers` unanswered

**Expected Result**:
- ❌ Cannot proceed

**Test 5c: Value Not in List**
1. Answer `stress_frequency` = 2
2. Leave `stress_triggers` unanswered

**Expected Result**:
- ✅ Can proceed

---

### Scenario 6: All Operators

**Goal**: Verify each operator works correctly.

| Operator | Test Value | Reference | Should Match |
|----------|------------|-----------|--------------|
| `eq` | 3 | 3 | ✅ Yes |
| `eq` | 2 | 3 | ❌ No |
| `neq` | 2 | 3 | ✅ Yes |
| `neq` | 3 | 3 | ❌ No |
| `gt` | 4 | 3 | ✅ Yes |
| `gt` | 3 | 3 | ❌ No |
| `gte` | 3 | 3 | ✅ Yes |
| `gte` | 2 | 3 | ❌ No |
| `lt` | 2 | 3 | ✅ Yes |
| `lt` | 3 | 3 | ❌ No |
| `lte` | 3 | 3 | ✅ Yes |
| `lte` | 4 | 3 | ❌ No |
| `in` | 3 | [2,3,4] | ✅ Yes |
| `in` | 1 | [2,3,4] | ❌ No |

---

### Scenario 7: Edge Cases

**Test 7a: Unanswered Dependency Question**
1. Create rule: B required if A >= 3
2. Leave A unanswered
3. Leave B unanswered

**Expected Result**:
- ✅ Can proceed if A and B are both optional at baseline
- Condition evaluates to `false` when dependency is unanswered

**Test 7b: Multiple Rules on Same Question**
1. Create two rules for question C:
   - Rule 1 (priority 10): C required if A >= 3
   - Rule 2 (priority 20): C required if B <= 1
2. Meet only Rule 2 condition

**Expected Result**:
- ❌ Cannot proceed
- Only one error shown (rules don't duplicate)
- Higher priority rule evaluated first

**Test 7c: Circular Dependencies**
Setup:
- Rule 1: B required if A >= 3
- Rule 2: A required if B >= 3

**Expected Result**:
- System should handle gracefully
- Each rule evaluates independently
- No infinite loops

**Test 7d: Inactive Rule**
1. Create rule with `is_active = false`
2. Meet the condition
3. Leave target question unanswered

**Expected Result**:
- ✅ Can proceed (inactive rules are ignored)

---

## API Testing

### Using cURL

```bash
# Test validation endpoint (extended mode)
curl -X POST http://localhost:3000/api/assessment-validation/validate-step \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "assessmentId": "YOUR-ASSESSMENT-UUID",
    "stepId": "YOUR-STEP-UUID",
    "extended": true
  }' | jq
```

**Expected Response (with conditional required violation)**:
```json
{
  "success": true,
  "isValid": false,
  "missingQuestions": [
    {
      "questionId": "uuid",
      "questionKey": "stress_duration",
      "questionLabel": "Wie lange dauert der Stress schon an?",
      "orderIndex": 2,
      "reason": "conditional_required",
      "ruleId": "rule-uuid",
      "ruleDescription": "Ihre Antwort war mindestens 3"
    }
  ]
}
```

### Using Browser DevTools

1. Open stress-check page
2. Open DevTools → Network tab
3. Answer questions to trigger rule
4. Click "Weiter"
5. Find `validate-step` request
6. Inspect response JSON

---

## Database Verification Queries

### Check Active Rules
```sql
SELECT 
  fqr.id,
  q.key AS question_key,
  q.label,
  fqr.rule_type,
  fqr.rule_payload->'conditions' AS conditions,
  fqr.priority,
  fqr.is_active
FROM funnel_question_rules fqr
JOIN questions q ON fqr.question_id = q.id
WHERE fqr.is_active = true
ORDER BY fqr.priority DESC;
```

### Check Assessment Answers
```sql
SELECT 
  aa.question_id,
  q.label,
  aa.answer_value
FROM assessment_answers aa
LEFT JOIN questions q ON q.key = aa.question_id
WHERE aa.assessment_id = 'YOUR-ASSESSMENT-UUID'
ORDER BY q.label;
```

### Simulate Rule Evaluation
```sql
-- Check if condition would be met
SELECT 
  q.key,
  aa.answer_value,
  aa.answer_value >= 3 AS condition_met
FROM assessment_answers aa
JOIN questions q ON q.key = aa.question_id
WHERE aa.assessment_id = 'YOUR-ASSESSMENT-UUID'
AND q.key = 'stress_frequency';
```

---

## Performance Testing

### Measure Validation Time

```javascript
// In browser console
console.time('validation')
fetch('/api/assessment-validation/validate-step', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assessmentId: 'YOUR-UUID',
    stepId: 'YOUR-UUID',
    extended: true
  })
}).then(() => console.timeEnd('validation'))
```

**Expected Performance**:
- Typical step (5 questions, 2 rules): <50ms
- Large step (20 questions, 10 rules): <150ms
- Worst case (50 questions, 30 rules): <300ms

### Load Test with Multiple Rules

```sql
-- Create 20 test rules
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..20 LOOP
    INSERT INTO funnel_question_rules (question_id, funnel_step_id, rule_type, rule_payload)
    SELECT 
      id, 
      (SELECT id FROM funnel_steps LIMIT 1),
      'conditional_required',
      format('{
        "type": "conditional_required",
        "conditions": [{"question_key": "stress_frequency", "operator": "gte", "value": %s}]
      }', i % 5)::jsonb
    FROM questions
    WHERE key = 'stress_duration';
  END LOOP;
END $$;
```

Then measure validation time with multiple rules.

---

## Cleanup After Testing

```sql
-- Remove all test rules
DELETE FROM funnel_question_rules 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Or remove specific rules
DELETE FROM funnel_question_rules 
WHERE id IN ('uuid1', 'uuid2', ...);

-- Reset is_required flags if modified
UPDATE funnel_step_questions 
SET is_required = true 
WHERE question_id IN (
  SELECT id FROM questions WHERE key IN ('stress_frequency', 'sleep_quality')
);
```

---

## Test Checklist

Use this checklist for comprehensive testing:

- [ ] Scenario 1: Baseline B2 compatibility verified
- [ ] Scenario 2a: Simple condition (met) blocks navigation
- [ ] Scenario 2b: Simple condition (not met) allows navigation
- [ ] Scenario 3a: AND logic (both met) blocks navigation
- [ ] Scenario 3b/c: AND logic (only one met) allows navigation
- [ ] Scenario 4a/b: OR logic (any met) blocks navigation
- [ ] Scenario 4d: OR logic (none met) allows navigation
- [ ] Scenario 5: IN operator works correctly
- [ ] Scenario 6: All operators tested
- [ ] Scenario 7a: Unanswered dependencies handled
- [ ] Scenario 7b: Multiple rules on same question work
- [ ] Scenario 7d: Inactive rules are ignored
- [ ] UI shows "Pflicht (abhängig)" badge
- [ ] UI shows rule description in errors
- [ ] API returns correct `reason` field
- [ ] Performance is acceptable (<300ms)
- [ ] No console errors in browser
- [ ] Database queries are optimized (check with EXPLAIN ANALYZE)

---

## Troubleshooting

### Rule Not Triggering

1. **Check if rule is active**:
   ```sql
   SELECT * FROM funnel_question_rules WHERE id = 'your-rule-id';
   ```

2. **Verify question_key matches**:
   ```sql
   SELECT key FROM questions WHERE id = (
     SELECT question_id FROM funnel_question_rules WHERE id = 'your-rule-id'
   );
   ```

3. **Check answer exists**:
   ```sql
   SELECT * FROM assessment_answers 
   WHERE assessment_id = 'your-assessment' 
   AND question_id = 'expected-question-key';
   ```

### Unexpected Validation Error

1. Check browser console for errors
2. Inspect Network tab for API response
3. Verify rule_payload JSON is valid
4. Check operator is spelled correctly

### Performance Issues

1. Run EXPLAIN ANALYZE on validation queries
2. Verify indexes exist:
   ```sql
   \d funnel_question_rules
   ```
3. Check number of active rules:
   ```sql
   SELECT COUNT(*) FROM funnel_question_rules WHERE is_active = true;
   ```

---

**Testing completed by:** _________________  
**Date:** _________________  
**All tests passing:** ☐ Yes ☐ No  
**Notes:** _________________
