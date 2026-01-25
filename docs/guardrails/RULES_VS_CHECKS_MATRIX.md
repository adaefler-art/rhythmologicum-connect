# Rules vs Checks Matrix

**Status**: Active (v0.7 Epic E71/E72)  
**Purpose**: Canonical mapping of guardrail rules to enforcement checks  
**Owner**: E72 Governance  
**Last Updated**: 2026-01-25

---

## Overview

This document provides a complete matrix mapping every documented guardrail rule to its enforcement mechanism(s). It serves as the single source of truth for understanding which rules are enforced, how they're enforced, and what gaps exist.

**Terminology**:
- **Rule**: A documented "MUST/SHOULD/FORBIDDEN/ALLOWED" constraint
- **Check**: An automated script, workflow, or tool that enforces a rule
- **Scope**: The exact files/paths/surfaces where the rule applies
- **Pass Condition**: The criteria for a check to succeed
- **Evidence**: The artifact that proves compliance (log, file, status code)

---

## Matrix Format

Each rule entry includes:

| Field | Description |
|-------|-------------|
| **Rule ID** | Stable identifier (R-{DOMAIN}-{NUMBER}) |
| **Rule Text** | 1-2 sentence unambiguous statement |
| **Scope** | Exact path patterns / surfaces |
| **Enforced By** | Script(s) + file paths |
| **Pass Condition** | Exact success criteria |
| **Exceptions** | Allowlist file + format |
| **Evidence Output** | What file/log proves pass/fail |
| **Known Gaps** | Missing checks / false positive risks |
| **Owner** | Epic/team responsible |

---

## API / Endpoint Wiring Rules

### R-API-001: Critical API Handlers Must Exist

**Rule Text**: All critical API routes defined in `CRITICAL_ROUTES` registry must exist at their expected app-specific paths (not in root `/app/api`).

**Scope**:
- `apps/rhythm-patient-ui/app/api/**`
- `apps/rhythm-studio-ui/app/api/**`
- Routes listed in `scripts/ci/verify-critical-api-handlers.js` CRITICAL_ROUTES

**Enforced By**:
- Script: `scripts/ci/verify-critical-api-handlers.js`
- Workflow: `.github/workflows/api-wiring-gate.yml` (job: verify-critical-handlers)

**Pass Condition**:
- All routes in CRITICAL_ROUTES exist as `route.ts` or `route.tsx` at expected paths
- No critical routes found in wrong tree (root `/app/api` instead of app-specific)
- Exit code 0

**Exceptions**:
- None (hardcoded in script)

**Evidence Output**:
- Console: "✅ Guardrails passed: critical API handlers, Vercel roots, Jest alias, test imports."
- Console: "❌ Guardrails failed: [specific missing/wrong-tree routes]"
- Workflow artifact: api-wiring-gate logs

**Known Gaps**:
- Does not validate handler implementation (only file existence)
- Does not check route exports (GET/POST/etc.)

**Owner**: E72 / API Team

---

### R-API-002: Endpoint Catalog Must Be Current

**Rule Text**: The generated endpoint catalog (`docs/api/ENDPOINT_CATALOG.md`) must match the current codebase with no git diff.

**Scope**:
- `docs/api/ENDPOINT_CATALOG.md`
- `docs/api/endpoint-catalog.json`
- Generated from: `apps/*/app/api/**/*.ts`

**Enforced By**:
- Script: `scripts/ci/verify-endpoint-catalog.ps1`
- Generator: `scripts/dev/endpoint-catalog/generate.js`
- Workflow: `.github/workflows/api-wiring-gate.yml` (job: endpoint-catalog)

**Pass Condition**:
- `git diff --name-only -- 'docs/api'` returns empty
- Generator runs successfully (exit code 0)
- No changes detected in docs/api after regeneration

**Exceptions**:
- Allowlist: `docs/api/endpoint-allowlist.json` (undocumented routes)
- Format: JSON array of route paths (e.g., `["/api/legacy/v1/deprecated"]`)

**Evidence Output**:
- Console: "✅ Endpoint catalog verified successfully"
- Console: "❌ VERIFICATION FAILED: docs/api is out of date"
- File: `docs/api/ENDPOINT_CATALOG.md` (must match committed version)

**Known Gaps**:
- Allowlist format not documented in allowlist file itself
- No validation of allowlist entries (may contain non-existent routes)

**Owner**: E72 / API Team

---

### R-API-003: Vercel Build Roots Must Be Correct

**Rule Text**: Patient and Studio apps must have separate Vercel configs pointing to correct build outputs.

**Scope**:
- `vercel.json` (patient root)
- `apps/rhythm-studio-ui/vercel.json` (studio root)

