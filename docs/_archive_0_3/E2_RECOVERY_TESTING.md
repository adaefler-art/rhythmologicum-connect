# E2 — Recovery & Resume Testing Guide

## Overview

This document provides comprehensive test cases for validating the recovery and resume functionality of the assessment funnel system. These tests ensure that users never lose progress when interrupted during an assessment.

## Test Environment Setup

### Prerequisites
- Local development environment with database access
- Test user account with patient role
- Active funnel with multiple steps and questions

### Test Data
- Use the "stress-resilience" funnel or create a test funnel
- Ensure funnel has at least 3 steps with multiple required questions
- Configure test user with known credentials

## Test Cases

### TC1: Browser/Tab Close and Reopen

**Objective:** Verify that closing and reopening the browser preserves assessment progress.

**Steps:**
1. Log in as a test patient
2. Start a new assessment (e.g., `/patient/funnel/stress-resilience`)
3. Answer questions on the first step (e.g., answer 2 out of 3 questions)
4. Navigate to the next step and answer at least one question
5. Close the browser tab completely
6. Reopen browser and navigate to the assessment URL again

**Expected Results:**
- ✅ Assessment resumes at the correct step (not back to step 1)
- ✅ Previously answered questions show their saved values
- ✅ User sees "Fortschritt wiederhergestellt" (Progress restored) banner
- ✅ Progress bar reflects actual completion percentage
- ✅ No data loss - all previous answers are intact

**Acceptance Criteria Met:**
- Users don't lose progress on tab close
- Resume loads correct step
- No infinite loops or dead-ends

---

### TC2: Page Reload During Assessment

**Objective:** Verify that reloading the page during assessment preserves state.

