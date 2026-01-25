# Guardrails Documentation

**Status**: Active (v0.7 Epic E72)  
**Owner**: Governance / E72 Team  
**Last Updated**: 2026-01-25

---

## Overview

This directory contains the canonical documentation for all repository guardrails—the automated rules and checks that enforce code quality, security, and architectural constraints.

**Purpose**:
- **Single source of truth** for all "MUST/SHOULD/FORBIDDEN/ALLOWED" rules
- **Complete mapping** of rules to enforcement mechanisms
- **Gap analysis** identifying rules without checks and checks without rules
- **Guidance** for adding new rules and checks

---

## Documents in This Directory

### 1. RULES_VS_CHECKS_MATRIX.md

**The canonical reference.** Maps every guardrail rule to its enforcement check(s).

**Contains**:
- 30+ documented rules across API, Database, UI, and CI domains
- Complete enforcement details (scripts, workflows, pass conditions)
- Allowlist formats and examples
- Known gaps and limitations
- How-to guide for adding new rules/checks

**Use this document to**:
- Understand what rules exist and how they're enforced
- Find the script/workflow that enforces a specific rule
- Learn the correct format for allowlist entries
- Add a new rule or check to the system

---

### 2. RULES_VS_CHECKS_DIFF.md

**The gap analysis report.** Identifies mismatches between rules and checks.

**Contains**:
- 3 rules without automated checks (manual review only)
- 2 checks without documented rules
- 4 scope mismatches (rule says "all", check enforces subset)
- 3 format mismatches (allowlist format unclear or undocumented)
- 5 false positive risks (heuristic-based checks)
- 6 recommended follow-up issues with effort estimates

**Use this document to**:
- Identify areas where enforcement is missing
- Understand known limitations of existing checks
- Plan follow-up work to close gaps
- Justify why a proposed change is not "weakening" guardrails

---

## Rule ID Schema

All rules follow this naming pattern:

```
R-{DOMAIN}-{NUMBER}
```

**Domains**:
- `API`: Endpoint wiring, routing, ownership, critical handlers
- `DB`: Database access, migrations, schema, RLS, contracts
- `UI`: Layout patterns, width constraints, v2 guardrails, icons
- `CI`: Determinism, checkout refs, immutability, false-green prevention

**Examples**:
- `R-API-001`: Critical API Handlers Must Exist
- `R-DB-003`: Migration Files Are Immutable
- `R-UI-002`: No Width Constraints in (mobile) Pages
- `R-CI-001`: ESLint Must Pass on Changed Lines

**Stability**: Rule IDs are permanent. Once assigned, they should never be reused or changed.

---

## Quick Reference: Rules by Domain

### API Rules (R-API-001 to R-API-005)

| Rule ID | Summary | Enforced By |
|---------|---------|-------------|
| R-API-001 | Critical API handlers must exist | verify-critical-api-handlers.js |
| R-API-002 | Endpoint catalog must be current | verify-endpoint-catalog.ps1 |
| R-API-003 | Vercel build roots must be correct | verify-critical-api-handlers.js |
| R-API-004 | No generic app/api Jest alias | verify-critical-api-handlers.js |
| R-API-005 | No forbidden test imports | verify-critical-api-handlers.js |

### Database Rules (R-DB-001 to R-DB-011)

| Rule ID | Summary | Enforced By |
|---------|---------|-------------|
| R-DB-001 | Use canonical Supabase factories | ESLint + db-access-verification.yml |
| R-DB-002 | Admin client restricted to API routes | ESLint + server-only guard |
| R-DB-003 | Migration files are immutable | db-determinism.yml (git diff) |
| R-DB-004 | Migrations must be canonical | lint-migrations.ps1 |
| R-DB-005 | Migrations must be idempotent | lint-new-migrations-idempotency.sh |
| R-DB-006 | No schema drift | supabase db diff --local |
| R-DB-007 | TypeScript types match schema | db:typegen + git diff |
| R-DB-008 | Seed invariants must pass | verify-seed-invariants.ps1 |
| R-DB-009 | RLS policies on user data | verify-rls-policies.ps1 (db-determinism.yml) |
| R-DB-010 | API response format standard | **Manual review** (no check) |
| R-DB-011 | Migration linter tests must pass | test-linter.ps1 (db-determinism.yml) |

