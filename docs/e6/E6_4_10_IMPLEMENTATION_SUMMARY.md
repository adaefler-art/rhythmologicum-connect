# E6.4.10 Implementation Summary

**Issue:** E6.4.10 — Seed/Fixture: Minimal Pilot Data Setup (Org, Roles, Test Patients)

**Date:** 2026-01-15

**Status:** ✅ Complete

---

## Objective

Create deterministic seed data for the pilot deployment that enables reproducible development, staging, and demo environments with minimal setup.

### Requirements

1. **Deterministic Seeds** - Identical slugs/IDs, no random drift
2. **Runnable Pilot** - One-command setup creates a functional pilot environment
3. **Happy Path Ready** - E6.4.2 onboarding flow can be completed in <5 minutes after seed

---

## Implementation

### 1. Seed File (`supabase/seed.sql`)

**Location:** `supabase/seed.sql`

**Features:**

#### Deterministic Data
- All UUIDs are hard-coded for reproducibility
- Idempotent inserts using `ON CONFLICT` clauses
- Can be run multiple times safely

#### Pilot Organization
```sql
ID: 00000000-0000-0000-0000-000000000001
Slug: pilot-org
Settings: { pilot_enabled: true, features: [...] }
```

#### Test Users (5 total)

**Admin:**
- Email: `admin@pilot.test`
- Password: `admin123`
- UUID: `10000000-0000-0000-0000-000000000001`
- Role: admin

**Clinician:**
- Email: `clinician@pilot.test`
- Password: `clinician123`
- UUID: `10000000-0000-0000-0000-000000000002`
- Role: clinician

**Patient 1 (Onboarded):**
- Email: `patient1@pilot.test`
- Password: `patient123`
- UUID: `10000000-0000-0000-0000-000000000101`
- Name: Max Mustermann
- Onboarding: Completed
- Consent: Yes

**Patient 2 (Onboarded):**
- Email: `patient2@pilot.test`
- Password: `patient123`
- UUID: `10000000-0000-0000-0000-000000000102`
- Name: Erika Musterfrau
- Onboarding: Completed
- Consent: Yes

**Patient 3 (Not Onboarded):**
- Email: `patient3@pilot.test`
- Password: `patient123`
- UUID: `10000000-0000-0000-0000-000000000103`
- Name: (not set)
- Onboarding: Not started
- Consent: No
- Purpose: Test E6.4.2 happy path

#### Pilot Funnels

**Stress Assessment:**
- Slug: `stress-assessment`
- Pillar: mental-health
- Duration: 10 minutes
- Version: 1.0.0 (default)

**Sleep Quality:**
- Slug: `sleep-quality`
- Pillar: sleep
- Duration: 8 minutes
- Version: 1.0.0 (default)

#### Database Tables Populated

1. `organizations` - Pilot org
2. `auth.users` - 5 test users with encrypted passwords
3. `user_profiles` - Extended profiles for all users
4. `user_org_membership` - Org memberships with roles
5. `patient_profiles` - Legacy patient profiles with onboarding status
6. `user_consents` - Consent records for Patient 1 and 2
7. `funnels_catalog` - Ensures both pilot funnels exist
8. `funnel_versions` - Default versions for funnels

### 2. NPM Scripts

**Added to `package.json`:**

```json
{
  "db:migrate": "supabase migration up",
  "db:seed": "supabase db reset",
   "db:seed:verify": "pwsh -File scripts/verify/verify-e6-4-10-seed.ps1"
}
```

**Usage:**
```bash
# One-command setup (AC2)
npm run db:reset

# Verify seed data (AC1)
npm run db:seed:verify

# Reset and verify
npm run db:reset && npm run db:seed:verify
```

### 3. Verification Script

**Location:** `scripts/verify/verify-e6-4-10-seed.ps1`

**Features:**
- Automated testing of all seed data
- Verifies deterministic UUIDs
- Checks role assignments
- Validates onboarding states
- Confirms funnel configurations
- Tests org memberships