**Enforced By**:
- Script: `scripts/ci/verify-critical-api-handlers.js` (checkVercelRoots function)
- Workflow: `.github/workflows/api-wiring-gate.yml`

**Pass Condition**:
- Patient `vercel.json` buildCommand includes "build:patient"
- Patient outputDirectory is "apps/rhythm-patient-ui/.next"
- Studio `vercel.json` buildCommand includes "build:studio"
- Studio outputDirectory is "apps/rhythm-studio-ui/.next"

**Exceptions**:
- None

**Evidence Output**:
- Console: Part of overall guardrails check output
- Specific error: "Expected patient buildCommand to include 'build:patient' but found..."

**Known Gaps**:
- Does not validate that build scripts exist in package.json

**Owner**: E72 / DevOps

---

### R-API-004: No Generic app/api Jest Alias

**Rule Text**: Jest configuration must NOT contain generic `@/app/api` alias that would match test files importing from multiple apps.

**Scope**:
- `jest.config.js`

**Enforced By**:
- Script: `scripts/ci/verify-critical-api-handlers.js` (checkJestAlias function)
- Workflow: `.github/workflows/api-wiring-gate.yml`

**Pass Condition**:
- Jest config does NOT match patterns: `^\^@\/app\/api/` or `/@\/app\/api/`
- Exit code 0

**Exceptions**:
- None

**Evidence Output**:
- Console: "Jest alias for @/app/api is not allowed. Remove generic app/api mapping."
- Or: Part of overall ✅ guardrails passed message

**Known Gaps**:
- Simple regex check (may miss creative alias patterns)

**Owner**: E72 / Testing

---

### R-API-005: No Forbidden Test Imports

**Rule Text**: Test files must NOT import API handlers using generic `@/app/api/` or relative paths that could cross app boundaries.

**Scope**:
- All files matching: `**/__tests__/**/*.{ts,tsx}` or `*.{spec,test}.{ts,tsx}`
- Excluding: `TEST_IMPORT_ALLOWLIST` array in script

**Enforced By**:
- Script: `scripts/ci/verify-critical-api-handlers.js` (checkTestImports function)
- Workflow: `.github/workflows/api-wiring-gate.yml`

**Pass Condition**:
- No test files import from forbidden prefixes:
  - `@/app/api/`
  - `app/api/`
  - `../app/api/` (and variants up to 4 levels)
- Exit code 0

**Exceptions**:
- Allowlist: `TEST_IMPORT_ALLOWLIST` array in script
- Format: Relative path from repo root (e.g., `"apps/rhythm-patient-ui/__tests__/legacy.test.ts"`)

**Evidence Output**:
- Console: "No forbidden test imports found."
- Or: "Forbidden test imports of app/api handlers: [file list with imports]"

**Known Gaps**:
- Allowlist currently empty (no documented exceptions)
- Does not catch dynamic imports or require() with template strings

**Owner**: E72 / Testing

---

## Database Rules

### R-DB-001: All Supabase Clients Use Canonical Factories

**Rule Text**: Direct imports of `createClient` from `@supabase/supabase-js` or `createServerClient` from `@supabase/ssr` are FORBIDDEN. Use canonical factories from `@/lib/db/supabase.*` instead.

**Scope**:
- All `*.ts` and `*.tsx` files
- Exceptions: `lib/db/supabase.*.ts` (canonical factory implementations)

**Enforced By**:
- ESLint rule: `no-restricted-imports` in `eslint.config.mjs`
- Workflow: `.github/workflows/lint-gate.yml`
- Workflow: `.github/workflows/db-access-verification.yml`

**Pass Condition**:
- ESLint exits 0 (no violations on changed files)
- No direct imports from `@supabase/supabase-js` (createClient)
- No direct imports from `@supabase/ssr` (createServerClient)

**Exceptions**:
- ESLint config: `overrides` section allows `lib/db/supabase.*.ts` files
- Format: Path pattern in ESLint config

**Evidence Output**:
- ESLint error message: "Use canonical factories from @/lib/db/supabase.* instead."
- Workflow: "❌ ESLint gate failed"
- File: Specific file + line number in ESLint output

**Known Gaps**:
- Only enforced on changed files (interim policy per lint-gate.yml)
- Pre-existing violations in unchanged files are not blocked

**Owner**: E71 / Database Team

---

### R-DB-002: Admin Client Restricted to API Routes

**Rule Text**: Admin client (`@/lib/db/supabase.admin`) imports are RESTRICTED to API routes and documented lib modules. Client components cannot import it.

**Scope**:
- Forbidden: Client components (files with `'use client'`)
- Allowed: `app/api/**/*.ts`, documented lib modules (audit, content resolver)

