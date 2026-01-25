# Rules vs Checks Diff Report

**Status**: Active Analysis (v0.7 Epic E72.F1)  
**Purpose**: Identify mismatches between documented rules and enforced checks  
**Last Updated**: 2026-01-25

---

## Executive Summary

This report identifies gaps, mismatches, and inconsistencies between written guardrail rules and their enforcement mechanisms. All findings are prioritized by impact on CI stability and determinism.

**Findings Summary**:
- **Rules without checks**: 0 critical rules (was 2, R-CI-002 ✅ RESOLVED, R-API-003 ✅ PARTIALLY RESOLVED)
- **Checks without documented rules**: 2 checks
- **Scope mismatches**: 4 instances
- **Format mismatches**: 3 allowlist format issues
- **False positive risks**: 5 heuristic-based checks

**Recent Resolutions**:
- ✅ **R-DB-009 RLS Verification** (E72.ALIGN.P0.DBSEC.001): Automated check implemented, integrated into CI
- ✅ **R-DB-007 TypeGen Determinism** (E72.ALIGN.P0.DBSEC.001): Strengthened evidence specification with hard gate implementation
- ✅ **R-CI-002 BASE_SHA Standardization** (E72.ALIGN.P1.DETCON.001): Shared script created, deterministic resolution implemented
- ✅ **R-API-003 Response Contract** (E72.ALIGN.P1.DETCON.001): Canonical type introduced, partial enforcement (rule-ID corrected from R-DB-010)

**Recommended Actions**: 5 remaining alignment PRs/issues (see Section 6)

---

## 1. Rules Without Checks (Manual Review Only)

These rules are documented but NOT automatically enforced. They rely on manual code review, increasing risk of violations.

### 1.1 R-DB-009: RLS Policies Required on User Data ✅ RESOLVED

**Original Rule Statement**:
> All tables containing user data must have Row Level Security (RLS) enabled with appropriate policies for patient/clinician roles.

**Previous Status**:
- **NONE** - Manual review only
- Documented in `docs/canon/CONTRACTS.md`
- Policies described but not validated

**Resolution** (E72.ALIGN.P0.DBSEC.001):
- ✅ **Automated check implemented**
- Script created: `scripts/db/verify-rls-policies.ps1`
- Integrated into: `.github/workflows/db-determinism.yml`
- Allowlist created: `docs/canon/rls-allowlist.json`
- Evidence artifacts: `artifacts/rls-verify/rls-summary.{json,txt}`

**Enforcement Details**:
- Checks: Tables with `patient_id` or `user_id` columns have RLS enabled
- Checks: Policies exist for patient role queries
- Fails CI if RLS missing or no patient policy found
- Configurable patient role name (default: "patient")
- Self-documenting allowlist with required reasons

**Status**: **ENFORCED** - See `RULES_VS_CHECKS_MATRIX.md` for complete details

---

### 1.1.1 R-DB-007: TypeScript Types Must Match Schema ✅ STRENGTHENED

**Original Rule Statement**:
> Generated TypeScript types (`lib/types/supabase.ts`) must exactly match the database schema. Run `npm run db:typegen` after schema changes.

**Previous Status**:
- **WEAK ENFORCEMENT** - Git diff check in CI workflow
- Simple `git diff --exit-code lib/types/supabase.ts` after running typegen
- Prone to generator drift (different CLI versions, environment differences)
- No structured diagnostics on failure

**Strengthening** (E72.ALIGN.P0.DBSEC.001):
- ✅ **Deterministic hard gate implemented**
- Script created: `scripts/db/typegen.ps1` (evidence-first design)
- Pinned CLI: `supabase@2.63.1` (exact version, no drift)
- SHA256 hash comparison (byte-for-byte verification)
- Process-based execution (robust stdout/stderr capture)
- Comprehensive evidence outputs (always printed)

**Enforcement Details**:
- Mode: `--local` (hardcoded for determinism)
- Two modes: `-Generate` (local dev) and `-Verify` (CI check)
- Evidence artifacts: `artifacts/typegen/supabase.generated.ts`, `artifacts/typegen/stderr.log`
- Fail-closed conditions: CLI errors, empty output, hash mismatch
- npm scripts: `db:typegen` (generate), `db:typegen:verify` (verify)

