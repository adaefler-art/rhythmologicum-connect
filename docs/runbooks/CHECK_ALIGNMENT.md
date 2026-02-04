# Check Alignment Documentation

**Version:** 1.0  
**Status:** Active  
**Epic:** E76.9 — Docs & Developer Runbook  
**Last Updated:** 2026-02-04

---

## Overview

This document describes the alignment between guardrail rules and their enforcement checks. It explains the mapping methodology, how to verify alignment, and how to maintain consistency between rules and checks.

**Purpose:**
- Ensure every rule has at least one enforcement check
- Ensure every check references at least one rule
- Prevent orphan rules (defined but not enforced)
- Prevent orphan checks (enforce but not documented)
- Maintain rule-to-check traceability

---

## Mapping Methodology

### Rule Definition

Every guardrail rule MUST be documented with:

1. **Rule ID** - Stable identifier (e.g., `R-E76.9-001`)
2. **Rule Text** - Clear, unambiguous requirement
3. **Scope** - Where the rule applies (files, paths, surfaces)
4. **Pass Condition** - What constitutes compliance
5. **Exceptions** - Documented allowlist/exemptions

**Rule ID Format:** `R-{DOMAIN}-{NUMBER}`

**Domains:**
- `API` - Endpoint wiring, routing, handlers
- `DB` - Database access, migrations, schema
- `UI` - User interface patterns, constraints
- `CI` - Continuous integration, determinism
- `E{EPIC}` - Epic-specific rules (e.g., E76.9)

---

### Check Implementation

Every check MUST:

1. **Reference Rule ID** - Include rule ID in check code
2. **Output Rule ID** - Include "violates R-{ID}" in error messages
3. **Match Scope** - Check exactly what rule specifies
4. **Return Evidence** - Provide proof of pass/fail
5. **Be Runnable** - Executable script or workflow

**Check Types:**
- **Script** - Node.js, PowerShell, Bash scripts in `scripts/ci/`
- **Workflow** - GitHub Actions workflows in `.github/workflows/`
- **ESLint** - Linting rules in `eslint.config.mjs`
- **Test** - Jest/Playwright tests

---

## Rule-to-Check Matrix

### API Domain Rules

| Rule ID | Rule Summary | Check Implementation | Status |
|---------|-------------|---------------------|--------|
| R-API-001 | Critical API handlers exist | `scripts/ci/verify-critical-api-handlers.js` | ✅ Active |
| R-API-002 | Endpoint catalog current | `scripts/ci/verify-endpoint-catalog.ps1` | ✅ Active |
| R-API-003 | Vercel build roots correct | `scripts/ci/verify-critical-api-handlers.js` | ✅ Active |
| R-API-004 | No generic API Jest alias | `scripts/ci/verify-critical-api-handlers.js` | ✅ Active |
| R-API-005 | No forbidden test imports | `scripts/ci/verify-critical-api-handlers.js` | ✅ Active |

**Workflow:** `.github/workflows/api-wiring-gate.yml`

---

### Database Domain Rules

| Rule ID | Rule Summary | Check Implementation | Status |
|---------|-------------|---------------------|--------|
| R-DB-001 | Use canonical Supabase factories | ESLint + `db-access-verification.yml` | ✅ Active |
| R-DB-002 | Admin client restricted | ESLint + server-only guard | ✅ Active |
| R-DB-003 | Migrations immutable | `db-determinism.yml` (git diff) | ✅ Active |
| R-DB-004 | Migrations canonical | `scripts/db/lint-migrations.ps1` | ✅ Active |
| R-DB-005 | Migrations idempotent | `scripts/lint-new-migrations-idempotency.sh` | ✅ Active |
| R-DB-006 | No schema drift | `supabase db diff --local` | ✅ Active |
| R-DB-007 | Types match schema | `db:typegen + git diff` | ✅ Active |
| R-DB-008 | Seed invariants pass | `verify-seed-invariants.ps1` | ✅ Active |
| R-DB-009 | RLS policies enforced | `verify-rls-policies.ps1` | ✅ Active |
| R-DB-010 | API response format | **Manual review** | ⚠️ No Check |
| R-DB-011 | Migration linter tests pass | `test-linter.ps1` | ✅ Active |

