# Navigation Semantics (I2.5)

**Last Updated:** 2026-01-26  
**Version:** 1.0  
**Related Issue:** I2.5 - Navigation Consistency: TopBar/BottomNav, Back/Close Semantik, No Redirect Surprises

---

## Overview

This document defines canonical navigation rules for the patient mobile UI to prevent redirect loops and ensure deterministic navigation behavior. All navigation targets are explicit, and browser history fallbacks (`router.back()`) are not used.

## Design Principles

1. **Deterministic Navigation**: Every back/close action has a defined, canonical target
2. **No History Fallbacks**: Never use `router.back()` - always navigate to explicit routes
3. **Screen-Type Semantics**: Each screen type has consistent navigation behavior
4. **Dialog Isolation**: Dialog screens always return to non-dialog screens

## Canonical Routes

All patient routes use these canonical paths (single source of truth):

```typescript
CANONICAL_ROUTES = {
  DASHBOARD: '/patient/dashboard',       // Main hub/home screen
  ASSESS: '/patient/assess',             // Assessment selection/list
  ASSESSMENTS_V2: '/patient/assessments-v2', // Legacy assessments list
  DIALOG: '/patient/dialog',             // Dialog/chat with AMY
  PROFILE: '/patient/profile',           // User profile and settings
  RESULTS: '/patient/results-v2',        // Results overview
}
```

## Navigation Semantics by Screen Type

