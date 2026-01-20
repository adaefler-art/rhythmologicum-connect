# E6.4.3 — Manual Verification Guide

## Quick Start

This guide provides step-by-step instructions for manually verifying the E6.4.3 implementation of pilot funnel wiring.

---

## Prerequisites

1. **Local development server running:**
   ```bash
   npm run dev
   ```

2. **Test patient account:**
   - Email: `test-patient@example.com` (or create a new one)
   - Must have completed onboarding (consent + profile)

3. **Database:**
   - Supabase local instance or cloud connection
   - Schema migrations applied (including `stress` funnel)

---

## Test Scenarios

### Scenario 1: New Assessment (Dashboard → Catalog → Funnel → Complete)

**Goal:** Verify complete flow from dashboard to completion and back.

**Steps:**

1. **Start from Dashboard**
   ```
   Navigate to: http://localhost:3000/patient/dashboard
   ```
   - ✅ Dashboard loads
   - ✅ Shows "Nächster Schritt" card
   - ✅ Shows "Neues Assessment starten" button (if no in-progress assessment)

2. **Navigate to Catalog**
   ```
   Click: "Neues Assessment starten"
   Expected: Navigate to /patient/funnels
   ```
   - ✅ Catalog page loads
   - ✅ Shows "Verfügbare Assessments"
   - ✅ Shows "Mentale Gesundheit & Stressmanagement" pillar
   - ✅ Shows "Stress Assessment" card with heart icon

3. **Select Funnel**
   ```
   Click: "Stress Assessment" card
   Expected: Navigate to /patient/funnel/stress/intro
   ```
   - ✅ Intro page loads
   - ✅ Shows funnel title and description
   - ✅ Shows estimated duration (10 min)
   - ✅ Shows "Start" button

4. **Start Assessment**
   ```
   Click: "Start" button
   Expected: Navigate to /patient/funnel/stress?skipIntro=true
   ```
   - ✅ Funnel loads with first question
   - ✅ Shows "Umgang mit Stress" step title
   - ✅ Shows 4 stress questions (scale 0-4)
   - ✅ Progress bar shows 0/8 questions

5. **Answer Questions - Step 1**
   ```
   Answer all 4 stress questions:
   - stress_q1: Wie häufig fühlen Sie sich im Alltag gestresst?
   - stress_q2: Fühlen Sie sich häufig überfordert?
   - stress_q3: Wie oft hatten Sie das Gefühl, keine Kontrolle zu haben?
   - stress_q4: Wie häufig reagieren Sie angespannt oder gereizt?
   ```
   - ✅ Questions render with scale 0-4
   - ✅ Answers are saved (check network tab for POST to `/api/funnels/stress/assessments/[id]/answers/save`)
   - ✅ Progress updates as questions are answered

6. **Navigate to Step 2**
   ```
   Click: "Weiter" button
   Expected: POST to /api/funnels/stress/assessments/[id]/steps/[stepId]
   ```
   - ✅ Step validation succeeds
   - ✅ Navigates to Step 2: "Schlaf & Erholung"
   - ✅ Shows 4 sleep questions
   - ✅ Progress shows 4/8 questions answered

7. **Answer Questions - Step 2**
   ```
   Answer all 4 sleep questions:
   - sleep_q1: Wie gut schlafen Sie typischerweise ein?
   - sleep_q2: Wie oft wachen Sie nachts auf?
   - sleep_q3: Wie erholt fühlen Sie sich morgens beim Aufstehen?
   - sleep_q4: Wie oft verspüren Sie Erschöpfung am Tag?
   ```
   - ✅ Questions render correctly
   - ✅ Answers are saved
   - ✅ Progress shows 8/8 questions

8. **Complete Assessment**
   ```
   Click: "Abschließen" button
   Expected: POST to /api/funnels/stress/assessments/[id]/complete
   ```
   - ✅ Completion request succeeds
   - ✅ Redirects to `/patient/funnel/stress/result?assessmentId=[id]`

9. **View Results**
   ```
   On result page:
   ```
   - ✅ Shows "Assessment abgeschlossen!" header
   - ✅ Shows completion timestamp
   - ✅ Shows "Zum Dashboard" button (primary, sky-blue)
   - ✅ Shows "Meine Assessments" button (secondary, gray)