**Workflows:** 
- `.github/workflows/db-determinism.yml`
- `.github/workflows/db-access-verification.yml`

---

### UI Domain Rules

| Rule ID | Rule Summary | Check Implementation | Status |
|---------|-------------|---------------------|--------|
| R-UI-001 | Pages inside (mobile) group | `scripts/verify-ui-v2.mjs` | ⚠️ Manual |
| R-UI-002 | No width constraints | `scripts/verify-ui-v2.mjs` | ⚠️ Manual |
| R-UI-003 | No legacy imports | `scripts/verify-ui-v2.mjs` | ⚠️ Manual |
| R-UI-004 | Content uses v2 layout | `scripts/verify-ui-v2.mjs` | ⚠️ Manual |
| R-UI-005 | No placeholder icons | `scripts/verify-ui-v2.mjs` | ⚠️ Manual |
| R-UI-006 | Minimal ad-hoc primitives | `scripts/verify-ui-v2.mjs` | ⚠️ Manual |

**Note:** UI rules are currently manual (not in CI). Integration planned for future epic.

---

### CI Domain Rules

| Rule ID | Rule Summary | Check Implementation | Status |
|---------|-------------|---------------------|--------|
| R-CI-001 | ESLint passes on changed lines | `.github/workflows/lint-gate.yml` | ✅ Active |
| R-CI-002 | Checkout refs deterministic | **Manual review** | ⚠️ No Check |
| R-CI-003 | Fail-closed for missing BASE_SHA | Inline bash in workflows | ✅ Active |
| R-CI-004 | DB determinism complete | `.github/workflows/db-determinism.yml` | ✅ Active |

---

### Epic E76 Rules (MCP Integration)

| Rule ID | Rule Summary | Check Implementation | Status |
|---------|-------------|---------------------|--------|
| R-E76.1-001 | MCP package structure | `scripts/ci/verify-e76-1-mcp-server.mjs` | ✅ Active |
| R-E76.1-002 | MCP tool schemas | `scripts/ci/verify-e76-1-mcp-server.mjs` | ✅ Active |
| R-E76.1-003 | Version metadata | `scripts/ci/verify-e76-1-mcp-server.mjs` | ✅ Active |
| R-E76.1-004 | Logging correlation IDs | `scripts/ci/verify-e76-1-mcp-server.mjs` | ✅ Active |
| R-E76.1-005 | Secrets redacted | `scripts/ci/verify-e76-1-mcp-server.mjs` | ✅ Active |
| R-E76.1-006 | API route exists | `scripts/ci/verify-e76-1-mcp-server.mjs` | ✅ Active |
| R-E76.1-007 | Literal callsite exists | `scripts/ci/verify-e76-1-mcp-server.mjs` | ✅ Active |
| R-E76.1-008 | Feature flag exists | `scripts/ci/verify-e76-1-mcp-server.mjs` | ✅ Active |

**Package Script:** `npm run verify:e76-1`

---

### Epic E76.9 Rules (This Issue)

| Rule ID | Rule Summary | Check Implementation | Status |
|---------|-------------|---------------------|--------|
| R-E76.9-001 | API endpoints have callsites | `scripts/ci/verify-endpoint-wiring.mjs` | ✅ Created |
| R-E76.9-002 | Input validation required | Schema validation in handlers | ✅ Pattern |
| R-E76.9-003 | Error codes include rule IDs | Check error message format | ✅ Pattern |
| R-E76.9-004 | Docs exist (MCP_SERVER.md) | File existence check | ✅ Created |
| R-E76.9-005 | Docs exist (ARTIFACT_SCHEMA_V1.md) | File existence check | ✅ Created |
| R-E76.9-006 | Docs exist (SECURITY_MODEL.md) | File existence check | ✅ Created |
| R-E76.9-007 | Docs exist (TROUBLESHOOTING.md) | File existence check | ✅ Created |
| R-E76.9-008 | Onboarding steps documented | MCP_SERVER.md section | ✅ Created |
| R-E76.9-009 | Rules-checks matrix exists | This document | ✅ Active |

