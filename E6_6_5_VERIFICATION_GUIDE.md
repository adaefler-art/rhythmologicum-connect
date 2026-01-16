# E6.6.5 — Manual Verification Guide

## Overview

This guide provides step-by-step instructions for manually verifying the triage router implementation. Each test case corresponds to a specific `nextAction` and validates the entire navigation flow.

---

## Prerequisites

1. **Development Environment:**
   ```bash
   cd /path/to/rhythmologicum-connect
   npm install
   npm run dev
   ```
   Server should be running at http://localhost:3000

2. **Authentication:**
   - Log in as a patient user
   - Navigate to `/patient/dashboard`

3. **Browser:**
   - Use Chrome/Edge DevTools for debugging
   - Open Console tab to see navigation logs
   - Open Network tab to monitor API calls

---

## Test Cases

### Test 1: SHOW_CONTENT (INFO Tier)

**Purpose:** Verify that informational queries navigate to content tiles with scroll

**Steps:**
1. Navigate to `/patient/dashboard`
2. Locate AMY Composer section
3. Enter the following text:
   ```
   Was ist Stress?
   ```
4. Click "Anliegen einreichen"
5. Wait for triage result (should be ~1-2 seconds)

**Expected Result:**
- ✅ Tier badge shows "✅ Information"
- ✅ Rationale shows: "Ihre Anfrage scheint informativ zu sein..."
- ✅ CTA button shows "📚 Inhalte ansehen"
- ✅ Click CTA → stays on `/patient/dashboard`
- ✅ Page scrolls smoothly to content tiles section
- ✅ URL updates to `/patient/dashboard?scrollTo=content` briefly
- ✅ Query param is cleared after scroll

**Console Logs to Check:**
```
[AMYComposer] Navigating to { url: '/patient/dashboard?scrollTo=content', description: 'Show content tiles (INFO tier)', tier: 'INFO' }
```

**Debug Tips:**
- If scroll doesn't work, check that `id="content-tiles"` exists in DOM
- If navigation fails, check `isRoutableAction()` validation in console

---

### Test 2: START_FUNNEL_A (ASSESSMENT Tier)

**Purpose:** Verify that assessment queries navigate to stress-resilience funnel

**Steps:**
1. Navigate to `/patient/dashboard`
2. Reset AMY Composer if needed (click "Neues Anliegen eingeben")
3. Enter the following text:
   ```
   Ich habe seit Wochen Schlafprobleme und fühle mich ständig gestresst.
   ```
4. Click "Anliegen einreichen"
5. Wait for triage result

**Expected Result:**
- ✅ Tier badge shows "📋 Einschätzung empfohlen"
- ✅ Rationale shows: "Basierend auf Ihrer Nachricht empfehlen wir..."
- ✅ CTA button shows "📋 Fragebogen starten"
- ✅ Click CTA → navigates to `/patient/funnel/stress-resilience?source=triage`
- ✅ Funnel page loads with triage context

**Console Logs to Check:**
```
[AMYComposer] Navigating to { url: '/patient/funnel/stress-resilience?source=triage', description: 'Start Stress & Resilience Assessment (Funnel A)', tier: 'ASSESSMENT' }
```

**Debug Tips:**
- If funnel doesn't load, check that route `/patient/funnel/stress-resilience` exists
- Check browser localStorage/sessionStorage for `lastTriageResult`

---

### Test 3: START_FUNNEL_B (ASSESSMENT Tier - Sleep Keywords)

**Purpose:** Verify sleep-specific keywords could route to sleep funnel (if implemented)

**Steps:**
1. Navigate to `/patient/dashboard`
2. Reset AMY Composer
3. Enter the following text:
   ```
   Ich kann nicht einschlafen und wache nachts ständig auf.
   ```
4. Click "Anliegen einreichen"

**Expected Result:**
- ✅ Tier badge shows "📋 Einschätzung empfohlen"
- ✅ CTA button shows either:
  - "📋 Fragebogen starten" (if START_FUNNEL_A)
  - "💤 Schlaf-Assessment starten" (if START_FUNNEL_B)