**Enforced By**:
- ESLint rule: `no-restricted-imports` for `@/lib/db/supabase.admin`
- Runtime: `server-only` import in `lib/db/supabase.admin.ts` (build-time guard)
- Workflow: `.github/workflows/db-access-verification.yml`

**Pass Condition**:
- ESLint exits 0
- Build succeeds (server-only throws error if imported in client bundle)
- Pattern verification script: `npm run db:access-verify` exits 0

**Exceptions**:
- ESLint config: `app/api/**/*.ts` files are allowed
- Documented lib modules listed in `DB_ACCESS_GUARDRAILS.md` section "Approved Exceptions"

**Evidence Output**:
- ESLint: "Admin client restricted to API routes and documented lib modules."
- Build error: "Error: 'server-only' module imported in client code at lib/db/supabase.admin.ts"
- Script: `scripts/db/verify-db-access.js` output

**Known Gaps**:
- Allowlist of "documented lib modules" is in markdown, not machine-readable
- No automated check that ESLint exceptions match documented exceptions

**Owner**: E71 / Database Team

---

### R-DB-003: Migration Files Are Immutable

**Rule Text**: Existing migration files in `supabase/migrations/*.sql` must NEVER be edited. All schema changes require new timestamped migrations.

**Scope**:
- `supabase/migrations/*.sql`
- Excludes: New migrations added in PR (only existing files checked)

**Enforced By**:
- Script: Inline bash in `.github/workflows/db-determinism.yml` (step: "Check migration immutability")
- Command: `git diff --name-status $MERGE_BASE...HEAD -- supabase/migrations/*.sql | grep -v '^A'`

**Pass Condition**:
- Git diff shows NO modified migrations (status M, D, R)
- Only added migrations (status A) are allowed
- Exit code 0

**Exceptions**:
- Emergency override: Set `ALLOW_MIGRATION_EDITS=1` env var (documented in workflow)
- No allowlist file

**Evidence Output**:
- Console: "✅ All migration changes are new additions"
- Or: "❌ ERROR: Existing migration files were modified: [file list]"
- Workflow logs show merge-base SHA and modified files

**Known Gaps**:
- Emergency override is documented but not audited (no log of when used)
- Does not prevent force-push to main that bypasses PR checks

**Owner**: E71 / Database Team

---

### R-DB-004: Migrations Must Be Canonical

**Rule Text**: All CREATE TABLE, CREATE TYPE, and ALTER TABLE statements must reference objects defined in the canonical schema manifest (`docs/canon/DB_SCHEMA_MANIFEST.json`).

**Scope**:
- `supabase/migrations/*.sql`
- Schema objects: tables, enums (types)

**Enforced By**:
- Script: `scripts/db/lint-migrations.ps1`
- Workflow: `.github/workflows/db-determinism.yml` (step: "Lint migrations against schema manifest")

**Pass Condition**:
- All table names match `manifest.tables` array
- All enum names match `manifest.enums` array
- No ALTER TABLE on non-canonical tables
- Exit code 0 (errors), exit code 0 with warnings (deprecated but allowed)

**Exceptions**:
- None (all objects must be canonical)
- Deprecated objects allowed but warned if in NEW migrations only

**Evidence Output**:
- Console: "✅ All migration objects are canonical!"
- Or: "❌ ERRORS (N non-canonical objects detected): [file:line, type, name, reason]"
- Warning: "⚠️ WARNINGS (N deprecated objects detected)"

**Known Gaps**:
- Does not validate foreign key references to canonical tables
- Does not check function/view definitions against manifest

**Owner**: E71 / Database Team

---

### R-DB-005: Migrations Must Be Idempotent

**Rule Text**: New migrations must use idempotency guards (IF NOT EXISTS, DROP IF EXISTS, or catalog checks) for all CREATE statements and constraint additions.

**Scope**:
- New migrations added in PR (compared to merge-base)
- `supabase/migrations/*.sql`

**Enforced By**:
- Script: `scripts/lint-new-migrations-idempotency.sh`
- Workflow: `.github/workflows/db-determinism.yml` (step: "Lint new migrations for idempotency")

**Pass Condition**:
- CREATE TABLE uses `IF NOT EXISTS`
- CREATE INDEX uses `IF NOT EXISTS`
- CREATE TYPE includes existence guard (pg_type check or duplicate_object handler)
- ADD CONSTRAINT includes guard (DROP IF EXISTS or catalog check)
- CREATE POLICY includes guard (DROP IF EXISTS or pg_policies check)
- Exit code 0

**Exceptions**:
- None (all new migrations must be idempotent)

**Evidence Output**:
- Console: "OK: New migrations look rerunnable (basic lint)."
- Or: "ERROR: [file] contains CREATE TABLE without IF NOT EXISTS"
- Lists specific violations per file

