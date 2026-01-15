# E6.4.6 — Escalation Offer Stub Verification Checklist

## Automated Verification ✅

### Unit Tests
- [x] All 11 unit tests pass
- [x] Red flag detection works for high risk level
- [x] No red flag for moderate/low/null risk
- [x] Correlation ID generation is unique
- [x] Deterministic behavior verified
- [x] Severity ranking works correctly
- [x] Reason formatting works correctly

**Command:**
```bash
npm test -- lib/escalation
```

**Result:** ✅ 11/11 tests passing

### Code Quality
- [x] TypeScript compilation successful
- [x] No TypeScript errors in escalation files
- [x] ESLint passes with no errors
- [x] Uses canonical imports (@/lib/db/supabase.server)
- [x] Uses env module instead of process.env

**Commands:**
```bash
npx tsc --noEmit  # Check TypeScript
npx eslint lib/escalation app/patient/escalation app/api/escalation --ext .ts,.tsx  # Check linting
```

**Result:** ✅ No errors

---

## Manual Verification (Requires Running App)

### Setup
1. Start development server:
   ```bash
   npm run dev
   ```
2. Open http://localhost:3000
3. Have database access for audit log verification

### Test Scenario 1: High Risk Detection

**Objective:** Verify red flag triggers for high risk assessment

**Steps:**
1. [ ] Log in as patient user
2. [ ] Navigate to stress assessment: `/patient/funnel/stress-assessment`
3. [ ] Complete assessment with high stress answers
4. [ ] Submit assessment
5. [ ] View result page

**Expected Results:**
- [ ] EscalationOfferCard appears at **top** of results page
- [ ] Card has red/orange gradient background
- [ ] Card shows AlertTriangle icon
- [ ] Card displays German warning text
- [ ] Card shows two CTA buttons:
  - [ ] "Video-Sprechstunde anfordern"
  - [ ] "Arzttermin vereinbaren"
- [ ] Card shows emergency contact info (112, 116 117, Telefonseelsorge)
- [ ] Card shows truncated correlation ID at bottom

**Verification in Database:**
```sql
-- Check that FLAG event was logged
SELECT 
  id,
  entity_type,
  entity_id,
  action,
  source,
  metadata->>'correlation_id' as correlation_id,
  metadata->>'red_flag_severity' as severity,
  metadata->>'red_flag_source' as source_type,
  created_at
FROM audit_log
WHERE 
  action = 'flag'
  AND entity_type = 'assessment'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- [ ] One FLAG event logged
- [ ] entity_type = 'assessment'
- [ ] metadata contains correlation_id starting with 'esc-'
- [ ] metadata contains red_flag_severity = 'critical'
- [ ] metadata contains red_flag_source = 'report_risk_level'
- [ ] No PHI in metadata

---

### Test Scenario 2: CTA Click - Video Consultation

**Objective:** Verify CTA navigation and logging

**Steps:**
1. [ ] From result page with escalation offer visible
2. [ ] Click "Video-Sprechstunde anfordern" button
3. [ ] Button shows "Wird vorbereitet..." while processing

**Expected Results:**
- [ ] Navigate to `/patient/escalation?type=video_consultation&correlation=esc-...`
- [ ] Placeholder page loads
- [ ] Page shows "Video-Sprechstunde" title
- [ ] Page shows "Funktion in Entwicklung" notice (amber)
- [ ] Page shows emergency contact section (red)
- [ ] Page shows regular contact options
- [ ] Page shows correlation ID at bottom
- [ ] Browser console logs page view event

**Verification in Database:**
```sql
-- Check that ESCALATE event was logged
SELECT 
  id,
  entity_type,
  entity_id,
  action,
  source,
  actor_user_id,
  metadata->>'correlation_id' as correlation_id,
  metadata->>'offer_type' as offer_type,
  created_at
FROM audit_log
WHERE 
  action = 'escalate'
  AND entity_type = 'assessment'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- [ ] One ESCALATE event logged
- [ ] entity_type = 'assessment'
- [ ] actor_user_id = current user ID
- [ ] metadata contains same correlation_id as FLAG event
- [ ] metadata contains offer_type = 'video_consultation'
- [ ] No PHI in metadata

---

### Test Scenario 3: CTA Click - Doctor Appointment

**Objective:** Verify second CTA works

**Steps:**
1. [ ] Return to result page (browser back or navigate)
2. [ ] Click "Arzttermin vereinbaren" button

**Expected Results:**
- [ ] Navigate to `/patient/escalation?type=doctor_appointment&correlation=esc-...`
- [ ] Same placeholder page with different title
- [ ] ESCALATE event logged with offer_type = 'doctor_appointment'

---

### Test Scenario 4: Moderate/Low Risk - No Escalation

**Objective:** Verify escalation offer NOT shown for non-high risk

**Steps:**
1. [ ] Complete assessment with moderate or low stress answers
2. [ ] Submit assessment
3. [ ] View result page

**Expected Results:**
- [ ] EscalationOfferCard **NOT** visible
- [ ] WorkupStatusCard shown (if applicable)
- [ ] Regular result components shown
- [ ] No FLAG event logged for this assessment

**Verification in Database:**
```sql
-- Verify no FLAG events for this assessment
SELECT COUNT(*) as flag_count
FROM audit_log
WHERE 
  action = 'flag'
  AND entity_id = '<assessment_id>'
  AND entity_type = 'assessment';
```

