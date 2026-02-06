# Design Recovery Audit — File Classification

## Overview

This document classifies all files affected by the token-based changes introduced in PR #818. Each file is categorized and marked for recovery action.

**Generated:** 2026-02-06  
**Status:** Initial audit for Phase 2 of design recovery

## File Categories

1. **Global Styles** - CSS and config files affecting entire app
2. **Shared Components** - Reusable UI components in lib/ui
3. **Design Tokens** - Token definition and loader files
4. **Feature-Specific UI** - App-specific components (if drifted)
5. **Reference/Docs** - Documentation and reference files

---

## 1. Global Styles

### `apps/rhythm-studio-ui/app/globals.css`
- **Lines:** 396
- **Status:** 🔴 Needs Recovery
- **Issue:** Extensive token system (157+ CSS variables)
- **Target:** Simplify to ~186 lines with semantic tokens only (match docs/mobile/styles/globals.css)
- **Recovery PR:** PR A
- **Dependencies:** All components currently rely on these tokens

### `apps/rhythm-studio-ui/tailwind.config.mjs`
- **Lines:** 18
- **Status:** ✅ OK
- **Issue:** None - minimal config
- **Action:** No changes needed

---

## 2. Shared Components (lib/ui/**)

### Components with design-tokens imports (14 files)

#### `lib/ui/AppShell.tsx`
- **Imports:** `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Post-PR-G cleanup
- **Note:** May be out of scope for Studio UI recovery

#### `lib/ui/Button.tsx`
- **Imports:** `componentTokens` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Part of broader component alignment
- **Dependencies:** Used across all UI

#### `lib/ui/Card.tsx`
- **Lines:** 196
- **Imports:** `shadows`, `radii`, `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery (PRIORITY)
- **Target:** 93 lines ±50% (47-139 lines)
- **Reference:** `docs/mobile/components/ui/card.tsx` (93 lines)
- **Recovery PR:** PR B
- **Issues:**
  - Missing `data-slot` attributes
  - Inline styles instead of Tailwind classes
  - Complex configuration objects
  - Over 2x reference line count

#### `lib/ui/ErrorText.tsx`
- **Imports:** `spacing`, `typography` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Post-PR-G cleanup
- **Note:** May not be in docs/mobile reference

#### `lib/ui/FormField.tsx`
- **Imports:** `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Part of form components (PR C)

#### `lib/ui/HelperText.tsx`
- **Imports:** `spacing`, `typography` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Part of form components (PR C)

#### `lib/ui/Input.tsx`
- **Lines:** 130
- **Imports:** `radii`, `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery (PRIORITY)
- **Target:** 22 lines ±50% (11-33 lines)
- **Reference:** `docs/mobile/components/ui/input.tsx` (22 lines)
- **Recovery PR:** PR C
- **Issues:**
  - Missing `data-slot` attribute
  - Over 5x reference line count
  - Complex helper text/error handling (should be external)
  - Size configuration objects

#### `lib/ui/Label.tsx`
- **Imports:** `typography`, `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Part of form components (PR C)

#### `lib/ui/Modal.tsx`
- **Status:** 🔴 Needs Recovery
- **Reference:** `docs/mobile/components/ui/alert-dialog.tsx`, `drawer.tsx`
- **Recovery PR:** PR F
- **Issues:**
  - Should use Radix UI primitives
  - Missing `data-slot` attribute
  - Needs portal-based rendering

#### `lib/ui/PageHeader.tsx`
- **Imports:** `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Post-PR-G cleanup
- **Note:** May not be in docs/mobile reference (Studio-specific)

#### `lib/ui/Progress.tsx`
- **Imports:** `componentTokens`, `colors`, `typography` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Post-PR-G cleanup

#### `lib/ui/SectionHeader.tsx`
- **Imports:** `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Post-PR-G cleanup

#### `lib/ui/Select.tsx`
- **Imports:** `radii`, `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery (PRIORITY)
- **Reference:** `docs/mobile/components/ui/select.tsx`
- **Recovery PR:** PR D
- **Issues:**
  - Not using Radix UI Select primitive
  - Missing portal-based rendering
  - Missing animations
  - Missing `data-slot` attribute
  - No size variants

#### `lib/ui/Table.tsx`
- **Imports:** `radii`, `shadows` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Reference:** `docs/mobile/components/ui/table.tsx`
- **Recovery PR:** PR E
- **Issues:**
  - Missing `data-slot` attributes
  - Verify structure matches reference

#### `lib/ui/Textarea.tsx`
- **Imports:** `radii`, `spacing` from design-tokens
- **Status:** 🔴 Needs Recovery
- **Recovery PR:** Part of form components (PR C)

### Components without design-tokens imports

#### `lib/ui/Alert.tsx`
- **Status:** ✅ Review
- **Action:** Verify matches reference, add data-slot if missing

#### `lib/ui/Badge.tsx`
- **Status:** ✅ Review
- **Action:** Verify matches reference, add data-slot if missing

#### `lib/ui/ErrorState.tsx`
- **Status:** ✅ Review
- **Action:** May not be in reference (Studio-specific)

#### `lib/ui/LoadingSpinner.tsx`
- **Status:** ✅ Review
- **Action:** May not be in reference (Studio-specific)

#### `lib/ui/Tabs.tsx`
- **Status:** ✅ Review
- **Reference:** `docs/mobile/components/ui/tabs.tsx`
- **Action:** Compare with reference

#### `lib/ui/ThemeToggle.tsx`
- **Status:** ✅ OK
- **Action:** Studio-specific, no action needed