**Known Gaps**:
- Simple regex-based (may miss complex SQL patterns)
- Does not validate DO $$ block guards (relies on heuristics)
- May have false positives/negatives on commented code

**Owner**: E71 / Database Team

---

### R-DB-006: No Schema Drift

**Rule Text**: Database schema state must exactly match migration definitions. Manual schema changes (via Supabase Studio or direct SQL) are FORBIDDEN.

**Scope**:
- Local Supabase instance schema
- `supabase/migrations/*.sql` (source of truth)

**Enforced By**:
- Script: `supabase db diff --local`
- Workflow: `.github/workflows/db-determinism.yml` (step: "Check for schema drift")

**Pass Condition**:
- `supabase db diff --local` output contains "No schema changes (found|detected)"
- Exit code 0

**Exceptions**:
- None (drift always fails CI)

**Evidence Output**:
- Console: "✅ No schema drift detected"
- Or: "❌ Schema drift detected! [diff output]"
- Suggests: "Please create a new migration to capture these changes"

**Known Gaps**:
- Only detects drift at PR time (not continuously)
- Does not prevent drift in production (separate monitoring needed)

**Owner**: E71 / Database Team

---

### R-DB-007: TypeScript Types Must Match Schema

**Rule Text**: Generated TypeScript types (`lib/types/supabase.ts`) must exactly match the database schema. Run `npm run db:typegen` after schema changes.

**History/Migration Note**: 
- Previously enforced via simple git diff check in CI
- Strengthened (E72.ALIGN.P0.DBSEC.001): Implemented deterministic hard gate with SHA256 verification, pinned CLI version, and comprehensive evidence outputs
- Semantics unchanged (types must match schema); enforcement mechanism strengthened (no weakening)
- See `RULES_VS_CHECKS_DIFF.md` section 1.1.1 for complete migration details

**Scope**:
- `lib/types/supabase.ts`
- Generated from: Supabase local instance schema

**Enforced By**:
- **Deterministic Script**: `scripts/db/typegen.ps1` (hard gate with full diagnostics)
- **npm scripts**:
  - `npm run db:typegen` → generates types (calls `typegen.ps1 -Generate`)
  - `npm run db:typegen:verify` → verifies committed types match (calls `typegen.ps1 -Verify`)
- Workflow: `.github/workflows/db-determinism.yml` (step: "Verify TypeScript types are deterministic")
- **Supabase CLI Version**: `2.63.1` (pinned in script for deterministic output)

**Pass Condition**:
- Generated types match committed `lib/types/supabase.ts` exactly (byte-for-byte via SHA256)
- `typegen.ps1 -Verify` exit code 0

**Exceptions**:
- None (types must always be in sync)

**Evidence Output**:
- **CI Logs** (always printed):
  - `ExitCode`: Supabase CLI exit code (0 = success, != 0 = failure)
  - `StdoutBytes`: Size of generated types file in bytes
  - `StderrBytes`: Size of stderr output in bytes (0 if no warnings/errors)
  - `GeneratedFile`: Path to generated/temp file
  - `StderrLog`: Path to stderr.log file (`artifacts/typegen/stderr.log`)
  - `SHA256` hashes: Committed vs Generated (in -Verify mode only)
- **Artifacts** (on -Verify mode):
  - `artifacts/typegen/supabase.generated.ts` (temp generated file for byte-level comparison)
  - `artifacts/typegen/stderr.log` (Supabase CLI stderr output, written always even on success)
- **Console Messages**:
  - Success: "✅ Types match! Files are identical."
  - Failure: "❌ Types differ! Generated output does not match committed version."
- **Full diagnostics on failure**:
  - Pinned CLI version (supabase@2.63.1)
  - Exact command used
  - File hashes (committed vs generated, both SHA256)
  - Diff preview (first 50 lines of difference)
- **Fail-Closed Conditions**:
  - Supabase CLI exit code != 0
  - Generated output is empty or whitespace-only
  - SHA256 hash mismatch between committed and generated files (in -Verify mode)
  - File I/O errors (cannot read committed file, cannot write temp file)

**Known Gaps**:
- Does not validate that types are actually used correctly in code
- Does not detect type-unsafe casts or `any` usage

**Determinism Notes**:
- **Hard Gate**: Exactly ONE way to generate types (enforced via `scripts/db/typegen.ps1`)
- Supabase CLI version pinned at `2.63.1` (no global installs, no version drift)
- Mode: `--local` (hardcoded in script)
- Command: `npx supabase@2.63.1 gen types typescript --local`
- Fail-closed design: any error (DB connection, CLI failure, etc.) → exit 1
- Both CI and local use identical script (no git diff comparison, SHA256 hash comparison instead)

**Owner**: E71 / Database Team