---

## Check Output Format

### Successful Check

```bash
✅ All {RULE_IDS} guardrails satisfied

Verified X rules:
  ✓ R-E76.1-001: MCP server package must exist
  ✓ R-E76.1-002: MCP tools must have Zod schemas
  ...
```

### Failed Check

```bash
❌ {RULE_IDS} guardrails violations found:

[{ERROR_CODE}] violates R-{DOMAIN}-{NUMBER}: {DETAILS}
[{ERROR_CODE}] violates R-{DOMAIN}-{NUMBER}: {DETAILS}

X violation(s) found
```

**Example:**
```bash
❌ E76.1 guardrails violations found:

[MCP_PACKAGE_MISSING] violates R-E76.1-001: Required file missing: src/tools.ts
[MCP_LITERAL_CALLSITE_MISSING] violates R-E76.1-007: Literal string "/api/mcp" not found

2 violation(s) found
```

---

## Verification Procedure

### Manual Verification

Run all checks to verify alignment:

```bash
# API checks
npm run api:catalog:verify
npm run api:handlers:verify

# Database checks
npm run db:verify
npm run db:typegen:verify

# Epic-specific checks
npm run verify:e76-1
npm run verify:e76-2
# ... etc

# Preflight (runs multiple checks)
npm run preflight
```

### Automated Verification (CI)

Checks run automatically on every PR:

```yaml
# .github/workflows/api-wiring-gate.yml
- name: Run endpoint wiring gate
  run: npm run api:catalog:verify

# .github/workflows/db-determinism.yml
- name: Check migration immutability
  run: git diff --exit-code supabase/migrations/
```

---

## Diff Report

### Rules Without Checks

**Definition:** Rules that are documented but have no automated enforcement.

**Current Status:**
- R-DB-010: API response format standard (manual review)
- R-CI-002: Checkout refs deterministic (manual inspection)
- R-UI-001 through R-UI-006: Not in CI (manual run only)

**Impact:** These rules rely on code review for enforcement.

**Recommendation:** Automate where feasible (see issue tracking below).

---

### Checks Without Rules

**Definition:** Checks that run but don't reference a documented rule.

**Current Status:** None identified

**Detection:**
```bash
# Find checks that don't include "violates R-"
grep -L "violates R-" scripts/ci/verify-*.mjs
```

---

### Scope Mismatches

**Definition:** Rule says "all X" but check only verifies subset of X.

**Example:**
- Rule: "All API routes must be in endpoint catalog"
- Check: Only verifies routes in `apps/rhythm-studio-ui/app/api/`
- Mismatch: Doesn't check `apps/rhythm-patient-ui/app/api/`

**Current Status:** No known scope mismatches

**Prevention:**
- Document exact scope in rule
- Update check to match scope
- Use allowlist for intentional exceptions

---

## Adding New Rules and Checks

### How to Add a New Rule

1. **Assign Rule ID**
```
R-{DOMAIN}-{NEXT_NUMBER}

Example: R-API-006 (next API rule)
```

2. **Document in Matrix**
```markdown
### R-API-006: New Rule Name

**Rule Text:** Clear, unambiguous requirement

**Scope:** Exact files/paths where rule applies

**Pass Condition:** What constitutes compliance
```

3. **Create Check (if automated)**
```bash
# Create verification script
touch scripts/ci/verify-{rule-id}.mjs

# Add npm script
# In package.json:
"verify:{rule-id}": "node scripts/ci/verify-{rule-id}.mjs"
```

4. **Update This Document**
```markdown
| R-API-006 | New rule summary | scripts/ci/verify-{rule-id}.mjs | ✅ Active |
```

---

### How to Add a New Check

1. **Identify Rule to Enforce**
```
Which rule(s) does this check enforce?
If none exist, create rule first.
```