10. **Return to Dashboard**
    ```
    Click: "Zum Dashboard" button
    Expected: Navigate to /patient/dashboard
    ```
    - ✅ Dashboard loads
    - ✅ Shows "Nächster Schritt" card
    - ✅ Shows "Neues Assessment starten" button (no in-progress assessment anymore)

**Database Verification:**
```sql
-- Check assessment was completed correctly
SELECT id, status, completed_at, started_at
FROM assessments
WHERE funnel = 'stress'
ORDER BY started_at DESC
LIMIT 1;

-- Expected:
-- status: 'completed'
-- completed_at: NOT NULL (ISO timestamp)
-- started_at: NOT NULL

-- Check all answers were saved
SELECT COUNT(*) as answer_count
FROM assessment_answers
WHERE assessment_id = '<assessment-id>';

-- Expected: 8 answers
```

---

### Scenario 2: Resume Flow (Dashboard → Continue → Funnel → Complete)

**Goal:** Verify resume functionality works correctly.

**Steps:**

1. **Start New Assessment**
   ```
   Follow Scenario 1 steps 1-6
   ```
   - ✅ Complete Step 1 (all 4 stress questions)
   - ✅ Navigate to Step 2
   - ⚠️ **DO NOT complete Step 2 yet**

2. **Leave Assessment**
   ```
   Navigate to: http://localhost:3000/patient/dashboard
   (or close browser tab and reopen)
   ```
   - ✅ Dashboard loads
   - ✅ Shows "Nächster Schritt" card
   - ✅ Shows "Assessment fortsetzen" button (NOT "Start")
   - ✅ Shows assessment info box with:
     - Funnel name: "stress"
     - Status: "In Bearbeitung"
     - Started date

3. **Resume Assessment**
   ```
   Click: "Assessment fortsetzen" button
   Expected: Navigate to /patient/funnel/stress
   ```
   - ✅ Funnel loads
   - ✅ Shows Step 2: "Schlaf & Erholung" (not Step 1)
   - ✅ Previous answers from Step 1 are preserved
   - ✅ Progress shows 4/8 questions answered

4. **Complete Assessment**
   ```
   Follow Scenario 1 steps 7-10
   ```
   - ✅ Complete Step 2
   - ✅ View results
   - ✅ Return to dashboard

**API Verification:**
```bash
# Check in-progress assessment endpoint
curl http://localhost:3000/api/assessments/in-progress \
  -H "Cookie: <your-session-cookie>"

# Expected (before completion):
# {
#   "success": true,
#   "data": {
#     "id": "uuid",
#     "funnel": "stress",
#     "started_at": "2026-01-14T12:00:00Z",
#     "completed_at": null
#   }
# }

# After completion:
# {
#   "success": false,
#   "error": {
#     "code": "NO_IN_PROGRESS",
#     "message": "No in-progress assessments found"
#   }
# }
```

---

### Scenario 3: Validation (Missing Answers)

**Goal:** Verify validation prevents skipping required questions.

**Steps:**

1. **Start Assessment**
   ```
   Follow Scenario 1 steps 1-4
   ```

2. **Skip Questions**
   ```
   On Step 1:
   - Answer only 2 out of 4 questions
   - Click "Weiter"
   ```
   - ✅ Validation error appears
   - ✅ Error message: "Bitte beantworten Sie alle Pflichtfragen (2 fehlend)."
   - ✅ Missing questions are highlighted
   - ✅ Does NOT navigate to next step

3. **Complete Questions**
   ```
   Answer remaining 2 questions
   Click "Weiter"
   ```
   - ✅ Validation succeeds
   - ✅ Navigates to Step 2

---

### Scenario 4: Error Handling

**Goal:** Verify error states navigate to dashboard.

**Steps:**

1. **Simulate Result Error**
   ```
   Navigate to: http://localhost:3000/patient/funnel/stress/result?assessmentId=invalid-id
   ```
   - ✅ Error state appears
   - ✅ Shows "Fehler" title
   - ✅ Shows error message
   - ✅ Shows "Zurück zum Dashboard" button (not "Zurück zur Übersicht")

2. **Return from Error**
   ```
   Click: "Zurück zum Dashboard" button
   Expected: Navigate to /patient/dashboard
   ```
   - ✅ Dashboard loads successfully

