# ESLint Policy & CI Gate Strategy

## Overview

This document describes the interim ESLint enforcement policy for the Rhythmologicum Connect repository. The goal is to prevent new lint regressions while allowing incremental cleanup of pre-existing lint debt without blocking unrelated PRs.

## Current State

As of v0.5, the repository contains **pre-existing ESLint violations**:
- **1 error**: `@typescript-eslint/no-explicit-any` in `app/api/health/env/route.ts`
- **29 warnings**: Various unused variables, unused imports, and React hooks dependency warnings

These violations exist in code that is already merged and functional. Enforcing a strict "zero-lint-errors" gate on the full repository would block all PRs until all legacy debt is resolved, which is not practical.

## Interim Policy: Changed-Files Lint Gate

### What We Enforce

The CI lint gate (`lint-gate.yml` workflow) enforces ESLint rules **only on changed lines** in pull requests. Specifically:

1. **Changed Files Only**: ESLint runs only on `.ts` and `.tsx` files modified in the PR
2. **Changed Lines Only**: Errors are reported only if they occur on lines that were added or modified in the PR
3. **Errors Block PRs**: Any ESLint **error** (severity 2) on a changed line will fail the CI check and block the PR
4. **Warnings Are Reported**: Warnings are shown but do not block the PR (configurable)
5. **Skip When No Changes**: If a PR has no TS/TSX changes, the lint gate is skipped entirely

### What We Ignore (Interim Allowlist)

To prevent blocking PRs due to unavoidable context when editing near legacy code, the following rules are temporarily ignored even on changed lines:

- `@typescript-eslint/no-explicit-any` - Legacy usage exists; will be cleaned up separately

This allowlist is defined in `tools/lint-changed-lines.mjs` (variable `IGNORED_RULE_IDS`) and should be kept minimal.

### Local Development

The local `npm run lint` command **remains unchanged** and runs ESLint on the entire repository. This allows developers to:
- See all lint issues when working locally
- Choose to fix additional lint issues beyond their immediate changes
- Use editor integrations that run eslint on the full file

**Note**: `npm run lint` may fail locally due to pre-existing issues. This is expected and acceptable during the interim period.

### CI Workflow

The `lint-gate.yml` workflow:
1. Checks out the code with full git history (`fetch-depth: 0`)
2. Determines which `.ts`/`.tsx` files changed between base and head SHA
3. Runs `npm run lint:changed`, which uses `tools/lint-changed-lines.mjs` to:
   - Lint only changed files
   - Extract git diff hunks to determine changed line ranges
   - Filter ESLint errors to only those on changed lines
   - Apply the interim allowlist
   - Exit with code 1 if any relevant errors remain

## How Changed-Line Detection Works

The lint gate uses git diff to identify changed line ranges:

```bash
git diff -U0 <base-sha> <head-sha> -- file.ts
```

The `-U0` flag produces a unified diff with zero lines of context, showing only the exact changed lines. The tool parses hunk headers like:

```
@@ -10,3 +15,5 @@
```

This means lines 15-19 (5 lines starting at line 15) in the HEAD version were changed. ESLint errors on those lines are considered "on changed lines" and will block the PR.

## Debt Tracking & Cleanup Plan

### Current Lint Debt Inventory

| Category | Count | Example Files |
|----------|-------|---------------|
| Unused vars/imports | 26 warnings | `app/admin/layout.tsx`, `lib/contracts/*.ts` |
| React hooks deps | 1 warning | `app/clinician/funnels/[id]/page.tsx` |
| Explicit `any` | 1 error | `app/api/health/env/route.ts` |
| Unused eslint-disable | 3 warnings | `scripts/*.js`, `tools/*.cjs` |

### Cleanup Strategy

1. **Do Not Block PRs**: Existing debt should not prevent new features from landing
2. **Incremental Improvement**: When touching a file with lint debt, fix the issues in that file if feasible
3. **Dedicated Cleanup**: Schedule a dedicated cleanup PR (tracked separately) to resolve all pre-existing violations
4. **Remove Interim Allowlist**: Once repo-wide lint debt is resolved, remove the `IGNORED_RULE_IDS` allowlist from `lint-changed-lines.mjs`
5. **Full-Repo Gate**: After cleanup, transition to a strict full-repo lint gate in CI

### Tracking Issue

Lint debt cleanup is tracked in: **[Create issue]** TV05_04-LINT-DEBT-CLEANUP

