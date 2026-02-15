# Issue 8 Testing Guide

## Automated Testing

### Signal Transformation Tests

**Location:** `apps/rhythm-studio-ui/lib/utils/__tests__/signalTransform.test.ts`

**Run tests:**
```bash
npm test -- signalTransform.test.ts
```

**Coverage:**
- ✅ Clinician signal transformation
- ✅ Patient hint transformation
- ✅ Patient signal validation (forbidden terms, scores, percentages)
- ✅ Red flag message generation
- ✅ Max bullets validation

### Validation Script

**Location:** `scripts/validate-signals.mjs`

**Run validation:**
```bash
node scripts/validate-signals.mjs
```

**Exit codes:**
- `0` - All checks passed
- `1` - One or more violations found

**Checks:**
- R-08.1: No forbidden terms in patient view
- R-08.2: Clinician view shows all signal data
- R-08.3: Patient view collapsed with max 5 bullets
- R-08.4: No scores/percentages in patient view
- R-08.5: Signals separated from consult notes

---

## Manual Testing

### Clinician View Testing

#### Prerequisites
1. Have a patient with completed assessments
2. Assessment should have `reports` with `safety_score`, `safety_findings`, `risk_level`
3. Assessment should have `calculated_results` with `risk_models`

#### Test Steps

1. **Navigate to patient detail page:**
   ```
   https://your-domain.com/clinician/patient/[patient-id]
   ```

2. **Verify Signals section is visible:**
   - Section header: "Signals"
   - Blue automation notice: "Automatisch generierte medizinische Hinweisinformation (nicht ärztlich validiert)"
   - Generation timestamp displayed
   - Algorithm version displayed (if available)

3. **Verify Risk Level display:**
   - Risk level badge shows color (red for high, yellow for moderate, green for low)
   - Risk score displayed as number out of 100
   - Badge text matches risk level (Hoch/Moderat/Niedrig)

4. **Verify Signal Codes:**
   - Technical codes displayed in monospace font
   - Codes wrapped with light border
   - Multiple codes displayed as chips/badges

5. **Verify Red Flags (if present):**
   - Red-themed section visible
   - Each flag shows code
   - Severity badge displayed
   - Description shown (if available)

6. **Verify Priority Ranking (if present):**
   - Tier displayed (if set)
   - Rank displayed (if set)
   - Intervention count displayed

#### Expected Results
- ✅ All signal data visible
- ✅ "Automatically generated" label present
- ✅ No data hidden or obscured
- ✅ Timestamp and version info shown
- ✅ Technical terminology preserved

---

### Patient View Testing

#### Prerequisites
1. Have a completed assessment
2. Navigate to results page

#### Test Steps

1. **Navigate to results page:**
   ```
   https://your-domain.com/patient/results-v2?assessmentId=[id]&funnel=[slug]
   ```

2. **Verify Signals section initial state:**
   - Section header: "Automatische Hinweise (ärztlich zu prüfen)"
   - Section is **collapsed** by default (content not visible)
   - Chevron icon pointing down

3. **Expand Signals section:**
   - Click on section header
   - Chevron rotates to point up
   - Content becomes visible

4. **Verify content (when expanded):**
   - Red flag status message (either "keine Warnhinweise" or "sollten geprüft werden")
   - Risk area hints (1-3 bullets)
   - Recommended next steps (up to 2 bullets)
   - Disclaimer text at bottom (italic, small font)

5. **Count total bullets:**
   - 1 red flag message
   - + N risk area hints (max 3)
   - + M next steps (max 2)
   - **Total must be ≤ 5**

6. **Scan for forbidden content:**
   - ❌ No numeric scores (e.g., "45", "Score: 75")
   - ❌ No percentages (e.g., "50%", "75 Prozent")
   - ❌ No signal codes (e.g., "critical_findings_count")
   - ❌ No diagnostic terms ("Diagnose", "Erkrankung festgestellt", "Krankheit")
   - ❌ No technical terms ("Tier", "Ranking", "Algorithmus")
   - ❌ No directive/final language ("kritisches Risiko", "sofortige Behandlung")

7. **Verify language is assistive:**
   - Uses tentative language ("könnte", "möglicherweise")
   - Uses recommendations, not directives ("empfohlen", not "erforderlich")
   - Emphasizes medical review ("ärztlich zu prüfen")

#### Expected Results
- ✅ Section collapsed by default
- ✅ Max 5 bullet points
- ✅ No forbidden terms present
- ✅ No numeric scores or percentages
- ✅ Language is non-diagnostic and tentative
- ✅ Disclaimer visible

---

### Integration Testing

#### Separation from Consult Notes

1. **In Clinician view:**
   - Verify Signals section and Diagnosis/Consult Note sections are visually separate
   - Different styling/layout
   - Clear section headers
   - Signals section does NOT appear inside consult note section

2. **Visual separation indicators:**
   - Different background colors or borders
   - Separate Card components
   - Vertical spacing between sections

#### Data Flow