### UI Rules (R-UI-001 to R-UI-006)

| Rule ID | Summary | Enforced By |
|---------|---------|-------------|
| R-UI-001 | Pages inside (mobile) route group | verify-ui-v2.mjs (**manual run only**) |
| R-UI-002 | No width constraints in mobile | verify-ui-v2.mjs (**manual run only**) |
| R-UI-003 | No legacy layout imports | verify-ui-v2.mjs (**manual run only**) |
| R-UI-004 | Content routes use v2 layout | verify-ui-v2.mjs (**manual run only**) |
| R-UI-005 | No placeholder icons | verify-ui-v2.mjs (**manual run only**) |
| R-UI-006 | Minimal ad-hoc primitives | verify-ui-v2.mjs (**manual run only**) |

### CI Rules (R-CI-001 to R-CI-004)

| Rule ID | Summary | Enforced By |
|---------|---------|-------------|
| R-CI-001 | ESLint passes on changed lines | lint-gate.yml |
| R-CI-002 | Checkout refs deterministic | **Manual review** (workflow inspection) |
| R-CI-003 | Fail-closed for missing BASE_SHA | Inline bash in workflows |
| R-CI-004 | DB determinism pipeline complete | db-determinism.yml |

---

## How to Use These Guardrails

### For Developers

**When you hit a CI failure**:

1. Check the error message for a Rule ID (e.g., "R-DB-003 violation")
2. Look up the rule in `RULES_VS_CHECKS_MATRIX.md`
3. Read the "Pass Condition" and "Exceptions" sections
4. Fix the violation or add to allowlist (if justified)
5. Re-run the check locally before pushing

**When you want to add an exception**:

1. Find the rule in `RULES_VS_CHECKS_MATRIX.md`
2. Check the "Exceptions" section for allowlist file and format
3. Add your entry following the documented format
4. Document justification (comment in allowlist or code)
5. Get approval if required (e.g., admin client usage)

**When working on UI v2 changes (Patient UI)**:

UI v2 guardrails (R-UI-001 through R-UI-006) are **NOT in CI yet**. You must run the verification script manually:

```powershell
# PowerShell
node scripts/verify-ui-v2.mjs

# Or using pwsh command prefix
pwsh -c "node scripts/verify-ui-v2.mjs"
```

Run this before committing any changes to:
- `apps/rhythm-patient-ui/app/patient/`
- `apps/rhythm-patient-ui/app/content/`

The script checks for:
- Pages outside (mobile) route group
- Forbidden width constraints
- Legacy layout/container imports
- Missing MobileShellV2 wrapper
- Placeholder icon imports
- Ad-hoc UI primitives

**Status**: Manual run only. CI integration planned for future epic.

### For Reviewers

**When reviewing a PR**:

1. Check for changes to allowlists (require justification)
2. Verify that new code follows documented rules
3. If a rule is unclear, consult `RULES_VS_CHECKS_MATRIX.md`
4. If enforcement is missing, check `RULES_VS_CHECKS_DIFF.md` for known gaps

### For Governance

**When planning new guardrails**:

1. Check `RULES_VS_CHECKS_DIFF.md` for gaps to address
2. Use "How to Add a New Rule" section in matrix
3. Create rule with stable ID before implementing check
4. Update both matrix and diff report

**When auditing compliance**:

1. Review allowlist files for stale entries
2. Check that documented exceptions match ESLint config
3. Verify checks are actually running in CI (workflow logs)
4. Plan cleanup of deprecated/temporary allowlists

---

## Relationship to Other Docs

### Related Canon Documents

- `docs/canon/DB_ACCESS_GUARDRAILS.md`: Detailed DB access patterns and rationale
- `docs/canon/DB_MIGRATIONS.md`: Migration best practices and canonical schema
- `docs/canon/CONTRACTS.md`: API and database contract specifications
- `docs/DB_DETERMINISM_CI_FLOW.md`: DB determinism workflow walkthrough

### Workflow Files