---

### Scenario 5: Multiple Assessments

**Goal:** Verify user can take assessment multiple times.

**Steps:**

1. **Complete First Assessment**
   ```
   Follow Scenario 1 (full flow)
   ```
   - ✅ Assessment completes
   - ✅ Returns to dashboard

2. **Start Second Assessment**
   ```
   Click: "Neues Assessment starten"
   Select: "Stress Assessment" again
   ```
   - ✅ New assessment starts (not resuming old one)
   - ✅ Questions are blank (not pre-filled from previous assessment)
   - ✅ Progress starts at 0/8

3. **Verify Database**
   ```sql
   SELECT id, status, started_at, completed_at
   FROM assessments
   WHERE funnel = 'stress'
   ORDER BY started_at DESC
   LIMIT 2;
   ```
   - ✅ Two assessments exist
   - ✅ Both have different IDs
   - ✅ Both have unique timestamps

---

## API Endpoint Verification

### Core Flow Endpoints

**1. Start Assessment:**
```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments \
  -H "Cookie: <session>" \
  -H "Idempotency-Key: test-$(date +%s)"

# Expected: 201 Created
# { "success": true, "data": { "assessmentId": "...", "status": "in_progress", ... } }
```

**2. Get Assessment Status:**
```bash
curl http://localhost:3000/api/funnels/stress/assessments/<id> \
  -H "Cookie: <session>"

# Expected: 200 OK
# { "success": true, "data": { "assessmentId": "...", "currentStep": {...}, ... } }
```

**3. Save Answer:**
```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments/<id>/answers/save \
  -H "Cookie: <session>" \
  -H "Content-Type: application/json" \
  -d '{"stepId":"...","questionId":"stress_q1","answerValue":3}'

# Expected: 200 OK
# { "success": true, "data": { "saved": true } }
```

**4. Validate Step:**
```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments/<id>/steps/<stepId> \
  -H "Cookie: <session>"

# Expected (valid): 200 OK
# { "success": true, "data": { "isValid": true, "nextStep": {...} } }

# Expected (invalid): 200 OK
# { "success": true, "data": { "isValid": false, "missingQuestions": [...] } }
```

**5. Complete Assessment:**
```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments/<id>/complete \
  -H "Cookie: <session>" \
  -H "Idempotency-Key: test-$(date +%s)"

# Expected: 200 OK
# { "success": true, "data": { "assessmentId": "...", "status": "completed" } }
```

**6. Get Result:**
```bash
curl http://localhost:3000/api/funnels/stress/assessments/<id>/result \
  -H "Cookie: <session>"

# Expected: 200 OK
# { "success": true, "data": { "id": "...", "funnel": "stress", "completedAt": "...", ... } }
```

---

## Success Criteria

✅ **All scenarios pass without errors**  
✅ **Navigation flow is deterministic**  
✅ **Resume functionality works correctly**  
✅ **Validation prevents incomplete submissions**  
✅ **Error states handle gracefully**  
✅ **Multiple assessments can be taken**  
✅ **All API endpoints return expected responses**  
✅ **Database records are correct after completion**

---

## Common Issues

### Issue: "Assessment not found"
**Cause:** Invalid or expired assessment ID  
**Fix:** Start a new assessment from dashboard

### Issue: Resume shows wrong step
**Cause:** Navigation state mismatch  
**Fix:** Refresh page - server-side state is canonical

### Issue: Questions not saving
**Cause:** Network error or authentication issue  
**Fix:** Check browser console, verify session cookie

### Issue: Can't complete assessment
**Cause:** Missing required answers  
**Fix:** Scroll through all steps and complete all required questions

---

## Automated Testing

For automated testing, see:
- Jest tests: `npm test`
- API integration tests: `app/api/funnels/[slug]/assessments/__tests__/`
- Component tests: `app/patient/funnel/__tests__/`

---

## Reporting Issues

When reporting issues, include:
1. Scenario number (e.g., "Scenario 2, Step 3")
2. Expected behavior
3. Actual behavior
4. Browser console errors (if any)
5. Network tab screenshot (for API errors)
6. Assessment ID (if applicable)

---

**Last Updated:** 2026-01-14  
**Version:** E6.4.3  
**Author:** GitHub Copilot