1. **Verify data sources:**
   - Clinician signals use data from `/api/clinician/patient/[id]/results`
   - Patient hints use data from assessment result endpoint
   - No data mixing between clinician and patient views

2. **Test with different risk levels:**
   - Low risk assessment → Patient hints should be minimal
   - High risk assessment → Patient hints should include next steps
   - No risk data → Patient section should not appear

---

## Edge Cases

### No Signal Data

**Test:**
- Assessment with no `safety_findings`, `risk_models`, or `red_flags`

**Expected:**
- Clinician: "Keine Signals verfügbar" message
- Patient: Section does not render (returns `null`)

### Empty Safety Findings

**Test:**
- Assessment with `safety_findings: {}`

**Expected:**
- Clinician: Shows section but signal codes list is empty
- Patient: Minimal hints based only on risk level

### Missing Risk Level

**Test:**
- Assessment with `risk_level: null`

**Expected:**
- Clinician: Risk Level section does not render, other data still shown
- Patient: Generic hints without risk-specific language

### Maximum Bullets Edge

**Test:**
- Create scenario that would generate >5 bullets

**Expected:**
- Patient hints limited to max 5 (enforced by `validateMaxBullets`)
- Validation script catches violations if limit exceeded

---

## Regression Testing

After any changes to signal display logic, re-run:

1. **Unit tests:**
   ```bash
   npm test -- signalTransform.test.ts
   ```

2. **Validation script:**
   ```bash
   node scripts/validate-signals.mjs
   ```

3. **Manual spot-checks:**
   - Clinician view: Check all fields visible
   - Patient view: Check collapsed state and bullet count
   - Both views: Check no console errors

---

## Browser Testing

Test in multiple browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

**Focus areas:**
- Collapsible behavior (mobile touch targets)
- Text wrapping (long German words)
- Icon rendering (Lucide icons)

---

## Accessibility Testing

1. **Keyboard navigation:**
   - Tab to signals section header
   - Press Enter/Space to expand/collapse

2. **Screen reader:**
   - Section announces as collapsible
   - Expanded state announced
   - Bullet list structure preserved

3. **Color contrast:**
   - Text meets WCAG AA standards
   - Red flag colors accessible
   - Badge colors have sufficient contrast

---

## Performance Testing

1. **Large signal datasets:**
   - 10+ signal codes
   - 5+ red flags
   - Verify no rendering lag

2. **Rapid expand/collapse:**
   - Click header rapidly
   - Verify smooth animation
   - No memory leaks

---

## Security Testing

1. **XSS Prevention:**
   - Try injecting `<script>` in signal data
   - Verify React escapes HTML
   - No code execution

2. **Data Leakage:**
   - Verify patient view cannot access clinician-only data
   - Check DevTools Network tab for unauthorized API calls
   - Verify RLS policies enforced

---

## Debugging

### Enable Development Logging

**Patient view:**
- Check for "Bullets: X/5 max" debug info (only in development)

**Clinician view:**
- Check browser console for signal transformation logs

### Common Issues

**Signals section not appearing:**
- Check data availability in parent component state
- Verify API endpoints returning data
- Check RLS policies allow data access

**Forbidden terms appearing:**
- Run validation script: `node scripts/validate-signals.mjs`
- Check transformation logic in `transformToPatientHints()`
- Verify templates in `PATIENT_HINT_TEMPLATES`

**Collapsed state not working:**
- Check React useState initialization
- Verify button onClick handler
- Check CSS for display: none when collapsed

---

## Test Data Setup

### Create Test Patient with Signals

```sql
-- Insert test assessment with signal data
INSERT INTO assessments (id, patient_id, status)
VALUES ('test-assessment-001', 'test-patient-001', 'completed');

-- Insert report with safety findings
INSERT INTO reports (id, assessment_id, risk_level, safety_score, safety_findings)
VALUES (
  'test-report-001',
  'test-assessment-001',
  'high',
  45,
  '{"critical_findings_count": 2, "high_findings_count": 3}'::jsonb
);

-- Insert calculated results with risk models
INSERT INTO calculated_results (id, assessment_id, algorithm_version, scores, risk_models)
VALUES (
  'test-calc-001',
  'test-assessment-001',
  '1.0',
  '{"stress_score": 75}'::jsonb,
  '{"cardiovascular": "elevated", "metabolic": "normal"}'::jsonb
);
```

---

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Run Signal Validation
  run: node scripts/validate-signals.mjs

- name: Run Signal Tests
  run: npm test -- signalTransform.test.ts
```

**Exit behavior:**
- Workflow fails if validation script returns exit code 1
- Workflow fails if any unit tests fail

---

## Reporting Issues

When reporting signal-related bugs, include:

1. **User role:** Clinician or Patient
2. **View:** Which page/component
3. **Expected vs Actual:** What should happen vs what happened
4. **Screenshot:** Visual evidence
5. **Data sample:** Sanitized example of signal data (no PHI)
6. **Validation output:** Run `node scripts/validate-signals.mjs` and include output