**Test Coverage:**
- 16 automated tests
- Covers AC1 (deterministic UUIDs)
- Covers AC2 (runnable pilot)
- Exit code 0 on success, 1 on failure

**Sample Output:**
```
=== E6.4.10 Seed Verification ===

Test 1: Pilot Organization UUID
  Pilot org should have deterministic UUID
  ✓ PASS (UUID matches)

Test 2: Admin User UUID
  Admin user should have deterministic UUID
  ✓ PASS (UUID matches)

...

=== Verification Summary ===

Tests Run: 16
Passed: 16
Failed: 0

✓ All seed verification tests passed!
```

### 4. Documentation

**Location:** `docs/runbooks/DB_SEED.md`

**Covers:**
- Quick start guide
- Test account credentials
- Verification steps
- Troubleshooting
- Maintenance procedures
- Manual SQL verification queries

**Updated:** `docs/runbooks/README.md`
- Added reference to DB_SEED.md
- Includes quick start commands

---

## Acceptance Criteria

### AC1: Deterministic Seeds ✅

**Requirement:** Seed is deterministic (identical slugs/ids, no random drift)

**Implementation:**
- All UUIDs are hard-coded constants
- Organization ID: `00000000-0000-0000-0000-000000000001`
- User IDs follow pattern: `10000000-0000-0000-0000-0000000000XX`
- `ON CONFLICT` clauses ensure idempotency
- No random data generation

**Verification:**
```bash
# Run seed twice
npm run db:reset
npm run db:seed:verify  # Should pass

npm run db:reset
npm run db:seed:verify  # Should pass with identical UUIDs
```

**Evidence:** Verification script tests 4 deterministic UUIDs

### AC2: Runnable Pilot ✅

**Requirement:** `db:seed` (or process) creates a runnable pilot

**Implementation:**
- Single command: `npm run db:reset`
- Automatically runs migrations + seed
- Creates all required data:
  - ✅ Pilot organization
  - ✅ 5 test users with roles
  - ✅ 2 active funnels
  - ✅ User profiles and consents
  - ✅ Org memberships

**Verification:**
```bash
npm run db:reset
npm run db:seed:verify
# All 16 tests should pass
```

**Evidence:** Verification script validates all required data exists

### AC3: Happy Path in <5 Minutes ✅

**Requirement:** After seed, E6.4.2 happy path can be completed in 5 minutes

**Implementation:**
- Patient 3 is specifically configured for testing onboarding flow
- No onboarding completed
- No consent given
- Ready to test full E6.4.2 flow

**Test Flow:**
1. Login as `patient3@pilot.test` / `patient123` (~30s)
2. Accept consent (~30s)
3. Complete profile (name, birth year, sex) (~1min)
4. Redirect to dashboard (~instant)
5. Start stress assessment (~30s navigation)
6. Complete first question (~30s)

**Total Time:** ~3-4 minutes (well under 5 minutes)

**Verification:**
```bash
# Start dev server
npm run dev

# In browser:
# 1. Go to http://localhost:3000
# 2. Login as patient3@pilot.test / patient123
# 3. Complete consent and profile
# 4. Verify redirect to /patient/dashboard
# 5. Click "Start Assessment"
```

---

## Configuration

### Supabase Config

**File:** `supabase/config.toml`

```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

This configuration ensures:
- Seed runs automatically after migrations during `db:reset`
- Seed file location is explicit
- Seed is enabled by default

---

## Files Changed

### New Files

1. **`supabase/seed.sql`** (648 lines)
   - Deterministic seed data
   - Idempotent inserts
   - Comprehensive comments

2. **`scripts/verify/verify-e6-4-10-seed.ps1`** (334 lines)
   - Automated verification script
   - 16 test cases
   - Detailed output and troubleshooting

3. **`docs/runbooks/DB_SEED.md`** (285 lines)
   - Complete seed documentation
   - Test account reference
   - Verification procedures
   - Troubleshooting guide

### Modified Files

1. **`package.json`**
   - Added `db:migrate` script
   - Added `db:seed` script
   - Added `db:seed:verify` script

2. **`docs/runbooks/README.md`**
   - Added DB_SEED.md reference
   - Quick start commands

---

## Testing

### Automated Tests

**Verification Script:** `scripts/verify/verify-e6-4-10-seed.ps1`

**Test Categories:**
1. Deterministic UUIDs (4 tests)
2. Required data exists (12 tests)
   - Organizations
   - Users and roles
   - Patient profiles
   - Consents
   - Funnels
   - Org memberships

**Run Tests:**
```bash
npm run db:reset
npm run db:seed:verify
```

**Expected Output:** All 16 tests pass

### Manual Verification

**SQL Queries Available In:**
- `docs/runbooks/DB_SEED.md` - Manual verification section

**Quick Check:**
```sql
-- Verify pilot org
SELECT id, slug FROM organizations WHERE slug = 'pilot-org';

