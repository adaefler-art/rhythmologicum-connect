# E71 — Smoke & Acceptance Pack

**Epic:** E71 — Mobile UI v2 + Studio Workbench Cleanup (v0.7)  
**Purpose:** Quick pass/fail acceptance test for third-party verification  
**Time to Execute:** ~15 minutes  
**Last Updated:** 2026-01-21

---

## Quick Reference

**PASS Criteria:**
1. ✅ Patient flow completes without redirect loops
2. ✅ Studio flow completes without crashes
3. ✅ Navigation config persists and applies
4. ✅ Theme enforcement works (patient=light, studio=dark)
5. ✅ All reference screens accessible

**FAIL if any:**
- ❌ Redirect loop detected
- ❌ RSC crash on any screen
- ❌ Navigation config doesn't persist
- ❌ Wrong theme displayed
- ❌ Any reference screen returns 404

---

## Setup

### Prerequisites

**Required:**
- Node.js v18+ installed
- Git repository cloned
- Test accounts created (see below)

### Installation & Start

```bash
# 1. Clone repository (if not already)
git clone https://github.com/adaefler-art/rhythmologicum-connect.git
cd rhythmologicum-connect

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Verify server is running
# Expected: Server running on http://localhost:3000
# Expected: No startup errors in console
```

### Local smoke start (no .env.local)

**PowerShell:**
```powershell
.\scripts\dev-start.ps1
```

This prompts for required env vars in the current session only and runs `npm run start` without writing secrets to disk.

#### Port 3000 handling

If port 3000 is already in use, the script prints the owning PID/process and prompts to kill it. If you answer **N**, the script exits cleanly without attempting to start the app.

#### /api/funnels/catalog expectations

- **Unauthenticated:** expect **401** (PASS, not a failure)
- **Authenticated:** expect **200**

To test authenticated behavior, set a cookie before running the smoke script:

```powershell
$env:RHYTHM_PATIENT_COOKIE="rhythm_refresh=PASTE; other=..."
.\scripts\smoke-local.ps1
```

#### Commands

```powershell
.\scripts\dev-start.ps1
.\scripts\smoke-local.ps1
```

#### Content page smoke check

```powershell
$base = "http://localhost:3000"
Invoke-WebRequest -UseBasicParsing "$base/content/was-ist-stress" | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing "$base/content/does-not-exist" | Select-Object -ExpandProperty StatusCode
```

Expected:
- Published slug returns **200**
- Missing slug returns **404**

#### Funnel resolver smoke check

```powershell
$base = "http://localhost:3000"
Invoke-WebRequest -UseBasicParsing "$base/api/content/resolve?funnel=stress-assessment&slug=was-ist-stress" |
	Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing "$base/api/content/resolve?slug=was-ist-stress" -SkipHttpErrorCheck |
	Select-Object -ExpandProperty StatusCode
```

Expected:
- With funnel param: **200** (content resolved or missing_content)
- Without funnel param: **422**

**Verification:**
- ✅ Console shows "Ready in Xms"
- ✅ No red errors in terminal
- ✅ Opening `http://localhost:3000` shows login page

---

## Test Accounts

**Patient Account:**
- Email: `patient@test.local`
- Password: (your test password)
- Role: `patient`

**Clinician/Admin Account:**
- Email: `clinician@test.local` or `admin@test.local`
- Password: (your test password)
- Role: `clinician` or `admin`

**Note:** If test accounts don't exist, you need to:
1. Create accounts via Supabase Auth
2. Set roles via database migration or SQL
3. Complete onboarding for patient account

---

## Patient Flow Test (5 min)

### Test 1.1: Login & Dashboard

**URL:** `http://localhost:3000`

**Steps:**
1. Enter patient credentials
2. Click "Einloggen"
3. Wait for redirect

**Expected:**
- ✅ Lands on `/patient/dashboard` (or similar mobile route)
- ✅ Dashboard content loads
- ✅ **Light theme** is active (white background)
- ✅ No "Too many redirects" error
- ✅ No console errors (open DevTools: F12)

**Failure Check:**
- ❌ If redirecting in a loop between pages → **FAIL**
- ❌ If dark theme visible → **FAIL**
- ❌ If blank screen or crash → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

### Test 1.2: Assessment Flow Access

**URL:** From dashboard

**Steps:**
1. Click "Assessment starten" or "Neue Beurteilung" button
2. Observe navigation

**Expected:**
- ✅ Navigates to `/patient/funnel/stress` (or similar funnel intro)
- ✅ Intro page loads with "Start" or "Weiter" button
- ✅ No 404 error
- ✅ No redirect loop

**Failure Check:**
- ❌ If 404 error → **FAIL**
- ❌ If page crashes → **FAIL**
- ❌ If redirect loop → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

### Test 1.3: Assessment Step Navigation

**URL:** From assessment intro

**Steps:**
1. Click "Weiter" or "Start"
2. Answer first question (select any option)
3. Click "Weiter" to next step
4. Click "Zurück" to go back

**Expected:**
- ✅ Steps advance forward on "Weiter"
- ✅ Steps go backward on "Zurück"
- ✅ No crash on step transitions
- ✅ Progress indicator updates

