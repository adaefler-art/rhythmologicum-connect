# V05-I03.3 Manual Testing Guide

## Save/Resume + Robust States - Manual Test Plan

### Prerequisites
- Local development environment running (`npm run dev`)
- Valid Supabase connection
- Patient user account with access to stress funnel

### Test 1: Answer Save & Resume (Happy Path)

**Objective:** Verify that answered questions persist and can be resumed after page reload.

**Steps:**
1. Navigate to `/patient/funnel/stress` (or your test funnel)
2. Wait for funnel to load completely
3. Answer **5 questions** in the first step
4. Note the question IDs and values you selected
5. **Without clicking "Next"**, refresh the browser (F5 or Cmd+R)
6. Wait for page to reload

**Expected Results:**
- ✅ Page loads without errors
- ✅ Assessment ID is the same (check in network tab or logs)
- ✅ All 5 answered questions show the previously selected values
- ✅ Loading spinner shows during load
- ✅ Resume happens automatically (no manual intervention)
- ✅ Console shows: `✅ Resumed assessment with X existing answers`

**Database Verification (Optional):**
```sql
-- Check that answers were saved
SELECT question_id, answer_value, created_at 
FROM assessment_answers 
WHERE assessment_id = '<your-assessment-id>'
ORDER BY created_at;

-- Check that current_step_id was updated
SELECT id, current_step_id, status 
FROM assessments 
WHERE id = '<your-assessment-id>';
```

---

### Test 2: Step Navigation & State Persistence

**Objective:** Verify that current step is saved when navigating forward.

**Steps:**
1. Continue from Test 1 or start fresh assessment
2. Answer all required questions in Step 1
3. Click "Weiter" (Next) button
4. Wait for Step 2 to load
5. Answer 2-3 questions in Step 2
6. Refresh the page (F5 or Cmd+R)

**Expected Results:**
- ✅ Page reloads to Step 2 (not Step 1)
- ✅ Step 2 questions are pre-filled with saved answers
- ✅ Progress indicator shows correct position
- ✅ `current_step_id` in database matches Step 2's ID

---

### Test 3: Error Handling & Retry

**Objective:** Verify robust error handling when save fails.

**Steps:**
1. Start a fresh assessment
2. Answer 1-2 questions
3. **Simulate network error:**
   - Open DevTools > Network tab
   - Enable "Offline" mode (or throttle to "Offline")
4. Try to answer another question
5. Observe the behavior
6. **Disable offline mode** (go back online)
7. Try answering a question again

**Expected Results:**
- ✅ When offline: Console shows retry attempts (up to 2 retries)
- ✅ Warning message in console: `⚠️ Answer saved locally but not synced to server`
- ✅ User can continue answering questions (local state updates)
- ✅ When back online: Next answer save succeeds
- ✅ No duplicates created (upsert behavior)
- ✅ No "hard" error blocks the UI - graceful degradation

---

### Test 4: Error State Display & Retry Button

**Objective:** Verify error UI when assessment fails to load.

**Steps:**
1. Navigate to `/patient/funnel/stress`
2. **Simulate server error:**
   - In DevTools > Network tab, block requests to `/api/funnels/stress/assessments`
   - Or temporarily modify the API to return 500 error
3. Try to load the funnel

**Expected Results:**
- ✅ Loading spinner shows initially
- ✅ After retry attempts fail, ErrorState component displays
- ✅ Error message is clear and in German
- ✅ "Erneut versuchen" (Retry) button is visible
- ✅ Clicking retry reloads and attempts to load again
- ✅ If retry succeeds, funnel loads normally

---

### Test 5: Concurrent Multi-Tab Behavior

**Objective:** Verify resume works correctly when same assessment is open in multiple tabs.

**Steps:**
1. Open assessment in Tab 1
2. Answer questions 1-3
3. Open same funnel URL in Tab 2 (new tab)
4. Answer questions 4-5 in Tab 2
5. Switch back to Tab 1
6. Refresh Tab 1

**Expected Results:**
- ✅ Tab 1 shows all 5 answers (from both tabs)
- ✅ No duplicate answers
- ✅ Most recent answer values are displayed (upsert behavior)
- ✅ Both tabs can progress independently
- ✅ Resume works in both tabs

---

### Test 6: Complete Assessment & Restart

**Objective:** Verify that completed assessments don't interfere with new ones.

**Steps:**
1. Complete a full assessment (answer all questions, submit)
2. Navigate to result page
3. Go back to `/patient/funnel/stress` again
4. Verify a new assessment starts

**Expected Results:**
- ✅ New assessment is created (different assessment ID)
- ✅ Questions are empty/unanswered (not pre-filled from old assessment)
- ✅ Previous completed assessment remains in database
- ✅ User can complete multiple assessments over time

---

### Test 7: Loading States During Long Operations

**Objective:** Verify loading indicators during slow operations.

**Steps:**
1. Start assessment
2. **Simulate slow network:**
   - DevTools > Network > Throttle to "Slow 3G"
3. Answer a question (observe save delay)
4. Click "Next" (observe validation delay)
5. Restore normal network speed

**Expected Results:**
- ✅ Loading spinner shows when initially loading funnel
- ✅ Progress indicators update smoothly
- ✅ No UI freezing during saves
- ✅ Validation shows appropriate loading state
- ✅ User can see progress is happening (not stuck)

---

## Acceptance Criteria

All tests should pass with the following outcomes:

- ✅ **Save works:** Answers persist to database via upsert (no duplicates)
- ✅ **Resume works:** Reload/refresh correctly restores state from `current_step_id` and saved answers
- ✅ **Errors graceful:** Network/server errors don't break UI; retry works
- ✅ **Loading clear:** User always knows when system is working (loading states visible)
- ✅ **Idempotent:** Multiple saves of same answer update (not duplicate)
- ✅ **State coherent:** `current_step_id` accurately tracks user progress

---

## Troubleshooting

### Issue: Resume doesn't work
- Check: Are answers in `assessment_answers` table?
- Check: Is `current_step_id` set in `assessments` table?
- Check: Console for errors during `loadExistingAnswers()`
- Check: Network tab - is GET `/api/funnels/.../assessments/...` returning data?

### Issue: Retry doesn't work
- Check: Is error handler in place? (should be in client.tsx)
- Check: Console for retry attempt logs
- Check: Network tab to see if requests are actually being made

### Issue: Duplicates created
- Check: Is upsert using correct conflict target `(assessment_id, question_id)`?
- Check: Unique constraint exists in database
- Verify: `ignoreDuplicates: false` in upsert call

---

## Test Completion Checklist

- [ ] Test 1: Save & Resume - PASSED
- [ ] Test 2: Step Navigation - PASSED
- [ ] Test 3: Error & Retry - PASSED
- [ ] Test 4: Error UI Display - PASSED
- [ ] Test 5: Multi-Tab - PASSED
- [ ] Test 6: Complete & Restart - PASSED
- [ ] Test 7: Loading States - PASSED

**Tester:** _________________
**Date:** _________________
**Environment:** _________________

**Notes:**
