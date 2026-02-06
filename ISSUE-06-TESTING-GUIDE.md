# Issue 06 Testing Guide

## Prerequisites
- Local development environment with Supabase configured
- At least one test patient with name data in `patient_profiles`
- At least one test patient with completed assessments

## Test Scenarios

### Test 1: Patient Name Display

#### Scenario 1.1: Patient with full_name
1. Navigate to `/clinician/patient/{id}` where patient has `full_name` populated
2. **Expected**: Header shows full name (e.g., "Patient:in Andreas Aefler")
3. **Expected**: No console warnings about "Using fallback display name"

#### Scenario 1.2: Patient with first_name and last_name
1. Navigate to `/clinician/patient/{id}` where patient has `first_name` and `last_name` but NOT `full_name`
2. **Expected**: Header shows combined name (e.g., "Patient:in Andreas Aefler")
3. **Expected**: No console warnings

#### Scenario 1.3: Patient with no name data
1. Navigate to `/clinician/patient/{id}` where patient has NULL for all name fields
2. **Expected**: Header shows "Patient:in {first 8 chars of ID}"
3. **Expected**: Console warning appears (this is correct fallback behavior)

---

### Test 2: Overview Status Logic

#### Scenario 2.1: Patient with no assessments
1. Navigate to `/clinician/patient/{id}` where patient has:
   - 0 items in `patient_measures`
   - 0 items in `assessments`
2. Click on "Overview" tab
3. **Expected**: Shows empty state with 🌿 icon
4. **Expected**: Text reads "Noch keine Assessments vorhanden"
5. **Expected**: NO "Letztes Assessment" card visible

#### Scenario 2.2: Patient with assessments but no measures
1. Navigate to `/clinician/patient/{id}` where patient has:
   - 0 items in `patient_measures` (legacy)
   - 1+ items in `assessments`
2. Click on "Overview" tab
3. **Expected**: Shows summary stats
4. **Expected**: "Total Assessments" shows correct count (e.g., "1" or "2")
5. **Expected**: "Latest Stress Score" shows "—" (no data)
6. **Expected**: "Latest Sleep Score" shows "—" (no data)
7. **Expected**: "Letztes Assessment" card is visible and shows the most recent assessment

#### Scenario 2.3: Patient with both assessments and measures
1. Navigate to `/clinician/patient/{id}` where patient has both sources
2. Click on "Overview" tab
3. **Expected**: "Total Assessments" shows sum of both (e.g., 3 measures + 2 assessments = 5 total)
4. **Expected**: "Latest Stress Score" shows actual value from latest measure
5. **Expected**: "Latest Sleep Score" shows actual value from latest measure

---

### Test 3: Last Assessment Clickability

#### Setup
1. Navigate to `/clinician/patient/{id}` with at least one assessment
2. Ensure you're on the "Overview" tab
3. Locate the "Letztes Assessment" card

#### Test Steps
1. **Hover over the card**
   - **Expected**: Cursor changes to pointer
   - **Expected**: Card shows subtle hover effect (if interactive prop is working)
   - **Expected**: "Details →" text is visible

2. **Click anywhere on the card**
   - **Expected**: Navigates to assessment details view
   - **Expected**: Shows detailed assessment information
   - **Expected**: Shows "Zurück" or close button to return to overview

3. **Keyboard navigation** (accessibility check)
   - **Expected**: Card is focusable via Tab key
   - **Expected**: Pressing Enter or Space opens assessment details

---

### Test 4: Tab Hover in Dark Mode

#### Setup
1. Ensure system/browser is in dark mode (or toggle via app if available)
2. Navigate to `/clinician/patient/{id}`