**Steps:**
1. Log in as a test patient
2. Start or resume an assessment
3. Answer some questions on the current step (but don't complete the step)
4. Press F5 or click browser reload button
5. Wait for page to reload

**Expected Results:**
- ✅ Page reloads and shows the same step
- ✅ All previously answered questions remain filled
- ✅ Partial step progress is preserved
- ✅ Recovery banner appears if answers were restored
- ✅ User can continue from where they left off

**Acceptance Criteria Met:**
- Users don't lose progress on reload
- Resume mechanism determines correct position
- No data inconsistencies

---

### TC3: Multiple Reloads in Quick Succession

**Objective:** Ensure system handles rapid page reloads gracefully.

**Steps:**
1. Log in and start an assessment
2. Answer a few questions
3. Reload page 3-5 times in rapid succession (F5 multiple times)
4. Wait for final reload to complete

**Expected Results:**
- ✅ System remains stable
- ✅ No duplicate answers created in database
- ✅ Final state correctly reflects all user input
- ✅ No race conditions or errors
- ✅ Loading indicators work properly

**Acceptance Criteria Met:**
- No infinite loops in resume flow
- State remains consistent

---

### TC4: Network Interruption During Answer Save

**Objective:** Verify graceful handling of network failures when saving answers.

**Steps:**
1. Log in and start an assessment
2. Open browser DevTools Network tab
3. Answer a question
4. Immediately disable network (DevTools: "Offline" mode)
5. Try to answer another question
6. Wait a few seconds
7. Re-enable network

**Expected Results:**
- ✅ Answer save retries automatically (up to 3 times)
- ✅ Answers are saved locally even if network fails temporarily
- ✅ User is not blocked from continuing (local state updates)
- ✅ Sync happens automatically when network returns
- ✅ Console shows retry messages (check with DevTools)
- ✅ No error modals that block user flow

**Acceptance Criteria Met:**
- Network interruptions are handled gracefully
- Users can continue working offline (temporarily)

---

### TC5: Network Failure During Assessment Load

**Objective:** Test recovery when network fails while loading assessment status.

**Steps:**
1. Log in and start an assessment
2. Answer a few questions and close browser
3. Reopen browser
4. Before navigating to assessment, enable offline mode in DevTools
5. Navigate to assessment URL
6. Observe retry behavior
7. Re-enable network after 5-10 seconds

**Expected Results:**
- ✅ Loading screen shows "Wiederherstellung läuft..." (Recovery in progress)
- ✅ System retries loading with exponential backoff (3 attempts)
- ✅ Shows retry attempt count (Versuch 1/3, 2/3, 3/3)
- ✅ When network returns, assessment loads successfully
- ✅ User can retry manually if all attempts fail
- ✅ Error message is clear and actionable

**Acceptance Criteria Met:**
- Network interruptions handled with retry logic
- User sees clear feedback during recovery

---

### TC6: Resume After Partial Step Completion

**Objective:** Ensure correct resume behavior when step is partially completed.

**Steps:**
1. Log in and start an assessment
2. Navigate to a step with 5 required questions
3. Answer only 3 out of 5 questions (leave 2 unanswered)
4. Close browser
5. Reopen and return to assessment

**Expected Results:**
- ✅ Assessment resumes on the same step (not moved to next step)
- ✅ All 3 answered questions show saved values
- ✅ 2 unanswered questions remain empty
- ✅ Progress bar reflects 3/5 questions answered for this step
- ✅ "Weiter" button validates that all required questions must be answered
- ✅ User can complete the remaining 2 questions and proceed

**Acceptance Criteria Met:**
- Resume loads correct step (doesn't skip ahead)
- Partial progress is preserved

---

### TC7: Resume After Completing Multiple Steps

**Objective:** Verify correct step calculation when multiple steps are complete.

**Steps:**
1. Log in and start an assessment with 4+ steps
2. Complete step 1 fully (all required questions answered)
3. Complete step 2 fully
4. Start step 3 and answer 1 question
5. Close browser
6. Reopen and return to assessment

**Expected Results:**
- ✅ Assessment resumes at step 3 (first incomplete step)
- ✅ Does NOT return to step 1 or 2
- ✅ Progress shows steps 1-2 complete, step 3 in progress
- ✅ All answers from previous steps are preserved
- ✅ Progress bar shows accurate completion percentage
- ✅ Recovery banner indicates number of restored answers

**Acceptance Criteria Met:**
- Resume doesn't go back to beginning
- Correct step is calculated based on completed questions

---

### TC8: Page Visibility Changes (Tab Switching)

**Objective:** Test behavior when switching tabs/windows and returning.

**Steps:**
1. Log in and start an assessment
2. Answer a few questions
3. Switch to another browser tab for 1-2 minutes
4. Return to assessment tab

**Expected Results:**
- ✅ Assessment state is refreshed silently in background
- ✅ No visible loading/interruption for user
- ✅ If another session modified data, it's reflected
- ✅ Console log shows "Page became visible, refreshing assessment status"
- ✅ User's local changes (if any) are not lost

**Acceptance Criteria Met:**
- Multi-tab/window scenarios handled
- State remains consistent across sessions

---

### TC9: Complete Assessment After Multiple Interruptions

**Objective:** End-to-end test of recovery through full assessment lifecycle.

**Steps:**
1. Start assessment, answer 2 questions, reload page
2. Continue, complete 1 full step, close browser
3. Reopen, answer more questions, switch tabs for 1 minute
4. Return, complete remaining steps
5. Submit final assessment

**Expected Results:**
- ✅ Each recovery works seamlessly
- ✅ Final submitted assessment contains all answers
- ✅ No duplicate or missing answers in database
- ✅ Results page loads correctly
- ✅ Assessment marked as "completed" in database
- ✅ Trying to access funnel URL redirects to results page

**Acceptance Criteria Met:**
- Full recovery cycle works end-to-end
- No data corruption or loss
- Assessment completes successfully

---

### TC10: Error Recovery - Assessment Not Found

**Objective:** Handle edge case where assessment is deleted externally.

**Steps:**
1. Start an assessment and note the assessment ID
2. Manually delete the assessment from database (or use different user)
3. Try to resume the assessment

**Expected Results:**
- ✅ Clear error message: "Assessment nicht gefunden"
- ✅ Retry button available
- ✅ Option to return to dashboard
- ✅ No infinite error loops
- ✅ User can start fresh assessment

**Acceptance Criteria Met:**
- No dead-ends in error scenarios
- Clear error messages

---

## Performance Validation

### Load Time Requirements
- Assessment status load: < 200ms (normal)
- Assessment status load with retry: < 5s (network failure)
- Answer save: < 100ms (normal)
- Page reload to resumed state: < 2s

### Monitoring
Check browser console for:
- ✅ "✅ Resumed assessment with X existing answers" message
- ✅ "📱 Page became visible, refreshing assessment status" on tab switch
- ✅ Retry attempt logs during network failures
- ⚠️ No unhandled errors or exceptions
- ⚠️ No excessive API calls (verify with Network tab)

---

## Database Validation

### After Each Test
Query the database to verify:
```sql
-- Check assessment answers
SELECT assessment_id, question_id, answer_value, created_at, updated_at
FROM assessment_answers
WHERE assessment_id = '<test-assessment-id>'
ORDER BY created_at;

-- Verify no duplicates
SELECT question_id, COUNT(*)
FROM assessment_answers
WHERE assessment_id = '<test-assessment-id>'
GROUP BY question_id
HAVING COUNT(*) > 1;

-- Check assessment status
SELECT id, status, started_at, completed_at
FROM assessments
WHERE id = '<test-assessment-id>';
```

**Expected:**
- One answer per question (no duplicates)
- All timestamps are logical (created_at <= updated_at)
- Assessment status is correct (in_progress or completed)

---

## Regression Testing

Run these tests after any changes to:
- Assessment navigation logic (`lib/navigation/assessmentNavigation.ts`)
- Funnel client component (`app/patient/funnel/[slug]/client.tsx`)
- Answer save endpoints (`/api/funnels/[slug]/assessments/[id]/answers/save`)
- Resume endpoint (`/api/assessments/[id]/resume`)

---

## Known Limitations

1. **Offline Mode**: Full offline support is not implemented. Users need network connection to save answers persistently.
2. **Concurrent Edits**: If user edits assessment from multiple devices simultaneously, last-write-wins.
3. **Session Timeout**: If Supabase session expires, user must re-login before resuming.

---

## Troubleshooting

### Issue: Assessment doesn't resume at correct step
- Check browser console for errors
- Verify `getCurrentStep` logic in `assessmentNavigation.ts`
- Confirm answers are actually saved in `assessment_answers` table
- Check question key matching (keys vs IDs)

### Issue: Answers not saving
- Check Network tab for failed API calls
- Verify retry logic is triggering
- Check Supabase RLS policies
- Confirm user has correct patient_profile

### Issue: Infinite loading
- Check for JavaScript errors in console
- Verify API endpoint isn't hanging
- Check if assessment exists in database
- Clear browser cache and try again

---

## Success Criteria Summary

✅ **All test cases pass**
✅ **No data loss in any scenario**
✅ **No infinite loops or dead-ends**
✅ **Clear user feedback during recovery**
✅ **Performance within acceptable limits**
✅ **Database integrity maintained**

---

## Test Report Template

```markdown
## E2 Recovery Testing Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [Local/Staging/Production]
**Browser:** [Chrome/Firefox/Safari + Version]

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Browser Close/Reopen | ✅/❌ | |
| TC2: Page Reload | ✅/❌ | |
| TC3: Multiple Reloads | ✅/❌ | |
| TC4: Network Interruption (Save) | ✅/❌ | |
| TC5: Network Failure (Load) | ✅/❌ | |
| TC6: Partial Step Completion | ✅/❌ | |
| TC7: Multiple Steps Complete | ✅/❌ | |
| TC8: Tab Switching | ✅/❌ | |
| TC9: Full Lifecycle | ✅/❌ | |
| TC10: Error Recovery | ✅/❌ | |

### Issues Found
[List any bugs or unexpected behavior]

### Performance Metrics
- Average load time: Xms
- Retry success rate: X%

### Recommendations
[Any suggestions for improvement]
```
