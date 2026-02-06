# Design Guardrails

Automated checks to prevent design drift and maintain consistency with the golden reference in `docs/mobile`.

## Quick Start

```bash
# Run all checks
./tools/design-guardrails/run-all.sh

# Run individual checks
./tools/design-guardrails/component-drift-check.sh
./tools/design-guardrails/globals-size-check.sh
./tools/design-guardrails/globals-var-check.sh
./tools/design-guardrails/pr-size-check.sh
```

## Scripts

### `component-drift-check.sh`

Detects component deviations from `docs/mobile` reference patterns.

**Rules:** R-COMP-01, R-COMP-02, R-COMP-03, R-COMP-04, R-COMP-05

**Checks:**
- ❌ **BLOCK**: Design-tokens imports in components
- ⚠️ **WARN**: Missing data-slot attributes
- ⚠️ **WARN**: Excessive inline styles (>20%)
- ⚠️ **WARN**: Card component line count deviation
- ⚠️ **WARN**: Input component line count deviation

**Exit Code:** 1 if blocking violations found

---

### `globals-size-check.sh`

Ensures `globals.css` stays lean and focused.

**Rules:** R-GLOB-01

**Checks:**
- ⚠️ **WARN**: globals.css exceeds 200 lines

**Exit Code:** Always 0 (warning only)

---

### `globals-var-check.sh`

Prevents explosion of CSS variables in `:root`.

**Rules:** R-GLOB-02

**Checks:**
- ⚠️ **WARN**: More than 20 CSS variables in :root

**Exit Code:** Always 0 (warning only)

---

### `pr-size-check.sh`

Prevents mega-PRs that change too many files.

**Rules:** R-SIZE-01, R-SIZE-02

**Checks:**
- ⚠️ **WARN**: More than 20 UI component files changed
- ❌ **BLOCK**: More than 50 total files changed (without override label)

**Environment:**
- `PR_FILES`: Newline-separated list of changed files
- `PR_LABELS`: Comma-separated PR labels

**Override:** Add `size-override` label to bypass R-SIZE-02

**Exit Code:** 1 if R-SIZE-02 violated without override

---

### `run-all.sh`

Runs all guardrail checks in sequence.

**Exit Code:** 1 if any blocking violation found

## Current Violations

As of the design recovery effort, the following violations exist:

### Blocking (❌)
- **R-COMP-01**: 14 components import from `@/lib/design-tokens`

### Warnings (⚠️)
- **R-COMP-02**: 5 components missing data-slot attributes
- **R-COMP-04**: Card.tsx is 196 lines (expected ~93)
- **R-COMP-05**: Input.tsx is 130 lines (expected ~22)
- **R-GLOB-01**: globals.css is 396 lines (expected <200)
- **R-GLOB-02**: ~157 CSS variables in :root (expected <20)

## Recovery Plan

See [docs/design/recovery.md](../../docs/design/recovery.md) for the complete recovery plan to address these violations.

## CI Integration

These checks will be integrated into GitHub Actions workflow `.github/workflows/design-guardrails.yml`.

## Adding New Checks

1. Choose appropriate rule category (COMP, SIZE, GLOB, VIS)
2. Assign next available ID (e.g., R-COMP-06)
3. Add to [RULES_VS_CHECKS_MATRIX.md](../../RULES_VS_CHECKS_MATRIX.md)
4. Update or create check script
5. Update this README
6. Test locally

## Related Documentation

- [RULES_VS_CHECKS_MATRIX.md](../../RULES_VS_CHECKS_MATRIX.md) - Complete rules mapping
- [docs/design/recovery.md](../../docs/design/recovery.md) - Design recovery plan
- [docs/mobile](../../docs/mobile) - Golden reference
