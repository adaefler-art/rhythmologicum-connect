# Rules vs Checks Matrix — Issue 05 Design Recovery

## Overview

This document maps design guardrail rules to their corresponding check implementations. Every rule MUST have at least one check, and every check MUST reference at least one rule.

**Format:** Violations output `violates R-XXX-YY` where R-XXX-YY is the rule identifier.

**Status:** 🚧 In Development (11 rules defined, 5 check scripts planned, 0 implemented)

## Rule Categories

- **R-COMP**: Component design rules
- **R-SIZE**: PR size rules
- **R-GLOB**: Global styles rules
- **R-VIS**: Visual regression rules

## Rules → Checks Mapping

### Component Design Rules (R-COMP)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-COMP-01 | Components must not import from `@/lib/design-tokens` | 🔴 Block | `component-drift-check.sh` | ⏳ Planned |
| R-COMP-02 | Components should use `data-slot` attributes | ⚠️ Warn | `component-drift-check.sh` | ⏳ Planned |
| R-COMP-03 | Components should prefer Tailwind classes over inline styles (>80% Tailwind) | ⚠️ Warn | `component-drift-check.sh` | ⏳ Planned |
| R-COMP-04 | Card component line count must be within ±50% of reference (93 lines) | ⚠️ Warn | `component-drift-check.sh` | ⏳ Planned |
| R-COMP-05 | Input component line count must be within ±50% of reference (22 lines) | ⚠️ Warn | `component-drift-check.sh` | ⏳ Planned |

### PR Size Rules (R-SIZE)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-SIZE-01 | PRs should change fewer than 20 UI component files | ⚠️ Warn | `pr-size-check.sh` | ⏳ Planned |
| R-SIZE-02 | PRs must not change more than 50 total files without override label | 🔴 Block | `pr-size-check.sh` | ⏳ Planned |

### Global Styles Rules (R-GLOB)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-GLOB-01 | `globals.css` should be under 200 lines | ⚠️ Warn | `globals-size-check.sh` | ⏳ Planned |
| R-GLOB-02 | `globals.css` :root should define fewer than 20 CSS variables | ⚠️ Warn | `globals-var-check.sh` | ⏳ Planned |

### Visual Regression Rules (R-VIS)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-VIS-01 | Design system showcase page card components must match visual baseline | ⚠️ Warn | `design-system-visual.spec.ts` | ⏳ Planned |
| R-VIS-02 | Design system showcase page input components must match visual baseline | ⚠️ Warn | `design-system-visual.spec.ts` | ⏳ Planned |

## Checks → Rules Mapping

### `tools/design-guardrails/component-drift-check.sh`

**Purpose:** Detect component deviations from `docs/mobile` reference patterns

**Rules Enforced:**
- R-COMP-01: Check for `@/lib/design-tokens` imports
- R-COMP-02: Check for `data-slot` attribute usage
- R-COMP-03: Count inline `style=` vs Tailwind classes
- R-COMP-04: Compare Card.tsx line count with reference
- R-COMP-05: Compare Input.tsx line count with reference

**Usage:**
```bash
./tools/design-guardrails/component-drift-check.sh
# Outputs:
# ✓ R-COMP-01: No design-tokens imports found
# ✗ R-COMP-02: violates R-COMP-02 - Missing data-slot in lib/ui/Card.tsx
# ✗ R-COMP-03: violates R-COMP-03 - 45% inline styles in lib/ui/Input.tsx (threshold: 20%)
# ✗ R-COMP-04: violates R-COMP-04 - Card.tsx is 196 lines (expected: 93 ±47)
# ✓ R-COMP-05: Input.tsx is within acceptable range
```