**Failure Check:**
- ❌ If steps don't advance → **FAIL**
- ❌ If crash on navigation → **FAIL**
- ❌ If stuck in loop → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

### Test 1.4: Logout

**URL:** From any patient page

**Steps:**
1. Click logout button (usually in menu or profile)
2. Observe redirect

**Expected:**
- ✅ Redirects to `/` (login page)
- ✅ Session cleared (can't navigate back to `/patient/*` without login)
- ✅ No redirect loop

**Failure Check:**
- ❌ If logout fails → **FAIL**
- ❌ If redirect loop → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

## Studio Flow Test (5 min)

### Test 2.1: Login & Dashboard

**URL:** `http://localhost:3000` (logout first if needed)

**Steps:**
1. Enter clinician/admin credentials
2. Click "Einloggen"
3. Wait for redirect

**Expected:**
- ✅ Lands on `/clinician` dashboard
- ✅ Dashboard content loads
- ✅ **Dark theme** is active (dark background)
- ✅ Sidebar visible on left
- ✅ No redirect loop
- ✅ No console errors

**Failure Check:**
- ❌ If light theme visible → **FAIL**
- ❌ If redirect loop → **FAIL**
- ❌ If crash → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

### Test 2.2: Sidebar Scrolling

**URL:** `/clinician` (from previous test)

**Steps:**
1. Observe left sidebar
2. If navigation items exceed viewport height, scroll sidebar down
3. Verify bottom user section is reachable

**Expected:**
- ✅ Sidebar has scrollbar if items overflow
- ✅ Can scroll to bottom item
- ✅ User section (email, "Abmelden") visible at bottom
- ✅ Scrolling is smooth

**Failure Check:**
- ❌ If cannot scroll sidebar → **FAIL**
- ❌ If bottom items cut off → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

### Test 2.3: Navigation Config — Access

**URL:** `http://localhost:3000/admin/navigation`

**Steps:**
1. Login as admin (if not already)
2. Navigate to `/admin/navigation`
3. Observe page

**Expected:**
- ✅ Page loads successfully
- ✅ Shows role tabs (Patient, Clinician, Admin, etc.)
- ✅ Shows list of navigation items
- ✅ Can see toggle icons (eye icon) to enable/disable items
- ✅ Can see "Änderungen speichern" (Save changes) button

**Failure Check:**
- ❌ If 404 error → **FAIL**
- ❌ If page crashes → **FAIL**
- ❌ If empty or broken UI → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

### Test 2.4: Navigation Config — Modify & Persist

**URL:** `/admin/navigation` (from previous test)

**Steps:**
1. Select "Clinician" role tab
2. Find any enabled navigation item
3. Click eye icon to **disable** it (eye should cross out or turn gray)
4. Note which item you disabled (e.g., "Triage" or "Funnels")
5. Click "Änderungen speichern"
6. Wait for success message
7. Navigate to `/clinician` dashboard
8. Check sidebar — disabled item should NOT be visible
9. **Reload page** (Ctrl+R or Cmd+R)
10. Verify disabled item is still NOT visible
11. Navigate back to `/admin/navigation`
12. Verify item shows as disabled

**Expected:**
- ✅ Save succeeds with confirmation message
- ✅ Disabled item NOT in sidebar
- ✅ After reload, item still NOT in sidebar
- ✅ Config page shows item still disabled

**Failure Check:**
- ❌ If save fails → **FAIL**
- ❌ If item still visible in sidebar → **FAIL**
- ❌ If config reverts after reload → **FAIL**

**Result:** PASS ☐ / FAIL ☐

**Re-enable the item after test:**
1. Return to `/admin/navigation`
2. Re-enable the item you disabled
3. Click "Änderungen speichern"

---

### Test 2.5: Logout

**URL:** From any studio page

**Steps:**
1. Click "Abmelden" button
2. Observe redirect

**Expected:**
- ✅ Redirects to `/` (login page)
- ✅ Session cleared
- ✅ No redirect loop

**Failure Check:**
- ❌ If logout fails → **FAIL**
- ❌ If redirect loop → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

## Theme Enforcement Test (2 min)

### Test 3.1: Patient = Light Only

**Steps:**
1. Login as patient
2. Navigate to any patient page
3. Open DevTools (F12) → Console
4. Type: `localStorage.getItem('theme')`
5. Verify page appearance

**Expected:**
- ✅ Page is in **light mode** (white/light background)
- ✅ No theme toggle visible anywhere
- ✅ Console returns `null` or `undefined` for theme (or shows "light")

**Failure Check:**
- ❌ If dark mode visible → **FAIL**
- ❌ If theme toggle present → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

### Test 3.2: Studio = Dark Only

**Steps:**
1. Login as clinician/admin
2. Navigate to any studio page
3. Open DevTools (F12) → Console
4. Type: `localStorage.getItem('theme')`
5. Verify page appearance

**Expected:**
- ✅ Page is in **dark mode** (dark background)
- ✅ No theme toggle visible anywhere
- ✅ Console returns `null` or `undefined` for theme (or shows "dark")

**Failure Check:**
- ❌ If light mode visible → **FAIL**
- ❌ If theme toggle present → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

## No Crash Verification (3 min)

### Test 4.1: Patient Pages — No Errors

**Pages to Check:**
1. `/patient/dashboard`
2. `/patient/funnel/stress` (or any funnel)
3. `/patient/results-v2` (if accessible)
4. `/patient/profile` (if accessible)
5. `/patient/history` (if accessible)

**Steps for Each Page:**
1. Navigate to page
2. Open DevTools Console (F12)
3. Check for red errors

**Expected:**
- ✅ Page loads without errors
- ✅ No "RSC payload" errors
- ✅ No "Hydration failed" errors
- ✅ Content visible

**Failure Check:**
- ❌ If any page shows red console errors → **FAIL**
- ❌ If any page shows error boundary → **FAIL**
- ❌ If any page blank/crashed → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

### Test 4.2: Studio Pages — No Errors

**Pages to Check:**
1. `/clinician` (dashboard)
2. `/clinician/triage` (if exists)
3. `/clinician/funnels` (if exists)
4. `/admin/navigation`
5. `/admin/content` (if exists)

**Steps for Each Page:**
1. Navigate to page
2. Open DevTools Console (F12)
3. Check for red errors

**Expected:**
- ✅ Page loads without errors
- ✅ No console errors
- ✅ Content visible

**Failure Check:**
- ❌ If any page shows red console errors → **FAIL**
- ❌ If any page crashes → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

## Five Reference Screens Verification

### Identify & Access Reference Screens

The epic requires 5 key screens to be accessible:

1. **Patient Dashboard:** `/patient/dashboard`
2. **Assessment Intro:** `/patient/funnel/[slug]` (e.g., `/patient/funnel/stress`)
3. **Assessment Flow:** Inside funnel (question steps)
4. **Results/Insights:** `/patient/results-v2` or `/patient/insights-v2`
5. **Studio Dashboard:** `/clinician`

**Steps:**
1. Access each screen above
2. Verify it loads without 404
3. Verify content is visible and usable

**Expected:**
- ✅ All 5 screens load successfully
- ✅ No 404 errors
- ✅ No crashes
- ✅ Content displayed

**Failure Check:**
- ❌ If any screen returns 404 → **FAIL**
- ❌ If any screen crashes → **FAIL**
- ❌ If any screen unusable → **FAIL**

**Result:** PASS ☐ / FAIL ☐

---

## Final Acceptance Checklist

Before declaring **PASS**, verify all criteria met:

- [ ] Patient login → dashboard works (no loop)
- [ ] Patient assessment flow accessible and navigable
- [ ] Patient logout works cleanly
- [ ] Patient UI is **light-only** (no dark mode)
- [ ] Studio login → dashboard works (no loop)
- [ ] Studio sidebar scrolls properly
- [ ] Studio navigation config page accessible
- [ ] Studio navigation config changes **persist after reload**
- [ ] Studio logout works cleanly
- [ ] Studio UI is **dark-only** (no light mode)
- [ ] No console errors on any patient page
- [ ] No console errors on any studio page
- [ ] All 5 reference screens accessible and usable
- [ ] This doc was executable without code knowledge

---

## Acceptance Result

**Final Verdict:**  
☐ **PASS** — All criteria met, Epic E71 is accepted  
☐ **FAIL** — One or more criteria failed (see test results above)

**Failed Tests (if any):**
1. _____________________________
2. _____________________________
3. _____________________________

**Notes:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**Tester Name:** _____________________________  
**Test Date:** _____________________________  
**Environment:** ☐ Local Dev | ☐ Staging | ☐ Production

---

## Troubleshooting

### Problem: "Too many redirects"

**Solution:**
1. Clear browser cookies and localStorage
2. Logout completely
3. Close all browser tabs
4. Login again fresh

### Problem: Navigation config doesn't persist

**Solution:**
1. Hard refresh page (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Clear browser cache
3. Check database table `navigation_item_configs` has rows
4. Verify API endpoint `/api/admin/navigation` returns data

### Problem: Wrong theme displayed

**Solution:**
1. Clear localStorage: Open console, type `localStorage.clear()`, press Enter
2. Hard refresh page
3. Logout and login again

### Problem: Pages crash or show errors

**Solution:**
1. Check server is running (`npm run dev`)
2. Check console for specific error message
3. Hard refresh page
4. Check environment variables are set correctly

### Problem: Test accounts don't work

**Solution:**
1. Verify accounts exist in Supabase Auth
2. Verify roles are set in `auth.users.raw_app_meta_data.role`
3. For patient: Verify onboarding completed (consent + profile)
4. For clinician/admin: Verify role is `clinician` or `admin`

---

## For Detailed Testing

For comprehensive test scenarios, see:
- **Full Test Suite:** `docs/v07/E71_SMOKE_TESTS.md` (680 lines)
- **Architecture Details:** `docs/v07/E71_UIV2_GUARDRAILS.md`

---

**End of E71 Smoke & Acceptance Pack**
