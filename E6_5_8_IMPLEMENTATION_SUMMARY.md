# E6.5.8 Implementation Summary

**Issue**: E6.5.8 — Navigation Wiring: Dashboard ↔ Funnels ↔ Workup ↔ Escalation (Patient)

**Date**: 2026-01-16

**Status**: ✅ Complete

---

## Objective

Ensure seamless navigation between patient dashboard and all connected flows (funnels, workup/history, escalation) with:
- No broken links (no 404 errors)
- Resume always lands on correct step
- Back navigation returns to dashboard with updated state

---

## Problem Statement

The patient navigation flow had several issues:
1. `/patient/onboarding` route didn't exist, causing 404 errors when NextStep resolver pointed to it
2. Escalation page used `window.history.back()` which didn't guarantee return to dashboard
3. History page lacked explicit "back to dashboard" navigation
4. Need to verify dashboard state refreshes when navigated back to

---

## Solution Design

### 1. Create Missing Onboarding Route

Created `/patient/onboarding/page.tsx` that intelligently redirects based on onboarding status:
- Not authenticated → redirect to login
- Onboarding completed → redirect to dashboard
- Otherwise → redirect to `/patient/onboarding/consent` (first step)

This fixes the 404 error and ensures proper onboarding flow.

### 2. Update Escalation Back Navigation

Changed escalation page from:
```tsx
onClick={() => window.history.back()}
```

To:
```tsx
onClick={() => router.push('/patient/dashboard')}
```

This ensures users always return to dashboard, not just the previous page in browser history.

### 3. Add Dashboard Navigation to History Page

Added "Zurück zum Dashboard" button in three places:
- Top of main page view
- Error state
- Empty state

Changed button targets from `/patient/assessment` to `/patient/dashboard` for consistency.

---

## Implementation Details

### Files Modified

1. **app/patient/onboarding/page.tsx** (NEW)
   - Server component that handles `/patient/onboarding` route
   - Checks authentication and onboarding status
   - Redirects appropriately based on state

2. **app/patient/escalation/client.tsx**
   - Added `useRouter` import
   - Changed back button to use `router.push('/patient/dashboard')`
   - Updated button label

3. **app/patient/history/PatientHistoryClient.tsx**
   - Added back button at top of page
   - Updated error state button
   - Updated empty state button
   - All now navigate to `/patient/dashboard`

### Navigation Flow Verification

All 6 NextStep resolution rules verified:

| Rule | Trigger | Target Route | Status |
|------|---------|--------------|--------|
| 1. Onboarding | `onboarding_status !== 'completed'` | `/patient/onboarding` | ✅ |
| 2. Workup Follow-ups | `workupState === 'needs_more_data'` | `/patient/history` | ✅ |
| 3. Resume Funnel | `hasInProgressFunnel === true` | `/patient/funnel/${slug}` | ✅ |
| 4. Start Funnel | `hasStartedAnyFunnel === false` | `/patient/funnel/stress-assessment` | ✅ |
| 5. Escalation | `hasRedFlags === true` | `/patient/escalation` | ✅ |
| 6. View Content | Fallback | `/patient/funnels` | ✅ |

### Dashboard State Refresh

Dashboard properly refreshes state when navigated back to:
- **Server Side**: `export const dynamic = 'force-dynamic'` prevents caching
- **Client Side**: `useEffect(() => { loadDashboardData() }, [])` fetches fresh data on mount
- **Result**: Dashboard always displays current NextStep based on latest user state

---

## Testing

### Automated Tests

- ✅ Dashboard first policy tests: 19/19 passed
- ✅ Next step resolver tests: 32/32 passed
- ✅ Total: 51/51 tests passing

### Manual Verification

- ✅ All routes exist and are accessible
- ✅ No 404 errors when following NextStep CTAs
- ✅ Back navigation returns to dashboard
- ✅ Dashboard shows updated state after completing actions

---

## Acceptance Criteria

### AC1: No broken links (no 404 fetch inside page)

**Status**: ✅ PASS

- Fixed missing `/patient/onboarding` route
- Verified all NextStep targets route to valid pages:
  - `/patient/onboarding` → redirects to consent page
  - `/patient/history` → shows assessment history
  - `/patient/funnel/${slug}` → dynamic route exists
  - `/patient/funnel/stress-assessment` → handled by dynamic route
  - `/patient/escalation` → escalation placeholder
  - `/patient/funnels` → funnel catalog

### AC2: Resume always lands on correct step

**Status**: ✅ PASS

Funnel client already implemented correctly:
- Uses `/api/funnels/${slug}/assessments/${assessmentId}` endpoint
- API returns `AssessmentStatus` with `currentStep.stepId` and `currentStep.stepIndex`
- Client loads this status and renders the exact step from funnel definition
- No changes needed - verified existing implementation

### AC3: Back returns to dashboard with updated state

**Status**: ✅ PASS

- **Escalation page**: Changed to `router.push('/patient/dashboard')`
- **History page**: Added "Zurück zum Dashboard" buttons in all states
- **Result page**: Already has "Zum Dashboard" button
- **Dashboard refresh**: `force-dynamic` + `useEffect` ensures fresh data load

---

## Key Decisions

1. **Onboarding redirect logic**: Check onboarding status server-side to determine redirect target
   - Prevents unnecessary client-side redirects
   - Maintains server-first architecture

2. **Consistent dashboard navigation**: All pages now explicitly navigate to `/patient/dashboard`
   - More predictable than browser history navigation
   - Ensures dashboard-first policy compliance

3. **No changes to funnel resume logic**: Existing implementation already correct
   - AssessmentStatus API provides exact step information
   - Client correctly loads and renders current step

---

## Migration Notes

No breaking changes. All changes are additive or improvements to existing navigation:
- New route created (no existing functionality affected)
- Navigation targets updated (improves UX)
- No API changes
- No database changes

---

## Future Improvements

Potential enhancements for future iterations:

1. **Visual feedback on navigation**: Add loading states during navigation
2. **Navigation history tracking**: Log navigation events for analytics
3. **Deep linking support**: Allow direct links to specific funnel steps (with proper guards)
4. **Mobile back button consistency**: Consider using MobileHeader everywhere

---

## Conclusion

All acceptance criteria met:
- ✅ No broken links (fixed /patient/onboarding route)
- ✅ Resume lands on correct step (verified existing implementation)
- ✅ Back navigation returns to dashboard with updated state (improved navigation consistency)

The patient navigation flow is now complete and robust, with proper route guards and consistent back navigation to the dashboard.
