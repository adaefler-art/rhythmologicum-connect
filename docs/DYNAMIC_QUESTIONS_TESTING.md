# Dynamic Questions Testing Guide

## Overview

This document describes how to test the dynamic question loading feature for the stress-check page.

## What Changed

Previously, questions for the stress assessment were hardcoded in the React component. Now they are loaded dynamically from the database through the following tables:
- `funnels` - Defines the stress funnel
- `funnel_steps` - Defines the stress and sleep sections
- `questions` - Contains the actual questions
- `funnel_step_questions` - Links questions to funnel steps

## Migration

The migration file `20251207150000_populate_stress_questions.sql` must be applied to the database. It:
1. Creates/updates the "stress" funnel
2. Creates two funnel steps (stress and sleep)
3. Inserts 8 questions (4 stress, 4 sleep)
4. Links questions to appropriate steps
5. Sets up RLS policies for authenticated users

## Testing Steps

### 1. Apply Migration

If using local Supabase:
```bash
supabase migration up
```

Or if using remote Supabase, the migration will be applied automatically when merged.

### 2. Verify Database Setup

Check that the tables are populated:

```sql
-- Should return 1 row for the stress funnel
SELECT * FROM public.funnels WHERE slug = 'stress';

-- Should return 2 rows (stress and sleep steps)
SELECT * FROM public.funnel_steps fs
JOIN public.funnels f ON fs.funnel_id = f.id
WHERE f.slug = 'stress'
ORDER BY fs.order_index;

-- Should return 8 questions
SELECT * FROM public.questions
WHERE key LIKE 'stress_%' OR key LIKE 'sleep_%'
ORDER BY key;

-- Should return 8 links
SELECT fsq.*, q.key, q.label
FROM public.funnel_step_questions fsq
JOIN public.questions q ON fsq.question_id = q.id
JOIN public.funnel_steps fs ON fsq.funnel_step_id = fs.id
JOIN public.funnels f ON fs.funnel_id = f.id
WHERE f.slug = 'stress'
ORDER BY fs.order_index, fsq.order_index;
```

### 3. Test Frontend

1. **Login as a patient**
2. **Navigate to stress-check page** (`/patient/stress-check`)
3. **Verify questions load**:
   - Page should show loading state briefly
   - Should display 8 questions total
   - First 4 should be in "Umgang mit Stress" section
   - Last 4 should be in "Schlaf & Erholung" section
4. **Check question content**:
   - Questions should match the text from the database
   - Help text should display if present (currently null)
5. **Test question flow**:
   - Answer all questions
   - Submit assessment
   - Verify assessment is saved correctly

### 4. Test Adaptability

To verify that the layout adapts to the number of questions:

1. **Add a new question to the database**:
```sql
-- Add a new stress question
INSERT INTO public.questions (key, label, help_text, question_type, min_value, max_value)
VALUES ('stress_q5', 'Neue Testfrage', 'Dies ist eine Hilfe', 'scale', 0, 4);

-- Link it to the stress step
INSERT INTO public.funnel_step_questions (funnel_step_id, question_id, order_index, is_required)
SELECT fs.id, q.id, 5, true
FROM public.questions q, public.funnel_steps fs
JOIN public.funnels f ON fs.funnel_id = f.id
WHERE q.key = 'stress_q5'
  AND f.slug = 'stress'
  AND fs.order_index = 1;
```

2. **Reload the stress-check page**
3. **Verify**:
   - Page now shows 9 questions total
   - New question appears in the stress section
   - Progress bar calculates correctly (shows "Frage X von 9")
   - Help text displays for the new question

4. **Clean up test question** (optional):
```sql
DELETE FROM public.funnel_step_questions
WHERE question_id = (SELECT id FROM public.questions WHERE key = 'stress_q5');

DELETE FROM public.questions WHERE key = 'stress_q5';
```

### 5. Test Backward Compatibility

1. **Check existing assessments**:
   - Old assessment data should still work
   - Assessment answers should still reference question keys (stress_q1, etc.)
   
2. **Verify data format**:
```sql
-- Check that assessment_answers still uses text question_id
SELECT aa.question_id, aa.answer_value
FROM public.assessment_answers aa
WHERE assessment_id = '<some-existing-assessment-id>'
ORDER BY aa.created_at;
```

## Expected Behavior

### Success Criteria

✅ Questions load dynamically from database  
✅ All 8 questions display in correct order  
✅ Questions are grouped correctly (4 stress, 4 sleep)  
✅ Progress tracking works with dynamic count  
✅ Assessment submission still works  
✅ Question IDs (stress_q1, etc.) are used correctly  
✅ Adding/removing questions updates the UI automatically  
✅ Help text displays when present  

### Error Scenarios

The page should handle these gracefully:

1. **Funnel not found**: Shows error message
2. **No steps found**: Shows error message
3. **No questions found**: Shows error message
4. **Database connection error**: Shows loading state or error

## Troubleshooting

### Questions don't load

1. Check browser console for errors
2. Verify migration was applied successfully
3. Check RLS policies are set correctly
4. Verify user is authenticated

### Questions appear in wrong order

1. Check `order_index` in `funnel_step_questions` table
2. Verify `order_index` in `funnel_steps` table

### Assessment submission fails

1. Check that question keys match between database and submitted answers
2. Verify `assessment_answers` table accepts text `question_id`
3. Check browser console for detailed error

## Code Changes Summary

### Files Modified

1. **app/patient/stress-check/page.tsx**
   - Removed hardcoded QUESTIONS array
   - Added dynamic loading from database
   - Added help text display support

2. **lib/funnelHelpers.ts**
   - Fixed TypeScript type annotations (no functional changes)

3. **supabase/migrations/20251207150000_populate_stress_questions.sql**
   - New migration file to populate questions

### Key Features

- Questions loaded via Supabase client from browser
- Uses same question key format (stress_q1, etc.)
- Maintains compatibility with existing assessment_answers table
- Layout automatically adapts to number of questions
- Support for help_text field per question