### Dashboard
- **Screen Type:** `dashboard`
- **Back:** Not applicable (it's the root)
- **Close:** Not applicable
- **Notes:** Dashboard is the main hub; most screens return here

### Tab Screens (Assess, Dialog, Profile)
- **Screen Type:** `tab`
- **Back:** → Dashboard
- **Close:** Not applicable (tabs use bottom nav)
- **Notes:** Top-level sections accessible via bottom navigation

### Assessment Flow
- **Screen Type:** `assessment-flow`
- **Back:** Handled within flow (previous question) or → Assess list on first question
- **Close:** → `/patient/assess` (deterministic exit to assessments list)
- **Notes:** 
  - Close always exits the entire flow
  - Demo mode exits to `/patient/assessments-v2`
  - Live mode exits to `/patient/assess`

### Result Screens
- **Screen Type:** `result`
- **Back:** → Dashboard
- **Close:** → Dashboard
- **Notes:** Results are typically viewed after completing an assessment

### Dialog/Chat
- **Screen Type:** `dialog`
- **Back:** → Dashboard (last non-dialog screen fallback)
- **Close:** → Dashboard
- **Notes:** Dialog can be entered from multiple contexts but always exits to dashboard

### Content Pages
- **Screen Type:** `content`
- **Back:** → Dashboard
- **Close:** → Dashboard
- **Notes:** Dynamic content detail pages

## TopBar Variants

The TopBar component supports three variants, each with specific navigation behavior:

### Variant A: Tab Screens
**Used on:** Dashboard, Assess, Dialog, Profile

**UI Elements:**
- Left: Burger menu (opens sidebar)
- Center: Screen title
- Right: Bell icon (notifications) + optional avatar

**Navigation:**
- No back/close buttons
- Navigation via bottom nav or sidebar

### Variant B: Assessment Flow
**Used on:** Active funnel/assessment flows

**UI Elements:**
- Left: Back button
- Center: Progress/title
- Right: Close button (X)

**Navigation:**
- **Back:** Previous question (handled by component) OR fallback to `/patient/assess`
- **Close:** Exit to `/patient/assess` (deterministic)

### Variant C: Results
**Used on:** Assessment result pages

**UI Elements:**
- Left: Back button
- Center: Result title
- Right: Optional overflow menu

**Navigation:**
- **Back:** → Dashboard (deterministic)
- **Close:** Not applicable (or could be added to return to dashboard)

## Implementation

### Navigation Utilities Module

Location: `apps/rhythm-patient-ui/app/patient/utils/navigation.ts`

**Key Functions:**
- `getBackRoute(screenType)` - Returns canonical back route for a screen type
- `getCloseRoute(screenType)` - Returns canonical close route for a screen type
- `getAssessmentFlowExitRoute(mode)` - Returns exit route based on demo/live mode
- `getDialogUrl(context)` - Generates dialog URL with context params
- `getNearestCanonicalRoute(path)` - Resolves any path to nearest canonical route

### Component Integration

**TopBarV2 Component**
```typescript
// Import canonical routes
import { CANONICAL_ROUTES } from '../utils/navigation'

// Deterministic back handler
const handleBack = () => {
  if (onBackClick) {
    onBackClick() // Custom handler takes precedence
  } else {
    const fallbackRoute = variant === 'flow' 
      ? CANONICAL_ROUTES.ASSESS 
      : CANONICAL_ROUTES.DASHBOARD
    router.push(fallbackRoute) // NO router.back()
  }
}

// Deterministic close handler
const handleClose = () => {
  if (onCloseClick) {
    onCloseClick() // Custom handler takes precedence
  } else {
    const closeRoute = variant === 'flow' 
      ? CANONICAL_ROUTES.ASSESS 
      : CANONICAL_ROUTES.DASHBOARD
    router.push(closeRoute) // Always canonical
  }
}
```

**MobileShellV2 Component**
```typescript
// Provides navigation callbacks based on current route
const handleBackClick = () => {
  if (pathname?.includes('/dialog')) {
    router.push(CANONICAL_ROUTES.DASHBOARD)
  } else if (variant === 'result') {
    router.push(CANONICAL_ROUTES.DASHBOARD)
  }
  // Otherwise use TopBarV2's default behavior
}

const handleCloseClick = () => {
  if (variant === 'flow') {
    router.push(CANONICAL_ROUTES.ASSESS)
  } else {
    router.push(CANONICAL_ROUTES.DASHBOARD)
  }
}
```

## Testing Checklist

To verify navigation consistency, test these scenarios:

### Assessment Flow
- [ ] Start assessment → Close (X) → Should land on `/patient/assess`
- [ ] Start assessment → Answer questions → Complete → Should land on `/patient/assess` (or results)
- [ ] Start assessment (demo mode) → Close → Should land on `/patient/assessments-v2`
- [ ] First question → Back → Should go to `/patient/assess`
- [ ] Mid-flow → Back → Should go to previous question
- [ ] Reload mid-flow → Back/Close still work correctly

### Dialog
- [ ] Dashboard → Dialog → Back → Should land on `/patient/dashboard`
- [ ] Results → Dialog → Back → Should land on `/patient/dashboard`
- [ ] Dialog → Reload → Back → Should land on `/patient/dashboard`
- [ ] Dialog → "Zurück zum Dashboard" link → Should land on `/patient/dashboard`

### Results
- [ ] View results → Back → Should land on `/patient/dashboard`
- [ ] Results → Reload → Back → Should land on `/patient/dashboard`

### General
- [ ] No navigation creates redirect loops
- [ ] Back/Close always lead to the same destination (deterministic)
- [ ] Reloading any screen doesn't break navigation

## Migration Notes

### Changes from Previous Implementation

**Before:**
- TopBarV2 used `router.back()` as fallback
- No centralized route definitions
- Inconsistent exit routes for assessment flows
- Dialog back behavior undefined

**After:**
- All navigation uses explicit canonical routes
- Centralized route constants in `navigation.ts`
- Deterministic exit routes for all screen types
- Dialog always returns to dashboard

### Breaking Changes
None. The changes are backward compatible as they only affect internal navigation logic.

## Future Considerations

1. **History Stack Management**: Consider implementing a custom navigation stack if more complex navigation patterns emerge
2. **Deep Linking**: Ensure deep links resolve to canonical routes
3. **Navigation Analytics**: Track navigation patterns to identify user confusion
4. **Accessibility**: Ensure back/close actions are clearly announced to screen readers

## References

- **Issue:** [I2.5] Navigation Consistency: TopBar/BottomNav, Back/Close Semantik, No Redirect Surprises
- **Implementation PR:** [Link to PR]
- **Related Components:**
  - `apps/rhythm-patient-ui/app/patient/components/TopBarV2.tsx`
  - `apps/rhythm-patient-ui/app/patient/components/MobileShellV2.tsx`
  - `apps/rhythm-patient-ui/app/patient/utils/navigation.ts`