2. **Create Check Script**
```typescript
#!/usr/bin/env node
/**
 * {RULE_ID}: {Rule Description}
 * 
 * Verifies that {what is being checked}
 * 
 * Usage: node scripts/ci/verify-{name}.mjs
 * Exit codes:
 *   0 - All guardrails satisfied
 *   1 - Violations found
 */

const RULES = [
  {
    id: 'R-{DOMAIN}-{NUMBER}',
    description: 'Rule description',
    errorCode: 'ERROR_CODE',
  },
]

function reportViolation(errorCode, details) {
  const ruleId = ERROR_CODE_TO_RULE_ID[errorCode]
  console.log(`[${errorCode}] violates ${ruleId}: ${details}`)
}
```

3. **Add Package Script**
```json
{
  "scripts": {
    "verify:{name}": "node scripts/ci/verify-{name}.mjs"
  }
}
```

4. **Add to CI (optional)**
```yaml
# .github/workflows/{workflow}.yml
- name: Run {check name}
  run: npm run verify:{name}
```

5. **Document in Matrix**
```markdown
| R-{DOMAIN}-{NUMBER} | Rule summary | scripts/ci/verify-{name}.mjs | ✅ Active |
```

---

## Policy Tests vs Schema Validations

### Policy Tests

**What:** Tests that verify business logic and access control policies

**Examples:**
- RLS policies enforce correct access (test with different users)
- Workflow steps run in correct order
- Data transformations preserve invariants

**Location:** 
- `test/` directory (Jest tests)
- `supabase/tests/` (pgTAP tests)
- SQL scripts in `scripts/verify/`

**Run:**
```bash
npm test
npm run db:test
```

---

### Schema Validations

**What:** Runtime validation that data conforms to expected structure

**Examples:**
- API input validation (Zod schemas)
- Database constraint checks (NOT NULL, UNIQUE, FK)
- TypeScript type checking

**Location:**
- Zod schemas in `packages/mcp-server/src/tools.ts`
- Database schema in `schema/schema.sql`
- TypeScript types in `*.d.ts` files

**Run:**
```bash
# Type checking
npm run build

# Schema validation (happens at runtime)
# Zod.parse() throws on invalid data
```

---

## Matrix Maintenance

### Weekly Tasks

- [ ] Review new PRs for rule additions/changes
- [ ] Verify all checks still pass
- [ ] Check for new orphan rules (grep for "R-" in docs)

### Monthly Tasks

- [ ] Run full check suite locally
- [ ] Review allowlist entries (remove stale)
- [ ] Update this document with new rules/checks
- [ ] Generate fresh diff report

### Quarterly Tasks

- [ ] Full audit of rules vs checks
- [ ] Close resolved gaps
- [ ] Archive deprecated rules (don't reuse IDs)
- [ ] Plan next round of automation

---

## Onboarding Steps for Local Execution

### Prerequisites

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with required values
```

### Run Individual Checks

```bash
# MCP server check
npm run verify:e76-1

# API catalog check
npm run api:catalog:verify

# Database checks
npm run db:verify

# Preflight (runs multiple checks)
npm run preflight
```

### Run All Checks (CI Simulation)

```bash
# Run what CI runs
npm run preflight
npm run build
npm test
npm run db:verify
npm run api:catalog:verify
```

### Troubleshooting Check Failures

See `docs/runbooks/TROUBLESHOOTING.md` for error code reference.

**Common Issues:**
- Environment variables not set → check .env.local
- Dependencies not installed → run `npm install`
- MCP server not running → start with `npm run dev` in packages/mcp-server
- Database not initialized → run `supabase db reset`

---

## References

- **Global Matrix:** `docs/guardrails/RULES_VS_CHECKS_MATRIX.md`
- **Diff Report:** `docs/guardrails/RULES_VS_CHECKS_DIFF.md`
- **E76.9 Matrix:** `docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md` (this epic)
- **Troubleshooting:** `docs/runbooks/TROUBLESHOOTING.md`
- **MCP Server:** `docs/runbooks/MCP_SERVER.md`

---

**Check Alignment Version:** 1.0  
**Author:** GitHub Copilot  
**Epic:** E76.9 — Docs & Developer Runbook
