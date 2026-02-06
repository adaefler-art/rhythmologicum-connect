# Issue 05 — Studio UI Design Recovery: Implementation Summary

## Executive Summary

This document summarizes the implementation of Issue 05, which establishes the foundation for recovering the Studio UI design system to align with the golden reference in `docs/mobile` after PR #818 introduced extensive token-based changes.

**Status:** ✅ Phase 1 & 2 Complete | 🚧 Phase 3 & 4 Planned

**Deliverables Completed:**
- Comprehensive recovery documentation
- 11 design guardrail rules with 5 check scripts
- CI/CD integration with GitHub Actions
- Visual regression test suite
- Complete file audit and classification

## Problem Context

After PR #818:
- Studio UI components diverged from `docs/mobile` reference
- Extensive token system introduced (157+ CSS variables)
- Components over-engineered (Card: 196 lines vs 93 reference, Input: 130 vs 22)
- 14 components importing from `@/lib/design-tokens`
- Quick revert attempt failed, leaving UI in inconsistent state

## Solution Overview

**Approach:** Surgical, phased recovery with automated guardrails

### Phases

1. **✅ Documentation & Reference Fixation** (Complete)
   - Established `docs/mobile` as golden reference
   - Documented design principles and patterns
   - Created comprehensive recovery plan

2. **✅ Audit & Classification** (Complete)
   - Classified 20+ affected files
   - Created dependency graph
   - Prioritized recovery sequence

3. **🚧 Recovery Implementation** (Planned: 7 PRs)
   - PR A: Simplify globals.css
   - PR B-F: Restore components (Card, Input, Select, Table, Modal)
   - PR G: Cleanup design-tokens

4. **✅ CI Guardrails** (Complete)
   - Automated drift detection
   - PR size gates
   - Visual regression tests

## Files Created

### Documentation (3 files, 37KB)

#### `docs/design/recovery.md` (17KB)
Comprehensive recovery plan including:
- Golden reference documentation
- Current implementation analysis
- 7-phase recovery plan (PR A-G)
- Rules vs checks matrix
- Acceptance criteria
- Migration guide for future changes

#### `docs/design/audit.md` (10KB)
File classification and prioritization:
- 20+ files categorized
- Recovery priority matrix
- Dependency graph
- Statistics and metrics

#### `RULES_VS_CHECKS_MATRIX.md` (10KB)
Complete rules-to-checks mapping:
- 11 rules across 4 categories
- 5 check implementations
- Zero drift (all rules have checks, all checks have rules)
- CI integration plan

### Guardrail Scripts (5 scripts + README)

#### `tools/design-guardrails/component-drift-check.sh`
**Rules:** R-COMP-01, R-COMP-02, R-COMP-03, R-COMP-04, R-COMP-05

Checks:
- ❌ BLOCK: design-tokens imports (R-COMP-01)
- ⚠️ WARN: Missing data-slot attributes (R-COMP-02)
- ⚠️ WARN: Excessive inline styles (R-COMP-03)
- ⚠️ WARN: Component line count deviations (R-COMP-04, R-COMP-05)

**Current Results:**
```
✗ R-COMP-01: 14 components import design-tokens (BLOCKING)
⚠ R-COMP-02: 5 components missing data-slot
⚠ R-COMP-04: Card.tsx is 196 lines (expected 46-139)
⚠ R-COMP-05: Input.tsx is 130 lines (expected 11-33)
```

#### `tools/design-guardrails/globals-size-check.sh`
**Rule:** R-GLOB-01

Checks that `globals.css` stays under 200 lines.

**Current:** 396 lines (⚠️ violates R-GLOB-01)

#### `tools/design-guardrails/globals-var-check.sh`
**Rule:** R-GLOB-02

Counts CSS variables in `:root`, warns if >20.

**Current:** ~157 variables (⚠️ violates R-GLOB-02)

#### `tools/design-guardrails/pr-size-check.sh`
**Rules:** R-SIZE-01, R-SIZE-02

Prevents mega-PRs:
- ⚠️ WARN: >20 UI component files
- ❌ BLOCK: >50 total files (without `size-override` label)

#### `tools/design-guardrails/run-all.sh`
Master script to run all checks in sequence.

#### `tools/design-guardrails/README.md`
Usage guide and documentation for all scripts.

### CI/CD Integration

#### `.github/workflows/design-guardrails.yml`
GitHub Actions workflow with 3 jobs:

1. **component-drift** (blocking)
   - Runs component drift checks
   - Comments results on PR
   - Fails if R-COMP-01 violated

