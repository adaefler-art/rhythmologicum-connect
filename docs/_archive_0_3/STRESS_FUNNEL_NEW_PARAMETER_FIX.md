# Stress Funnel Fix: ?new=true Parameter

**Issue:** Bug: Stress-Funnel zeigt direkt Ergebnis-Seite statt Fragenseite im aktuellen Deploy  
**Date:** 2025-12-09  
**Status:** ✅ Implemented  

---

## Problem Description

When users accessed the stress funnel at `/patient/stress-check` on mobile devices, they were immediately redirected to the result page if they had a previously completed assessment. This prevented users from starting a new assessment, causing them to see only their old results.

### Expected Behavior
- First-time users should see the questionnaire
- Users with completed assessments should be able to start a new assessment
- In-progress assessments should be resumed

### Actual Behavior (Before Fix)
- Users with completed assessments were always redirected to results
- No way to start a new assessment
- Particularly problematic on mobile where users couldn't work around the issue

---

## Root Cause

In `app/patient/stress-check/page.tsx`, the `bootstrapAssessment()` function checked for existing assessments and automatically redirected to the result page when finding a completed assessment:

```typescript
// OLD CODE (lines 102-108)
if (existingAssessments && existingAssessments.length > 0) {
  const latest = existingAssessments[0]
  if (latest.status === 'completed') {
    router.push(`/patient/stress-check/result?assessmentId=${latest.id}`)
    return
  }
  currentAssessmentId = latest.id
}
```

This logic didn't provide any way for users to explicitly request starting a new assessment.

---

## Solution

Added support for a `?new=true` URL parameter that allows users to bypass the redirect and always start a new assessment.

### Implementation Details

#### 1. Read URL Parameter
```typescript
const searchParams = useSearchParams()
const forceNew = searchParams.get('new') === 'true'
```

#### 2. Modified Redirect Logic
```typescript
// NEW CODE (lines 104-120)
let currentAssessmentId: string | null = null

// Handle existing assessments:
// - If completed AND !forceNew: redirect to result (show existing results)
// - If completed AND forceNew: create new assessment (start fresh)
// - If in_progress: resume existing assessment
if (existingAssessments && existingAssessments.length > 0) {
  const latest = existingAssessments[0]
  if (latest.status === 'completed' && !forceNew) {
    router.push(`/patient/stress-check/result?assessmentId=${latest.id}`)
    return
  }
  // Use existing in-progress assessment (but not completed ones when forceNew is true)
  if (latest.status === 'in_progress') {
    currentAssessmentId = latest.id
  }
}
```

#### 3. Updated Result Page Link
```typescript
// OLD: "Zurück zum Fragebogen"
onClick={() => router.push('/patient/stress-check')}

// NEW: "Neuen Fragebogen starten"
onClick={() => router.push('/patient/stress-check?new=true')}
```

---

## Behavior Matrix

| Scenario | URL | Existing Assessment | Behavior |
|----------|-----|---------------------|----------|
| First visit | `/patient/stress-check` | None | Create new assessment |
| With completed | `/patient/stress-check` | Completed | Redirect to result page |
| Force new | `/patient/stress-check?new=true` | Completed | Create new assessment |
| In progress | `/patient/stress-check` | In progress | Resume existing |
| In progress + new | `/patient/stress-check?new=true` | In progress | Resume existing (in-progress takes precedence) |

---

## Testing Guide

### Manual Test Cases

#### Test 1: First Time User
1. Log in as a user who has never completed an assessment
2. Navigate to `/patient/stress-check`
3. **Expected:** See questionnaire page with questions
4. **Verify:** No redirect to result page

#### Test 2: User with Completed Assessment (Default)
1. Complete an assessment (or use a user who has one)
2. Navigate to `/patient/stress-check`
3. **Expected:** Redirect to `/patient/stress-check/result?assessmentId=...`
4. **Verify:** See result page with scores and AMY text

#### Test 3: User with Completed Assessment (Force New)
1. Complete an assessment (or use a user who has one)
2. Navigate to `/patient/stress-check?new=true`
3. **Expected:** See questionnaire page (no redirect)
4. **Verify:** Questions are empty (new assessment started)
5. **Verify:** Old assessment still exists in database

#### Test 4: Result Page "Neuen Fragebogen starten" Button
1. Complete an assessment
2. Navigate to result page
3. Click "Neuen Fragebogen starten" button
4. **Expected:** Navigate to `/patient/stress-check?new=true`
5. **Verify:** See questionnaire page with empty questions

#### Test 5: In-Progress Assessment Resume
1. Start an assessment but don't complete it
2. Navigate away and return to `/patient/stress-check`
3. **Expected:** Resume at the current step with saved answers
4. **Verify:** Previously answered questions show selected values

#### Test 6: Mobile Specific Test
1. Use mobile device (iPhone with Safari recommended)
2. Complete an assessment
3. Navigate to `/patient/stress-check?new=true`
4. **Expected:** See questionnaire page (the main bug fix)
5. **Verify:** No redirect to result page on mobile

---

## Files Modified

### `/app/patient/stress-check/page.tsx`
- **Lines 1-4:** Added `useSearchParams` import
- **Lines 56:** Added `forceNew` parameter reading from URL
- **Lines 104-120:** Modified assessment handling logic with forceNew check
- **Line 241:** Added `forceNew` to useEffect dependency array

**Changes:** +13 lines, -6 lines

### `/app/patient/stress-check/result/StressResultClient.tsx`
- **Line 372:** Changed button link to include `?new=true`
- **Line 375:** Changed button text to "Neuen Fragebogen starten"

**Changes:** +2 lines, -2 lines

---

## Deployment Checklist

- [x] Code changes implemented
- [x] TypeScript compilation successful
- [x] ESLint checks passed (no new errors)
- [x] Code review completed
- [x] Security scan completed (0 vulnerabilities)
- [x] Manual testing guide created
- [ ] Manual testing on development environment
- [ ] Manual testing on mobile device (iOS Safari)
- [ ] Manual testing on desktop (Chrome, Firefox)
- [ ] Deployed to preview environment
- [ ] Smoke testing on preview
- [ ] Production deployment
- [ ] Post-deployment verification

---

## Rollback Plan

If issues are discovered after deployment:

1. **Quick Rollback:** Revert PR commits
2. **Database:** No database changes made, no migration needed
3. **Impact:** Users will return to old behavior (redirect to results)

---

## Future Improvements

1. **Consider Adding:**
   - Confirmation dialog before starting new assessment (to prevent accidental data loss)
   - "View previous results" link on questionnaire page
   - Archive/delete old assessments functionality
   - Better handling of multiple in-progress assessments

2. **Potential Enhancements:**
   - Add analytics to track how often users start new assessments
   - Add timestamp comparison to prevent rapid re-assessment
   - Consider allowing users to name/label their assessments

---

## Related Documentation

- **Implementation:** B6_FRONTEND_INTEGRATION.md (Assessment bootstrapping)
- **API Reference:** B5_FUNNEL_RUNTIME_BACKEND.md (Assessment creation API)
- **User Flow:** F3_PATIENT_JOURNEY_TESTING.md (Patient journey documentation)

---

## Notes

- This fix maintains backward compatibility - existing behavior is unchanged unless `?new=true` is explicitly in URL
- The parameter name `new` was chosen for clarity and brevity
- Mobile testing is critical as this was the primary use case for the bug report
- No database schema changes required
- No breaking changes to API contracts
