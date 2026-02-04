# RULES_VS_CHECKS_MATRIX E76.8 Update

**Epic**: E76.8 - Determinism & Idempotenz: inputs_hash + Dedupe Policy  
**Date**: 2026-02-04  
**Status**: Complete

## New Rules Added (9 total)

### R-E76.8-001: inputs_meta Column in diagnosis_runs

**Rule Text**: The `diagnosis_runs` table must have an `inputs_meta` JSONB column to store context pack metadata (patient_id, anamnesis_ids, funnel_run_ids, demographics, measures).

**Scope**:
- `supabase/migrations/20260204164641_e76_8_add_inputs_meta.sql`
- Database table: `diagnosis_runs`

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkInputsMetaMigration)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- Migration file exists
- Contains `inputs_meta jsonb` column definition
- Has E76.8 documentation comment
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-001: inputs_meta column must exist in diagnosis_runs table migration"
- Console: "❌ [INPUTS_META_COLUMN_MISSING] violates R-E76.8-001" (on failure)

**Known Gaps**: Does not validate runtime column existence in database

**Owner**: E76 / Diagnosis Team

---

### R-E76.8-002: Deduplication Logic Module Exists

**Rule Text**: A deduplication logic module must exist at `lib/diagnosis/dedupe.ts` containing `checkDuplicateRun()` and `extractInputsMeta()` functions.

**Scope**:
- `lib/diagnosis/dedupe.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkDedupeModule)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- File exists at expected path
- Contains `export async function checkDuplicateRun`
- Contains `export function extractInputsMeta`
- Has E76.8 documentation comment
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-002: Deduplication logic module must exist at lib/diagnosis/dedupe.ts"
- Console: "❌ [DEDUPE_MODULE_MISSING] violates R-E76.8-002" (on failure)

**Known Gaps**: Does not validate function signatures or runtime behavior

**Owner**: E76 / Diagnosis Team

---

### R-E76.8-003: Deduplication Checks inputs_hash

**Rule Text**: The deduplication logic must query for existing runs by `inputs_hash` to detect duplicates.

**Scope**:
- `lib/diagnosis/dedupe.ts` (`checkDuplicateRun` function)

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkDedupeModule)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- Contains `.eq('inputs_hash'` or `.inputs_hash` in dedupe check
- Queries `diagnosis_runs` table
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-003: Deduplication must check inputs_hash for duplicates"
- Console: "❌ [DEDUPE_HASH_CHECK_MISSING] violates R-E76.8-003" (on failure)

**Known Gaps**: Static code check only; does not verify runtime query behavior

**Owner**: E76 / Diagnosis Team

---

### R-E76.8-004: inputs_meta Extraction Function

**Rule Text**: The `extractInputsMeta()` function must exist to extract metadata from context pack for persistence.

**Scope**:
- `lib/diagnosis/dedupe.ts` (`extractInputsMeta` function)

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkDedupeModule)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- Function is exported
- Has proper signature with context pack parameter
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-004: inputs_meta extraction function must exist"
- Console: "❌ [INPUTS_META_EXTRACTION_MISSING] violates R-E76.8-004" (on failure)

**Known Gaps**: Does not validate extracted metadata structure

**Owner**: E76 / Diagnosis Team

---

### R-E76.8-005: Queue API Route Exists

**Rule Text**: A diagnosis queue API route must exist at `/api/studio/diagnosis/queue` for queueing runs with deduplication.

**Scope**:
- `apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkQueueAPIRoute)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- File exists at expected path
- Has E76.8 documentation comment
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-005: API route /api/studio/diagnosis/queue must exist"
- Console: "❌ [QUEUE_API_ROUTE_MISSING] violates R-E76.8-005" (on failure)

**Known Gaps**: Does not validate API handler implementation

**Owner**: E76 / Diagnosis Team

---

### R-E76.8-006: Queue API Uses Dedupe Logic

**Rule Text**: The queue API must call `checkDuplicateRun()` before creating a new diagnosis run to enforce deduplication policy.