-- Verify test users
SELECT email, raw_app_meta_data->>'role' as role 
FROM auth.users 
WHERE email LIKE '%@pilot.test';

-- Verify funnels
SELECT slug, is_active 
FROM funnels_catalog 
WHERE slug IN ('stress-assessment', 'sleep-quality');
```

---

## Usage Patterns

### Development Workflow

```bash
# Initial setup
npm run db:reset
npm run db:seed:verify
npm run dev

# Reset during development
npm run db:reset
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Setup Database
  run: |
    npm run db:reset
    npm run db:seed:verify
```

### Troubleshooting

```bash
# Check Supabase status
supabase status

# View logs
supabase logs db

# Manual reset
supabase db reset --force

# Verify after reset
npm run db:seed:verify
```

---

## Security Considerations

### Test Passwords

- **NOT for production use**
- Simple passwords for dev/demo only
- All accounts use `*123` pattern
- Clearly marked as test accounts (`.test` domain)

### UUID Disclosure

- Deterministic UUIDs are public knowledge
- Acceptable for dev/staging/demo
- **Never use in production**
- Prod environments should use random UUIDs

### RLS Protection

- Seed data respects existing RLS policies
- Patients can only see own data
- Clinicians scoped to org
- Admin has elevated access within org

---

## Future Enhancements

### Optional Additions

1. **More Test Data**
   - Sample assessments with completed answers
   - Sample reports
   - Sample workup states

2. **Multi-Org Support**
   - Seed multiple organizations
   - Cross-org isolation testing

3. **CI Fixtures**
   - Minimal fixture for unit tests
   - Performance testing fixture

4. **Dashboard Tiles**
   - When dashboard tiles table is added
   - Seed with sample content

### Not Implemented (Out of Scope)

- Production seed data (intentionally omitted for security)
- Real patient data (violates privacy)
- Production-grade passwords
- Random test data generation (conflicts with determinism requirement)

---

## Related Issues

- E6.4.1 — Pilot Scope + Eligibility Gate (prerequisite)
- E6.4.2 — Patient Onboarding Happy Path (validated by AC3)
- E6.4.4 — Workup Status (workup_status enum used)

---

## Done Definition Checklist

- [x] Seed is documented in Runbook
- [x] One-command path exists (`npm run db:reset`)
- [x] Deterministic UUIDs (AC1)
- [x] Runnable pilot (AC2)
- [x] Happy path <5 min (AC3)
- [x] Verification script exists
- [x] All tests pass locally
- [x] Documentation complete

---

**Implemented by:** GitHub Copilot  
**Reviewed by:** (Pending)  
**Merged:** (Pending)

---

## Quick Reference

### One-Command Setup
```bash
npm run db:reset
```

### Test Accounts
```
admin@pilot.test / admin123
clinician@pilot.test / clinician123
patient1@pilot.test / patient123 (onboarded)
patient2@pilot.test / patient123 (onboarded)
patient3@pilot.test / patient123 (not onboarded - for testing)
```

### Verify Seed
```bash
npm run db:seed:verify
```

### Pilot Organization
```
ID: 00000000-0000-0000-0000-000000000001
Slug: pilot-org
```

### Pilot Funnels
```
stress-assessment (mental-health, 10 min)
sleep-quality (sleep, 8 min)
```
