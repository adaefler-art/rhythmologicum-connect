# Manual Testing Guide - V05-I03.1 Onboarding Flow

## Prerequisites

1. Local development environment with:
   - Node.js and npm installed
   - Supabase CLI installed
   - Docker running (for local Supabase)

2. Environment variables configured in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

## Setup Steps

1. **Start Local Supabase**

   ```bash
   npx supabase start
   ```

2. **Reset Database** (applies all migrations)

   ```bash
   npm run db:reset
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server should start at http://localhost:3000

## Test Scenarios

### Scenario 1: New User Onboarding (Happy Path)

**Objective**: Verify complete onboarding flow for new user

1. **Create Test User**
   - Navigate to http://localhost:3000
   - Click "Sign Up" or register link
   - Create account with email: `test-patient@example.com`
   - Verify email if required

2. **Test Consent Flow**
   - After login, should automatically redirect to `/patient/onboarding/consent`
   - **Verify**:
     - [ ] Page displays "Willkommen bei Rhythmologicum Connect"
     - [ ] Terms and conditions are visible in scrollable area
     - [ ] Checkbox for agreement is unchecked by default
     - [ ] Submit button is disabled when checkbox unchecked
   - Check the "Ich habe die Nutzungsbedingungen gelesen" checkbox
   - **Verify**:
     - [ ] Submit button becomes enabled
   - Click "Zustimmen und fortfahren"
   - **Verify**:
     - [ ] No error message appears
     - [ ] Redirects to `/patient/onboarding/profile`

3. **Test Profile Form**
   - On profile page, should see "Basisprofil erstellen"
   - **Verify**:
     - [ ] Full name field is present and required
     - [ ] Birth year field is optional
     - [ ] Sex dropdown is optional with correct options
   - Fill in form:
     - Full name: "Max Mustermann"
     - Birth year: 1985
     - Sex: "Männlich" (male)
   - Click "Profil speichern"
   - **Verify**:
     - [ ] No error message appears
     - [ ] Redirects to `/patient/assessment`

4. **Verify Onboarding Complete**
   - Should be on funnel selector page
   - **Verify**:
     - [ ] Can see available funnels
     - [ ] No redirect back to onboarding

### Scenario 2: Reload Persistence

**Objective**: Verify data persists across page reloads

1. **After completing onboarding from Scenario 1**:
   - Navigate to http://localhost:3000/patient
   - **Verify**:
     - [ ] Does NOT redirect to consent page
     - [ ] Does NOT redirect to profile page
     - [ ] Goes directly to `/patient/assessment`

2. **Check Profile Data**:
   - Navigate to http://localhost:3000/patient/onboarding/profile
   - **Verify**:
     - [ ] Form loads with previously saved values:
       - Name: "Max Mustermann"
       - Birth year: 1985
       - Sex: "Männlich"

### Scenario 3: Idempotent Consent

**Objective**: Verify consent can be re-submitted without errors

1. **Navigate to consent page**:
   - Go to http://localhost:3000/patient/onboarding/consent
   - **Verify**:
     - [ ] Page loads without error
     - [ ] Checkbox can be checked
   - Check the agreement box
   - Click "Zustimmen und fortfahren"
   - **Verify**:
     - [ ] No error (should accept duplicate consent)
     - [ ] Redirects to profile or assessment page

### Scenario 4: Profile Update (Idempotent)

**Objective**: Verify profile can be updated

1. **Navigate to profile page**:
   - Go to http://localhost:3000/patient/onboarding/profile
   - Form should load with existing data
   - Change the name to "Max Musterfrau"
   - Click "Profil speichern"
   - **Verify**:
     - [ ] No error message
     - [ ] Redirects successfully

2. **Verify Update**:
   - Navigate back to profile page
   - **Verify**:
     - [ ] Name shows "Max Musterfrau" (updated value)

### Scenario 5: Validation Errors

**Objective**: Verify client and server validation

1. **Test Empty Name**:
   - Navigate to profile page
   - Clear the full name field
   - Try to submit
   - **Verify**:
     - [ ] HTML5 validation prevents submission (browser shows "Please fill out this field")

2. **Test Invalid Birth Year**:
   - Enter birth year: 1800 (before 1900)
   - Try to submit
   - **Verify**:
     - [ ] Validation error appears
     - [ ] Error message mentions "Birth year must be 1900 or later"

3. **Test Future Birth Year**:
   - Enter birth year: 2030
   - Try to submit
   - **Verify**:
     - [ ] Validation error appears
     - [ ] Error message mentions "cannot be in the future"

### Scenario 6: RLS Enforcement

**Objective**: Verify users can only see their own data

**Setup**: Create two test users

- User A: `patient-a@example.com`
- User B: `patient-b@example.com`

1. **As User A**:
   - Complete onboarding with name "Patient A"
   - Log out

2. **As User B**:
   - Complete onboarding with name "Patient B"
   - Navigate to profile page
   - **Verify**:
     - [ ] Only sees own name ("Patient B")
     - [ ] Cannot see User A's data

3. **Database Check** (using Supabase Studio or SQL):
   ```sql
   SELECT full_name FROM patient_profiles WHERE user_id = '<user-a-id>';
   ```

   - **Verify**: Can see User A's profile in admin view
   - As User B (using anon key):
     - Cannot query other users' profiles

### Scenario 7: Audit Log Verification

**Objective**: Verify audit events are created

1. **After completing onboarding**, check audit log:

   ```sql
   SELECT
     entity_type,
     action,
     created_at,
     metadata
   FROM audit_log
   WHERE actor_user_id = '<test-user-id>'
   ORDER BY created_at DESC;
   ```

2. **Verify Audit Entries**:
   - [ ] Consent create event exists
     - entity_type: 'consent'
     - action: 'create'
     - metadata contains: consent_version
   - [ ] Profile create event exists
     - entity_type: 'consent' (reused)
     - action: 'create' or 'update'
     - metadata contains: profile_updated='baseline'

### Scenario 8: Incomplete Onboarding Redirect

**Objective**: Verify redirects work for partial onboarding

1. **Test No Consent**:
   - Create new user
   - Immediately navigate to http://localhost:3000/patient/assessment
   - **Verify**:
     - [ ] Redirects to `/patient/onboarding/consent`

2. **Test Consent Only (No Profile)**:
   - Complete consent page
   - Directly navigate to http://localhost:3000/patient/assessment
   - **Verify**:
     - [ ] Redirects to `/patient/onboarding/profile`

## Database Verification Commands

### Check Consent Records

```sql
SELECT * FROM user_consents WHERE user_id = '<test-user-id>';
```

### Check Patient Profiles

```sql
SELECT * FROM patient_profiles WHERE user_id = '<test-user-id>';
```

### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('user_consents', 'patient_profiles');
```