**Note:** Current engine always returns START_FUNNEL_A for ASSESSMENT tier. START_FUNNEL_B is reserved for future sleep-specific routing logic.

---

### Test 4: SHOW_ESCALATION (ESCALATE Tier)

**Purpose:** Verify red flag keywords trigger escalation flow

**Steps:**
1. Navigate to `/patient/dashboard`
2. Reset AMY Composer
3. Enter the following text (German red flag keyword):
   ```
   Ich habe Gedanken an Selbstmord und weiß nicht mehr weiter.
   ```
4. Click "Anliegen einreichen"

**Expected Result:**
- ✅ Tier badge shows "🚨 Dringend"
- ✅ Rationale shows: "Ihre Nachricht enthält Hinweise auf eine Notfallsituation..."
- ✅ Emergency warning alert visible: "Bei akuten Notfällen wählen Sie bitte sofort 112..."
- ✅ CTA button shows "🆘 Unterstützung erhalten"
- ✅ Click CTA → navigates to `/patient/support?source=triage&tier=ESCALATE`
- ✅ Support page loads with urgent context

**Console Logs to Check:**
```
[AMYComposer] Navigating to { url: '/patient/support?source=triage&tier=ESCALATE', description: 'Show escalation support (ESCALATE tier)', tier: 'ESCALATE' }
```

**Alternative Red Flag Keywords to Test:**
- English: "I want to kill myself"
- German: "Selbstverletzung", "akute Gefahr", "Notfall"
- Check that redFlags array is populated in triage result

---

### Test 5: RESUME_FUNNEL (With Incomplete Funnel)

**Purpose:** Verify resume logic when user has in-progress assessment

**Prerequisites:**
1. Start a funnel but don't complete it (complete 2-3 steps, then return to dashboard)
2. Dashboard should show "Next Step" card with "Resume Assessment"

**Steps:**
1. Navigate to `/patient/dashboard`
2. Verify "Next Step" card is visible
3. In AMY Composer, enter:
   ```
   Ich möchte meine Einschätzung fortsetzen.
   ```
4. Click "Anliegen einreichen"

**Expected Result:**
- ✅ nextAction might be RESUME_FUNNEL (depends on engine logic)
- ✅ CTA button shows "▶️ Fragebogen fortsetzen"
- ✅ Click CTA → navigates to `/patient/dashboard?action=resume`
- ✅ After ~500ms delay, auto-navigates to funnel resume URL
- ✅ Funnel loads at the correct step (e.g., step 4 if user left off there)

**Note:** Current engine may return START_FUNNEL_A instead of RESUME_FUNNEL. The RESUME_FUNNEL logic requires context awareness (knowing user has incomplete funnel).

---

## Storage Verification

### Test 6: Verify sessionStorage Persistence

**Steps:**
1. Complete any triage flow (e.g., Test 1)
2. Open DevTools → Application tab → Storage → Session Storage
3. Look for key: `lastTriageResult`

**Expected Result:**
- ✅ Key exists with JSON value
- ✅ Value matches TriageResultV1 schema:
  ```json
  {
    "tier": "INFO",
    "nextAction": "SHOW_CONTENT",
    "redFlags": [],
    "rationale": "...",
    "version": "v1",
    "correlationId": "..."
  }
  ```
- ✅ Value is valid JSON (no corruption)
- ✅ Value persists across page reloads (stay on same tab)
- ✅ Value clears when tab is closed

---

## Edge Cases

### Test 7: Invalid/Unknown nextAction

**Purpose:** Verify graceful fallback for unexpected nextActions

**Steps:**
1. Manually tamper with triage result in code or use browser console
2. In console, run:
   ```javascript
   sessionStorage.setItem('lastTriageResult', JSON.stringify({
     tier: 'INFO',
     nextAction: 'UNKNOWN_ACTION',
     redFlags: [],
     rationale: 'Test',
     version: 'v1',
     correlationId: 'test-123'
   }))
   ```
3. Reload page and trigger triage

