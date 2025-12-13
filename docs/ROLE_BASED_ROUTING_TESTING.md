# Role-Based Entry Routing - Testing Guide

## Overview
This document describes how to test the role-based entry routing feature that automatically redirects logged-in users to their appropriate landing page.

## Feature Behavior

### Automatic Redirect on Login Page
When a logged-in user visits the root URL (`/`), they are automatically redirected to their role-specific landing page:

- **Patient** → `/patient` → auto-redirects to `/patient/assessment`
- **Clinician** → `/clinician` (dashboard)
- **Admin** → `/clinician` (same dashboard as clinician)

### Feature Flags
The routing respects the `CLINICIAN_DASHBOARD_ENABLED` feature flag:
- If disabled, clinicians are redirected to `/patient` instead of `/clinician`

## Test Scenarios

### Prerequisites
1. Running Supabase instance
2. Access to Supabase Studio or SQL editor
3. Test users created with different roles

### Setting Up Test Users

#### Create a Patient User (Default)
1. Register via the app UI at `/`
2. Click "Registrieren" tab
3. Enter email and password
4. Patient role is assigned by default

#### Create a Clinician User
1. First create a user via signup
2. Then run SQL in Supabase:
```sql
SELECT set_user_role('clinician@example.com', 'clinician');
```

#### Create an Admin User
1. First create a user via signup
2. Then run SQL in Supabase:
```sql
SELECT set_user_role('admin@example.com', 'admin');
```

### Test Cases

#### Test 1: Unauthenticated User
**Steps:**
1. Ensure you're logged out
2. Navigate to `/`

**Expected Result:**
- Login/Signup page is displayed
- No redirect occurs
- User can see and interact with the login form

#### Test 2: Patient User Auto-Redirect
**Steps:**
1. Log in as a patient user
2. Navigate to `/`

**Expected Result:**
- User is immediately redirected to `/patient`
- Then auto-redirected to `/patient/assessment`
- Funnel selector page is displayed
- No login form is visible

#### Test 3: Clinician User Auto-Redirect
**Steps:**
1. Log in as a clinician user
2. Navigate to `/`

**Expected Result:**
- User is immediately redirected to `/clinician`
- Clinician dashboard is displayed
- Shows patient overview table and KPI cards
- No login form is visible

#### Test 4: Admin User Auto-Redirect
**Steps:**
1. Log in as an admin user
2. Navigate to `/`

**Expected Result:**
- User is immediately redirected to `/clinician`
- Clinician dashboard is displayed (admins share clinician view)
- Shows patient overview table and KPI cards
- No login form is visible

#### Test 5: Login Flow (New Login)
**Steps:**
1. Ensure you're logged out
2. Navigate to `/`
3. Enter valid credentials
4. Click "Einloggen"

**Expected Result:**
- User is logged in
- Automatically redirected to role-specific landing page
- Behavior same as Test 2, 3, or 4 depending on role

#### Test 6: Feature Flag - Clinician Dashboard Disabled
**Steps:**
1. Set environment variable: `NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=false`
2. Restart dev server
3. Log in as clinician
4. Navigate to `/`

**Expected Result:**
- Clinician is redirected to `/patient` instead of `/clinician`
- Patient flow is shown even for clinician role

### Manual Testing Checklist

- [ ] Unauthenticated user sees login page
- [ ] Patient user redirects to `/patient/assessment`
- [ ] Clinician user redirects to `/clinician` dashboard
- [ ] Admin user redirects to `/clinician` dashboard
- [ ] Login flow still works correctly for all roles
- [ ] No flash of login page for authenticated users
- [ ] Browser back button doesn't show login page (uses replace)
- [ ] Feature flag correctly overrides clinician redirect

## Verification Points

### Security
- [ ] Layouts (patient, clinician, admin) still enforce authentication
- [ ] Role checks in layouts prevent unauthorized access
- [ ] URL manipulation doesn't bypass role restrictions

### UX
- [ ] No visible flash of login page for authenticated users
- [ ] Redirect is immediate and smooth
- [ ] Error messages still display correctly if present in URL params

## Troubleshooting

### User Not Redirecting
1. Check if user is actually authenticated:
   ```javascript
   // In browser console
   const { data } = await supabase.auth.getUser()
   console.log(data.user)
   ```

2. Verify user role is set correctly:
   ```sql
   SELECT email, raw_app_meta_data->>'role' as role 
   FROM auth.users 
   WHERE email = 'your-email@example.com';
   ```

### Wrong Landing Page
1. Verify role in database matches expected role
2. Check feature flags in environment variables
3. Clear browser cache and cookies
4. Check browser console for errors

## Related Files
- `/app/page.tsx` - Login page with redirect logic
- `/lib/utils/roleBasedRouting.ts` - Role utilities and landing page mapping
- `/app/patient/layout.tsx` - Patient layout with auth check
- `/app/clinician/layout.tsx` - Clinician layout with role check
- `/app/admin/layout.tsx` - Admin layout with role check
