# EPIC E71 - Mobile UI v2 + Studio Workbench v0.7 Smoke Tests

**Epic:** E71 — Mobile UI v2 + Studio Workbench Cleanup (v0.7)  
**Purpose:** Verify all flows work end-to-end without crashes or loops  
**Audience:** QA engineers, operations team, third-party testers

---

## Quick Start

### Prerequisites

1. **Environment Running**
   ```bash
   # Install dependencies (first time only)
   npm install
   
   # Start development server
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

2. **Test Accounts**
   
   **Patient Account:**
   - Email: patient@test.local
   - Password: (your test password)
   - Role: `patient`
   - Must have completed onboarding (consent + profile)
   
   **Clinician Account:**
   - Email: clinician@test.local
   - Password: (your test password)
   - Role: `clinician`
   
   **Admin Account:**
   - Email: admin@test.local
   - Password: (your test password)
   - Role: `admin`

3. **Browser Requirements**
   - Modern browser (Chrome, Firefox, Safari, Edge)
   - JavaScript enabled
   - Cookies enabled
   - Developer Tools accessible (F12)

---

## Epic Gate Criteria (Pass/Fail)

**PASS only when ALL criteria are met:**

1. ✅ **No Redirect/Reload Loops** (Patient + Studio)
2. ✅ **No RSC Hard Crashes** (all central pages)
3. ✅ **All Screens Accessible** (5 reference screens reachable)
4. ✅ **Studio Navigation Config Works** (persists + applies after reload)
5. ✅ **Smoke Doc Executable** (by third parties without repo knowledge)

---

## Test Suite 1: Patient Flow (Mobile v2)

### 1.1 Login → Dashboard

**Objective:** Verify patient can login and land on dashboard without loops

**Steps:**
1. Open browser to `http://localhost:3000`
2. Enter patient credentials
3. Click "Einloggen"
4. Observe redirect behavior

**Expected Outcome:**
- ✅ Redirects to `/patient/dashboard` (or mobile route)
- ✅ Dashboard loads without errors
- ✅ No redirect loops (check browser back button works normally)
- ✅ No console errors in DevTools
- ✅ Theme is **light-only** (no dark mode toggle visible)

**Failure Signs:**
- ❌ Infinite redirect loop between `/` and `/patient`
- ❌ "Too many redirects" error
- ❌ White screen / crash
- ❌ Console shows RSC errors

---

### 1.2 Dashboard → Start Assessment

**Objective:** Verify patient can access assessment flow

**Steps:**
1. From dashboard, locate "Assessment starten" or "Neue Beurteilung" button
2. Click the button
3. Observe navigation

**Expected Outcome:**
- ✅ Navigates to assessment intro page (e.g., `/patient/funnel/stress`)
- ✅ Intro page loads without errors
- ✅ "Start" or "Weiter" button is visible
- ✅ No redirect loops
- ✅ Light theme persists

**Failure Signs:**
- ❌ 404 error
- ❌ Redirect loop
- ❌ Blank page
- ❌ RSC crash error

---

### 1.3 Assessment Flow → Complete

**Objective:** Verify patient can complete an assessment flow

**Steps:**
1. From assessment intro, click "Weiter" or "Start"
2. Answer questions on each step
3. Click "Weiter" through all steps
4. Reach final step and submit

**Expected Outcome:**
- ✅ Each step loads without errors
- ✅ Progress indicator shows current position
- ✅ "Zurück" button works (can go back)
- ✅ "Weiter" button advances to next step
- ✅ Final step submits successfully
- ✅ Redirects to results or dashboard
- ✅ No crashes during flow

**Failure Signs:**
- ❌ Steps don't advance
- ❌ Back button causes crash
- ❌ Submit fails silently
- ❌ RSC crash on step transition
- ❌ Loop between steps

---

### 1.4 Results → View

**Objective:** Verify patient can view assessment results

**Steps:**
1. After completing assessment, view results page
2. Navigate to `/patient/results-v2` or `/patient/insights-v2`
3. Check for insights/reports

**Expected Outcome:**
- ✅ Results page loads
- ✅ Assessment data visible (charts, scores, insights)
- ✅ No errors loading data
- ✅ Light theme consistent

**Failure Signs:**
- ❌ Results page blank
- ❌ Data fetch errors
- ❌ 404 on results route

---

### 1.5 Profile → View/Edit

**Objective:** Verify patient can access profile page

**Steps:**
1. From dashboard, navigate to profile
2. Click on user menu or profile link
3. View profile details

