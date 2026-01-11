# Manual Test Plan — Patient Layout Consolidation

**Issue**: Patient-Routing & Layout-Konsolidierung — Legacy-Shell entfernen, neue Patient-Shell überall erzwingen  
**Date**: 2025-12-12  
**Testing Required**: Manual browser testing

---

## Overview

After code analysis, **no legacy layout or "small table" issue was found in the code**. However, the issue description specifically mentions these problems occurring at runtime. This test plan will verify the actual behavior in the browser.

---

## Pre-Test Setup

### Environment
- [ ] Development server running (`npm run dev`)
- [ ] Test accounts ready:
  - Patient account
  - Clinician account (if needed)
- [ ] Browser: Chrome/Firefox (latest)
- [ ] Browser window: Desktop size (1920x1080 or larger)
- [ ] Mobile testing: Chrome DevTools responsive mode or actual device

### Test URLs
- Base URL: `http://localhost:3000` (dev) or `https://rhythmologicum-connect.vercel.app` (production)

---

## Test Case 1: Funnel with skipIntro Parameter

### URL
```
GET /patient/funnel/stress-assessment?skipIntro=true
```

### Expected Behavior
✅ **Patient Shell Layout:**
- Desktop: Header with "Rhythmologicum Connect" branding and tabs (Assessments | Verlauf)
- Mobile: Bottom navigation tabs (📝 Assessments | 📊 Verlauf)
- Footer on desktop only

✅ **Content Width:**
- Content should be centered with reasonable width
- Desktop: `max-w-6xl` container (≈1152px max)
- NO narrow right column (NO ~360px constraint)
- NO large empty space on left

✅ **Assessment Flow:**
- Questions display in cards or mobile full-screen
- Progress indicator visible
- Navigation buttons (Weiter/Zurück) work

### Test Steps
1. Login as patient
2. Navigate to `/patient/funnel/stress-assessment?skipIntro=true`
3. **Verify:** Header shows "Rhythmologicum Connect" and tabs
4. **Verify:** Content is centered, not pushed to right
5. **Verify:** Content width is reasonable (not narrow ~360px)
6. **Measure:** Use browser DevTools to check actual width
7. Answer a few questions to verify flow works
8. **Check mobile:** Resize to <640px, verify bottom tabs

### Screenshots Required
- [ ] Desktop full page view
- [ ] Desktop with DevTools showing content width
- [ ] Mobile view with bottom tabs
- [ ] Question card/screen

### Issues to Report
- [ ] Layout different from expected? (describe)
- [ ] "Small table" issue present? (screenshot + measurements)
- [ ] Header/tabs missing or incorrect?
- [ ] Navigation broken?

---

## Test Case 2: Funnel Intro Page

### URL
```
GET /patient/funnel/stress-assessment/intro
```

### Expected Behavior
✅ **Same Patient Shell** as Test Case 1

✅ **MobileWelcomeScreen Component:**
- Welcome text and bullet points
- "Start" button to begin assessment
- Proper spacing and typography

✅ **Width:** 
- Uses appropriate max-width
- NOT narrow column on right

### Test Steps
1. Navigate to `/patient/funnel/stress-assessment/intro`
2. **Verify:** Same header/tabs as Test Case 1
3. **Verify:** Welcome screen renders properly
4. **Verify:** Content width is appropriate
5. Click "Start" button → should go to assessment
6. **Check mobile:** Verify responsive layout

### Screenshots Required
- [ ] Desktop intro page
- [ ] Mobile intro page

---

## Test Case 3: Patient History

### URL
```
GET /patient/history
```

### Expected Behavior
✅ **Same Patient Shell** as Test Cases 1-2

✅ **Content:**
- Page title: "Ihr Verlauf"
- Summary cards (3 columns on desktop, 1 column on mobile)
- Timeline of past assessments
- Export button (top right)
- "Neue Messung durchführen" button

✅ **Width:**
- Content container: `max-w-4xl` (≈896px)
- NOT narrow right column
- Cards display in responsive grid

✅ **Links:**
- "Neue Messung durchführen" should go to `/patient/assessment` (NOT `/patient/funnel/stress-assessment`)
- "Zum Fragebogen" buttons should go to `/patient/assessment`

### Test Steps
1. Navigate to `/patient/history`
2. **Verify:** Same header/tabs
3. **Verify:** Page layout matches expected
4. **Verify:** Cards render in grid (3 cols desktop, 1 col mobile)
5. **Click:** "Neue Messung durchführen" → verify goes to `/patient/assessment`
6. **Check mobile:** Verify responsive grid