---

### R-DB-008: Seed Invariants Must Pass

**Rule Text**: Baseline seed data must satisfy documented invariants (canonical questions exist, system users exist, etc.).

**Scope**:
- `supabase/seed.sql`
- Local Supabase instance after reset

**Enforced By**:
- Script: `scripts/db/verify-seed-invariants.ps1`
- Workflow: `.github/workflows/db-determinism.yml` (step: "Verify seed invariants")

**Pass Condition**:
- All documented invariants pass (script defines checks)
- Exit code 0

**Exceptions**:
- None (seed must always satisfy invariants)

**Evidence Output**:
- Console: "✅ Seed invariants satisfied"
- Or: "❌ Seed invariant failed: [specific check]"

**Known Gaps**:
- Invariants defined in script, not in separate spec document
- No schema for what constitutes a "valid invariant check"

**Owner**: E71 / Database Team

---

### R-DB-009: RLS Policies Required on User Data

**Rule Text**: All tables containing user data must have Row Level Security (RLS) enabled with appropriate policies for patient/clinician roles.

**Scope**:
- All tables in `public` schema with `patient_id` or `user_id` columns (heuristic-based detection)
- Excludes system schemas: `pg_catalog`, `information_schema`, `auth`, `storage`, `extensions`, `graphql`, `vault`, `realtime`

**Enforced By**:
- Script: `scripts/db/verify-rls-policies.ps1`
- Workflow: `.github/workflows/db-determinism.yml` (step: "Verify RLS policies on user data tables")
- Integration: E72.ALIGN.P0.DBSEC.001

**Pass Condition**:
- All user data tables (detected via `patient_id`/`user_id` columns) have:
  - RLS enabled (`pg_class.relrowsecurity = true`)
  - At least one policy exists for patient role (checked via `pg_policies`)
- Allowlisted tables are excluded from checks
- Exit code 0

**Exceptions**:
- Allowlist: `docs/canon/rls-allowlist.json`
- Format: JSON with `entries` array containing `{table: "schema.table", reason: "explanation"}`
- Public metadata tables (content_pages, design_tokens, funnels_catalog, etc.)

**Evidence Output**:
- Artifact: `artifacts/rls-verify/rls-summary.json` (machine-readable)
- Artifact: `artifacts/rls-verify/rls-summary.txt` (human-readable)
- GitHub Actions artifact upload (retention: 30 days)

**Known Gaps**:
- Heuristic-based detection may miss tables without `patient_id`/`user_id` columns
- Does not validate policy correctness (only checks for existence)
- Patient role check is configurable via `$PatientRoleName` parameter (default: "patient")

**Owner**: E72 / Database Team / Security

---

### R-DB-010: API Response Format Standard

**Rule Text**: All API endpoints must return standard format: `{ success: boolean, data?: T, error?: { code: string, message: string } }`.

**Scope**:
- All API route handlers in `app/api/**/*.ts`

**Enforced By**:
- Manual review (no automated check currently)
- Documentation: `docs/canon/CONTRACTS.md`

**Pass Condition**:
- Manual code review confirms format

**Exceptions**:
- Legacy endpoints (to be documented)

**Evidence Output**:
- Manual code review notes

**Known Gaps**:
- **NO AUTOMATED CHECK** - This is a manual review rule
- Could be enforced via TypeScript response types + linter

**Owner**: E71 / API Team

---

## UI Rules

### R-UI-001: Patient Pages Must Be Inside (mobile) Route Group

**Rule Text**: All patient page directories must be under `app/patient/(mobile)/` route group, not directly under `app/patient/`.

**Scope**:
- `apps/rhythm-patient-ui/app/patient/`
- Excludes: Allowlisted routes in `ALLOWLISTED_ROUTES` array

**Enforced By**:
- Script: `scripts/verify-ui-v2.mjs` (Check 1: checkPagesOutsideMobile)
- Workflow: Manual run (not in CI yet per E71 scope)

**Pass Condition**:
- No directories under `app/patient/` except:
  - `(mobile)` itself
  - Allowlisted routes: onboarding, documents, (legacy), components, layout/error files
- Exit code 0

**Exceptions**:
- Allowlist: `ALLOWLISTED_ROUTES` array in script
- Format: Array of directory/file names (e.g., `['onboarding', 'documents']`)

**Evidence Output**:
- Console: "✅ All checks passed! Mobile UI v2 constraints are satisfied."
- Or: "❌ Found N violation(s): [PAGE_OUTSIDE_MOBILE] [relative path]"

**Known Gaps**:
- Allowlist is hardcoded in script (not in separate allowlist file)
- Not yet integrated into CI workflow (manual run only)

**Owner**: E71 / UI Team

---

### R-UI-002: No Width Constraints in (mobile) Pages

