# Rules vs Checks Matrix — E78.9 Inbox Tests & Docs

## Overview

This document maps Inbox/Triage system rules to their corresponding check implementations. Every rule MUST have at least one check, and every check MUST reference at least one rule.

**Format:** Violations output `violates R-XXX` where R-XXX is the rule identifier.

**Status:** ✅ Complete (9 rules defined, 3 check scripts implemented)

## Rule Categories

- **R-E78.9**: Contract tests and documentation for Inbox/Triage system

## Rules → Checks Mapping

### Contract and Response Shape (R-E78.9-001 to R-E78.9-002)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.9-001 | Response shape must include case_state, attention_items, next_action | 🔴 Block | `test/e78-9-inbox-contracts.test.ts` | ✅ Implemented |
| R-E78.9-002 | Query parameters (activeOnly, status, attention) must be validated | 🔴 Block | `test/e78-9-inbox-contracts.test.ts` | ✅ Implemented |

### Determinism (R-E78.9-003 to R-E78.9-005)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.9-003 | Same data must produce same attention_items | 🔴 Block | `test/e78-9-inbox-contracts.test.ts`, `smoke-e78-9-inbox.mts` | ✅ Implemented |
| R-E78.9-004 | Same data must produce same case_state | 🔴 Block | `test/e78-9-inbox-contracts.test.ts`, `smoke-e78-9-inbox.mts` | ✅ Implemented |
| R-E78.9-005 | Priority score must be deterministic | 🔴 Block | `test/e78-9-inbox-contracts.test.ts`, `smoke-e78-9-inbox.mts` | ✅ Implemented |

### Functional Behavior (R-E78.9-006 to R-E78.9-008)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.9-006 | activeOnly filter must exclude resolved cases | 🔴 Block | `smoke-e78-9-inbox.mts` | ✅ Implemented |
| R-E78.9-007 | Sorting by priority_score DESC, assigned_at ASC must work | 🔴 Block | `smoke-e78-9-inbox.mts` | ✅ Implemented |
| R-E78.9-008 | API must return valid response shape | 🔴 Block | `smoke-e78-9-inbox.mts` | ✅ Implemented |

### Documentation (R-E78.9-009)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.9-009 | Documentation must be current and in repository | ⚠️ Warn | Manual review | ✅ Implemented |

## Checks → Rules Mapping

### `test/e78-9-inbox-contracts.test.ts`

**Purpose:** Contract tests for Inbox/Triage API response shapes and determinism

**Rules Enforced:**
- R-E78.9-001: Response shape validation (case_state, attention_items, next_action)
- R-E78.9-002: Query parameter validation
- R-E78.9-003: Deterministic attention_items computation
- R-E78.9-004: Deterministic case_state computation
- R-E78.9-005: Deterministic priority_score computation

**Test Categories:**
1. Response Shape Validation
   - Complete triage case schema
   - Required fields presence
   - Enum value validation (case_state, attention_level, next_action)
   - Array type validation (attention_items)
   - Bounded value validation (priority_score 0-1000)

2. Full Response Validation
   - Complete triage response structure
   - Multiple cases handling
   - Error response validation

3. Determinism Checks
   - case_state consistency
   - attention_items consistency
   - priority_score consistency

4. Query Parameter Validation
   - Valid status values
   - Invalid status rejection
   - Valid attention values
   - Invalid attention rejection

**Usage:**
```bash
npm test -- e78-9-inbox-contracts
# Or
jest test/e78-9-inbox-contracts.test.ts
```

**Exit Code:** 
- 0 if all tests pass
- 1 if any test fails

**Status:** ✅ Implemented

---

### `scripts/ci/smoke-e78-9-inbox.mts`

**Purpose:** Smoke test for Inbox/Triage API with minimal fixtures

**Rules Enforced:**
- R-E78.9-003: Same data produces same attention_items
- R-E78.9-004: Same data produces same case_state
- R-E78.9-005: Priority score is deterministic
- R-E78.9-006: activeOnly filter excludes resolved cases
- R-E78.9-007: Sorting by priority_score DESC, assigned_at ASC works
- R-E78.9-008: API returns valid response shape

**Test Flow:**
1. Initialize Supabase client
2. Seed minimal test fixtures
   - Create test patient
   - Create active assessment (in_progress)
   - Create resolved assessment (delivered)
3. Test activeOnly filter
   - Query with `is_active=true`
   - Verify no resolved cases returned
4. Test sorting
   - Query with ORDER BY priority_score DESC, assigned_at ASC
   - Verify correct sort order
5. Test response shape
   - Verify all required fields present
   - Validate field types
6. Test determinism
   - Query same assessment twice
   - Verify identical results (case_state, attention_items, priority_score)
7. Cleanup test fixtures

**Usage:**
```bash
# Requires Supabase connection
SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/ci/smoke-e78-9-inbox.mts

# Or via npm script
npm run smoke:inbox
```

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY` — Service role key
- `API_BASE_URL` (optional) — API base URL for HTTP tests

**Exit Code:**
- 0 if all checks pass
- 1 if any check fails
- 2 if fatal error (setup failure, connection error)

**Output Format:**
```
✅ E78.9-006 (R-E78.9-006): activeOnly filter excludes resolved cases
✅ E78.9-007 (R-E78.9-007): Sorting by priority_score DESC, assigned_at ASC works
✅ E78.9-008 (R-E78.9-008): API returns valid response shape
✅ E78.9-004 (R-E78.9-004): case_state is deterministic
✅ E78.9-003 (R-E78.9-003): attention_items is deterministic
✅ E78.9-005 (R-E78.9-005): priority_score is deterministic