**Expected:**
- [ ] flag_count = 0

---

### Test Scenario 5: Placeholder Page Direct Access

**Objective:** Verify placeholder page works standalone

**Steps:**
1. [ ] Navigate directly to `/patient/escalation?type=video_consultation&correlation=test-123`

**Expected Results:**
- [ ] Page loads successfully
- [ ] Shows video consultation content
- [ ] Shows correlation ID: test-123
- [ ] Back button works (goes to previous page)
- [ ] Emergency contacts visible
- [ ] Feature notice visible

---

## Security Verification

### PHI Protection in Audit Logs

**Query all escalation events:**
```sql
SELECT 
  id,
  action,
  metadata,
  diff
FROM audit_log
WHERE 
  action IN ('flag', 'escalate')
  AND entity_type = 'assessment'
ORDER BY created_at DESC
LIMIT 20;
```

**Verify:**
- [ ] No patient names in metadata
- [ ] No assessment answers in metadata
- [ ] No clinical text in metadata
- [ ] No email/phone in metadata
- [ ] Only IDs, enums, and correlation_id present
- [ ] diff field is null or contains only safe fields

### API Endpoint Security

**Test without authentication:**
```bash
curl -X POST http://localhost:3000/api/escalation/log-click \
  -H "Content-Type: application/json" \
  -d '{"assessmentId":"test","correlationId":"test","offerType":"video_consultation"}'
```

**Expected:**
- [ ] Returns 401 Unauthorized
- [ ] Error: "Authentication required"

**Test with invalid offer type:**
```bash
curl -X POST http://localhost:3000/api/escalation/log-click \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{"assessmentId":"test","correlationId":"test","offerType":"invalid_type"}'
```

**Expected:**
- [ ] Returns 400 Bad Request
- [ ] Error: "Invalid offer type"

---

## UI/UX Verification

### Visual Design
- [ ] EscalationOfferCard uses red/orange gradient (danger theme)
- [ ] Alert icon is visible and appropriate size
- [ ] Text is readable on gradient background
- [ ] Emergency section has distinct red background
- [ ] CTAs are large and prominent
- [ ] Mobile responsive (test on narrow viewport)
- [ ] Dark mode support (if app supports dark mode)

### Accessibility
- [ ] Screen reader can read all content
- [ ] CTAs are keyboard accessible (Tab navigation)
- [ ] Enter key activates CTAs
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible on interactive elements

### Text Content (German)
- [ ] Warning text is clear and professional
- [ ] Emergency disclaimer is prominent
- [ ] Emergency numbers are correct:
  - 112 - Notarzt
  - 116 117 - Ärztlicher Bereitschaftsdienst
  - 0800 111 0 111 - Telefonseelsorge
- [ ] Contact information is accurate
- [ ] No typos or grammatical errors

---

## Integration Verification

### Result Page Integration
- [ ] EscalationOfferCard appears **before** WorkupStatusCard
- [ ] Card does not interfere with other result components
- [ ] Page layout remains stable with/without escalation card
- [ ] Scrolling works normally
- [ ] Other result features still functional

### Navigation Flow
- [ ] Back button from escalation page works
- [ ] Can navigate to other sections after viewing escalation
- [ ] Browser history works correctly
- [ ] Deep links to escalation page work

---

## Performance Verification

### Detection Performance
- [ ] Red flag detection completes quickly (<100ms)
- [ ] Page load not significantly delayed
- [ ] No visible lag when rendering card

### Logging Performance
- [ ] Audit logging does not block UI
- [ ] Failed logging does not break user flow
- [ ] Console shows no errors during normal flow

---

## Acceptance Criteria Final Check

### AC1: RedFlag → Escalation Offer wird angezeigt (deterministisch)
- [ ] High risk level **always** triggers escalation offer
- [ ] Same inputs → same outputs (except correlation ID)
- [ ] Unit tests verify deterministic behavior
- [ ] Manual test confirms consistent behavior

### AC2: CTA klickbar, führt zu Placeholder Screen
- [ ] Both CTAs are clickable
- [ ] Navigation to placeholder page works
- [ ] Placeholder shows appropriate content
- [ ] No broken links or errors

### AC3: Event wird geloggt (ohne PHI), correlationId vorhanden
- [ ] FLAG event logged when offer shown
- [ ] ESCALATE event logged when CTA clicked
- [ ] Correlation ID present in all events
- [ ] No PHI in any logged data
- [ ] Database queries confirm correct logging

### AC4: Kein Support-Task System erforderlich
- [ ] No tasks created
- [ ] No queue processing
- [ ] No scheduling backend
- [ ] Placeholder explicitly states "in development"
- [ ] No clinician assignment or notification

---

## Sign-Off

**Automated Checks:**
- [x] Unit tests: 11/11 passing
- [x] TypeScript: No errors
- [x] ESLint: No errors

**Manual Checks (Requires Running App):**
- [ ] High risk detection
- [ ] CTA navigation
- [ ] Audit logging
- [ ] No escalation for low/moderate risk
- [ ] PHI protection verified
- [ ] Security checks passed
- [ ] UI/UX acceptable
- [ ] All ACs met

**Tester:** _________________  
**Date:** _________________  
**Environment:** Development / Staging / Production  
**Notes:** _________________
