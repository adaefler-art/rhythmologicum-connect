# F3 Patient Journey Flow - Testing Guide

## Overview
This document describes the manual testing procedures for the improved patient journey flow.

## Feature Summary
The patient journey flow has been improved to provide clear, frictionless navigation:
- **Questionnaire** → **Result** → **History** → **New Check**

## Navigation Improvements

### 1. Result Page
- ✅ Added "📊 Meinen Verlauf ansehen" button (primary CTA)
- ✅ Added "Zurück zum Fragebogen" link (secondary navigation)
- ✅ Clear path forward after viewing results

### 2. History Page
- ✅ Prominent "Neue Messung durchführen" button at top
- ✅ Removed redundant button at bottom
- ✅ Export button remains accessible

### 3. Consistent Layout
- ✅ All pages use patient layout with consistent header/footer
- ✅ Removed conflicting `min-h-screen` from questionnaire page
- ✅ Proper flex layout hierarchy maintained

## Manual Testing Checklist

### Test 1: Complete Happy Path
1. [ ] Navigate to `/patient/stress-check`
2. [ ] Fill out all questionnaire items
3. [ ] Click "Antworten speichern & weiter"
4. [ ] Verify redirect to result page with results displayed
5. [ ] Verify "📊 Meinen Verlauf ansehen" button is visible
6. [ ] Click "Meinen Verlauf ansehen"
7. [ ] Verify redirect to history page
8. [ ] Verify history shows the new measurement
9. [ ] Verify "Neue Messung durchführen" button is at top
10. [ ] Click "Neue Messung durchführen"
11. [ ] Verify redirect back to questionnaire
12. [ ] Verify questionnaire is reset (no previous answers)

### Test 2: Back Navigation from Result
1. [ ] Complete questionnaire and navigate to result page
2. [ ] Click "Zurück zum Fragebogen" link
3. [ ] Verify redirect to questionnaire
4. [ ] Verify questionnaire shows fresh state (no answers)
5. [ ] Fill out questionnaire again
6. [ ] Submit and verify new result appears
7. [ ] Verify no duplicate entries in database

### Test 3: Browser Back Button
1. [ ] Complete questionnaire → result → history flow
2. [ ] Click browser back button from history
3. [ ] Verify navigation to result page
4. [ ] Click browser back button from result
5. [ ] Verify navigation to questionnaire
6. [ ] DO NOT submit again (just verify state)
7. [ ] Navigate forward to history
8. [ ] Verify only one measurement from this test

### Test 4: Header Navigation
1. [ ] From any patient page, verify header shows:
   - [ ] "Rhythmologicum Connect" branding
   - [ ] "Stress & Resilienz Pilot" subtitle
   - [ ] "Fragebogen" nav link
   - [ ] "Mein Verlauf" nav link
2. [ ] Click "Fragebogen" from history page
3. [ ] Verify navigation to questionnaire
4. [ ] Click "Mein Verlauf" from questionnaire
5. [ ] Verify navigation to history

### Test 5: Footer Consistency
1. [ ] From questionnaire page, verify footer shows:
   - [ ] "Rhythmologicum Connect – frühe Testversion..." text
   - [ ] "Datenschutz" link
   - [ ] Copyright notice
2. [ ] Repeat check on result page
3. [ ] Repeat check on history page
4. [ ] Verify footer is identical across all pages

### Test 6: Empty History State
1. [ ] As a new user with no measurements:
2. [ ] Navigate to `/patient/history`
3. [ ] Verify empty state message
4. [ ] Verify "Zum Fragebogen" button is visible
5. [ ] Click button and verify navigation

### Test 7: Error State Navigation
1. [ ] Navigate to result page without assessmentId parameter
2. [ ] Verify error message displayed
3. [ ] Verify "Zur Startseite" button present
4. [ ] Click and verify navigation

### Test 8: Multiple Measurements
1. [ ] Complete 3 separate questionnaires (full flow each time)
2. [ ] Navigate to history page
3. [ ] Verify 3 measurements are shown chronologically
4. [ ] Verify latest measurement at top
5. [ ] Verify "Neue Messung durchführen" button visible
6. [ ] Complete one more measurement
7. [ ] Verify history now shows 4 measurements