**Exit Code:** 1 if any BLOCK-level violation, 0 otherwise (warnings don't fail)

**Status:** ⏳ Planned

---

### `tools/design-guardrails/pr-size-check.sh`

**Purpose:** Prevent mega-PRs that change too many files

**Rules Enforced:**
- R-SIZE-01: Warn if >20 files in `lib/ui/**` changed
- R-SIZE-02: Block if >50 total files changed (unless override label)

**Usage:**
```bash
./tools/design-guardrails/pr-size-check.sh
# Outputs:
# ✓ R-SIZE-01: 12 UI component files changed (threshold: 20)
# ✗ R-SIZE-02: violates R-SIZE-02 - 73 files changed (threshold: 50)
```

**Environment Variables:**
- `PR_FILES`: Newline-separated list of changed files (from GitHub Actions)
- `PR_LABELS`: Comma-separated PR labels (check for "size-override")

**Exit Code:** 1 if R-SIZE-02 violated without override, 0 otherwise

**Status:** ⏳ Planned

---

### `tools/design-guardrails/globals-size-check.sh`

**Purpose:** Keep globals.css lean and focused

**Rules Enforced:**
- R-GLOB-01: Warn if globals.css exceeds 200 lines

**Usage:**
```bash
./tools/design-guardrails/globals-size-check.sh
# Outputs:
# ✗ R-GLOB-01: violates R-GLOB-01 - globals.css is 396 lines (threshold: 200)
```

**Target File:** `apps/rhythm-studio-ui/app/globals.css`

**Exit Code:** Always 0 (warning only)

**Status:** ⏳ Planned

---

### `tools/design-guardrails/globals-var-check.sh`

**Purpose:** Prevent explosion of CSS variables in :root

**Rules Enforced:**
- R-GLOB-02: Warn if :root defines more than 20 CSS variables

**Usage:**
```bash
./tools/design-guardrails/globals-var-check.sh
# Outputs:
# ✗ R-GLOB-02: violates R-GLOB-02 - Found 157 CSS variables in :root (threshold: 20)
```

**Method:** Count lines matching `--[a-z]` pattern in `:root { }` block

**Target File:** `apps/rhythm-studio-ui/app/globals.css`

**Exit Code:** Always 0 (warning only)

**Status:** ⏳ Planned

---

### `tests/e2e/design-system-visual.spec.ts`

**Purpose:** Visual regression testing for design system components

**Rules Enforced:**
- R-VIS-01: Card components match reference screenshots
- R-VIS-02: Input components match reference screenshots

**Usage:**
```bash
npx playwright test design-system-visual
# Outputs:
# ✓ R-VIS-01: Card component matches baseline
# ✗ R-VIS-02: violates R-VIS-02 - Input component differs from baseline
```

**Baseline Storage:** `tests/e2e/snapshots/design-system-visual/`

**Update Baselines:** `npx playwright test --update-snapshots`

**Exit Code:** 1 if any snapshot mismatches, 0 otherwise

**Status:** ⏳ Planned

---

## CI Integration

### GitHub Actions Workflow

**File:** `.github/workflows/design-guardrails.yml`

**Triggers:**
- Pull request (all branches)
- Push to main (for baseline updates)

**Jobs:**

1. **component-drift**
   - Runs `component-drift-check.sh`
   - Fails PR if R-COMP-01 violated
   - Comments warnings on PR

2. **pr-size**
   - Runs `pr-size-check.sh`
   - Fails PR if R-SIZE-02 violated (without override)
   - Comments warnings on PR

3. **globals-checks**
   - Runs `globals-size-check.sh` and `globals-var-check.sh`
   - Comments warnings only (non-blocking)

4. **visual-regression**
   - Runs Playwright visual tests
   - Uploads diff images as artifacts
   - Comments on PR with diff previews

**Status:** ⏳ Planned

---

## Audit Results

### Rules Without Checks

✅ **None** — All 11 rules have corresponding checks

### Checks Without Rules

✅ **None** — All 5 check scripts reference specific rules

### Scope Mismatches

✅ **None** — All checks validate the rules they claim to validate

---

## Implementation Checklist

### Scripts
- [ ] `tools/design-guardrails/component-drift-check.sh`
- [ ] `tools/design-guardrails/pr-size-check.sh`
- [ ] `tools/design-guardrails/globals-size-check.sh`
- [ ] `tools/design-guardrails/globals-var-check.sh`

### Tests
- [ ] `tests/e2e/design-system-visual.spec.ts`
- [ ] Baseline screenshots for card component
- [ ] Baseline screenshots for input component

### CI/CD
- [ ] `.github/workflows/design-guardrails.yml`
- [ ] PR comment integration
- [ ] Artifact upload for visual diffs

### Documentation
- [x] `RULES_VS_CHECKS_MATRIX.md` (this file)
- [x] `docs/design/recovery.md` (recovery plan)
- [ ] Update README.md with guardrails section

---

## Usage for Developers

### Running Checks Locally

```bash
# Run all design guardrails
./tools/design-guardrails/run-all.sh

# Run specific check
./tools/design-guardrails/component-drift-check.sh

# Visual regression tests
npx playwright test design-system-visual

# Update visual baselines (after approved changes)
npx playwright test design-system-visual --update-snapshots
```

### Understanding Violations

When a check fails, look for output like:

```
✗ R-COMP-01: violates R-COMP-01 - Found design-tokens import in lib/ui/Card.tsx
```

1. **R-COMP-01** is the rule ID
2. Look up the rule in this document
3. Check the rule description and severity
4. Fix the violation or request override (if allowed)

### Requesting Overrides

For **R-SIZE-02** only:

1. Add `size-override` label to PR
2. Justify in PR description why mega-PR is necessary
3. Get approval from code owners
4. Document breakup plan for future

---

## Maintenance

### Adding a New Rule

1. Choose appropriate category (COMP, SIZE, GLOB, VIS)
2. Assign next available ID (e.g., R-COMP-06)
3. Add to rules table with severity (Block/Warn)
4. Assign to existing check script or create new one
5. Update check script to validate new rule
6. Update this document
7. Test locally before committing

### Modifying a Rule

1. Update rule description in this document
2. Update corresponding check script logic
3. Update severity if needed (Block ↔ Warn)
4. Test changes locally
5. Document change in commit message

### Deprecating a Rule

1. Mark rule as ⚠️ Deprecated in table
2. Update check script to skip rule
3. Leave in documentation for historical reference
4. After 2 releases, remove from tables

---

## Version History

- **v1.0** (2026-02-06): Initial matrix created
  - 11 rules defined across 4 categories
  - 5 check scripts planned
  - CI integration designed
  - Zero drift: all rules have checks, all checks have rules

---

## Related Documentation

- [Design Recovery Plan](./docs/design/recovery.md) — Full recovery strategy
- [Design System Showcase](/admin/design-system) — Live component examples
- [Golden Reference](./docs/mobile/components/ui/) — Authoritative component patterns