---

## 3. Design Tokens (To Be Removed)

### `lib/design-tokens.ts`
- **Lines:** ~50
- **Status:** 🗑️ Remove in PR G
- **Exports:** Main token aggregator
- **Used by:** 14 components

### `lib/design-tokens-loader.ts`
- **Lines:** 4937 bytes
- **Status:** 🗑️ Remove in PR G
- **Purpose:** Runtime token loading
- **Dependencies:** None should exist after recovery

### `lib/design-tokens/` directory
- **Status:** 🗑️ Remove in PR G (entire directory)
- **Contents:** Individual token definition files
- **Action:** Delete after all imports removed

---

## 4. Feature-Specific UI

### Design System Showcase

#### `apps/rhythm-studio-ui/app/admin/design-system/page.tsx`
- **Lines:** 551
- **Status:** ✅ Update after component recovery
- **Action:** Test with recovered components
- **Recovery PR:** PR E (verification)
- **Dependencies:** Imports from `@/lib/ui`

---

## 5. Reference/Docs (Golden Reference)

### `docs/mobile/styles/globals.css`
- **Lines:** 186
- **Status:** ✅ Golden Reference
- **Purpose:** Template for simplified globals.css
- **Characteristics:**
  - Semantic color tokens only
  - Minimal variable set (~42 variables)
  - Clean :root structure
  - Tailwind v4 integration

### `docs/mobile/components/ui/card.tsx`
- **Lines:** 93
- **Status:** ✅ Golden Reference
- **Target for:** `lib/ui/Card.tsx`

### `docs/mobile/components/ui/input.tsx`
- **Lines:** 22
- **Status:** ✅ Golden Reference
- **Target for:** `lib/ui/Input.tsx`

### `docs/mobile/components/ui/select.tsx`
- **Lines:** 190
- **Status:** ✅ Golden Reference
- **Target for:** `lib/ui/Select.tsx`

### `docs/mobile/components/ui/table.tsx`
- **Lines:** 117
- **Status:** ✅ Golden Reference
- **Target for:** `lib/ui/Table.tsx`

### `docs/mobile/components/ui/alert-dialog.tsx`
- **Lines:** ~150
- **Status:** ✅ Golden Reference
- **Target for:** `lib/ui/Modal.tsx`

---

## Recovery Priority Matrix

### Phase 3A: Globals Simplification (PR A)
1. `apps/rhythm-studio-ui/app/globals.css` — Simplify to semantic tokens

### Phase 3B: Card Component (PR B)
1. `lib/ui/Card.tsx` — Align with reference

### Phase 3C: Form Components (PR C)
1. `lib/ui/Input.tsx` — Align with reference
2. `lib/ui/FormField.tsx` — Simplify or remove
3. `lib/ui/Label.tsx` — Simplify
4. `lib/ui/HelperText.tsx` — Simplify or remove
5. `lib/ui/Textarea.tsx` — Align with reference

### Phase 3D: Select Component (PR D)
1. `lib/ui/Select.tsx` — Rewrite with Radix UI

### Phase 3E: Table Component (PR E)
1. `lib/ui/Table.tsx` — Align with reference
2. `apps/rhythm-studio-ui/app/admin/design-system/page.tsx` — Verify

### Phase 3F: Modal/Dialog (PR F)
1. `lib/ui/Modal.tsx` — Rewrite with Radix UI

### Phase 3G: Cleanup (PR G)
1. Remove `lib/design-tokens.ts`
2. Remove `lib/design-tokens-loader.ts`
3. Remove `lib/design-tokens/` directory
4. Clean up remaining components:
   - `lib/ui/AppShell.tsx`
   - `lib/ui/Button.tsx`
   - `lib/ui/ErrorText.tsx`
   - `lib/ui/PageHeader.tsx`
   - `lib/ui/Progress.tsx`
   - `lib/ui/SectionHeader.tsx`

---

## Dependency Graph

```
globals.css (PR A - Foundation)
  ↓
Card.tsx (PR B - High Priority)
  ↓
Input.tsx + Form Components (PR C - High Priority)
  ↓
Select.tsx (PR D - Medium Priority)
  ↓
Table.tsx (PR E - Medium Priority)
  ↓
Modal.tsx (PR F - Medium Priority)
  ↓
Cleanup design-tokens (PR G - Final)
```

---

## Statistics

### Total Files to Modify: 20+
- Global Styles: 1
- Shared Components: 14 (with tokens) + 6 (review)
- Design Tokens: 3 (to remove)
- Feature UI: 1 (to verify)

### Total Lines to Reduce:
- globals.css: 396 → ~200 (-196 lines, -49%)
- Card.tsx: 196 → ~93 (-103 lines, -53%)
- Input.tsx: 130 → ~22 (-108 lines, -83%)

### Total Violations to Fix:
- **Blocking:** 1 (R-COMP-01: design-tokens imports)
- **Warnings:** 5+ (data-slot, line counts, globals size/vars)

---

## Next Steps

1. Begin with PR A: Simplify globals.css
2. Test impact on existing components
3. Proceed with PR B-F in sequence
4. Final cleanup with PR G
5. Update RULES_VS_CHECKS_MATRIX.md as violations are fixed
6. Run full guardrail suite after each PR

---

## Notes

- Some components like AppShell, PageHeader, ErrorState may be Studio-specific and not in docs/mobile reference
- These should still remove design-tokens imports and use Tailwind classes directly
- Button component needs special care as it's used everywhere
- Design system showcase page is good integration test after each component recovery