**Expected Result:**
- ✅ Console warning: `[TriageRouter] Unknown nextAction, falling back to dashboard`
- ✅ Navigation falls back to `/patient/dashboard`
- ✅ No JavaScript errors or crashes

---

### Test 8: Storage Unavailable (Private Browsing)

**Purpose:** Verify graceful degradation without sessionStorage

**Steps:**
1. Open browser in Private/Incognito mode
2. Navigate to `/patient/dashboard`
3. Complete a triage flow

**Expected Result:**
- ✅ Console warning: `[AMYComposer] Failed to store triage result`
- ✅ Triage still completes successfully
- ✅ Navigation still works (router doesn't depend on storage)
- ✅ Retry functionality may be limited (no stored result to reference)

---

### Test 9: Very Long Rationale

**Purpose:** Verify rationale bounding works correctly

**Steps:**
1. Trigger a triage with expected long rationale
2. Check that rationale is ≤280 characters or ≤3 bullet points

**Expected Result:**
- ✅ Rationale is bounded correctly
- ✅ No UI overflow or layout issues
- ✅ Validation passes (no schema errors)

---

## Browser Compatibility

Test the following browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Focus Areas:**
- sessionStorage support
- `scrollIntoView()` behavior
- Query parameter handling
- Navigation transitions

---

## Performance Verification

### Test 10: Navigation Speed

**Steps:**
1. Complete a triage flow
2. Measure time from CTA click to page load/scroll

**Expected Result:**
- ✅ Navigation to funnel: <500ms
- ✅ Scroll to content: <300ms
- ✅ No janky animations or layout shifts
- ✅ Smooth user experience

---

## Debugging Tips

### Common Issues

1. **Scroll doesn't work:**
   - Check `id="content-tiles"` exists in DOM
   - Check console for errors in `useEffect` hook
   - Verify `scrollTo` query param is present

2. **Navigation doesn't trigger:**
   - Check `isRoutableAction()` validation
   - Check console for router warnings
   - Verify `handleNavigate()` is called (add console.log)

3. **Storage fails silently:**
   - Check browser supports sessionStorage
   - Check quota limits (unlikely with small JSON)
   - Check Private Browsing mode

4. **Triage returns unexpected tier:**
   - Check input text matches keyword patterns
   - Review engine rules in `lib/triage/engine.ts`
   - Check for case sensitivity issues

### Console Logs to Monitor

```javascript
// Success case
[AMYComposer] Navigating to { url: '...', description: '...', tier: '...' }

// Validation failure
[AMYComposer] Invalid nextAction { nextAction: '...' }

// Storage warning
[AMYComposer] Failed to store triage result

// Router fallback
[TriageRouter] Unknown nextAction, falling back to dashboard
```

---

## Checklist

After completing all tests, verify:

- [ ] All 5 nextActions route correctly
- [ ] Scroll-to-content works smoothly
- [ ] Auto-resume triggers after delay
- [ ] sessionStorage persists across reloads
- [ ] Emergency warnings display for ESCALATE tier
- [ ] CTAs show correct labels for each action
- [ ] Navigation is initiated from dashboard (AC3)
- [ ] Router is deterministic (same input → same route)
- [ ] No console errors or warnings (except expected ones)
- [ ] Mobile responsive (test on iPhone/Android)

---

## Success Criteria

All test cases pass AND:
- No JavaScript errors in console
- No broken navigation flows
- No data loss (storage failures handled gracefully)
- User experience is smooth and intuitive
- Emergency cases handled with appropriate urgency

---

## Reporting Issues

If any test fails, report with:
1. Test case number (e.g., "Test 2: START_FUNNEL_A")
2. Browser and OS
3. Console logs (errors/warnings)
4. Expected vs. actual behavior
5. Screenshots if applicable

Example:
```
Test 4: SHOW_ESCALATION fails in Safari 17.2 on macOS
- Expected: Navigate to /patient/support?source=triage&tier=ESCALATE
- Actual: Navigation triggers but query params missing
- Console: No errors
- Screenshot: [attached]
```