### Test 9: Responsive Design
1. [ ] Test all pages on desktop viewport (1920x1080)
2. [ ] Test all pages on tablet viewport (768x1024)
3. [ ] Test all pages on mobile viewport (375x667)
4. [ ] Verify all buttons are touch-friendly
5. [ ] Verify text is readable at all sizes
6. [ ] Verify layout adapts appropriately

### Test 10: Accessibility
1. [ ] Navigate using keyboard only (Tab, Enter, Space)
2. [ ] Verify all interactive elements are focusable
3. [ ] Verify focus indicators are visible
4. [ ] Test with screen reader (if available)
5. [ ] Verify semantic HTML structure

## Database Verification

### No Duplicate Saves
After Test 3 (Browser Back Button):
```sql
-- Check for duplicate assessments within short time window
SELECT 
  patient_id,
  COUNT(*) as assessment_count,
  array_agg(id ORDER BY created_at DESC) as assessment_ids,
  array_agg(created_at ORDER BY created_at DESC) as timestamps
FROM assessments
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY patient_id
HAVING COUNT(*) > 1;
```

Expected: No duplicates within the same minute (unless intentionally created)

### Report Idempotency
```sql
-- Verify one report per assessment
SELECT 
  assessment_id,
  COUNT(*) as report_count
FROM reports
GROUP BY assessment_id
HAVING COUNT(*) > 1;
```

Expected: Empty result (each assessment has max 1 report)

### Patient Measures Idempotency
```sql
-- Verify one measure per report
SELECT 
  report_id,
  COUNT(*) as measure_count
FROM patient_measures
WHERE report_id IS NOT NULL
GROUP BY report_id
HAVING COUNT(*) > 1;
```

Expected: Empty result (each report has max 1 measure)

## Success Criteria

### Navigation Flow
- ✅ All navigation paths work without dead ends
- ✅ Clear "next step" visible on each page
- ✅ Back navigation available where appropriate
- ✅ Browser back/forward work correctly

### No Duplicate Saves
- ✅ Submitting questionnaire creates exactly 1 assessment
- ✅ Viewing result creates exactly 1 report
- ✅ Database queries confirm no duplicates
- ✅ Back button doesn't trigger re-submission

### Consistent UI
- ✅ Header identical across all patient pages
- ✅ Footer identical across all patient pages
- ✅ Color scheme and typography consistent
- ✅ Button styles follow design system

### No Undefined States
- ✅ All pages handle loading states
- ✅ All pages handle error states
- ✅ All pages handle empty states
- ✅ No blank screens or missing content

## Known Issues / Edge Cases

### Consent Modal
- **What:** ConsentModal is a data privacy consent component that users must accept before using the app
- **Behavior:** Renders full-screen, bypassing the standard patient layout
- **Why:** Intentional design - user must provide explicit consent before seeing any patient data or UI
- **Status:** Not considered a bug - this is by design for legal/privacy compliance

### Loading States
- **What:** Brief loading indicators while authentication and data are being fetched
- **Behavior:** Brief flash of loading state (typically 100-500ms)
- **Why:** Supabase authentication check and session validation require network calls
- **Future:** Could be improved with skeleton screens for better perceived performance

### Error Recovery (AMY Service)
- **What:** AMY is the AI assistant that generates personalized stress assessment reports
- **Behavior:** If AMY service fails, report creation may be delayed; status shows "pending"
- **Why:** External API call to Anthropic Claude may timeout or be unavailable
- **Recovery:** User can retry by refreshing the result page; questionnaire data is safely stored
- **Status:** History will show "pending" status until report generation completes successfully

## Performance Expectations

- Page navigation: < 200ms
- Questionnaire submission: < 2s
- Result generation: < 5s (depends on AMY API)
- History load: < 1s

## Browser Compatibility

Tested on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Regression Testing

After any changes to patient flow:
1. Re-run Tests 1, 2, and 3 (core flow tests)
2. Verify database queries still return no duplicates
3. Check console for errors or warnings
4. Verify header/footer consistency

## Automation Potential

Future test automation could include:
- Playwright E2E tests for happy path
- Cypress component tests for individual pages
- Jest unit tests for state management
- Database integrity tests in CI/CD

---

**Created:** 2024-12-07
**Status:** Ready for Manual Testing
**Related Issue:** F3 Patient Journey Flow