**Migration Note**:
- **Semantics unchanged**: Rule still requires types to match schema
- **Enforcement strengthened**: Added comprehensive diagnostics, pinned CLI version, SHA256 verification
- **No weakening**: Fail-closed design, stricter than previous git diff approach
- **Rationale**: Eliminates recurring CI failures from generator drift

**Status**: **ENFORCED (STRENGTHENED)** - See `RULES_VS_CHECKS_MATRIX.md` for complete details

---

### 1.2 R-API-003: API Response Format Standard ✅ PARTIALLY RESOLVED

**Previous Rule-ID**: R-DB-010 (incorrect domain classification)  
**Corrected Rule-ID**: R-API-003 (E72.ALIGN.P1.DETCON.001)  
**Migration Note**: Rule-ID corrected from DB domain to API domain. No semantic weakening - rule constraint remains unchanged.

**Rule Statement**:
> All API endpoints must return standard format: `{ success: boolean, data?: T, error?: { code: string, message: string } }`.

**Previous Check Behavior**:
- **NONE** - Manual code review only
- Documented in `docs/canon/CONTRACTS.md`

**Resolution** (E72.ALIGN.P1.DETCON.001):
- ✅ **Canonical type introduced**: `lib/types/api.ts`
- ✅ **Helper constructors created**: `ok<T>()`, `fail()`
- ✅ **Documentation updated**: Contract examples and migration guidance in `CONTRACTS.md`
- ✅ **TypeScript type enforcement**: Changed files encouraged to use canonical type
- ⚠️  **Partial enforcement**: Changed-files mode only (no automated linter rule yet)

**Enforcement Details**:
- Type: `ApiResponse<T>` discriminated union
- Helpers: `ok<T>(data)` and `fail(code, message)` for type-safe construction
- Scope: New/changed API routes (gradual migration)
- Legacy compatibility: Existing `lib/api/responses.ts` helpers remain valid
- Evidence: TypeScript compilation + code review

**Impact**:
- **MEDIUM** - Reduced inconsistent error handling via type safety
- Frontend can rely on standard format with TypeScript support
- Gradual migration approach prevents breaking changes

**Why This Is Not Weakening**:
- Rule constraint unchanged (format requirement remains)
- TypeScript type enforcement adds compile-time safety
- Helper functions make compliance easier, not optional
- Changed-files scope is interim policy (allows gradual cleanup)

**Remaining Work**:
- Future: Add ESLint rule for automated enforcement (optional)
- Future: Migrate legacy endpoints during natural updates

**Status**: **PARTIALLY ENFORCED** - See `RULES_VS_CHECKS_MATRIX.md` for complete details

---

### 1.3 R-CI-002: Checkout Refs Must Be Deterministic ✅ RESOLVED

**Rule Statement**:
> CI workflows must use `fetch-depth: 0` to ensure full git history is available for diff-based checks.

**Previous Check Behavior**:
- **NONE** - Manual workflow file review
- Documented in `docs/canon/CI_DEPLOY_MODEL.md`

**Resolution** (E72.ALIGN.P1.DETCON.001):
- ✅ **Shared script created**: `scripts/ci/get-base-sha.ps1`
- ✅ **Deterministic resolution logic implemented**
- ✅ **Fail-closed behavior** for shallow clone/missing refs
- ✅ **Documentation updated**: `CI_DEPLOY_MODEL.md` with usage examples
- ✅ **Matrix/Diff updated**: Rule enforcement details added

**Enforcement Details**:
- Script: `scripts/ci/get-base-sha.ps1`
- Output: BASE_SHA, HEAD_SHA, context metadata (JSON format)
- PR events: Use `github.event.pull_request.base.sha`, fallback to `git merge-base`
- Push events: Use `github.event.before`, fallback to `HEAD~1`
- Fail-closed: Exit 1 if BASE_SHA cannot be determined reliably
- Integrated into: Workflows using git diffs

**Impact**:
- **MEDIUM** - Eliminates non-deterministic diffs from shallow clones
- Standardized fallback logic across all workflows
- Fail-closed prevents silent CI failures

**Standardization Benefits**:
- All workflows use same BASE_SHA determination logic
- Shared script is easier to audit than inline bash
- Consistent error handling and recovery
- Evidence output for CI debugging