2. **globals-checks** (warnings)
   - Runs globals size and var checks
   - Comments warnings on PR
   - Non-blocking

3. **pr-size** (conditional blocking)
   - Checks PR file count
   - Comments results on PR
   - Fails if >50 files without override

### Visual Regression Tests

#### `tests/e2e/design-system-visual.spec.ts`
Playwright tests for visual regression:

**Rules:** R-VIS-01, R-VIS-02, R-VIS-03, R-VIS-04

Tests:
- Card components match reference (R-VIS-01)
- Input components match reference (R-VIS-02)
- Table components match reference (R-VIS-03)
- Button components match reference (R-VIS-04)
- Color palette consistency
- Typography consistency
- Component presence validation

**Usage:**
```bash
# Run visual tests
npx playwright test design-system-visual

# Update baselines (after approved changes)
npx playwright test design-system-visual --update-snapshots
```

## Design Principles

### 1. Golden Reference
**Source:** `docs/mobile/components/ui/**`

Characteristics:
- Semantic Tailwind classes (not CSS variables)
- Minimal abstraction
- `data-slot` attributes
- `cn()` utility for class merging
- Radix UI primitives where appropriate

### 2. Semantic Tokens Only
**Reference:** `docs/mobile/styles/globals.css` (186 lines)

Minimal token set:
- Colors: background, foreground, card, border, input, muted
- Radius: single `--radius` variable
- No spacing/typography/shadow token systems

### 3. Component Patterns

#### Simple Component
```tsx
import { cn } from "./utils"

function Component({ className, ...props }) {
  return (
    <div
      data-slot="component"
      className={cn("base-classes", className)}
      {...props}
    />
  )
}
```

#### Radix UI Wrapper
```tsx
import * as Primitive from "@radix-ui/react-component"

function Component(props) {
  return <Primitive.Root data-slot="component" {...props} />
}
```

### 4. Guardrail Philosophy

**Every rule has a check, every check references a rule.**

Violation format: `violates R-XXX-YY` for quick diagnosis

## Recovery Roadmap

### Phase 3: Implementation (7 PRs)

#### PR A: Simplify globals.css
**Target:** `apps/rhythm-studio-ui/app/globals.css`
- Reduce from 396 to ~186 lines
- Remove extensive token system
- Keep semantic tokens only
- Match `docs/mobile/styles/globals.css`

**Fixes:** R-GLOB-01, R-GLOB-02

#### PR B: Restore Card Component
**Target:** `lib/ui/Card.tsx`
- Reduce from 196 to ~93 lines
- Remove design-tokens imports
- Add data-slot attributes
- Use Tailwind classes
- Match `docs/mobile/components/ui/card.tsx`

**Fixes:** R-COMP-01 (partial), R-COMP-02 (partial), R-COMP-04

#### PR C: Restore Form Components
**Targets:** Input, FormField, Label, HelperText, Textarea
- Simplify Input from 130 to ~22 lines
- Remove complex helper text handling
- Add data-slot attributes
- Match references

**Fixes:** R-COMP-01 (partial), R-COMP-02 (partial), R-COMP-05

#### PR D: Restore Select Component
**Target:** `lib/ui/Select.tsx`
- Rewrite using Radix UI Select primitive
- Add portal-based rendering
- Add animations
- Match `docs/mobile/components/ui/select.tsx`

**Fixes:** R-COMP-01 (partial), R-COMP-02 (partial)

#### PR E: Restore Table Component
**Target:** `lib/ui/Table.tsx`
- Verify structure matches reference
- Add data-slot attributes
- Test on design-system page

**Fixes:** R-COMP-01 (partial), R-COMP-02 (partial)

#### PR F: Restore Modal/Dialog
**Target:** `lib/ui/Modal.tsx`
- Rewrite using Radix UI AlertDialog
- Add portal-based rendering
- Add animations
- Support drawer variant if needed

**Fixes:** R-COMP-01 (partial), R-COMP-02 (partial)

#### PR G: Cleanup Design Tokens
**Targets:** All remaining components, token files
- Remove `lib/design-tokens.ts`
- Remove `lib/design-tokens-loader.ts`
- Remove `lib/design-tokens/` directory
- Update remaining components (AppShell, Button, etc.)

**Fixes:** R-COMP-01 (complete)

### Phase 4: Verification

After all PRs merged:
1. Run full guardrail suite: `./tools/design-guardrails/run-all.sh`
2. Verify all violations resolved
3. Run visual regression tests
4. Update documentation with "after" state

## Metrics & Impact

