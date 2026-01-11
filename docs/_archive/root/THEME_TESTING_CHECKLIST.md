# Theme System Testing Checklist (v0.4)

## Overview
This document provides a comprehensive testing checklist for the theme system improvements in v0.4.

## Changes Made

### 1. Theme Infrastructure
- ✅ Centralized ThemeContext with `light`/`dark` modes
- ✅ Theme persistence via localStorage
- ✅ System preference detection with `prefers-color-scheme`
- ✅ No-flicker script in root layout
- ✅ ThemeToggle component with smooth animations

### 2. Global Styling
- ✅ Removed conflicting `!important` CSS overrides from globals.css
- ✅ Updated form field styling to support theme switching
- ✅ Consistent dark mode color tokens

### 3. Layout Updates

#### Login Page (`/`)
- ✅ ThemeToggle in top-right corner
- ✅ All backgrounds, text, and form fields support dark mode
- ✅ Smooth transitions between themes

#### Clinician Layout (`/clinician/*`)
- ✅ ThemeToggle in DesktopLayout sidebar (desktop & mobile)
- ✅ All dashboard components support dark mode
- ✅ Consistent card, table, and badge styling

#### Patient Layout (`/patient/*`)
- ✅ ThemeToggle added to desktop header
- ✅ Updated navigation (desktop & mobile) for dark mode
- ✅ Consistent header, footer, and content styling

### 4. UI Component Updates
- ✅ Input: Full dark mode support
- ✅ Textarea: Full dark mode support
- ✅ Select: Full dark mode support
- ✅ Button: Already had dark mode (verified)
- ✅ Card: Already had dark mode (verified)
- ✅ Badge: Already had dark mode (verified)
- ✅ Table: Already had dark mode (verified)

### 5. Patient Page Components
- ✅ MobileHeader: Full dark mode support
- ✅ PatientNavigation: Full dark mode support
- ✅ Assessment selector: Updated gradients and text colors
- ✅ FollowUpActions: Updated gradients and card styling

## Testing Scenarios

### A. Theme Toggle Functionality

#### Test 1: Login Page Theme Toggle
1. Open `/` (login page)
2. Verify initial theme matches system preference
3. Click ThemeToggle button in top-right
4. Verify:
   - Background changes (light: slate-100, dark: slate-900)
   - Card backgrounds change (light: white, dark: slate-800)
   - Text colors adjust properly
   - Form inputs change (light: white bg, dark: slate-700 bg)
   - No visual glitches or flicker
5. Reload page
6. Verify theme persists (localStorage)

#### Test 2: Clinician Dashboard Theme Toggle
1. Login as clinician
2. Navigate to `/clinician`
3. Locate ThemeToggle in sidebar (desktop) or menu (mobile)
4. Click toggle
5. Verify:
   - Sidebar background changes
   - Dashboard background changes
   - KPI cards change properly
   - Table rows have proper contrast
   - All text remains readable
6. Navigate to sub-pages (e.g., `/clinician/funnels`)
7. Verify theme persists across navigation

#### Test 3: Patient Portal Theme Toggle
1. Login as patient
2. Navigate to `/patient`
3. Locate ThemeToggle in desktop header (or verify mobile behavior)
4. Click toggle
5. Verify:
   - Header/footer backgrounds change
   - Navigation active states visible
   - Content area changes properly
   - Mobile bottom tabs change properly
6. Navigate to `/patient/assessment`
7. Verify gradient background works in both themes
8. Check assessment cards and content

### B. System Preference Detection

#### Test 4: Initial Load with Dark System Preference
1. Set OS to dark mode
2. Clear localStorage for the site
3. Navigate to `/`
4. Verify app loads in dark mode
5. No localStorage value should exist yet

#### Test 5: Initial Load with Light System Preference
1. Set OS to light mode
2. Clear localStorage for the site
3. Navigate to `/`
4. Verify app loads in light mode

#### Test 6: Override System Preference
1. Set OS to dark mode
2. Open app (should be dark)
3. Click toggle to switch to light
4. Verify localStorage stores `"light"`
5. Change OS to light mode
6. Reload app
7. Verify app stays in light mode (localStorage takes precedence)

### C. Cross-Page Consistency

#### Test 7: Theme Persistence Across Navigation
1. Login and set theme to dark
2. Navigate through:
   - Login → Patient → Assessment → Back to Patient
   - Or: Login → Clinician → Dashboard → Reports → Back