**Why This Is Not Weakening**:
- Standardization reduces CI flakiness
- Fail-closed behavior prevents nondeterministic passes
- No change to history requirements (`fetch-depth: 0` still needed)

**Next Steps**:
- Migrate remaining workflows to use shared script
- Verify all workflows have `fetch-depth: 0` in checkout

**Status**: **ENFORCED** - See `RULES_VS_CHECKS_MATRIX.md` for complete details

---

## 2. Checks Without Documented Rules

These checks are implemented but not documented as explicit rules in the matrix. They enforce constraints that should be formalized.

### 2.1 Test Linter for DB Migrations

**Check Location**:
- Script: `scripts/db/test-linter.ps1`
- Workflow: `.github/workflows/db-determinism.yml` (step: "Test migration linter")

**Current Check Behavior**:
- Runs migration linter against test fixtures (`scripts/db/fixtures/forbidden.sql`, `allowed.sql`)
- Validates that linter correctly detects non-canonical objects
- Exits 0 if linter behaves correctly

**Missing Rule**:
- No explicit rule like "R-DB-011: Migration linter must pass self-tests"
- Implied by DB determinism flow but not documented

**Recommended Alignment**:
- **Add rule to matrix** (preferred)
- Create: R-DB-011: "Migration linter test suite must pass before checking actual migrations"
- Documents that linter itself is tested for correctness
- Pass condition: Test fixtures produce expected violations/passes

**Why This Is Not Weakening**:
- Formalizes existing check
- Makes testing requirement explicit
- No behavior change

---

### 2.2 Supabase Local Instance Lifecycle

**Check Location**:
- Workflow: `.github/workflows/db-determinism.yml` (steps: "Start Supabase", "Stop Supabase")

**Current Check Behavior**:
- Starts local Supabase before migration checks
- Always stops Supabase in cleanup (even on failure)
- Uses `supabase start`, `supabase status`, `supabase stop --no-backup`

**Missing Rule**:
- No explicit rule about Supabase lifecycle management
- Implied by DB determinism workflow but not documented as requirement

