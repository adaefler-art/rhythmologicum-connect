# Studio UI Design Recovery Documentation

## Overview

This document establishes the golden reference for the Studio UI design system and outlines the recovery plan after PR #818 introduced extensive token-based changes that deviated from the original design basis.

## Problem Statement

After the merge of PR #818, the Studio UI design was broadly "token-unified"/standardized with a comprehensive CSS variable system. The quick revert attempt did not work reliably, leaving the Studio UI in a state that deviates from the original design basis documented in `docs/mobile`.

**Current State Issues:**
- `lib/ui` components use an extensive token-based system with `@/lib/design-tokens`
- `apps/rhythm-studio-ui/app/globals.css` contains 396 lines of CSS variables and token definitions
- Components like `Card`, `Input`, `Select`, etc. use inline styles with token references instead of semantic Tailwind classes
- Divergence from the clean, maintainable patterns established in `docs/mobile`

## Golden Reference: docs/mobile

### Source of Truth

**Location:** `docs/mobile/components/ui/**`

This directory contains the authoritative design reference for all UI components. These components are characterized by:

1. **Semantic Tailwind Classes:** Direct use of Tailwind utility classes instead of CSS variables
2. **Minimal Abstraction:** Clean, readable component code
3. **Consistent Patterns:** Unified approach to styling across all components
4. **Data Slots:** Use of `data-slot` attributes for component identification
5. **cn() Utility:** The `cn()` utility from `./utils` for conditional class merging

### Key Reference Files

#### Surface/Card Components

**Reference:** `docs/mobile/components/ui/card.tsx`

**Key Characteristics:**
```tsx
- Uses `data-slot` attributes for semantic markup
- Border radius: `rounded-xl`
- Border: `border` (single border)
- Background: `bg-card`
- Text color: `text-card-foreground`
- Flexible gap: `flex flex-col gap-6`
- Padding: Applied via `px-6 pt-6 pb-6` pattern
```

**Design Principles:**
- Clean hierarchy with header, content, footer sections
- Container queries with `@container/card-header`
- Auto-adjusting grid layouts for headers with actions
- Border separators controlled by CSS selectors (`.border-b`, `.border-t`)

#### Input Components

**Reference:** `docs/mobile/components/ui/input.tsx`

**Key Characteristics:**
```tsx
- Height: `h-9` (36px)
- Border radius: `rounded-md`
- Background: `bg-input-background`
- Border: `border-input`
- Focus ring: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Error state: `aria-invalid:border-destructive aria-invalid:ring-destructive/20`
- Dark mode: `dark:bg-input/30`
```

**Design Principles:**
- Consistent form field styling using semantic color tokens
- ARIA attributes for accessibility
- Placeholder text: `placeholder:text-muted-foreground`
- File input styling: Special handling for file inputs

#### Select Components

**Reference:** `docs/mobile/components/ui/select.tsx`

**Key Characteristics:**
```tsx
- Uses Radix UI Select primitive (@radix-ui/react-select@2.1.6)
- Trigger: `h-9` height, `rounded-md`, `border`, `bg-input-background`
- Content: Popover with animations, `rounded-md border shadow-md`
- Items: `rounded-sm` with hover state `focus:bg-accent focus:text-accent-foreground`
- Icon indicators: CheckIcon for selected items
```

**Design Principles:**
- Portal-based rendering for z-index management
- Scroll buttons for long lists
- Keyboard navigation support
- Size variants: `sm` and `default`

#### Table Components

**Reference:** `docs/mobile/components/ui/table.tsx`

**Key Characteristics:**
```tsx
- Container: `relative w-full overflow-x-auto`
- Table: `w-full caption-bottom text-sm`
- Header row: `[&_tr]:border-b`
- Body rows: Hover state `hover:bg-muted/50`, border-b
- Cells: `p-2 align-middle whitespace-nowrap`
```

**Design Principles:**
- Responsive with horizontal scrolling
- Zebra striping via hover, not alternating rows
- Checkbox support with special column handling
- Caption below table (caption-bottom)

#### Dialog/Modal Components

**Reference:** `docs/mobile/components/ui/alert-dialog.tsx`, `docs/mobile/components/ui/drawer.tsx`

**Key Characteristics:**
```tsx
- Overlay: `bg-black/50` with fade animations
- Content: Centered, `rounded-lg border p-6 shadow-lg`
- Max width: `max-w-lg` for dialogs
- Animations: Fade and zoom via data-state attributes
- Drawer: Directional variants (top, bottom, left, right)
```