### Before Recovery
- **Global CSS:** 396 lines, 157+ variables
- **Card Component:** 196 lines, 3 token imports, no data-slot
- **Input Component:** 130 lines, 2 token imports, no data-slot
- **Blocking Violations:** 1 (R-COMP-01: 14 files)
- **Total Warnings:** 5+

### After Recovery (Target)
- **Global CSS:** ~186 lines, ~20 variables (-53%)
- **Card Component:** ~93 lines, 0 token imports, has data-slot (-53%)
- **Input Component:** ~22 lines, 0 token imports, has data-slot (-83%)
- **Blocking Violations:** 0
- **Total Warnings:** 0

### Code Reduction
- **Total Lines Removed:** ~400+ lines across components
- **Files Deleted:** 3 (design-tokens files)
- **Complexity Reduction:** ~60% average

## Testing Strategy

### Manual Testing
- Design system showcase page (`/admin/design-system`)
- All forms using Input, Select components
- All pages using Card component
- All data tables

### Automated Testing
1. **Guardrail Scripts:** Run on every local commit
2. **CI Checks:** Run on every PR
3. **Visual Regression:** Run on design-system changes
4. **E2E Tests:** Existing tests should pass

### Regression Prevention
- CI blocks PRs with violations
- Visual baselines catch unintended changes
- PR size gate prevents mega-PRs
- Component drift detection runs automatically

## Lessons Learned

### What Worked
✅ Clear golden reference (docs/mobile)  
✅ Comprehensive documentation before changes  
✅ Automated guardrails to prevent regression  
✅ Small, focused PR strategy  
✅ Rules-to-checks mapping with zero drift  

### What to Avoid
❌ Mega-PRs with sweeping changes  
❌ Token systems without clear benefit  
❌ Over-engineering simple components  
❌ Changes without reference/documentation  

## Future Prevention

### Guardrails in Place
1. **CI Workflow:** Runs on every PR
2. **Component Drift Check:** Blocks design-tokens imports
3. **PR Size Gate:** Prevents mega-PRs
4. **Visual Regression:** Catches UI changes
5. **Documentation:** Recovery plan as reference

### Developer Guidelines
From `docs/design/recovery.md`:

1. Start with the reference (`docs/mobile`)
2. Use semantic tokens only
3. Prefer Tailwind classes
4. Keep it simple
5. Use data-slot attributes
6. Check guardrails locally
7. Small, focused PRs

## Acceptance Criteria Status

### ✅ Completed
- [x] Studio UI reference documented
- [x] Audit and classification complete
- [x] Guardrail scripts implemented
- [x] CI integration ready
- [x] Visual regression tests created
- [x] Recovery plan in small PRs defined

### 🚧 Remaining (Phases 3A-3G)
- [ ] Studio UI components aligned with reference
- [ ] No design-tokens imports
- [ ] All components use semantic Tailwind classes
- [ ] All components have data-slot attributes
- [ ] globals.css simplified to <200 lines
- [ ] All guardrail violations resolved

## Next Steps

1. **Begin PR A:** Simplify globals.css
2. **Test Impact:** Verify on design-system page
3. **Proceed with PR B:** Card component recovery
4. **Iterate through PR C-G:** Component-by-component
5. **Final Verification:** Run full test suite
6. **Document Results:** Update this summary with "after" metrics

## Related Documentation

- [Recovery Plan](./docs/design/recovery.md) — Full strategy and migration guide
- [Audit](./docs/design/audit.md) — File classification and prioritization
- [Rules Matrix](./RULES_VS_CHECKS_MATRIX.md) — Complete rules-to-checks mapping
- [Guardrails README](./tools/design-guardrails/README.md) — Script usage
- [Visual Tests](./tests/e2e/design-system-visual.spec.ts) — Regression tests

## Conclusion

Phase 1 and 2 establish a **strong foundation** for design recovery:
- Clear documentation and reference
- Automated guardrails to prevent regression
- Structured recovery plan with 7 small PRs
- CI integration for continuous validation

The actual component recovery (Phase 3) will proceed carefully, one PR at a time, with testing after each change. This approach ensures:
- **Reviewability:** Each PR is focused and easy to review
- **Testability:** Impact of changes is isolated
- **Rollback:** Individual changes can be reverted if needed
- **Quality:** Guardrails catch issues early

**This work sets the standard for future design system maintenance and evolution.**

---

**Version:** 1.0  
**Date:** 2026-02-06  
**Status:** Phase 1 & 2 Complete, Phase 3 Ready to Begin