3. Verify theme stays consistent throughout
4. No flicker or theme switching between pages

#### Test 8: Theme After Logout/Login
1. Login and set theme to light
2. Logout
3. Login again
4. Verify theme is still light
5. Repeat with dark theme

### D. Component-Specific Tests

#### Test 9: Form Components in Both Themes
1. Navigate to any page with forms (e.g., login, settings)
2. Switch between light and dark
3. Test each form component:
   - Input fields (text, email, password)
   - Textareas
   - Select dropdowns
   - Buttons (primary, secondary, ghost, etc.)
4. Verify:
   - Proper contrast and readability
   - Focus states visible
   - Error states visible
   - Placeholder text readable

#### Test 10: Patient Assessment Selector
1. Navigate to `/patient/assessment`
2. Switch theme
3. Verify:
   - Gradient background adjusts properly
   - Card backgrounds have contrast
   - Text is readable on all cards
   - Hover states work

#### Test 11: Clinician Dashboard
1. Navigate to `/clinician`
2. Switch theme
3. Verify:
   - KPI cards have proper backgrounds
   - Table is readable
   - Badge colors maintain contrast
   - Charts/graphs (if any) are visible

### E. Edge Cases & Accessibility

#### Test 12: Rapid Theme Switching
1. Click ThemeToggle rapidly 5-10 times
2. Verify:
   - No visual glitches
   - Theme stabilizes correctly
   - No console errors

#### Test 13: Color Contrast (WCAG AA)
1. Use browser DevTools or a contrast checker
2. In light mode, verify:
   - Body text has 4.5:1 contrast minimum
   - Large text has 3:1 contrast minimum
3. In dark mode, verify same ratios
4. Check specific cases:
   - Primary text on primary background
   - Muted text on background
   - Links on background
   - Button text on button background

#### Test 14: Keyboard Navigation
1. Use only Tab/Shift+Tab to navigate
2. Verify ThemeToggle is focusable
3. Press Enter or Space on ThemeToggle
4. Verify theme switches
5. Verify focus ring visible in both themes

### F. Mobile/Responsive Testing

#### Test 15: Mobile Theme Toggle (Clinician)
1. Resize browser to mobile width (<768px)
2. Open clinician sidebar menu
3. Verify ThemeToggle is visible and functional
4. Switch theme
5. Close menu
6. Verify theme persisted

#### Test 16: Mobile Patient Navigation
1. Resize to mobile width
2. Navigate to `/patient`
3. Verify bottom tabs render correctly in both themes
4. Switch theme (if toggle available on mobile)
5. Verify tabs remain visible and functional

### G. Browser Compatibility

#### Test 17: Cross-Browser Theme Support
Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers (Chrome Mobile, Safari Mobile)

For each:
1. Verify theme toggle works
2. Verify localStorage persistence
3. Verify no visual glitches
4. Check CSS transitions

## Definition of Done

All tests should pass with the following criteria:

### Visual Quality
- ✅ No color conflicts or "hybrid" states (e.g., dark shell + light card)
- ✅ Smooth transitions (no flicker)
- ✅ Text always readable (proper contrast)
- ✅ Gradients work in both themes

### Functional Requirements
- ✅ Toggle switches theme immediately
- ✅ Theme persists across page navigation
- ✅ Theme persists after logout/login
- ✅ System preference detected on first load
- ✅ User override takes precedence over system

### Technical Requirements
- ✅ No console errors
- ✅ localStorage used correctly
- ✅ No SSR/hydration mismatches
- ✅ Performance: No noticeable lag when switching

### Accessibility
- ✅ ThemeToggle keyboard accessible
- ✅ WCAG AA contrast ratios met
- ✅ Focus indicators visible in both themes
- ✅ Screen reader compatible (proper ARIA labels)

## Known Limitations

None currently identified.

## Rollback Plan

If critical issues are found:
1. Revert commits in reverse order:
   - 0d22163 (patient components)
   - 209f24c (UI components)
   - 1c61abe (globals.css)
   - 2b5a977 (patient layout)
2. Re-test on main branch
3. Document the issue
4. Create new fix with targeted approach

## Notes

- Theme toggle respects system changes only when no localStorage value exists
- Once user sets a preference, it overrides system until cleared
- Dark mode CSS uses Tailwind's `dark:` variant
- All design tokens are defined in `/app/globals.css` and `/lib/design-tokens.ts`