**Design Principles:**
- Uses Radix UI primitives for accessibility
- Portal-based rendering
- Focus trap and keyboard management
- Smooth enter/exit animations
- Different patterns for different contexts (dialog vs drawer)

### Design Tokens in Reference

The `docs/mobile` reference uses **semantic color tokens** defined in CSS variables:

**From `docs/mobile/styles/globals.css`:**
```css
:root {
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --radius: 0.625rem;
  /* ... etc */
}
```

**Key Differences from Current Implementation:**
- Minimal set of semantic tokens (background, foreground, card, border, input, muted, etc.)
- No extensive spacing/typography/shadow token system
- Tailwind classes reference these via `@theme inline` directive
- Simple, focused token set for color and radius only

## Current Implementation Analysis

### Global Styles

**File:** `apps/rhythm-studio-ui/app/globals.css` (396 lines)

**Issues:**
- Extensive token system with spacing, typography, border radius, shadows, motion tokens
- Over-engineered for the Studio UI needs
- Creates maintenance burden
- Deviates from mobile reference simplicity

**Token Categories in Current Implementation:**
```
- SPACING TOKENS (7 variants)
- TYPOGRAPHY TOKENS (Font sizes, line heights, weights)
- BORDER RADIUS TOKENS (7 variants)
- SHADOW TOKENS (7 variants)  
- MOTION TOKENS (Durations, easing functions)
- LAYOUT TOKENS (Max widths)
- COLOR TOKENS (Primary, neutral, semantic with 10 shades each)
```

### Shared Components

**Location:** `lib/ui/**`

**Current Issues:**

1. **Card Component** (`lib/ui/Card.tsx`):
   - Uses imported tokens from `@/lib/design-tokens`
   - Inline styles for padding, shadow, radius
   - Complex configuration objects instead of Tailwind classes
   - 196 lines vs 93 lines in reference

2. **Input Component** (`lib/ui/Input.tsx`):
   - Uses imported tokens for radii and spacing
   - Inline styles mixed with Tailwind classes
   - More complex than reference (131 lines vs 22 lines)

3. **Select Component** (`lib/ui/Select.tsx`):
   - Not using Radix UI Select primitive like reference
   - Custom implementation without portal/overlay management
   - Missing animations and accessibility features

4. **Table Component** (`lib/ui/Table.tsx`):
   - Needs comparison with reference

5. **Modal Component** (`lib/ui/Modal.tsx`):
   - Needs comparison with reference

### Design Tokens

**Location:** `lib/design-tokens/`, `lib/design-tokens-loader.ts`

**Files:**
- `lib/design-tokens.ts`
- `lib/design-tokens-loader.ts` (4937 bytes)
- `lib/design-tokens/**` (directory with additional token files)

**Issue:** These files create a complex token system that is not used in the reference and adds unnecessary abstraction.

## Recovery Plan

### Phase 1: Reference Documentation ✓

**Status:** COMPLETED
- [x] Document golden reference in `docs/design/recovery.md`
- [x] Identify all reference files and their design patterns
- [x] Analyze current implementation vs reference
- [x] Create recovery checklist

### Phase 2: Audit & Classification

