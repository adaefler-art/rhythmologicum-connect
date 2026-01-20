# Database Seeding Runbook

**Issue:** E6.4.10 — Seed/Fixture: Pilot Org + Test Patients + 2 Funnels + Workup States

**Purpose:** Deterministic database seeding for development, staging, and demo environments

---

## Overview

The database seed file (`supabase/seed.sql`) provides a reproducible baseline dataset for the pilot deployment. It creates:

1. **Pilot Organization** - A single organization for pilot testing
2. **Test Users** - Admin, clinician, and patient test accounts
3. **User Roles** - Proper role assignments (admin/clinician/patient)
4. **Patient Profiles** - Pre-configured patient profiles with varying onboarding states
5. **User Consents** - Consent records for eligible patients
6. **Pilot Funnels** - Ensures stress-assessment and sleep-quality funnels exist
7. **Org Memberships** - Links users to the pilot organization

---

## Quick Start

### One-Command Setup

```bash
npm run db:reset
```

This command will:
1. Drop and recreate the local database
2. Run all migrations
3. Execute seed data from `supabase/seed.sql`

### Verification

After seeding, verify the data was loaded correctly:

```bash
npm run db:seed:verify
```

This will run automated checks to ensure:
- All test users were created with deterministic UUIDs
- Pilot organization exists
- Funnels are configured correctly
- Patient profiles and consents are set up
- Org memberships are correct

### Alternative Commands

```bash
# Just run migrations (no seed)
npm run db:migrate

# Full reset with seed (same as db:reset)
npm run db:seed

# Reset and verify in one go
npm run db:reset && npm run db:seed:verify

# Generate TypeScript types after seeding
npm run db:typegen
```

---

## Test Accounts

After seeding, the following test accounts are available:

### Admin Account
- **Email:** `admin@pilot.test`
- **Password:** `admin123`
- **Role:** admin
- **Org:** pilot-org

### Clinician Account
- **Email:** `clinician@pilot.test`
- **Password:** `clinician123`
- **Role:** clinician
- **Org:** pilot-org

### Patient Accounts

#### Patient 1 (Fully Onboarded)
- **Email:** `patient1@pilot.test`
- **Password:** `patient123`
- **Name:** Max Mustermann
- **Status:** Onboarding completed
- **Consent:** ✅ Given
- **Use Case:** Testing assessment flows, dashboard

#### Patient 2 (Fully Onboarded)
- **Email:** `patient2@pilot.test`
- **Password:** `patient123`
- **Name:** Erika Musterfrau
- **Status:** Onboarding completed
- **Consent:** ✅ Given
- **Use Case:** Testing assessment flows, multi-patient scenarios

#### Patient 3 (Not Onboarded)
- **Email:** `patient3@pilot.test`
- **Password:** `patient123`
- **Name:** Anna Schmidt (not set yet)
- **Status:** Not started
- **Consent:** ❌ Not given
- **Use Case:** Testing E6.4.2 happy path (consent → profile → dashboard)

---

## Pilot Organization

- **ID:** `00000000-0000-0000-0000-000000000001`
- **Name:** Pilot Organization
- **Slug:** `pilot-org`
- **Pilot Enabled:** ✅ Yes
- **Features:** funnels, assessments, workup

---

## Pilot Funnels

Two funnels are guaranteed to exist after seeding:

### 1. Stress Assessment
- **Slug:** `stress-assessment`
- **Pillar:** mental-health
- **Duration:** ~10 minutes
- **Status:** Active
- **Version:** 1.0.0 (default)

### 2. Sleep Quality Assessment
- **Slug:** `sleep-quality`
- **Pillar:** sleep
- **Duration:** ~8 minutes
- **Status:** Active
- **Version:** 1.0.0 (default)

---

## Deterministic UUIDs

All seed data uses deterministic UUIDs for reproducibility:

- **Organization ID:** `00000000-0000-0000-0000-000000000001`
- **Admin User ID:** `10000000-0000-0000-0000-000000000001`
- **Clinician User ID:** `10000000-0000-0000-0000-000000000002`
- **Patient 1 User ID:** `10000000-0000-0000-0000-000000000101`
- **Patient 2 User ID:** `10000000-0000-0000-0000-000000000102`
- **Patient 3 User ID:** `10000000-0000-0000-0000-000000000103`

This ensures that:
- Seeds are idempotent (can be run multiple times)
- Test data is consistent across environments
- Scripts can reference known UUIDs

---

## Verification

### Quick Verification

Use the automated verification script:

```bash
npm run db:seed:verify
```

This script (located at `scripts/verify/verify-e6-4-10-seed.ps1`) checks:
- Deterministic UUIDs (AC1)
- All required data exists (AC2)
- Proper role assignments
- Onboarding states
- Funnel configurations

### Acceptance Criteria (E6.4.10)

#### AC1: Deterministic Seeds ✅
```bash
# Run seed twice and verify identical results
npm run db:reset
npm run db:seed:verify

npm run db:reset
npm run db:seed:verify

# Both should pass with same UUIDs
```

#### AC2: Runnable Pilot ✅
```bash
# Verify funnels and test users exist
npm run db:seed:verify
```

