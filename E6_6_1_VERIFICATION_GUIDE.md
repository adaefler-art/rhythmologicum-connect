# E6.6.1 Verification Guide

## Manual Testing Guide

This guide provides step-by-step instructions for manually verifying the E6.6.1 AMY Composer implementation.

### Prerequisites

1. **Environment Setup:**
   ```bash
   # Ensure .env.local has required variables
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ANTHROPIC_API_KEY=your-anthropic-key  # Optional, will use fallback if missing
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

3. **Login as Patient:**
   - Navigate to http://localhost:3000
   - Login with patient credentials
   - Navigate to dashboard: http://localhost:3000/patient/dashboard

### Test Suite

#### ✅ Test 1: Initial Component Rendering

**Steps:**
1. Navigate to patient dashboard
2. Locate AMY Composer component (purple/pink gradient icon 🤖)

**Expected Results:**
- [ ] AMY header with "AMY - Ihr persönlicher Assistent" title
- [ ] Blue info Alert with non-emergency disclaimer text
- [ ] Four suggested concern chips visible:
  - 💤 Schlafprobleme
  - 😰 Stress
  - 💓 Herzklopfen
  - 😟 Sorgen
- [ ] Empty textarea with placeholder text
- [ ] Character counter shows "0 / 800 Zeichen"
- [ ] Submit button is disabled

**Screenshot:** Save as `screenshots/e6-6-1-test-1-initial-state.png`

---

#### ✅ Test 2: Character Counter - Valid Input

**Steps:**
1. Type a short concern (e.g., "Ich habe Stress bei der Arbeit")
2. Observe character counter

**Expected Results:**
- [ ] Counter updates in real-time
- [ ] Counter text is gray (normal state)
- [ ] Shows correct count (e.g., "31 / 800 Zeichen")
- [ ] Submit button becomes enabled when >= 10 characters

**Screenshot:** Save as `screenshots/e6-6-1-test-2-valid-input.png`

---

#### ✅ Test 3: Character Counter - Approaching Limit

**Steps:**
1. Type or paste text between 500-800 characters
2. Observe character counter color change

**Expected Results:**
- [ ] Counter text changes to amber/orange when > 500 chars
- [ ] Helper text appears: "Empfohlen: bis zu 500 Zeichen"
- [ ] Submit button remains enabled
- [ ] No error message

**Screenshot:** Save as `screenshots/e6-6-1-test-3-approaching-limit.png`

---

#### ✅ Test 4: Character Counter - Over Limit (AC1 Client-Side)

**Steps:**
1. Type or paste text exceeding 800 characters
2. Observe validation behavior

**Expected Results:**
- [ ] Counter text turns RED
- [ ] Error message appears: "Maximal 800 Zeichen erlaubt"
- [ ] Textarea has red border (error state)
- [ ] Submit button is DISABLED
- [ ] Cannot submit the form

**Screenshot:** Save as `screenshots/e6-6-1-test-4-over-limit.png`

**Verification Command:**
```javascript
// In browser console
document.querySelector('textarea').value.length // Should be > 800
document.querySelector('button[type="button"]').disabled // Should be true
```

---

#### ✅ Test 5: Suggested Chips

**Steps:**
1. Click on "💤 Schlafprobleme" chip
2. Observe textarea update

**Expected Results:**
- [ ] Textarea populates with "Schlafprobleme"
- [ ] Character counter updates (15 / 800)
- [ ] Submit button enables

**Steps (continued):**
3. Type additional text
4. Click on another chip (e.g., "😰 Stress")

**Expected Results:**
- [ ] New text is appended with comma: "Schlafprobleme, Stress"
- [ ] Counter updates accordingly

**Screenshot:** Save as `screenshots/e6-6-1-test-5-chips.png`

---

#### ✅ Test 6: Submit - Loading State (AC4)

**Steps:**
1. Type valid concern (50-100 characters)
2. Click "Anliegen einreichen" button
3. Observe loading state

**Expected Results:**
- [ ] Button shows loading spinner
- [ ] Button text changes to "Wird analysiert..."
- [ ] Button is disabled during loading
- [ ] Textarea is disabled
- [ ] All inputs are frozen

**Screenshot:** Save as `screenshots/e6-6-1-test-6-loading.png`

**Tip:** Use browser DevTools Network tab to slow down the request (throttling) to capture this state.

---

#### ✅ Test 7: Submit - Success State - Moderate Tier (AC4)

**Steps:**
1. Type: "Ich habe in letzter Zeit Schlafprobleme und fühle mich gestresst."
2. Submit and wait for response

**Expected Results:**
- [ ] Success state displays
- [ ] Tier badge shows: "📋 Mittel" (amber background)
- [ ] Summary text from AI is displayed
- [ ] Suggested resources section appears (if provided)
- [ ] "Neues Anliegen eingeben" button visible
- [ ] Original input form is hidden

**Screenshot:** Save as `screenshots/e6-6-1-test-7-success-moderate.png`

**API Verification:**
```bash
# Check server logs for:
# [amy/triage] Processing triage request
# [amy/triage] Request completed successfully
# tier: moderate, nextAction: funnel
```

---

#### ✅ Test 8: Submit - Success State - High Tier

**Steps:**
1. Reset form (click "Neues Anliegen eingeben" if needed)
2. Type: "Ich habe starke Herzprobleme und Atemnot seit Tagen."
3. Submit and wait for response

**Expected Results:**
- [ ] Tier badge shows: "⚠️ Hoch" (orange background)
- [ ] Escalation warning Alert appears (yellow)
- [ ] Alert text: "Wir empfehlen, zeitnah einen Arzt aufzusuchen..."
- [ ] Summary text provided

**Screenshot:** Save as `screenshots/e6-6-1-test-8-success-high.png`

---

#### ✅ Test 9: Submit - Success State - Urgent/Emergency

**Steps:**
1. Reset form
2. Type concern with emergency indicators
3. Submit and wait for response

**Expected Results:**
- [ ] Tier badge shows: "🚨 Dringend" (red background)
- [ ] Emergency Alert appears (red)
- [ ] Alert text: "Bitte wenden Sie sich umgehend an einen Notdienst (112)..."

**Screenshot:** Save as `screenshots/e6-6-1-test-9-success-urgent.png`

---

#### ✅ Test 10: Reset Flow

**Steps:**
1. After successful triage, click "Neues Anliegen eingeben"

**Expected Results:**
- [ ] Form returns to initial state
- [ ] Textarea is cleared
- [ ] Character counter reset to "0 / 800"
- [ ] Submit button disabled
- [ ] Previous result is cleared
- [ ] No error messages visible

**Screenshot:** Save as `screenshots/e6-6-1-test-10-reset.png`

---

#### ✅ Test 11: Error Handling - Network Error (AC4)

**Steps:**
1. Open browser DevTools > Network tab
2. Enable "Offline" mode
3. Type valid concern and submit

**Expected Results:**
- [ ] Loading state shows briefly
- [ ] Error state displays
- [ ] Red error Alert with message
- [ ] Input form remains visible (not hidden)
- [ ] Submit button re-enabled for retry
- [ ] Can edit text and retry

**Screenshot:** Save as `screenshots/e6-6-1-test-11-error.png`

---

#### ✅ Test 12: Server-Side Validation - Too Short (AC1)

**Steps:**
1. Open browser console
2. Make API call with short text:
   ```javascript
   fetch('/api/amy/triage', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({concern: 'Short'})
   }).then(r => r.json()).then(console.log)
   ```

**Expected Results:**
```json
{
  "error": "Concern must be at least 10 characters"
}
```
- [ ] HTTP status: 400
- [ ] Error message is descriptive

---

#### ✅ Test 13: Server-Side Validation - Too Long (AC1)

**Steps:**
1. In browser console:
   ```javascript
   const longText = 'x'.repeat(850)
   fetch('/api/amy/triage', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({concern: longText})
   }).then(r => r.json()).then(console.log)
   ```

**Expected Results:**
```json
{
  "error": "Concern must not exceed 800 characters"
}
```
- [ ] HTTP status: 400
- [ ] Server logs warning about length

---

#### ✅ Test 14: Non-Emergency Disclaimer (AC3)

**Steps:**
1. Locate the blue info Alert at top of component

**Expected Results:**
- [ ] Alert is ALWAYS visible (initial state, during input, etc.)
- [ ] Alert is NOT dismissible (no X button)
- [ ] Text reads: "Hinweis: Dies ist kein Notfalldienst. Bei akuten medizinischen Notfällen wählen Sie bitte 112."
- [ ] Alert has info icon
- [ ] Blue color scheme (sky-blue)

**Screenshot:** Save as `screenshots/e6-6-1-test-14-disclaimer.png`

---

#### ✅ Test 15: Telemetry Events

**Steps:**
1. Submit a valid concern
2. Check server logs

**Expected Results:**
```
[amy/triage] POST request received correlationId=<uuid>
[TELEMETRY] Emitting TRIAGE_SUBMITTED event
[TELEMETRY] Emitting TRIAGE_ROUTED event
[amy/triage] Request completed successfully
```
- [ ] TRIAGE_SUBMITTED event logged
- [ ] TRIAGE_ROUTED event logged
- [ ] Events include tier and nextAction
- [ ] No patient text in telemetry (PHI-safe)

---

#### ✅ Test 16: AMY Feature Flag Disabled

**Steps:**
1. Set environment variable:
   ```bash
   NEXT_PUBLIC_FEATURE_AMY_ENABLED=false
   ```
2. Restart dev server
3. Submit concern

**Expected Results:**
- [ ] Fallback response is used
- [ ] Tier: "moderate"
- [ ] NextAction: "funnel"
- [ ] Generic summary text (not AI-generated)
- [ ] No error displayed to user
- [ ] Server logs: "[amy/triage] AMY feature disabled, using fallback"

---

#### ✅ Test 17: Anthropic API Key Missing

**Steps:**
1. Remove `ANTHROPIC_API_KEY` from .env.local
2. Restart dev server
3. Submit concern

**Expected Results:**
- [ ] Fallback response is used
- [ ] Same as Test 16 results
- [ ] Server logs: "[amy/triage] Anthropic not configured, using fallback"
- [ ] No error displayed to user

---

#### ✅ Test 18: Dark Mode

**Steps:**
1. Toggle system dark mode or browser dark mode
2. Observe component styling

**Expected Results:**
- [ ] All text is readable
- [ ] AMY gradient icon looks good
- [ ] Alert colors adapt correctly
- [ ] Textarea has proper dark mode styling
- [ ] Character counter is readable
- [ ] Tier badges look good in dark mode

**Screenshot:** Save as `screenshots/e6-6-1-test-18-dark-mode.png`

---

#### ✅ Test 19: Mobile Responsive

**Steps:**
1. Resize browser to mobile width (375px)
2. Interact with component

**Expected Results:**
- [ ] Component fits mobile screen
- [ ] Chips wrap to multiple lines
- [ ] Textarea is usable
- [ ] Button is full-width and touch-friendly
- [ ] No horizontal scroll

**Screenshot:** Save as `screenshots/e6-6-1-test-19-mobile.png`

---

#### ✅ Test 20: Accessibility

**Steps:**
1. Use keyboard navigation only (Tab, Enter, Escape)
2. Test with screen reader

**Expected Results:**
- [ ] Can tab to all interactive elements
- [ ] Textarea has focus indicator
- [ ] Submit button has focus indicator
- [ ] Can activate chips with Enter/Space
- [ ] Error messages are announced
- [ ] Loading state is announced ("Wird analysiert...")
- [ ] Character counter is accessible

---

## Summary Checklist

### Acceptance Criteria
- [ ] **AC1:** Max length enforced client-side + server-side (Tests 4, 12, 13)
- [ ] **AC2:** Single-turn interaction, no chat history (Tests 7-10)
- [ ] **AC3:** Non-emergency disclaimer visible (Test 14)
- [ ] **AC4:** Submit triggers triage API and shows routed result (Tests 6-9)

### Additional Verification
- [ ] Character counter works correctly (Tests 2-4)
- [ ] Suggested chips function (Test 5)
- [ ] Loading states work (Test 6)
- [ ] Success states work for all tiers (Tests 7-9)
- [ ] Reset flow works (Test 10)
- [ ] Error handling works (Test 11)
- [ ] Server validation works (Tests 12-13)
- [ ] Telemetry emits correctly (Test 15)
- [ ] Fallbacks work (Tests 16-17)
- [ ] Dark mode works (Test 18)
- [ ] Mobile responsive (Test 19)
- [ ] Accessible (Test 20)

## Automated Test Suite (Future)

Create Jest/Playwright tests for:
```typescript
describe('AMYComposer', () => {
  it('should disable submit when input is empty')
  it('should enable submit when input >= 10 chars')
  it('should show error when input > 800 chars')
  it('should show loading state during API call')
  it('should display triage result on success')
  it('should handle API errors gracefully')
  it('should reset form on reset button click')
})

describe('AMY Triage API', () => {
  it('should return 400 for missing concern')
  it('should return 400 for too short concern')
  it('should return 400 for too long concern')
  it('should return triage result for valid input')
  it('should use fallback when AMY is disabled')
  it('should emit telemetry events')
})
```

## Performance Benchmarks

Monitor in production:
- API latency: p50, p95, p99
- Fallback rate: % of requests using fallback
- Tier distribution: low/moderate/high/urgent %
- Error rate: % of failed requests

Target metrics:
- API latency p95 < 3s
- Fallback rate < 5%
- Error rate < 1%