**Rule Text**: Mobile route pages must NOT use `max-w-*` (except none), `container`, or `mx-auto` classes. Use `w-full` with padding tokens instead.

**Scope**:
- `apps/rhythm-patient-ui/app/patient/(mobile)/**/*.{ts,tsx}`
- Excludes: `MOBILE_WIDTH_ALLOWLIST` patterns (tests, dev routes)

**Enforced By**:
- Script: `scripts/verify-ui-v2.mjs` (Check 2: checkForbiddenWidthPatterns)
- Regex patterns: `FORBIDDEN_WIDTH_PATTERNS` array

**Pass Condition**:
- No matches for forbidden patterns in non-allowlisted files
- Exit code 0

**Exceptions**:
- Allowlist: `MOBILE_WIDTH_ALLOWLIST` in script
- Format: Array of path patterns (e.g., `['__tests__', '.test.', 'dev/']`)

**Evidence Output**:
- Console: "✅ All checks passed!"
- Or: "❌ [FORBIDDEN_WIDTH_PATTERN] [file]:[line] Forbidden width pattern found: [line content]"

**Known Gaps**:
- Regex-based (may miss dynamic className construction)
- Allowlist for modals/overlays is by path pattern, not semantic (could miss valid modal use)

**Owner**: E71 / UI Team

---

### R-UI-003: No Legacy Layout Imports in (mobile)

**Rule Text**: Mobile route pages must NOT import from `@/components/Layout` or `@/components/Container`. Use MobileShellV2 instead.

**Scope**:
- `apps/rhythm-patient-ui/app/patient/(mobile)/**/*.{ts,tsx}`

**Enforced By**:
- Script: `scripts/verify-ui-v2.mjs` (Check 3: checkForbiddenImports)
- Regex patterns: `FORBIDDEN_IMPORTS` array

**Pass Condition**:
- No imports from forbidden legacy components
- Exit code 0

**Exceptions**:
- None (no allowlist for legacy imports)

**Evidence Output**:
- Console: "✅ All checks passed!"
- Or: "❌ [FORBIDDEN_IMPORT] [file] Forbidden legacy import detected"

**Known Gaps**:
- Does not detect re-exports of legacy components through intermediate modules

**Owner**: E71 / UI Team

---

### R-UI-004: Content Routes Use Mobile v2 Layout

**Rule Text**: Content routes (`app/content/`) must wrap with `MobileShellV2` and apply `PatientDesignTokensProvider` in layout.tsx.

**Scope**:
- `apps/rhythm-patient-ui/app/content/layout.tsx`
- `apps/rhythm-patient-ui/app/content/**/*.{ts,tsx}`

**Enforced By**:
- Script: `scripts/verify-ui-v2.mjs` (Check 4: checkContentRoutes)

**Pass Condition**:
- `app/content/layout.tsx` includes `MobileShellV2` import/usage
- `app/content/layout.tsx` includes `PatientDesignTokensProvider` import/usage
- No forbidden width patterns or imports in content route pages
- Exit code 0

**Exceptions**:
- Allowlist: `CONTENT_WIDTH_ALLOWLIST` for tests

**Evidence Output**:
- Console: "✅ All checks passed!"
- Or: "❌ [CONTENT_LAYOUT_MISSING_SHELL] layout.tsx must wrap with MobileShellV2"
- Or: "❌ [CONTENT_FORBIDDEN_WIDTH_PATTERN] [file]:[line]"

**Known Gaps**:
- Only checks for presence of imports, not correct usage/nesting
- Does not validate that layout actually renders children inside MobileShellV2

**Owner**: E71 / UI Team

---

### R-UI-005: No Placeholder Icons in (mobile)

**Rule Text**: Mobile route pages must NOT directly import from `lucide-react` or `@heroicons/react`. Use v2 icon system instead.

**Scope**:
- `apps/rhythm-patient-ui/app/patient/(mobile)/**/*.{ts,tsx}`
- Excludes: `ICON_ALLOWLIST` patterns (tests, dev routes)

**Enforced By**:
- Script: `scripts/verify-ui-v2.mjs` (Check 5: checkPlaceholderIcons)
- Regex patterns: `PLACEHOLDER_ICON_PATTERNS` array

**Pass Condition**:
- No direct Lucide/Heroicons imports in non-allowlisted files
- Exit code 0

**Exceptions**:
- Allowlist: `ICON_ALLOWLIST` in script
- Format: Array of path patterns (e.g., `['__tests__', 'dev/']`)

**Evidence Output**:
- Console: "✅ All checks passed!"
- Or: "❌ [PLACEHOLDER_ICON] [file]:[line] Placeholder icon import found (use v2 icon system): [line content]"