#### Test Steps
1. **Hover over inactive tabs** (e.g., "Assessments", "Anamnese")
   - **Expected**: Text color changes to light (slate-50, #f8fafc)
   - **Expected**: Text remains easily readable against dark background
   - **Expected**: Border appears beneath tab on hover

2. **Check active tab** (e.g., "Overview")
   - **Expected**: Text is sky-400 (#38bdf8)
   - **Expected**: Bottom border is sky-400
   - **Expected**: Clearly distinguishable from inactive tabs

3. **Visual consistency check**
   - **Expected**: Tab borders (bottom line) are visible in dark mode
   - **Expected**: Tab list bottom border is slate-700 (#334155)

4. **Light mode verification** (switch to light mode)
   - **Expected**: Hover still works (text should darken to slate-900)
   - **Expected**: No visual regressions

---

## Console Checks

### Expected Console Logs
For each patient page load, you should see:
```
[PatientDetailPage] Patient profile loaded: {
  patientId: "bb0a3049...",
  hasFullName: true/false,
  hasFirstName: true/false,
  hasLastName: true/false
}
```

### Expected Warnings (Only for Fallback Cases)
If a patient truly has no name data:
```
[PatientOverviewHeader] Using fallback display name: {
  patientId: "bb0a3049...",
  hasFullName: false,
  hasFirstName: false,
  hasLastName: false
}
```

### No Warnings Expected
For patients with ANY name data (full_name OR first_name/last_name), there should be NO warnings.

---

## Regression Checks

### Areas to Verify (No Changes Expected)
1. **Assessments Tab**: Should work exactly as before
2. **Anamnese Tab**: Should work exactly as before
3. **Diagnosis Tab**: Should work exactly as before
4. **AMY Insights Tab**: Should work exactly as before
5. **Actions Tab**: Should work exactly as before
6. **Patient Header Info**: Birth year, sex, status badges should all display correctly
7. **Other tabs' hover behavior**: Should not be affected

### Data Integrity
- **No data modifications**: These changes are UI-only
- **No RLS changes**: Access policies unchanged
- **No database changes**: No migrations included

---

## Performance Checks

### Database Queries
1. Open browser DevTools → Network tab
2. Filter for Supabase API calls
3. Find the `patient_profiles` query
4. **Expected**: Query explicitly selects fields (not `SELECT *`)
5. **Expected**: Only one query per page load (no duplicate fetches)

### Rendering Performance
1. Navigate between tabs multiple times
2. **Expected**: Smooth transitions, no lag
3. **Expected**: No unnecessary re-renders in console

---

## Acceptance Criteria Checklist

- [ ] Patient name displays when `full_name` exists
- [ ] Patient name displays when `first_name`+`last_name` exist
- [ ] ID fallback only when no name data exists
- [ ] No console warnings for patients with name data
- [ ] Overview empty state only shows when truly no assessments
- [ ] Overview empty state does NOT show latestAssessment card
- [ ] Total Assessments count is accurate (sum of both sources)
- [ ] "Letztes Assessment" card is clickable
- [ ] Clicking card opens assessment details
- [ ] "Details →" indicator is visible
- [ ] Tab hover in dark mode uses light colors
- [ ] Tab hover in light mode works correctly
- [ ] All existing functionality unchanged

---

## Screenshots to Capture

For PR documentation, capture:
1. **Patient header** with name displayed (not ID)
2. **Overview empty state** (if available)
3. **Overview with assessments** showing clickable card
4. **Tab hover in dark mode** (before/after comparison if possible)
5. **Assessment details view** (after clicking card)

---

## Common Issues & Troubleshooting

### Issue: Still seeing ID instead of name
- **Check**: Does patient actually have name data in database?
- **Fix**: Run SQL query to verify: `SELECT id, full_name, first_name, last_name FROM patient_profiles WHERE id = '{patient_id}'`

### Issue: Empty state shows even with assessments
- **Check**: Are assessments in `assessments` table or `patient_measures`?
- **Check**: Console logs for the arrays
- **Fix**: Ensure patient has data in correct tables

### Issue: Card not clickable
- **Check**: Browser console for JavaScript errors
- **Check**: Ensure `interactive` prop is being passed to Card component
- **Fix**: Clear browser cache and reload

### Issue: Dark mode not working
- **Check**: Is dark mode actually enabled?
- **Check**: Inspect element to verify classes include `dark:` variants
- **Fix**: Ensure TailwindCSS dark mode is configured in project

---

## Rollback Plan

If issues arise:
1. Revert commit `b78d9e9` (main fix)
2. Previous behavior will be restored:
   - `SELECT *` query
   - Empty state shows on measures.length === 0
   - Last assessment card not clickable
   - Tab hover uses slate-900 (dark color)

No database rollback needed (no schema changes).