Target: Resolve all pre-existing violations by **v0.6.0** milestone.

## Tools & Commands

### Available Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run lint` | Lint entire repository | Local development, editor integration |
| `npm run lint:changed` | Lint changed files/lines only | CI, pre-commit hook (optional) |
| `npm run lint -- --fix` | Auto-fix issues | Local cleanup of fixable issues |

### Lint Gate Tool

The core logic is in `tools/lint-changed-lines.mjs`:
- Detects changed files using git diff
- Runs ESLint in JSON mode
- Parses diff hunks to extract changed line ranges
- Filters errors to only those on changed lines
- Applies interim allowlist
- Exits with failure if relevant errors exist

### Customization

To adjust the interim allowlist (e.g., to add another temporarily-ignored rule):

1. Edit `tools/lint-changed-lines.mjs`
2. Update the `IGNORED_RULE_IDS` Set:
   ```javascript
   const IGNORED_RULE_IDS = new Set([
     normalizeRuleId('@typescript-eslint/no-explicit-any'),
     // Add more if absolutely necessary (keep minimal)
   ])
   ```
3. Document the reason in this file
4. Ensure cleanup is tracked

## Verification

### Running the Lint Gate Locally

To simulate CI locally:

```bash
# Set base and head SHAs
export BASE_SHA=$(git merge-base HEAD origin/main)
export HEAD_SHA=$(git rev-parse HEAD)

# Run the lint gate
npm run lint:changed
```

Expected output:
- If no errors on changed lines: `✅ No ESLint errors on changed lines. Ignored N pre-existing errors outside changed ranges.`
- If errors exist: `❌ ESLint errors on changed lines: N` followed by error details, exit code 1

### PowerShell Verification (Windows)

```powershell
# Run standard commands
npm test
npm run build  # May fail due to missing env vars (expected in dev)

# The lint gate is verified in CI on changed files
# To verify locally, use bash/WSL or Git Bash
```

## FAQs

### Why not just fix all lint issues now?

Fixing all 30 violations would touch many files and potentially introduce risk. The interim gate allows us to:
- Enforce quality on new code immediately
- Fix legacy issues incrementally when we're already touching those files
- Avoid a large, risky cleanup PR that could introduce bugs

### What if I want to fix extra lint issues in my PR?

Please do! If you're editing a file and see nearby lint issues, fixing them is encouraged. The lint gate will pass as long as your changes don't introduce *new* errors.

### Can I run ESLint with auto-fix?

Yes: `npm run lint -- --fix` will auto-fix many issues. Review the changes carefully before committing.

### What if the lint gate fails on my PR?

1. Check the CI output to see which file/line has the error
2. Fix the error in your PR
3. Push the fix - the lint gate will re-run
4. If you believe the error is a false positive or unavoidable, discuss in the PR

### When will we remove the interim policy?

Once all pre-existing lint violations are resolved (target: v0.6.0), we will:
1. Remove the `IGNORED_RULE_IDS` allowlist
2. Switch CI to run full-repo ESLint
3. Update this document to reflect the new strict policy

## Implementation Details

### CI Workflow Trigger Paths

The `lint-gate.yml` workflow triggers on:
- Pull requests to `main` or `develop` when:
  - Any `.ts` or `.tsx` file changes
  - `eslint.config.mjs` changes
  - `package.json` changes
  - `tools/lint-changed-lines.mjs` changes
- Pushes to `main` when the same files change

This ensures the gate runs on all relevant changes but skips when only documentation or non-code files change.

### Integration with Other CI Checks

The lint gate is a **standalone workflow** and runs independently of:
- `db-access-verification.yml` - Contains additional lint logic for DB access patterns
- `db-determinism.yml` - Schema validation
- Other CI checks

The `db-access-verification.yml` workflow contains a **similar but separate** lint gate implementation focused on DB access patterns. Both workflows may run on the same PR, and both must pass.

## Summary

The interim ESLint policy balances **enforcing quality on new code** with **pragmatic handling of legacy debt**. By linting only changed lines, we:

✅ Prevent new lint regressions  
✅ Allow incremental improvement  
✅ Avoid blocking unrelated PRs  
✅ Maintain a clear path to full-repo lint enforcement  

For questions or suggestions, open an issue with the `lint-policy` label.

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-02  
**Maintained By**: Engineering Team