**Tasks:**
- [ ] Create comprehensive file change list from PR #818 (use git history)
- [ ] Categorize files into:
  - Global styles (globals.css, tailwind config)
  - Shared components (lib/ui/**)
  - Feature-specific UI (app/**)
  - Design tokens (lib/design-tokens/**)
- [ ] Document dependencies between files
- [ ] Identify files that can be safely reverted vs need careful migration

### Phase 3: Recovery Implementation (Multiple Small PRs)

#### PR A: Simplify globals.css
**Goal:** Align `apps/rhythm-studio-ui/app/globals.css` with `docs/mobile/styles/globals.css`

**Tasks:**
- [ ] Replace extensive token system with semantic tokens only
- [ ] Remove SPACING, TYPOGRAPHY, BORDER RADIUS, SHADOW, MOTION token sections
- [ ] Keep only essential semantic color tokens (background, foreground, card, border, input, muted, etc.)
- [ ] Preserve Tailwind v4 integration (@source, @theme inline)
- [ ] Maintain dark mode support
- [ ] Test design-system showcase page

#### PR B: Restore Card Component
**Goal:** Align Card component with reference

**Tasks:**
- [ ] Replace token imports with Tailwind classes
- [ ] Simplify to match reference pattern (93 lines)
- [ ] Use `data-slot` attributes
- [ ] Remove complex configuration objects
- [ ] Use semantic Tailwind classes (rounded-xl, border, bg-card, etc.)
- [ ] Test on design-system page and real usage

#### PR C: Restore Input Component
**Goal:** Align Input component with reference

**Tasks:**
- [ ] Simplify to reference pattern (22 lines)
- [ ] Remove token imports
- [ ] Use semantic Tailwind classes
- [ ] Keep essential props (className, type)
- [ ] Remove helper text (should be external concern)
- [ ] Test form usage across Studio UI

#### PR D: Restore Select Component
**Goal:** Implement Select using Radix UI like reference

**Tasks:**
- [ ] Replace custom Select with Radix UI Select primitive
- [ ] Match reference implementation pattern
- [ ] Add portal-based rendering
- [ ] Implement animations
- [ ] Add keyboard navigation
- [ ] Test on all usage locations

#### PR E: Restore Table Component
**Goal:** Align Table component with reference

**Tasks:**
- [ ] Compare current implementation with reference
- [ ] Simplify to reference pattern
- [ ] Ensure responsive container
- [ ] Test on data-heavy pages

#### PR F: Restore Modal/Dialog Components
**Goal:** Align with alert-dialog/drawer patterns

**Tasks:**
- [ ] Use Radix UI Dialog/AlertDialog primitives
- [ ] Implement portal-based rendering
- [ ] Add animations
- [ ] Support drawer variant if needed
- [ ] Test across all modal usage

#### PR G: Cleanup Design Tokens
**Goal:** Remove unused token system

**Tasks:**
- [ ] Remove `lib/design-tokens/` directory
- [ ] Remove `lib/design-tokens-loader.ts`
- [ ] Remove `lib/design-tokens.ts`
- [ ] Update any remaining imports
- [ ] Verify no broken imports

### Phase 4: CI Guardrails

#### Design Drift Detection

**Script:** `tools/design-guardrails/component-drift-check.sh`

**Purpose:** Detect when components deviate from reference patterns

**Implementation:**
```bash
#!/bin/bash
# Compare lib/ui components with docs/mobile reference
# Flag differences in:
# - Use of inline styles vs Tailwind classes
# - Import of design-tokens
# - Missing data-slot attributes
# - Line count deviations (>50% difference)
```

**Output:** Violations formatted as `violates R-COMP-01` where R-COMP-01 is rule ID

#### PR Size Gate

**Script:** `tools/design-guardrails/pr-size-check.sh`

**Purpose:** Prevent mega-PRs that change many files at once

**Implementation:**
```bash
#!/bin/bash
# Check PR file count
# Warn if > 20 files changed
# Block if > 50 files changed (unless override label present)
```

**Output:** Violations formatted as `violates R-SIZE-01`

#### Visual Regression (Playwright)

**Test:** `tests/e2e/design-system-visual.spec.ts`

**Purpose:** Detect visual changes to design system components

**Implementation:**
```typescript
test('design system cards match reference', async ({ page }) => {
  await page.goto('/admin/design-system')
  await expect(page.locator('[data-slot="card"]').first()).toMatchSnapshot()
})
```

#### Guardrails Matrix

**File:** `RULES_VS_CHECKS_MATRIX.md`

See separate section below for detailed matrix.

## Rules vs Checks Matrix

| Rule ID | Rule Description | Check Script | Check Method | Enforcement |
|---------|------------------|--------------|--------------|-------------|
| R-COMP-01 | Components must not import from `@/lib/design-tokens` | `component-drift-check.sh` | grep for design-tokens imports | CI Block |
| R-COMP-02 | Components should use `data-slot` attributes | `component-drift-check.sh` | grep for data-slot usage | CI Warn |
| R-COMP-03 | Components should use Tailwind classes over inline styles | `component-drift-check.sh` | Count style= usage, warn if >20% | CI Warn |
| R-COMP-04 | Card component must match reference line count (±50%) | `component-drift-check.sh` | wc -l comparison | CI Warn |
| R-COMP-05 | Input component must match reference line count (±50%) | `component-drift-check.sh` | wc -l comparison | CI Warn |
| R-SIZE-01 | PRs should change <20 UI component files | `pr-size-check.sh` | File count in lib/ui/** | CI Warn |
| R-SIZE-02 | PRs must not change >50 files without override | `pr-size-check.sh` | Total file count | CI Block |
| R-GLOB-01 | globals.css should be <200 lines | `globals-size-check.sh` | wc -l | CI Warn |
| R-GLOB-02 | globals.css must not define >20 CSS variables in :root | `globals-var-check.sh` | Count --var: declarations | CI Warn |
| R-VIS-01 | Design system page cards must match visual baseline | Playwright visual test | Screenshot comparison | CI Warn |
| R-VIS-02 | Design system page inputs must match visual baseline | Playwright visual test | Screenshot comparison | CI Warn |

### Rules Without Checks (Need Implementation)

None currently - all rules have corresponding checks planned.

### Checks Without Rules (Need Cleanup)

None currently - all checks reference specific rules.

### Implementation Status

- [ ] `tools/design-guardrails/component-drift-check.sh` (R-COMP-01 through R-COMP-05)
- [ ] `tools/design-guardrails/pr-size-check.sh` (R-SIZE-01, R-SIZE-02)
- [ ] `tools/design-guardrails/globals-size-check.sh` (R-GLOB-01)
- [ ] `tools/design-guardrails/globals-var-check.sh` (R-GLOB-02)
- [ ] `tests/e2e/design-system-visual.spec.ts` (R-VIS-01, R-VIS-02)
- [ ] `.github/workflows/design-guardrails.yml` (CI integration)

## Acceptance Criteria

### Design System Alignment
- [ ] Studio UI components match `docs/mobile` reference patterns
- [ ] No imports from `@/lib/design-tokens` in components
- [ ] All components use semantic Tailwind classes
- [ ] Components use `data-slot` attributes consistently
- [ ] globals.css is simplified to <200 lines with semantic tokens only

### No Repo-Wide Token Replacements
- [ ] Future PRs cannot make sweeping token changes across many files
- [ ] PR size gate prevents mega-PRs
- [ ] Component drift checks catch deviations early

### Reviewability
- [ ] Changes delivered in multiple small PRs (5-7 PRs)
- [ ] Each PR focuses on one component or concern
- [ ] PR descriptions reference this recovery plan
- [ ] Each PR is independently testable

### Guardrails Active
- [ ] All 11 rules have active checks
- [ ] CI runs guardrail checks on every PR
- [ ] Violations formatted as `violates R-XXX-YY`
- [ ] `RULES_VS_CHECKS_MATRIX.md` is kept up to date
- [ ] Design drift is detected within 1 PR cycle

## Migration Guide for Future Changes

When making design changes to Studio UI:

1. **Start with the reference:** Check `docs/mobile/components/ui/` first
2. **Use semantic tokens:** Only the minimal set from globals.css
3. **Prefer Tailwind classes:** Over inline styles or CSS variables
4. **Keep it simple:** Match reference complexity, don't over-engineer
5. **Use data-slot:** For component identification and testing
6. **Check guardrails:** Run local checks before pushing
7. **Small PRs:** Focus on one component or feature at a time

## Appendix: Reference Component Patterns

### Pattern: Simple Component with cn()

```tsx
import { cn } from "./utils"

function Component({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="component"
      className={cn(
        "base-classes here",
        "conditional classes",
        className
      )}
      {...props}
    />
  )
}
```

### Pattern: Radix UI Wrapper

```tsx
import * as Primitive from "@radix-ui/react-component"
import { cn } from "./utils"

function Component(props: React.ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root data-slot="component" {...props} />
}

function ComponentTrigger({ className, ...props }) {
  return (
    <Primitive.Trigger
      className={cn("trigger-classes", className)}
      {...props}
    />
  )
}
```

### Pattern: Semantic Tokens

```css
/* globals.css */
:root {
  --background: #ffffff;
  --foreground: #171717;
  --card: #ffffff;
  --card-foreground: #171717;
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --radius: 0.625rem;
}

/* Used in Tailwind config */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  /* ... */
}
```

## Version History

- **v1.0** (2026-02-06): Initial recovery documentation created
  - Established golden reference: `docs/mobile`
  - Analyzed current implementation issues
  - Created comprehensive recovery plan with 7 PRs
  - Defined 11 guardrail rules with checks
  - Documented acceptance criteria