### Screenshots Required
- [ ] Desktop history page with cards
- [ ] Mobile history page
- [ ] After clicking "Neue Messung" button (should show assessment selector)

---

## Test Case 4: Patient Root / Assessment Selector

### URL
```
GET /patient/
```

### Expected Behavior
✅ **Redirect:** Should redirect to `/patient/assessment`

✅ **Assessment Selector Page:**
- Same Patient Shell (header/tabs/footer)
- Title: "Wählen Sie Ihr Assessment"
- Grid of funnel cards
- Desktop: 3 columns, Mobile: 1 column
- Each card clickable

✅ **Width:**
- Container: `max-w-6xl`
- Cards properly sized
- NOT narrow column

### Test Steps
1. Navigate to `/patient/` (root)
2. **Verify:** Redirects to `/patient/assessment`
3. **Verify:** Funnel selector displays
4. **Verify:** Cards render in responsive grid
5. **Click:** Any funnel card → verify goes to intro or assessment
6. **Check mobile:** Verify mobile layout

### Screenshots Required
- [ ] Desktop assessment selector
- [ ] Mobile assessment selector

---

## Test Case 5: Login Flow

### Expected Behavior
✅ **Patient Login:**
- After successful login → redirect to `/patient/` (which redirects to `/patient/assessment`)
- Should NOT redirect to `/patient/funnel/stress-assessment` directly

✅ **Clinician Login:**
- If `CLINICIAN_DASHBOARD_ENABLED` → redirect to `/clinician/`
- Otherwise → redirect to `/patient/`

### Test Steps
1. Logout (if logged in)
2. Navigate to `/` (login page)
3. Login with patient credentials
4. **Verify:** Redirects to `/patient/assessment` (or `/patient/` first)
5. **Verify:** NOT redirected to specific funnel
6. Logout
7. Login with clinician credentials (if available)
8. **Verify:** Appropriate redirect based on feature flag

### Notes to Record
- [ ] Final URL after patient login
- [ ] Any unexpected redirects
- [ ] Feature flag status (`CLINICIAN_DASHBOARD_ENABLED`)

---

## Test Case 6: Mobile Specific Tests

### Device/Screen Sizes
- Mobile: 375px (iPhone SE)
- Mobile: 414px (iPhone 12/13)
- Tablet: 768px (iPad)
- Desktop: 1920px

### Tests for Each Size
1. **Bottom Tabs (Mobile only, <768px):**
   - [ ] Visible at bottom
   - [ ] Correct icons (📝 Assessments, 📊 Verlauf)
   - [ ] Active state works
   - [ ] Tappable with appropriate size

2. **Top Tabs (Desktop only, ≥768px):**
   - [ ] Visible in header
   - [ ] Active state correct
   - [ ] Clickable

3. **Question Screens:**
   - [ ] Mobile (<640px): Full-screen adaptive layout for single questions
   - [ ] Desktop: Card-based layout
   - [ ] Answer buttons appropriately sized

4. **Content Width:**
   - [ ] Mobile: Full width with padding
   - [ ] Desktop: Centered with max-width

### Screenshots Required
- [ ] Mobile 375px
- [ ] Mobile 414px
- [ ] Tablet 768px
- [ ] Desktop 1920px

---

## Test Case 7: "Small Table" Issue Investigation

### What to Look For

If the "small table" issue exists, you will see:
- Content appears in a narrow column (~360px wide)
- Large empty space on the left side
- Content is pushed to the right
- Looks like a two-column layout with empty left column

### How to Measure
1. Open browser DevTools (F12)
2. Inspect the main content area
3. Look for:
   - Fixed widths like `w-80`, `w-[360px]`, `max-w-sm`
   - Grid layouts like `grid-cols-[1fr_360px]`
   - Flex layouts with `ml-auto` or `justify-end`
4. Take measurements:
   - Content container width
   - Available viewport width
   - Any constraining parent elements

### If Issue is Found
- [ ] Take screenshot showing the issue
- [ ] Use DevTools to identify the constraining CSS
- [ ] Check computed styles for:
   - `width`, `max-width`, `min-width`
   - `grid-template-columns`
   - `flex` properties
   - `margin-left`, `margin-right`
- [ ] Identify the specific element causing the constraint
- [ ] Note the file/component that renders it

### Report Format
```
ISSUE FOUND: Small Table Layout

URL: [URL where issue occurs]
Screen Size: [e.g., Desktop 1920x1080]

Description:
Content is constrained to narrow column on right side.

Measurements:
- Viewport width: XXXpx
- Content container width: XXXpx (should be ~1152px, actual: XXXpx)
- Empty space on left: XXXpx

DevTools Inspection:
Element: [CSS selector]
Computed Width: XXXpx
Constraining CSS: [e.g., max-w-sm → max-width: 384px]
Source File: [component file path]

Screenshots: [attached]
```