#### AC3: Happy Path in <5 Minutes ✅
```bash
# Manual verification (start dev server)
npm run dev

# Then in browser:
# 1. Go to http://localhost:3000
# 2. Login as patient3@pilot.test / patient123
# 3. Complete consent (should take ~30s)
# 4. Complete profile (should take ~1min)
# 5. Redirected to dashboard
# 6. Start assessment
# Total: < 5 minutes
```

**Note:** The E6.4.2 verification script (`scripts/verify/verify-e6-4-2-onboarding.ps1`) is a separate tool for testing the onboarding flow and is not part of this seed implementation.

---

## Manual Verification Steps

### 1. Verify Organizations
```sql
SELECT id, slug, name, is_active 
FROM organizations 
WHERE slug = 'pilot-org';
```

**Expected:** 1 row with pilot-org

### 2. Verify Test Users
```sql
SELECT id, email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE email LIKE '%@pilot.test'
ORDER BY email;
```

**Expected:** 5 rows (admin, clinician, 3 patients)

### 3. Verify Patient Profiles
```sql
SELECT user_id, full_name, onboarding_status
FROM patient_profiles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@pilot.test'
);
```

**Expected:** 3 rows (patient1, patient2, patient3)

### 4. Verify User Consents
```sql
SELECT user_id, consent_version, consented_at
FROM user_consents
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@pilot.test'
);
```

**Expected:** 2 rows (patient1, patient2)

### 5. Verify Funnels
```sql
SELECT slug, title, is_active, pillar_id
FROM funnels_catalog
WHERE slug IN ('stress-assessment', 'sleep-quality');
```

**Expected:** 2 rows

### 6. Verify Funnel Versions
```sql
SELECT fc.slug, fv.version, fv.is_default, fv.rollout_percent
FROM funnel_versions fv
JOIN funnels_catalog fc ON fc.id = fv.funnel_id
WHERE fc.slug IN ('stress-assessment', 'sleep-quality');
```

**Expected:** 2 rows (both version 1.0.0, is_default=true)

---

## Troubleshooting

### Issue: Seed fails with "auth.users does not exist"

**Cause:** Running seed before Supabase is fully initialized

**Solution:**
```bash
# Ensure Supabase is running
supabase status

# If not running, start it
supabase start

# Then run seed
npm run db:reset
```

### Issue: Duplicate key violations on re-run

**Cause:** Seed has `ON CONFLICT` clauses that should handle this

**Solution:**
Check that you're using the latest seed.sql file. If issues persist:
```bash
# Manual reset
supabase db reset --force
```

### Issue: Passwords don't work

**Cause:** Auth system may use different encryption

**Solution:**
1. Use Supabase Studio to reset passwords
2. Or update seed.sql with proper `crypt()` calls
3. For local dev, you can also create users via Studio UI

### Issue: Funnels missing questionnaire_config.steps

**Cause:** Funnel version may not have valid structure

**Solution:**
```bash
# Run seed invariants check
pwsh -File scripts/db/verify-seed-invariants.ps1
```

---

## Automation

### CI/CD Integration

For automated testing environments:

```yaml
# Example GitHub Actions workflow
- name: Setup Database
  run: |
    npm run db:reset
    npm run db:verify
    pwsh -File scripts/db/verify-seed-invariants.ps1
```

### Local Development

For quick reset during development:

```bash
# Reset and verify
npm run db:reset && npm run db:verify

# Reset, verify, and generate types
npm run db:reset && npm run db:verify && npm run db:typegen
```

---

## Maintenance

### Adding New Seed Data

1. Edit `supabase/seed.sql`
2. Use deterministic UUIDs (continue the pattern)
3. Add `ON CONFLICT` clauses for idempotency
4. Update this documentation
5. Test with:
   ```bash
   npm run db:reset
   npm run db:reset  # Run twice to test idempotency
   ```

### Updating Test Accounts

To change test user data:
1. Edit the relevant `INSERT` statements in `supabase/seed.sql`
2. Use `ON CONFLICT ... DO UPDATE` to ensure updates apply
3. Run `npm run db:reset` to apply changes

### Adding New Funnels

To add additional pilot funnels:
1. Add entry in Section 7 of `supabase/seed.sql`
2. Follow the pattern of stress-assessment and sleep-quality
3. Ensure `questionnaire_config.steps` is a non-empty array
4. Run seed invariants check after seeding

---

## Related Documentation

- [E6.4.2 Implementation Summary](../e6/E6_4_2_IMPLEMENTATION_SUMMARY.md) - Patient onboarding happy path
- [E6.4.1 Implementation Summary](../e6/E6_4_1_IMPLEMENTATION_SUMMARY.md) - Pilot eligibility gates
- [Pilot Smoke Tests](./PILOT_SMOKE_TESTS.md) - Post-deployment verification
- [Migration Sync](../../scripts/verify-migration-sync.ps1) - Schema consistency checks

---

## Support

For issues with seeding:
1. Check troubleshooting section above
2. Verify Supabase is running: `supabase status`
3. Check logs: `supabase logs db`
4. Run verification scripts
5. Check seed invariants: `pwsh -File scripts/db/verify-seed-invariants.ps1`

---

**Last Updated:** 2026-01-15  
**Issue:** E6.4.10  
**Author:** GitHub Copilot