**Known Gaps**:
- Does not enforce use of specific v2 icon components (only forbids direct imports)

**Owner**: E71 / UI Team

---

### R-UI-006: Minimal Ad-Hoc UI Primitives

**Rule Text**: Page components should use UI Kit components (Card, Button) instead of ad-hoc primitive classes like custom `rounded-*`, `shadow-*`.

**Scope**:
- `apps/rhythm-patient-ui/app/patient/(mobile)/**/*page.tsx`
- `apps/rhythm-patient-ui/app/patient/(mobile)/**/*client.tsx`
- Excludes: `AD_HOC_ALLOWLIST` patterns

**Enforced By**:
- Script: `scripts/verify-ui-v2.mjs` (Check 6: checkAdHocPrimitives)
- Regex patterns: `AD_HOC_PRIMITIVE_PATTERNS` array

**Pass Condition**:
- No suspicious ad-hoc styling patterns in page files
- Exit code 0

**Exceptions**:
- Allowlist: `AD_HOC_ALLOWLIST` in script
- Format: Array of path patterns (e.g., `['components/', 'client.tsx']`)

**Evidence Output**:
- Console: "✅ All checks passed!"
- Or: "❌ [AD_HOC_PRIMITIVE] [file]:[line] Ad-hoc UI primitive detected (use UI Kit instead): [line content]"

**Known Gaps**:
- Heuristic-based (false positives possible)
- Does not validate that UI Kit components are actually used
- Allowlist includes 'client.tsx' which may be too permissive

**Owner**: E71 / UI Team

---

## CI / Determinism Rules

### R-CI-001: ESLint Must Pass on Changed Lines

**Rule Text**: ESLint must pass with zero errors on all lines changed in the PR (interim policy: pre-existing errors in unchanged lines are ignored).

**Scope**:
- All `*.ts` and `*.tsx` files changed in PR
- Determined by: `git diff $BASE_SHA $HEAD_SHA`

**Enforced By**:
- Workflow: `.github/workflows/lint-gate.yml`
- Workflow: `.github/workflows/db-access-verification.yml` (similar pattern)
- Script: `npm run lint:changed`

**Pass Condition**:
- ESLint exit code 0 for changed files
- No errors on changed lines (warnings allowed)

**Exceptions**:
- Pre-existing errors in unchanged files are ignored (interim policy)
- Documented in `docs/LINT_POLICY.md` (if exists)

**Evidence Output**:
- Console: "✅ ESLint gate passed!"
- Or: ESLint error output for specific files/lines

**Known Gaps**:
- Interim policy allows pre-existing violations to persist
- No timeline for full repo lint pass enforcement

**Owner**: E72 / DevOps

---

### R-CI-002: Checkout Refs Must Be Deterministic

**Rule Text**: CI workflows must use `fetch-depth: 0` to ensure full git history is available for diff-based checks.

**Scope**:
- All workflows: `.github/workflows/*.yml`
- Specifically: workflows that run `git diff`, `git merge-base`, etc.

**Enforced By**:
- Manual review of workflow files
- Documentation in `docs/canon/CI_DEPLOY_MODEL.md`

**Pass Condition**:
- All workflows using git diff have `fetch-depth: 0` in checkout step
- Manual verification

**Exceptions**:
- None (determinism is critical)

**Evidence Output**:
- Manual code review notes
- Workflow run logs showing merge-base computation

**Known Gaps**:
- **NO AUTOMATED CHECK** - Manual review rule
- Could be enforced via workflow linter (if one existed)

**Owner**: E72 / DevOps

---

### R-CI-003: Fail-Closed for Missing Base SHA

**Rule Text**: If BASE_SHA cannot be determined, workflows must fail immediately (not silently pass or diff against wrong ref).

**Scope**:
- Workflows: `lint-gate.yml`, `db-access-verification.yml`

**Enforced By**:
- Inline bash logic in workflow steps
- Example: "❌ BASE_SHA is empty. Cannot proceed (fail-closed)."

**Pass Condition**:
- Workflow exits 1 if BASE_SHA is invalid
- Fallback to merge-base with main if BASE_SHA missing

**Exceptions**:
- None (fail-closed is security-critical)

**Evidence Output**:
- Workflow logs: "❌ BASE_SHA is empty or invalid: '$BASE_SHA'"
- Or: "❌ Failed to compute merge-base with origin/main (fail-closed)."

**Known Gaps**:
- Fallback logic varies between workflows (not standardized)
- No shared script for BASE_SHA determination

**Owner**: E72 / DevOps

---

### R-CI-004: DB Determinism Pipeline Must Complete

**Rule Text**: All 4 DB determinism checks must pass: (1) immutability, (2) application, (3) drift, (4) types.