- `.github/workflows/api-wiring-gate.yml`: Enforces R-API-001 through R-API-005
- `.github/workflows/db-determinism.yml`: Enforces R-DB-003 through R-DB-008
- `.github/workflows/db-access-verification.yml`: Enforces R-DB-001, R-DB-002
- `.github/workflows/lint-gate.yml`: Enforces R-CI-001

### Verification Scripts

- `scripts/ci/verify-endpoint-catalog.ps1`: R-API-002
- `scripts/ci/verify-critical-api-handlers.js`: R-API-001, R-API-003, R-API-004, R-API-005
- `scripts/db/lint-migrations.ps1`: R-DB-004
- `scripts/lint-new-migrations-idempotency.sh`: R-DB-005
- `scripts/verify-ui-v2.mjs`: R-UI-001 through R-UI-006

---

## Maintenance Schedule

### Weekly
- Review CI failure trends (are same rules repeatedly violated?)
- Check for new allowlist entries (are they justified?)

### Monthly
- Review exception lists (can any be removed?)
- Check for stale allowlist entries (routes/files that no longer exist)

### Quarterly
- Full audit of rules vs checks (update diff report)
- Review and close resolved gaps
- Plan next round of enforcement additions

### Ad-Hoc
- When adding a new rule or check (update matrix + diff)
- When discovering a gap (add to diff report)
- When removing a deprecated rule (archive but don't reuse ID)

---

## FAQ

### Q: Why so many rules? Isn't this over-engineering?

**A**: These rules prevent recurring CI chaos. Each rule addresses a real failure mode that has caused problems:
- R-DB-003 (immutability) prevents migration conflicts
- R-DB-001 (canonical factories) prevents service key exposure
- R-UI-002 (width constraints) prevents mobile layout bugs
- R-CI-001 (ESLint) catches type errors before deploy

The alternative is manual review of every change, which doesn't scale and has higher error rate.

### Q: Can I bypass a rule if I'm in a hurry?

**A**: Generally no. Guardrails are designed to be fast (~seconds to minutes) and prevent problems that are expensive to fix later. If a rule is blocking you:
1. Check if you need an allowlist entry (and document why)
2. If the rule is wrong, open an issue to fix it
3. If it's truly an emergency, document override in PR description

### Q: What if a check has a false positive?

**A**: 
1. Check `RULES_VS_CHECKS_DIFF.md` section 5 for known false positive risks
2. If it's a new pattern, open an issue to improve the check
3. Add allowlist entry with justification
4. Document the false positive in diff report for others

### Q: How do I know if my change needs a new rule?

**A**: If you're adding:
- A new category of code (new app, new route pattern, new schema pattern)
- A new failure mode you want to prevent (saw bug in production)
- A new team/ownership boundary (prevent cross-contamination)

Then consider if a rule + check would prevent future violations.

### Q: Why are some rules not enforced automatically?

**A**: See `RULES_VS_CHECKS_DIFF.md` section 1. Reasons include:
- Complexity (e.g., RLS policy validation requires SQL parsing)
- Resource constraints (not yet implemented)
- Intentional (some things benefit from human judgment)

The diff report tracks these gaps and recommends which to automate.

---

## Contributing

### Adding a Rule

See "How to Add a New Rule" in `RULES_VS_CHECKS_MATRIX.md`.

### Adding a Check

See "How to Add a New Check" in `RULES_VS_CHECKS_MATRIX.md`.

### Reporting a Gap

If you find a rule without a check, or a check without a rule:
1. Verify it's not already in `RULES_VS_CHECKS_DIFF.md`
2. Open an issue with label `guardrails-gap`
3. Include: what should be enforced, why it matters, how to check

### Improving Documentation

PRs welcome for:
- Clarifying pass conditions
- Adding examples to allowlist formats
- Documenting known false positives
- Improving "How to" sections

---

## Changelog

- **2026-01-25**: Initial guardrails documentation created for E72.F1
  - Created RULES_VS_CHECKS_MATRIX.md (30+ rules)
  - Created RULES_VS_CHECKS_DIFF.md (16 findings, 6 recommended issues)
  - Created this README.md
  - Assigned stable Rule IDs across 4 domains