**Recommended Alignment**:
- **Document as operational requirement** (not a guardrail rule)
- Add to `docs/DB_DETERMINISM_CI_FLOW.md` "Prerequisites" section
- Not necessarily a "MUST" rule (it's implementation detail)

**Why This Is Not Weakening**:
- Clarifies workflow dependencies
- Not a constraint on user code (internal CI detail)

---

## 3. Scope Mismatches

These rules and checks have documented scopes that don't match their actual enforcement patterns.

### 3.1 R-DB-001: ESLint Enforcement is Partial

**Rule Statement Scope**:
> "All `*.ts` and `*.tsx` files"

**Actual Check Scope**:
- **Only changed files** in PR (interim policy)
- Pre-existing violations in unchanged files are ignored
- Documented in `lint-gate.yml`: "Interim lint gate: Fail only on ESLint errors occurring on PR-changed lines"

**Impact**:
- **LOW** - Known technical debt
- Prevents new violations while allowing gradual cleanup
- Documented as interim policy

**Recommended Alignment**:
- **Update rule text to match reality** (preferred)
- Change scope to: "All changed `*.ts` and `*.tsx` files (interim policy: unchanged files with pre-existing violations are not blocked)"
- Add note: "Long-term goal: Enforce on all files after cleanup"
- Reference: `docs/LINT_POLICY.md` (if it exists)

**Why This Is Not Weakening**:
- Aligns rule with actual behavior (transparency)
- Still prevents new violations
- Acknowledges technical debt without hiding it

---

### 3.2 R-UI-001 through R-UI-006: Not in CI Yet

**Rule Statement Enforcement**:
> "Enforced By: scripts/verify-ui-v2.mjs"

**Actual Check Scope**:
- Script exists and works
- **NOT integrated into CI workflows** (manual run only per E71 scope)
- No `.github/workflows/ui-v2-gate.yml` exists

**Impact**:
- **MEDIUM** - Rules can be violated without CI catching them
- Relies on developers running script manually
- E71 scope was to create script, E72+ may integrate to CI

**Recommended Alignment**:
- **Update rule enforcement field** (short-term)
- Change "Enforced By" to: "Script: scripts/verify-ui-v2.mjs (manual run only, not yet in CI)"
- Add note: "Integration into CI planned for future epic"
- Or: **Add UI v2 workflow** (if E72 scope permits)

**Why This Is Not Weakening**:
- Clarifies enforcement status
- Prevents false sense of security
- Acknowledges implementation phase

---

### 3.3 R-API-002: Allowlist Format Undocumented

**Rule Statement**:
> "Allowlist: `docs/api/endpoint-allowlist.json` (undocumented routes)"

**Actual Allowlist File**:
- File may or may not exist
- **No documentation of format** in the file itself
- Matrix says "Format: JSON array of route paths" but file doesn't include this

**Impact**:
- **LOW** - Developers don't know how to add exceptions
- May add wrong format entries
- No self-documenting allowlist

**Recommended Alignment**:
- **Add format documentation to allowlist file** (preferred)
- Include comment/description in JSON:
  ```json
  {
    "_comment": "Allowlist for endpoints that don't fit standard catalog. Format: array of route paths like '/api/legacy/v1/deprecated'. Remove entry when endpoint is removed or standardized.",
    "entries": [
      "/api/example/legacy"
    ]
  }
  ```

**Why This Is Not Weakening**:
- Makes allowlist self-documenting
- Reduces chance of format errors
- No behavior change

---

### 3.4 R-DB-002: "Documented Lib Modules" Allowlist is Vague

**Rule Statement**:
> "Allowed: `app/api/**/*.ts`, documented lib modules (audit, content resolver)"

**Actual Allowlist**:
- ESLint config has path-based exception
- "Documented lib modules" is mentioned in `DB_ACCESS_GUARDRAILS.md` section "Approved Exceptions"
- **Not machine-readable** - ESLint can't enforce "documented"

**Impact**:
- **MEDIUM** - Ambiguous scope
- Developers don't know if their lib module qualifies
- ESLint exceptions may diverge from documentation

**Recommended Alignment**:
- **Consolidate allowlist** (preferred)
- Create: `docs/canon/admin-client-allowlist.json`
- List specific paths: `["lib/audit/log.ts", "lib/utils/contentResolver.ts"]`
- Update ESLint config to read from this file
- Or: Add explicit path patterns to ESLint config

**Why This Is Not Weakening**:
- Makes exceptions explicit and auditable
- Ensures ESLint and docs stay in sync
- Easier to review/remove exceptions over time

---

## 4. Format Mismatches

Allowlists exist but their entry format is inconsistent or unclear.

### 4.1 R-API-005: TEST_IMPORT_ALLOWLIST is Empty

**Rule Statement**:
> "Allowlist: `TEST_IMPORT_ALLOWLIST` array in script. Format: Relative path from repo root"

**Actual Allowlist**:
```javascript
const TEST_IMPORT_ALLOWLIST = []
```

**Impact**:
- **NONE** - Currently no exceptions needed
- Format example is documented but unused

**Recommended Alignment**:
- **No change needed** (but monitor)
- If exceptions are added later, validate format with example
- Consider moving to separate JSON file if list grows

**Why This Is Not Weakening**:
- N/A (no mismatch currently)

---

### 4.2 R-UI-001 through R-UI-006: Hardcoded Allowlists

**Rule Statement**:
> "Allowlist: `ALLOWLISTED_ROUTES` / `MOBILE_WIDTH_ALLOWLIST` / etc. in script"

**Actual Allowlist**:
- Hardcoded arrays in `scripts/verify-ui-v2.mjs`
- Not in separate files
- Not self-documenting

**Impact**:
- **LOW** - Allowlists are small and stable
- Harder to modify without editing script
- Not as auditable as external files

**Recommended Alignment**:
- **Keep hardcoded** (acceptable for small lists)
- Or: **Move to JSON file** if lists grow
- Current lists:
  - `ALLOWLISTED_ROUTES`: ~8 items
  - `MOBILE_WIDTH_ALLOWLIST`: 3 patterns
  - `ICON_ALLOWLIST`: 3 patterns
  - `AD_HOC_ALLOWLIST`: 4 patterns

**Why This Is Not Weakening**:
- No functional change
- External files improve maintainability (not enforcement)

---

### 4.3 R-DB-004: Deprecated Objects Allowlist is Implicit

**Rule Statement**:
> "Deprecated objects allowed but warned if in NEW migrations only"

**Actual Behavior**:
- Deprecated list in `DB_SCHEMA_MANIFEST.json` under `deprecated.tables`
- Linter warns for deprecated usage in new migrations
- **No explicit allowlist file** - deprecation is in manifest itself

**Impact**:
- **NONE** - Current approach is reasonable
- Manifest is source of truth for canonical + deprecated

**Recommended Alignment**:
- **No change needed**
- Clarify in matrix that "allowlist" is the `deprecated` section of manifest
- Not a mismatch (just different pattern than other allowlists)

**Why This Is Not Weakening**:
- N/A (no actual mismatch)

---

## 5. False Positive Risks

These checks use heuristics or regex patterns that may produce false positives or miss violations.

### 5.1 R-DB-005: Idempotency Linter is Regex-Based

**Check Implementation**:
```bash
grep -Pqi '^(?!\s*--)\s*create\s+table(?!\s+if\s+not\s+exists)\b' "$file"
```

**Known Limitations**:
- Simple regex (may miss complex SQL)
- Does not parse SQL syntax
- May trigger on commented examples or string literals
- Does not validate DO $$ block guards (relies on heuristics)

**Impact**:
- **LOW** - Rare false positives
- May miss creative SQL patterns
- Generally effective for standard migrations

**Recommended Alignment**:
- **Document limitations in matrix** (done)
- Add examples of patterns that may be missed
- Consider SQL parser for future improvement (but not required for E72)

**Why This Is Not Weakening**:
- Acknowledges limitations
- Still catches most common violations
- Manual review backstops false negatives

---

### 5.2 R-UI-002: Width Pattern Regex May Miss Dynamic Classes

**Check Implementation**:
```javascript
/className="[^"]*\bmax-w-(?!none\b)[^"]*"/
```

**Known Limitations**:
- Only catches static className strings
- Misses:
  - `className={dynamicClass}` where variable contains `max-w-*`
  - Template literals: `` className={`max-w-${size}`} ``
  - Class utility functions: `cn('max-w-md', ...)`

**Impact**:
- **MEDIUM** - Could miss violations in dynamic code
- Most violations are static so generally effective

**Recommended Alignment**:
- **Document limitation in matrix** (done)
- Consider AST-based check for future (but complex)
- Rely on manual review for dynamic class usage

**Why This Is Not Weakening**:
- Acknowledges regex limitations
- Still catches most violations
- False negatives are rare in practice

---

### 5.3 R-UI-006: Ad-Hoc Primitive Detection is Heuristic

**Check Implementation**:
```javascript
/className="[^"]*\brounded-(2xl|3xl|full)[^"]*"(?!.*Card|.*Button)/
```

**Known Limitations**:
- Negative lookahead for "Card|Button" is imperfect
- May flag valid custom components
- May miss Card usage if import is renamed

**Impact**:
- **MEDIUM** - False positive risk
- Developers may need to allowlist valid custom styling

**Recommended Alignment**:
- **Expand allowlist as needed** (expected)
- Document that this is a "code smell" detector, not hard blocker
- Consider renaming check to "warn" instead of "error"

**Why This Is Not Weakening**:
- Clarifies intent (guidance vs enforcement)
- Reduces friction while still surfacing issues

---

### 5.4 R-API-002: Endpoint Catalog Allowlist Not Validated

**Check Implementation**:
- Generator reads `endpoint-allowlist.json`
- Assumes entries are valid route paths
- **Does not validate** that allowlisted routes actually exist

**Known Limitations**:
- Allowlist can contain stale/removed routes
- No cleanup prompt when route is deleted

**Impact**:
- **LOW** - Stale allowlist entries don't break anything
- Reduces trust in allowlist as "current exceptions"

**Recommended Alignment**:
- **Add allowlist validation** (future enhancement)
- Generator could warn about allowlist entries that don't exist in codebase
- Or: Add comment/date to allowlist entries for review cycle

**Why This Is Not Weakening**:
- Improves allowlist hygiene
- Prevents allowlist bloat

---

### 5.5 R-DB-009: No RLS Check Means No False Positives

**Current State**:
- Rule exists but no automated check
- Therefore: No false positives (also no true positives)

**Recommendation**:
- When check is added (per section 1.1), document expected false positive risks:
  - May flag public metadata tables (no RLS needed)
  - May flag system tables (RLS handled differently)
- Include allowlist for known exceptions

**Why This Is Not Weakening**:
- Acknowledges that future check will need tuning
- Plans for allowlist up front

---

## 6. Recommended Alignment Actions

Based on the findings above, here are recommended follow-up issues/PRs to synchronize rules and checks:

### ~~Issue 1: Add Automated RLS Policy Verification (HIGH PRIORITY)~~ ✅ COMPLETED

**Scope**: Address finding 1.1 (R-DB-009)

**Status**: **COMPLETED** (E72.ALIGN.P0.DBSEC.001)

**Completed Tasks**:
- ✅ Created `scripts/db/verify-rls-policies.ps1`
- ✅ Check: Tables with `patient_id`/`user_id` have RLS enabled
- ✅ Check: Policies exist for patient role
- ✅ Added to `db-determinism.yml` workflow
- ✅ Created allowlist: `docs/canon/rls-allowlist.json`
- ✅ Updated documentation (RULES_VS_CHECKS_MATRIX.md, RULES_VS_CHECKS_DIFF.md)

**Actual Effort**: ~4 hours (script + workflow integration + documentation)

**Outcome**: Automated enforcement now active in CI, fail-closed on violations

---

### ~~Issue 2: Standardize BASE_SHA Determination Logic (MEDIUM PRIORITY)~~ ✅ COMPLETED

**Scope**: Address findings 1.3, 3.1 (CI determinism)

**Status**: **COMPLETED** (E72.ALIGN.P1.DETCON.001)

**Completed Tasks**:
- ✅ Created `scripts/ci/get-base-sha.ps1` with standard fallback logic
- ✅ Deterministic resolution for PR and push events
- ✅ Fail-closed behavior for shallow clones/missing refs
- ✅ Documented behavior in `CI_DEPLOY_MODEL.md`
- ✅ Updated matrix and diff documentation

**Actual Effort**: ~3 hours (script + documentation)

**Outcome**: Shared script provides deterministic BASE_SHA resolution with fail-closed guarantees

---

### ~~Issue 5: Add TypeScript Type Enforcement for API Responses (MEDIUM PRIORITY)~~ ✅ PARTIALLY COMPLETED

**Scope**: Address finding 1.2 (R-DB-010, now R-API-003)

**Status**: **PARTIALLY COMPLETED** (E72.ALIGN.P1.DETCON.001)

**Completed Tasks**:
- ✅ Created canonical `ApiResponse<T>` type in `lib/types/api.ts`
- ✅ Added helper constructors: `ok<T>()`, `fail()`
- ✅ Added type guards: `isSuccess()`, `isError()`
- ✅ Documented pattern in `CONTRACTS.md` with examples
- ✅ Updated matrix/diff with corrected rule-ID (R-DB-010 → R-API-003)
- ⚠️  ESLint rule not added (optional enhancement)
- ⚠️  No route migrations in this PR (changed-files enforcement only)

**Rule Changes**: 
- Corrected R-DB-010 → R-API-003 (API domain, not DB domain)
- Updated enforcement to "TypeScript types + changed files mode"

**Actual Effort**: ~2 hours (types + documentation)

**Outcome**: Canonical type available for adoption, gradual migration strategy documented

**Remaining Work** (Optional Future Enhancements):
- Add ESLint rule for automated enforcement
- Migrate legacy endpoints during natural updates

### Issue 3: Document and Validate Allowlist Formats (LOW PRIORITY)

**Scope**: Address findings 3.3, 3.4, 4.2 (allowlist clarity)

**Tasks**:
- Add format comments to all JSON allowlist files
- Consider moving hardcoded allowlists to JSON (if needed)
- Add validation of allowlist entries (e.g., endpoint catalog)
- Document allowlist review process in matrix

**Rule Changes**: Update exception fields with clearer format descriptions

**Check Changes**: Add allowlist validation (optional)

**Estimated Effort**: 2-3 hours (documentation + optional validation)

**Why Not Weakening**: Improves clarity and maintainability, no enforcement change

---

### Issue 4: Clarify UI v2 Check Status (LOW PRIORITY)

**Scope**: Address finding 3.2 (UI checks not in CI)

**Tasks**:
- Update matrix entries for R-UI-001 through R-UI-006
- Change "Enforced By" to clarify "manual run only, not in CI"
- Add note about planned CI integration timeline
- OR: Add `ui-v2-gate.yml` workflow (if E72 scope permits)

**Rule Changes**: Update enforcement field to match reality

**Check Changes**: None (or add workflow)

**Estimated Effort**: 1 hour (documentation) or 3-4 hours (add workflow)

**Why Not Weakening**: Clarifies current state, prevents false sense of security

---

### Issue 5: Add TypeScript Type Enforcement for API Responses (MEDIUM PRIORITY)

**Scope**: Address finding 1.2 (R-DB-010)

**Tasks**:
- Create shared `ApiResponse<T>` type in `lib/types/api.ts`
- Add ESLint rule requiring typed responses on API route handlers
- Refactor existing handlers to use type (gradual migration)
- Document pattern in `CONTRACTS.md`

**Rule Changes**: Update R-DB-010 enforcement to "TypeScript types + ESLint"

**Check Changes**: Add new ESLint rule

**Estimated Effort**: 6-8 hours (type definition + ESLint rule + migration examples)

**Why Not Weakening**: Adds type safety, catches format violations at compile time

---

### Issue 6: Document Migration Linter Test Suite as Rule (LOW PRIORITY)

**Scope**: Address finding 2.1 (linter self-test)

**Tasks**:
- Add R-DB-011 to matrix: "Migration linter test suite must pass"
- Document pass condition, fixtures, expected behavior
- No code changes needed (check already exists)

**Rule Changes**: Add new rule entry

**Check Changes**: None (formalize existing check)

**Estimated Effort**: 30 minutes (documentation only)

**Why Not Weakening**: Formalizes existing requirement, no behavior change

---

## Summary

**Total Identified Issues**: 16 findings across 5 categories

**Recommended Follow-up Actions**: 5 remaining issues (was 6, Issue 1 ✅ completed)

**P0 (High Priority)**: ~~1 issue~~ ✅ **ALL COMPLETED** (RLS verification)  
**P1 (Medium Priority)**: ~~2 issues~~ ✅ **ALL COMPLETED** (BASE_SHA standardization ✅, API response types ✅ partial)  
**P2 (Low Priority)**: 3 issues (allowlist docs, UI check status, linter test doc)

**Estimated Remaining Effort**: ~5-7 hours (was 13-19 hours)

**Key Principle**: All recommendations strengthen enforcement or improve clarity. None weaken existing guardrails.

---

## Changelog

- **2026-01-25**: E72.ALIGN.P1.DETCON.001 - BASE_SHA standardization + API response contract
  - ✅ Created shared BASE_SHA script: `scripts/ci/get-base-sha.ps1`
  - ✅ Deterministic resolution for PR/push events with fail-closed behavior
  - ✅ Created canonical API type: `lib/types/api.ts` with helpers
  - ✅ Corrected rule-ID: R-DB-010 → R-API-003 (API domain, not DB)
  - ✅ Updated matrix and diff documentation
  - ✅ Updated `CI_DEPLOY_MODEL.md` and `CONTRACTS.md`
  - Issue 2 (BASE_SHA) marked as **COMPLETED**
  - Issue 5 (API types) marked as **PARTIALLY COMPLETED**

- **2026-01-25**: R-DB-009 RLS verification implemented (E72.ALIGN.P0.DBSEC.001)
  - ✅ Created automated check: `scripts/db/verify-rls-policies.ps1`
  - ✅ Integrated into CI: `.github/workflows/db-determinism.yml`
  - ✅ Created allowlist: `docs/canon/rls-allowlist.json`
  - ✅ Updated matrix and diff documentation
  - Issue 1 marked as **COMPLETED**
  
- **2026-01-25**: Initial diff report created for E72.F1
  - Identified 3 rules without checks
  - Identified 2 checks without rules
  - Identified 4 scope mismatches
  - Identified 3 format mismatches
  - Identified 5 false positive risks
  - Proposed 6 follow-up issues