**Scope**:
- Workflow: `.github/workflows/db-determinism.yml`

**Enforced By**:
- Workflow orchestration (steps depend on each other)
- Documented in `docs/DB_DETERMINISM_CI_FLOW.md`

**Pass Condition**:
- All steps exit 0:
  - Test migration linter
  - Lint migrations against manifest
  - Check migration immutability
  - Lint new migrations for idempotency
  - Start Supabase
  - Apply migrations (db reset)
  - Verify seed invariants
  - Check schema drift
  - Generate and check types

**Exceptions**:
- Emergency override: `ALLOW_MIGRATION_EDITS=1` (for immutability check only)

**Evidence Output**:
- Workflow summary: "🎉 All DB determinism checks passed!"
- Or: Specific step failure with detailed error

**Known Gaps**:
- No single script that runs all checks locally (must run workflow)
- Cleanup step (stop Supabase) always runs but doesn't affect pass/fail

**Owner**: E71 / Database Team

---

## How to Add a New Rule or Check

### Adding a New Rule

1. **Choose a Rule ID**: Use the next available number in the domain:
   - API: R-API-XXX
   - DB: R-DB-XXX
   - UI: R-UI-XXX
   - CI: R-CI-XXX

2. **Document the Rule**: Add entry to this matrix with all fields:
   - Rule Text (clear, unambiguous)
   - Scope (exact paths/patterns)
   - Enforced By (or "Manual review" if no check yet)
   - Pass Condition
   - Exceptions (create allowlist file if needed)
   - Evidence Output
   - Known Gaps
   - Owner

3. **Create Enforcement Check** (if automated):
   - Write script in `scripts/` or `scripts/ci/`
   - Add to appropriate workflow in `.github/workflows/`
   - Test locally before committing

4. **Update This Matrix**: Add mapping of Rule → Check

5. **Update DIFF Report**: If rule has no check, add to "Rules without checks" section

### Adding a New Check

1. **Find or Create Rule**: Does this check enforce an existing rule? If not, create the rule first.

2. **Create Script**:
   - Place in `scripts/` (local dev) or `scripts/ci/` (CI-only)
   - Follow naming: `verify-{domain}-{feature}.{ext}` or `lint-{domain}.{ext}`
   - Include usage documentation in script header
   - Exit codes: 0 = pass, non-zero = fail

3. **Add to Workflow** (if CI-enforced):
   - Choose appropriate workflow (or create new one)
   - Add step with clear name
   - Include error handling and clear output

4. **Document in Matrix**:
   - Add check to "Enforced By" field of rule(s)
   - Document pass condition
   - Document exceptions/allowlist format

5. **Test**:
   - Run locally: should pass on clean main
   - Run on PR with violations: should fail with clear message
   - Run on PR with allowlisted violations: should pass

### Allowlist File Format Standards

When creating a new allowlist file:

1. **Location**: `docs/api/` or `docs/{domain}/` or same directory as script
2. **Format**: JSON (preferred) or plain text (one entry per line)
3. **Naming**: `{feature}-allowlist.{json|txt}`
4. **Structure** (JSON example):
   ```json
   {
     "_comment": "Allowlist for [feature]. Format: [description]. Remove entry when fixed.",
     "entries": [
       "/path/to/allowed/item",
       "/another/allowed/item"
     ]
   }
   ```
5. **Documentation**: Include format description and example in this matrix entry

---

## Verification Commands

### Run All Checks Locally

```bash
# ESLint (changed files)
npm run lint:changed

# DB checks
pwsh scripts/db/lint-migrations.ps1
bash scripts/lint-new-migrations-idempotency.sh origin/main
npm run db:access-verify

# API checks
pwsh scripts/ci/verify-endpoint-catalog.ps1
node scripts/ci/verify-critical-api-handlers.js

# UI checks
node scripts/verify-ui-v2.mjs

# DB determinism (requires Supabase running)
supabase start
npm run db:typegen
git diff lib/types/supabase.ts  # Should be empty
supabase db diff --local         # Should show "No schema changes"
supabase stop --no-backup
```

### Run Specific Check

```bash
# Endpoint catalog
pwsh scripts/ci/verify-endpoint-catalog.ps1 -RepoRoot . -OutDir docs/api

# Migration linter
pwsh scripts/db/lint-migrations.ps1 -Verbose

# Critical API handlers
node scripts/ci/verify-critical-api-handlers.js

# UI v2 constraints
node scripts/verify-ui-v2.mjs
```

---

## Changelog

- **2026-01-25**: Initial matrix created for E72.F1
  - Documented 30+ rules across API/DB/UI/CI domains
  - Mapped rules to enforcement mechanisms
  - Identified gaps in automated enforcement
  - Added "How to add rule/check" section
