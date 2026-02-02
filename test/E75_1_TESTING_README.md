# E75.1 — Anamnese Tables Testing Guide

## Overview

This directory contains test files for E75.1 — Anamnese Tables v1 + RLS/Access Model implementation.

## Files

- **`e75-1-anamnesis-rls-tests.sql`** - Automated RLS verification tests
- **`e75-1-anamnesis-test-data.sql`** - Test data setup and manual verification queries

## Running Tests

### Prerequisites

- Supabase local development setup
- Migration `20260202074325_e75_1_create_anamnesis_tables.sql` applied

### Step 1: Apply Migration

```bash
# From repository root
npm run db:reset  # Or apply migration individually
```

### Step 2: Run Automated RLS Tests

```bash
# From repository root
psql -U postgres -d rhythmologicum_connect -f test/e75-1-anamnesis-rls-tests.sql
```

**Expected Output:**
```
=== E75.1 Anamnesis RLS Verification Tests ===

--- Test 1: Verify RLS enabled on anamnesis tables ---
 tablename                    | rls_status
------------------------------+------------
 anamnesis_entries            | ENABLED
 anamnesis_entry_versions     | ENABLED
(2 rows)

...

NOTICE:  RLS Enabled Tables: 2 of 2
NOTICE:  Total Policies: 11 (expected: 11)
NOTICE:  Indexes: 6 (expected: 6)
NOTICE:  Triggers: 2 (expected: 2)
NOTICE:  PASS: All E75.1 RLS verification checks passed
```

### Step 3: Create Test Data

```bash
# From repository root
psql -U postgres -d rhythmologicum_connect -f test/e75-1-anamnesis-test-data.sql
```

**Expected Output:**
```
=== E75.1 Test Data Setup ===

--- Creating test organizations ---
Created 2 test organizations

--- Creating patient profiles ---
Created 3 patient profiles

...

=== Test Data Setup Complete ===
```

### Step 4: Manual RLS Testing (Optional)

To fully verify RLS policies, you need to test with different user contexts. This typically requires:

1. **Using Supabase client with authenticated users**
2. **Setting JWT claims for each user role**
3. **Querying anamnesis_entries with different user contexts**

#### Example Test Cases

**Test Case 1: Patient Isolation (R-E75.1-1)**

- User: Patient A1 (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`)
- Expected: Can see only entry `e1e1e1e1` (own entry)
- Expected: Cannot see entries `e2e2e2e2`, `e3e3e3e3`

**Test Case 2: Clinician Assignment (R-E75.1-4)**

- User: Clinician C1 (`cccccccc-cccc-cccc-cccc-cccccccccccc`)
- Expected: Can see entry `e1e1e1e1` (assigned to Patient A1)
- Expected: Cannot see `e2e2e2e2` (not assigned)
- Expected: Cannot see `e3e3e3e3` (different org)

**Test Case 3: Unassigned Clinician**

- User: Clinician C2 (`cccccccc-cccc-cccc-cccc-cccccccccccd`)
- Expected: Cannot see any entries (no assignments)

**Test Case 4: Admin Org Isolation (R-E75.1-7)**

- User: Admin D1 (`dddddddd-dddd-dddd-dddd-dddddddddddd`)
- Expected: Can see entries `e1e1e1e1`, `e2e2e2e2` (Org A)
- Expected: Cannot see `e3e3e3e3` (Org B)

**Test Case 5: Version History Access (R-E75.1-9 to R-E75.1-11)**

- Same access rules apply to `anamnesis_entry_versions`
- Users can only see version history for entries they can access

### Step 5: Verify Versioning Trigger

```sql
-- Update an entry to create a new version
UPDATE public.anamnesis_entries
SET title = 'Updated Medical History - Patient A1',
    content = '{"conditions": ["hypertension", "diabetes", "asthma"]}'::jsonb
WHERE id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

-- Check that version 2 was created
SELECT version_number, title, changed_at
FROM public.anamnesis_entry_versions
WHERE entry_id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'
ORDER BY version_number;

-- Expected: 2 rows (version 1 and version 2)
```

### Step 6: Verify Audit Log

```sql
-- Check audit log entries
SELECT 
    action,
    entity_type,
    created_at,
    metadata
FROM public.audit_log
WHERE entity_type = 'anamnesis_entry'
  AND entity_id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'
ORDER BY created_at;

-- Expected: At least 2 entries (created, updated)
```

## Cleanup

To remove test data:

```bash
# Run the cleanup commands from e75-1-anamnesis-test-data.sql
psql -U postgres -d rhythmologicum_connect -c "DELETE FROM public.anamnesis_entries WHERE id IN ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3');"
# ... etc (see cleanup section in test data script)
```

## Rule Coverage

All rules defined in `docs/e7/E75_1_RULES_VS_CHECKS_MATRIX.md` are covered by these tests:

- **R-E75.1-1 to R-E75.1-11:** RLS policies (automated + manual tests)
- **R-E75.1-12 to R-E75.1-16:** Schema integrity (automated tests)
- **R-E75.1-17:** Cross-org isolation (manual test)
- **R-E75.1-18:** Versioning trigger (manual test)
- **R-E75.1-19:** Audit log integration (manual test)
- **R-E75.1-20:** Migration idempotency (code review)

## Troubleshooting

### Issue: RLS tests fail with "relation does not exist"

**Solution:** Ensure migration has been applied first.

```bash
npm run db:reset
```

### Issue: Test data creation fails with foreign key violation

**Solution:** Ensure `patient_profiles` table exists and is populated with test users.

### Issue: Policies not working as expected

**Solution:** Verify that:
1. RLS is enabled on both tables
2. User context is properly set (via Supabase Auth JWT)
3. User has correct role in `user_org_membership`
4. Clinician has assignment in `clinician_patient_assignments` (if applicable)

### Issue: Versions not created automatically

**Solution:** Check that triggers are properly attached:

```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'anamnesis_entries'
  AND trigger_name LIKE '%anamnesis%';
```

## References

- Migration: `supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql`
- Rules Matrix: `docs/e7/E75_1_RULES_VS_CHECKS_MATRIX.md`
- Issue: E75.1 — DB Schema: Anamnese Tables v1 + RLS/Access Model