📊 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Passed: 6
❌ Failed: 0

✅ E78.9 smoke test PASSED
```

**Status:** ✅ Implemented

---

### Documentation Files

**Purpose:** Provide comprehensive guides for triage system usage and configuration

**Rules Enforced:**
- R-E78.9-009: Documentation is current and accessible

**Files Created:**
1. `docs/triage/how-to-triage.md`
   - User guide for clinicians
   - Understanding case states
   - Attention items and priority
   - Filtering and searching
   - Working with cases
   - Workflows and best practices

2. `docs/triage/how-to-interpret-statuses.md`
   - Technical reference for statuses
   - Detailed state logic (SQL conditions)
   - Attention item rules
   - Attention level computation
   - Next action determination
   - State transitions
   - Deterministic logic guarantees
   - Troubleshooting guide

3. `docs/triage/how-to-configure-sla.md`
   - Administrator guide for SLA setup
   - SLA types (completion, review, critical)
   - Configuration methods (ENV, database)
   - Precedence rules
   - Testing SLA configuration
   - Monitoring SLA compliance
   - Troubleshooting

**Status:** ✅ Implemented

---

## CI Integration

### Jest Tests

**File:** `package.json` (add script)

```json
{
  "scripts": {
    "test:inbox": "jest test/e78-9-inbox-contracts.test.ts",
    "smoke:inbox": "node scripts/ci/smoke-e78-9-inbox.mts"
  }
}
```

**Runs:**
- On pull request
- On push to main
- Before deployment

---

### Smoke Tests

**When to Run:**
- After database migrations
- After schema changes
- Before production deployment
- Weekly regression test

**Prerequisites:**
- Supabase instance available
- Service role key configured
- Database migrations applied

---

## Audit Results

### Rules Without Checks

✅ **None** — All 9 rules have corresponding checks or documentation

### Checks Without Rules

✅ **None** — All checks reference specific rules

### Scope Mismatches

✅ **None** — All checks validate the rules they claim to validate

---

## Implementation Checklist

### Tests
- [x] `test/e78-9-inbox-contracts.test.ts` — Contract tests
- [x] Response shape validation
- [x] Query parameter validation
- [x] Determinism checks

### Scripts
- [x] `scripts/ci/smoke-e78-9-inbox.mts` — Smoke test
- [x] Test fixture seeding
- [x] activeOnly filter test
- [x] Sorting test
- [x] Determinism test
- [x] Cleanup logic

### Documentation
- [x] `docs/triage/how-to-triage.md` — Clinician guide
- [x] `docs/triage/how-to-interpret-statuses.md` — Technical reference
- [x] `docs/triage/how-to-configure-sla.md` — Admin guide
- [x] `docs/triage/RULES_VS_CHECKS_MATRIX_E78_9.md` (this file)

### CI/CD
- [ ] Add `test:inbox` to GitHub Actions workflow
- [ ] Add `smoke:inbox` to deployment pipeline
- [ ] Configure environment variables for smoke test
- [ ] Set up Supabase connection in CI

---

## Usage for Developers

### Running Tests Locally

```bash
# Run contract tests
npm test -- e78-9-inbox-contracts

# Run smoke test (requires Supabase)
SUPABASE_SERVICE_ROLE_KEY=your-key npm run smoke:inbox

# Run all inbox tests
npm run test:inbox && npm run smoke:inbox
```

### Understanding Violations

When a check fails, look for output like:

```
❌ E78.9-001 (R-E78.9-001): Response shape validation failed
   Details: Missing required field: attention_items
   ❌ violates R-E78.9-001
```

1. **E78.9-001** is the check ID
2. **R-E78.9-001** is the rule ID being violated
3. Look up the rule in this document
4. Review the rule description and severity
5. Fix the violation or update the spec

---

## Maintenance

### Adding a New Rule

1. Choose rule ID: `R-E78.9-XXX` (next available number)
2. Add to rules table with severity (Block/Warn)
3. Create or update check script to validate rule
4. Add test case in `test/e78-9-inbox-contracts.test.ts` or `smoke-e78-9-inbox.mts`
5. Update this document
6. Test locally before committing

### Modifying a Rule

1. Update rule description in this document
2. Update corresponding check logic
3. Update severity if needed
4. Test changes locally
5. Document change in commit message

### Deprecating a Rule

1. Mark rule as ⚠️ Deprecated in table
2. Update check script to skip rule
3. Leave in documentation for historical reference
4. After 2 releases, remove from tables

---

## Version History

- **v1.0** (2026-02-07): Initial implementation for E78.9
  - 9 rules defined for Inbox/Triage system
  - 2 check scripts implemented (contract tests + smoke test)
  - 3 documentation guides created
  - Zero drift: all rules have checks, all checks have rules

---

## Related Documentation

- [Inbox Logic Specification](./inbox-v1.md) — Complete technical spec
- [E78.3 Triage API](./RULES_VS_CHECKS_MATRIX_E78_3.md) — API endpoint rules
- [E78.2 Triage View](./RULES_VS_CHECKS_MATRIX_E78_2.md) — Database view rules
- [Main Rules Matrix](/RULES_VS_CHECKS_MATRIX.md) — Global rules matrix