## Expected Results Summary

| Scenario            | Expected Outcome                            |
| ------------------- | ------------------------------------------- |
| New user onboarding | Completes consent → profile → assessment    |
| Reload persistence  | Data saved and reloaded correctly           |
| Idempotent consent  | No errors on re-submission                  |
| Profile update      | Changes saved and visible                   |
| Validation errors   | Clear error messages displayed              |
| RLS enforcement     | Users only see own data                     |
| Audit logging       | All events recorded                         |
| Redirect logic      | Correct redirects for incomplete onboarding |

## Troubleshooting

### Issue: Redirects not working

- Check browser console for errors
- Verify `getOnboardingStatus()` is being called
- Check network tab for 401/403 errors

### Issue: Data not persisting

- Verify Supabase connection
- Check RLS policies are enabled
- Verify user_id matches auth.uid()

### Issue: Validation not working

- Check browser console for Zod errors
- Verify server action is being called
- Check network tab for 400 errors

## Screenshots to Capture

For evidence/documentation, capture:

1. Consent page (initial state)
2. Consent page (with checkbox checked)
3. Profile page (empty form)
4. Profile page (filled form)
5. Profile page (with loaded data after reload)
6. Validation error example
7. Assessment page (after successful onboarding)
8. Audit log entries (from database)

## Success Criteria

✅ All 8 test scenarios pass
✅ No console errors during flow
✅ RLS prevents cross-user access
✅ Audit events recorded correctly
✅ Validation works on client and server
✅ Data persists across reloads