**Scope**:
- `apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkQueueAPIRoute)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- Imports `checkDuplicateRun` from dedupe module
- Calls `checkDuplicateRun()` function
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-006: Queue API must use dedupe logic before creating run"
- Console: "❌ [QUEUE_NO_DEDUPE] violates R-E76.8-006" (on failure)

**Known Gaps**: Static analysis only; does not verify runtime behavior

**Owner**: E76 / Diagnosis Team

---

### R-E76.8-007: Queue API Persists inputs_meta

**Rule Text**: The queue API must persist `inputs_meta` when creating a new diagnosis run.

**Scope**:
- `apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkQueueAPIRoute)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- Imports `extractInputsMeta` from dedupe module
- Includes `inputs_meta` in `.insert()` call
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-007: Queue API must persist inputs_meta"
- Console: "❌ [QUEUE_NO_INPUTS_META] violates R-E76.8-007" (on failure)

**Known Gaps**: Does not verify inputs_meta content or structure

**Owner**: E76 / Diagnosis Team

---

### R-E76.8-008: Literal Callsite for Queue Endpoint

**Rule Text**: A literal callsite for `/api/studio/diagnosis/queue` must exist in the repository (Strategy A compliance).

**Scope**:
- `apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx`

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkLiteralCallsite)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- File contains literal string `'/api/studio/diagnosis/queue'`
- Has E76.8 documentation comment
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-008: Literal callsite for /api/studio/diagnosis/queue must exist"
- Console: "❌ [QUEUE_LITERAL_CALLSITE_MISSING] violates R-E76.8-008" (on failure)

**Known Gaps**: Does not verify callsite is reachable or functional

**Owner**: E76 / Diagnosis Team

---

### R-E76.8-009: Dedupe Policy Logs Warnings

**Rule Text**: The deduplication policy must log warnings (console.warn) when duplicate runs are detected.

**Scope**:
- `lib/diagnosis/dedupe.ts` (`checkDuplicateRun` function)

**Enforced By**:
- Script: `scripts/ci/verify-e76-8-idempotency.mjs` (checkDedupeModule)
- NPM script: `npm run verify:e76-8`

**Pass Condition**:
- Contains `console.warn` call
- Warning message includes "DEDUPE WARNING" marker
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✓ R-E76.8-009: Dedupe policy must log warnings for duplicates"
- Console: "❌ [DEDUPE_NO_WARNING_LOG] violates R-E76.8-009" (on failure)

**Known Gaps**: Static check only; does not verify runtime logging behavior

**Owner**: E76 / Diagnosis Team

---

## Summary Statistics

**Rules Added**: 9  
**Checks Added**: 4 (across 9 rules)  
**Coverage**: 100% (all rules have checks)  
**Verification Script**: `scripts/ci/verify-e76-8-idempotency.mjs`  
**NPM Script**: `npm run verify:e76-8`

## Files Changed

### Created (4 files)
1. `supabase/migrations/20260204164641_e76_8_add_inputs_meta.sql` - Database migration
2. `lib/diagnosis/dedupe.ts` - Deduplication logic module
3. `apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts` - Queue API route
4. `scripts/ci/verify-e76-8-idempotency.mjs` - Verification script

### Modified (2 files)
1. `apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx` - Added literal callsite
2. `package.json` - Added `verify:e76-8` script

## Integration with Existing Rules

E76.8 extends the E76.x series (MCP/Diagnosis epics):
- E76.1: MCP Server basics
- E76.2: Context Pack Builder (provides inputs_hash calculation)
- E76.4: Diagnosis Worker
- E76.5: Diagnosis Prompt
- **E76.8: Idempotency & Deduplication** (this epic)

E76.8 reuses the stable `inputs_hash` from E76.2 (contextPackBuilder.ts) and adds deduplication policy on top.

## Verification

Run verification:
```bash
npm run verify:e76-8
```

Expected output:
```
✅ All E76.8 guardrails satisfied

Verified 9 rules:
  ✓ R-E76.8-001: inputs_meta column must exist in diagnosis_runs table migration
  ✓ R-E76.8-002: Deduplication logic module must exist at lib/diagnosis/dedupe.ts
  ✓ R-E76.8-003: Deduplication must check inputs_hash for duplicates
  ✓ R-E76.8-004: inputs_meta extraction function must exist
  ✓ R-E76.8-005: API route /api/studio/diagnosis/queue must exist
  ✓ R-E76.8-006: Queue API must use dedupe logic before creating run
  ✓ R-E76.8-007: Queue API must persist inputs_meta
  ✓ R-E76.8-008: Literal callsite for /api/studio/diagnosis/queue must exist
  ✓ R-E76.8-009: Dedupe policy must log warnings for duplicates
```