**Expected Outcome:**
- ✅ Profile page loads at `/patient/profile` or similar
- ✅ User information visible (email, name, etc.)
- ✅ Can edit profile fields (if editable)
- ✅ Changes save successfully

**Failure Signs:**
- ❌ Profile page inaccessible
- ❌ Data doesn't load
- ❌ Edits don't persist

---

### 1.6 Logout

**Objective:** Verify patient can logout cleanly

**Steps:**
1. From any patient page, locate logout button
2. Click logout
3. Observe redirect

**Expected Outcome:**
- ✅ Redirects to `/` (login page)
- ✅ Session cleared (can't navigate back to protected pages)
- ✅ No "already logged in" redirect loop
- ✅ Can login again immediately

**Failure Signs:**
- ❌ Logout fails (stays on protected page)
- ❌ Redirect loop after logout
- ❌ Session not cleared (still authenticated)

---

## Test Suite 2: Studio Flow (Clinician/Admin)

### 2.1 Login → Dashboard

**Objective:** Verify clinician can login and land on studio dashboard

**Steps:**
1. Open browser to `http://localhost:3000`
2. Enter clinician/admin credentials
3. Click "Einloggen"
4. Observe redirect behavior

**Expected Outcome:**
- ✅ Redirects to `/clinician` dashboard
- ✅ Dashboard loads without errors
- ✅ No redirect loops
- ✅ No console errors in DevTools
- ✅ Theme is **dark-only** (dark mode enforced, no light mode toggle)

**Failure Signs:**
- ❌ Infinite redirect loop
- ❌ Access denied error
- ❌ White screen / crash
- ❌ Light mode visible (should be dark-only)

---

### 2.2 Sidebar Scrolling

**Objective:** Verify studio sidebar scrolls to bottom with many items

**Steps:**
1. From clinician dashboard, observe left sidebar
2. If navigation items exceed viewport height, scroll sidebar
3. Verify bottom item is reachable

**Expected Outcome:**
- ✅ Sidebar has scrollbar if items overflow
- ✅ Can scroll to bottom navigation item
- ✅ User section (email, logout) always visible at bottom
- ✅ Scrolling is smooth, not janky
- ✅ Scroll position persists when navigating between pages

**Failure Signs:**
- ❌ Cannot scroll sidebar
- ❌ Bottom items cut off
- ❌ User section hidden
- ❌ Scrollbar missing when needed

---

### 2.3 Navigation Config → Access

**Objective:** Verify admin can access navigation configuration page

**Steps:**
1. Login as admin
2. Navigate to `/admin/navigation`
3. Verify page loads

**Expected Outcome:**
- ✅ Navigation config page loads
- ✅ Shows list of navigation items
- ✅ Shows role tabs (Patient, Clinician, Admin, Nurse)
- ✅ Can toggle items enabled/disabled
- ✅ Can reorder items
- ✅ Save button visible

**Failure Signs:**
- ❌ 404 error on `/admin/navigation`
- ❌ Page crashes
- ❌ Empty list
- ❌ Cannot interact with controls

---

### 2.4 Navigation Config → Modify & Persist

**Objective:** Verify navigation changes persist and apply to sidebar

**Steps:**
1. On `/admin/navigation`, select "Clinician" role
2. Disable one navigation item (toggle eye icon to "off")
3. Click "Änderungen speichern"
4. Wait for success confirmation
5. Navigate to `/clinician` dashboard
6. Observe sidebar navigation

**Expected Outcome:**
- ✅ Save succeeds with success message
- ✅ Disabled item is NOT visible in sidebar
- ✅ Reload page (`Ctrl+R` or `Cmd+R`)
- ✅ After reload, disabled item still NOT visible
- ✅ Navigate back to `/admin/navigation`
- ✅ Configuration shows item still disabled

**Failure Signs:**
- ❌ Save fails
- ❌ Disabled item still visible in sidebar
- ❌ Configuration not persisted after reload
- ❌ Sidebar doesn't reflect changes

---

### 2.5 Navigation Config → Reorder & Apply

**Objective:** Verify navigation reordering persists

**Steps:**
1. On `/admin/navigation`, select "Clinician" role
2. Move a navigation item up or down using arrow buttons
3. Click "Änderungen speichern"
4. Navigate to `/clinician` dashboard
5. Observe sidebar item order

**Expected Outcome:**
- ✅ Item order changes in config UI
- ✅ Save succeeds
- ✅ Sidebar shows items in new order
- ✅ Reload page
- ✅ Order persists after reload

**Failure Signs:**
- ❌ Reordering doesn't work
- ❌ Order not saved
- ❌ Sidebar shows old order
- ❌ Order reverts after reload

---

### 2.6 Logout

**Objective:** Verify clinician can logout cleanly

**Steps:**
1. From any clinician page, click "Abmelden" button
2. Observe redirect

**Expected Outcome:**
- ✅ Redirects to `/` (login page)
- ✅ Session cleared
- ✅ No redirect loop
- ✅ Can login again

**Failure Signs:**
- ❌ Logout fails
- ❌ Redirect loop
- ❌ Session not cleared

---

## Test Suite 3: Theme Enforcement

### 3.1 Patient UI - Light-Only Theme

**Objective:** Verify patient UI enforces light theme

**Steps:**
1. Login as patient
2. Navigate to any patient page
3. Open DevTools → Console
4. Check for `localStorage.getItem('theme')`
5. Verify HTML element classes

**Expected Outcome:**
- ✅ Page is in light mode
- ✅ No dark mode toggle visible
- ✅ `localStorage.theme` is cleared/removed
- ✅ HTML element has `class="light"` (not `dark`)
- ✅ Attempting to manually set dark mode (via DevTools) doesn't persist

**Failure Signs:**
- ❌ Dark mode visible
- ❌ Theme toggle present
- ❌ Can switch to dark mode

---

### 3.2 Studio UI - Dark-Only Theme

**Objective:** Verify studio UI enforces dark theme

**Steps:**
1. Login as clinician/admin
2. Navigate to any studio page
3. Open DevTools → Console
4. Check for `localStorage.getItem('theme')`
5. Verify HTML element classes

**Expected Outcome:**
- ✅ Page is in dark mode
- ✅ No light mode toggle visible
- ✅ `localStorage.theme` is cleared/removed
- ✅ HTML element has `class="dark"` (not `light`)
- ✅ Attempting to manually set light mode doesn't persist

**Failure Signs:**
- ❌ Light mode visible
- ❌ Theme toggle present
- ❌ Can switch to light mode

---

## Test Suite 4: No Crash Verification

### 4.1 Patient Pages - No RSC Crashes

**Objective:** Verify key patient pages don't have React Server Component errors

**Pages to Test:**
- `/patient/dashboard`
- `/patient/funnel/stress` (or any funnel)
- `/patient/results-v2`
- `/patient/insights-v2`
- `/patient/history`
- `/patient/profile`

**Steps:**
1. Login as patient
2. Navigate to each page above
3. Open DevTools → Console
4. Check for errors

**Expected Outcome:**
- ✅ Each page loads without errors
- ✅ No "RSC payload" errors
- ✅ No "Hydration failed" errors
- ✅ No infinite render loops
- ✅ Content visible on each page

**Failure Signs:**
- ❌ Red errors in console
- ❌ "Something went wrong" error boundary
- ❌ Blank page
- ❌ Loading spinner that never finishes

---

### 4.2 Studio Pages - No RSC Crashes

**Objective:** Verify key studio pages don't have React Server Component errors

**Pages to Test:**
- `/clinician` (dashboard)
- `/clinician/triage`
- `/clinician/pre-screening`
- `/clinician/shipments`
- `/clinician/funnels`
- `/admin/content`
- `/admin/navigation`
- `/admin/dev/endpoints` (admin only)

**Steps:**
1. Login as clinician/admin
2. Navigate to each page above
3. Open DevTools → Console
4. Check for errors

**Expected Outcome:**
- ✅ Each page loads without errors
- ✅ No RSC errors
- ✅ No hydration errors
- ✅ Content visible

**Failure Signs:**
- ❌ Console errors
- ❌ Error boundaries triggered
- ❌ Pages crash on load

---

## Test Suite 5: Five Reference Screens Accessible

### 5.1 Identify Reference Screens

The epic mentions "5 reference screens". Based on the flows, these likely are:

1. **Patient Dashboard** (`/patient/dashboard`)
2. **Assessment Intro** (`/patient/funnel/[slug]` intro page)
3. **Assessment Flow** (question steps in funnel)
4. **Results/Insights** (`/patient/results-v2` or `/patient/insights-v2`)
5. **Studio Dashboard** (`/clinician`)

**Additional Verification:**
- `/patient/profile`
- `/admin/navigation`

### 5.2 Accessibility Check

**Steps:**
1. Login as appropriate role
2. Navigate to each screen
3. Verify screen loads and is usable

**Expected Outcome:**
- ✅ All screens load without errors
- ✅ Navigation between screens works
- ✅ No dead ends or broken links
- ✅ Back button works correctly

**Failure Signs:**
- ❌ Any screen returns 404
- ❌ Any screen crashes
- ❌ Cannot navigate to screen
- ❌ Screen loads but unusable (blank, broken layout)

---

## Manual Verification Checklist

Before declaring PASS, verify:

- [ ] Patient can complete full flow: Login → Dashboard → Assessment → Results → Logout
- [ ] Studio can complete full flow: Login → Dashboard → Navigate pages → Admin/Navigation → Logout
- [ ] No redirect loops observed in either flow
- [ ] No console errors on any page
- [ ] Patient UI is light-only (no dark mode)
- [ ] Studio UI is dark-only (no light mode)
- [ ] Studio sidebar scrolls to bottom
- [ ] Navigation config saves and applies to sidebar
- [ ] Navigation config persists after page reload
- [ ] All 5+ reference screens are accessible
- [ ] This smoke doc can be run by someone without repo knowledge

---

## Automated Verification (Optional)

```bash
# Run build check
npm run build

# Expected: Build succeeds with no errors
# If build fails: Fix TypeScript/build errors before smoke tests

# Run tests (if available)
npm test

# Expected: All tests pass
```

---

## Troubleshooting Guide

### Problem: Redirect Loop

**Symptoms:**
- Browser shows "Too many redirects"
- URL keeps changing between `/` and `/patient` or `/clinician`

**Causes:**
- Auth middleware conflict
- Session not syncing properly
- Role detection failing

**Fixes:**
1. Clear browser cookies and localStorage
2. Logout completely
3. Close all browser tabs
4. Login again fresh

### Problem: Navigation Config Doesn't Apply

**Symptoms:**
- Changes saved in `/admin/navigation` don't show in sidebar
- Sidebar shows old menu items

**Causes:**
- API not persisting to database
- Frontend cache not invalidated
- Hard-refresh needed

**Fixes:**
1. Hard refresh page (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Clear browser cache
3. Check database table `navigation_item_configs` has rows
4. Check API endpoint `/api/admin/navigation` returns data

### Problem: Theme Stuck in Wrong Mode

**Symptoms:**
- Patient UI shows dark mode
- Studio UI shows light mode

**Causes:**
- Theme provider not loaded
- localStorage override
- Wrong app bundle loaded

**Fixes:**
1. Clear localStorage: `localStorage.clear()`
2. Hard refresh page
3. Verify correct app is running (patient vs studio)

### Problem: Sidebar Won't Scroll

**Symptoms:**
- Bottom navigation items cut off
- No scrollbar visible

**Causes:**
- CSS overflow not applied
- Height constraint missing
- Too few items to trigger scroll

**Fixes:**
1. Inspect element in DevTools
2. Check if `overflow-y: auto` applied to nav container
3. Add more navigation items to test (via config)
4. Verify flex layout of sidebar

### Problem: RSC Crash on Page Load

**Symptoms:**
- Error boundary shows "Something went wrong"
- Console shows RSC payload errors
- Page blank or partially rendered

**Causes:**
- Server/client state mismatch
- Invalid React component structure
- Missing data/props

**Fixes:**
1. Check console for specific error
2. Clear cache and hard refresh
3. Check if server is running (`npm run dev`)
4. Review recent code changes in affected component

---

## Success Criteria Summary

**✅ PASS Criteria:**

All of the following must be true:

1. **No Loops:** Both patient and studio flows complete without redirect or reload loops
2. **No Crashes:** No RSC errors, hydration errors, or error boundaries on key pages
3. **All Screens Accessible:** All 5+ reference screens load and are usable
4. **Navigation Config Works:** Changes in `/admin/navigation` persist and apply to sidebar after reload
5. **Runnable by Third Parties:** This doc can be executed by QA/ops without needing repo knowledge

**❌ FAIL Criteria:**

Any of the following fails the epic:

- Any redirect loop in patient or studio flow
- Any RSC crash on a central page
- Any reference screen returns 404 or crashes
- Navigation config doesn't persist or apply
- Smoke doc requires code knowledge to execute

---

## Version History

- **v1.0.0** (2026-01-21) - Initial smoke test documentation for EPIC E71 (v0.7)

---

## Contact / Support

If you encounter issues while running these smoke tests:

1. Check the Troubleshooting Guide above
2. Review server logs (`npm run dev` output)
3. Check browser DevTools Console and Network tabs
4. Document exact steps to reproduce and error messages
5. Report to development team with screenshots/logs

---

**End of EPIC E71 Smoke Tests**