---

## Test Case 8: Query Parameters

### skipIntro Parameter

**Test 8.1: With skipIntro**
```
GET /patient/funnel/stress-assessment?skipIntro=true
```
- [ ] Goes directly to assessment (skips intro)
- [ ] No redirect loop
- [ ] Same layout as without parameter

**Test 8.2: Without skipIntro**
```
GET /patient/funnel/stress-assessment
```
- [ ] Redirects to `/patient/funnel/stress-assessment/intro` (if intro exists)
- [ ] Shows intro page
- [ ] Clicking "Start" goes to assessment

**Test 8.3: Intro doesn't exist**
- [ ] Goes directly to assessment even without skipIntro
- [ ] No errors or redirect loops

---

## Test Case 9: Navigation Consistency

### Verify All Navigation Links

**Patient Layout Tabs (Desktop):**
- [ ] Click "Assessments" → goes to `/patient/assessment`
- [ ] Click "Verlauf" → goes to `/patient/history`
- [ ] Active state correctly reflects current page

**Patient Layout Tabs (Mobile):**
- [ ] Tap "📝 Assessments" → goes to `/patient/assessment`
- [ ] Tap "📊 Verlauf" → goes to `/patient/history`
- [ ] Active state correctly reflects current page

**History Page Buttons:**
- [ ] "Neue Messung durchführen" → goes to `/patient/assessment` ✅ (FIXED)
- [ ] "Zum Fragebogen" (error state) → goes to `/patient/assessment` ✅ (FIXED)
- [ ] "Zum Fragebogen" (empty state) → goes to `/patient/assessment` ✅ (FIXED)

**Assessment Flow:**
- [ ] Complete assessment → goes to result page
- [ ] From result page, "Zurück zur Übersicht" → goes to `/patient/` or `/patient/assessment`

---

## Test Case 10: Responsive Breakpoints

### Test Each Breakpoint

**sm (640px):**
- [ ] Layout transitions correctly
- [ ] Text sizes adjust
- [ ] No overflow

**md (768px):**
- [ ] Bottom tabs disappear
- [ ] Top tabs appear
- [ ] Footer appears
- [ ] Content adjusts

**lg (1024px):**
- [ ] Grid columns increase (if applicable)
- [ ] Max-width containers activate

**xl (1280px):**
- [ ] Content properly centered
- [ ] Max-width respected

---

## Results Summary Template

```markdown
## Test Results Summary

**Date:** YYYY-MM-DD  
**Tester:** [Name]  
**Environment:** Dev / Production  
**Browser:** Chrome/Firefox/Safari [Version]  

### Test Cases Passed ✅
- Test Case X: [Brief description]
- ...

### Test Cases Failed ❌
- Test Case X: [Brief description]
- Issue: [Description]
- Screenshots: [Links]
- ...

### Critical Issues Found 🚨
1. **Small Table Issue**
   - Status: FOUND / NOT FOUND
   - Details: [If found, provide measurements and screenshots]

2. **Layout Inconsistency**
   - Status: FOUND / NOT FOUND
   - Details: [Description]

3. **Navigation Issues**
   - Status: FOUND / NOT FOUND
   - Details: [Description]

### Overall Assessment
- [ ] All patient routes use consistent layout
- [ ] No "small table" issue present
- [ ] Navigation is consistent and correct
- [ ] Mobile and desktop layouts work properly
- [ ] Query parameters behave correctly

### Recommendations
- [Any suggested fixes or improvements]
```

---

## Notes for Tester

1. **Take screenshots liberally** - especially if something looks wrong
2. **Use browser DevTools** to measure actual widths
3. **Test on real mobile device** if possible (not just DevTools)
4. **Clear browser cache** before testing
5. **Test in incognito/private mode** to avoid cached CSS
6. **Check console for errors** - note any JavaScript errors
7. **Test with different content** - Some issues only appear with certain data

---

## Expected Outcome

Based on code analysis:
- ✅ All tests should PASS
- ✅ No "small table" issue should be found
- ✅ Layout should be consistent across all patient routes
- ✅ Navigation should work correctly with fixed hard-coded links

If any test fails, the issue is likely:
- Runtime CSS conflict
- Browser-specific rendering
- Dynamic class application
- External CSS affecting layout
- Caching issue

---

## Contact

If issues are found during testing, provide:
1. Screenshots with measurements
2. Browser/device information
3. DevTools inspection results
4. Console errors (if any)
5. Steps to reproduce
