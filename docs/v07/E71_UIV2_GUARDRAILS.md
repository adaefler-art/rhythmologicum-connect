# E71.F1 — Mobile UI v2 Systemwide Default + Anti-Drift Guardrails

## Problem Statement

**Issue:** Mobile UI v2 components were being rendered inside v1 legacy layouts, causing:
- Narrow boxes due to old `max-w-*`, `mx-auto`, and `container` constraints
- Per-screen fixes that would regress with each new issue
- No systematic enforcement of Mobile v2 design patterns

**Root Cause:** No architectural enforcement of Mobile v2 layout. Pages manually wrapped with MobileShellV2, creating opportunity for drift.

## Solution Overview

Implemented a **Route Group** pattern in Next.js to systemically enforce Mobile v2 layout and prevent drift through CI guardrails.

### Key Changes

1. **Route Group: `(mobile)`** - Canonical wrapper for all patient Mobile v2 screens
2. **Width Constraint Fixes** - Removed all forbidden patterns from mobile pages
3. **CI Guardrails** - Automated verification to prevent future regressions
4. **Documentation** - Clear guidance for developers

## Architecture

### Route Group Structure

```
apps/rhythm-patient-ui/app/patient/
├── (mobile)/                          # Route group - enforces Mobile v2
│   ├── layout.tsx                     # MobileShellV2 wrapper (canonical)
│   ├── dashboard/                     # All v2 patient pages
│   ├── dialog/
│   ├── profile/
│   ├── assess/
│   ├── funnel/
│   ├── assessments-v2/
│   ├── assessment-flow-v2/
│   ├── results-v2/
│   ├── insights-v2/
│   ├── funnels/
│   ├── content/
│   ├── assessment/
│   ├── escalation/
│   ├── history/
│   └── support/
├── onboarding/                        # Outside (mobile) - has own layout
├── documents/                         # Outside (mobile) - may have different reqs
├── layout.tsx                         # Parent layout (desktop + tokens)
└── PatientLayoutClient.tsx            # Desktop-only layout
```

### Layout Hierarchy

```
Root Layout
└── PatientDesignTokensProvider
    └── PatientLayoutClient
        ├── Desktop Layout (hidden md:block)
        └── Mobile Passthrough (md:hidden)
            └── (mobile) Route Group
                └── MobileShellV2
                    └── Patient Pages
```

### Canonical Mobile Layout Rules

**MobileShellV2** provides:
- TopBar (variant: tab/flow/result)
- BottomNav (conditionally hidden)
- Full-width container: `min-h-screen w-full`
- Scrollable main area

**Pages inside (mobile)** must follow:
- **Outer containers:** `w-full` (NO `max-w-*`, `mx-auto`, `container`)
- **Cards/sections:** `w-full` (NO centering constraints)
- **Padding:** Via tokens (`px-4`, `px-6`), NOT via `mx-auto max-w-*`
- **Exceptions:** Modal dialogs/overlays CAN use `max-w-md` for centering IF they're overlays

## Implementation Details

### 1. (mobile)/layout.tsx

```tsx
import type { ReactNode } from 'react'
import { MobileShellV2 } from '../components'

export default function MobileLayout({ children }: { children: ReactNode }) {
  return <MobileShellV2>{children}</MobileShellV2>
}
```

**Impact:** All routes under `(mobile)` automatically get MobileShellV2 wrapper.

### 2. Width Constraint Fixes

**Before (narrow boxes):**
```tsx
<div className="max-w-2xl mx-auto">  {/* ❌ Creates narrow column */}
  <DialogScreenV2 />
</div>
```

**After (full width):**
```tsx
<div className="w-full">  {/* ✅ Full mobile width */}
  <DialogScreenV2 />
</div>
```

**Files Fixed (13 total):**
- `(mobile)/dialog/DialogScreenV2.tsx`
- `(mobile)/dashboard/client.tsx`
- `(mobile)/profile/page.tsx`
- `(mobile)/assessment-flow-v2/client.tsx`
- `(mobile)/assessments-v2/client.tsx`
- `(mobile)/content/[slug]/client.tsx`
- `(mobile)/funnel/[slug]/client.tsx`
- `(mobile)/funnel/[slug]/content/[pageSlug]/client.tsx`
- `(mobile)/funnel/[slug]/intro/client.tsx`
- `(mobile)/funnels/client.tsx`
- `(mobile)/results-v2/client.tsx`
- `(mobile)/assessment/client.tsx`
- `(mobile)/escalation/client.tsx`
- `(mobile)/history/PatientHistoryClient.tsx`
- `(mobile)/support/SupportCaseDialog.tsx`
- `(mobile)/support/SupportCaseList.tsx`

### 3. CI Guardrails

**Verification Script:** `scripts/verify-ui-v2.mjs`

**Checks:**
1. **Pages Outside (mobile):** Fails if patient page directories exist outside `(mobile)` (unless allowlisted)
2. **Forbidden Width Patterns:** Fails if `max-w-*`, `mx-auto`, or `container` found in (mobile) pages
3. **Legacy Imports:** Fails if legacy layout/container components imported in (mobile) pages

**Allowlists:**
- **Routes:** `onboarding/`, `documents/`, `components/`, layout files
- **Width patterns:** Test files, dev files

**Run locally:**
```bash
npm run verify:ui-v2
```

**CI Integration:**
Added to `.github/workflows/patient-ci.yml`:
```yaml
- name: Verify UI v2 Architecture
  run: npm run verify:ui-v2
```

### 4. E71 P2 Guardrails (Anti-Drift)

**Verification Script:** `scripts/verify-e71.mjs`

**Purpose:** Catch UI v2 regressions and version identity drift before they reach CI/build.

**Checks:**
1. **Mobile imports:** Disallow `MobileHeader` and `@/lib/ui` imports inside `(mobile)`
2. **Canonical flow route:** Requires `/patient/assess/[id]/flow` to exist
3. **Non-redirect assess page:** `/patient/assess` must not be redirect-only
4. **No legacy v2 duplicates:** Ensures legacy v2 route folders do not exist under `(legacy)`
5. **Version identity:** Ensures patient/studio prebuild uses `--app` correctly and `public/version.json` is not `engine`

**Run locally:**
```bash
npm run verify:e71
```

**CI Integration:**
Added to `.github/workflows/patient-ci.yml` (before UI v2 verification):
```yaml
- name: Verify E71 Guardrails
  run: npm run verify:e71
```

## Verification Guide

### Automated Verification

**1. CI Check (automatic on PR/push):**
```bash
# Runs in GitHub Actions automatically
# See: .github/workflows/patient-ci.yml
```

**2. Local Verification:**
```bash
npm ci
npm run verify:ui-v2
```

Expected output:
```
🚀 Running UI v2 verification...

🔍 Check 1: Patient pages outside (mobile) route group...
🔍 Check 2: Forbidden width patterns in (mobile) pages...
🔍 Check 3: Forbidden legacy imports in (mobile) pages...

✅ All checks passed! Mobile UI v2 constraints are satisfied.
```

### Manual UI Verification

**PowerShell Commands:**
```powershell
# Build and start
npm ci
npm run build:patient
npm run dev:patient

# Open browser to:
# http://localhost:3000/patient/dashboard
# http://localhost:3000/patient/dialog
# http://localhost:3000/patient/profile
# http://localhost:3000/patient/assess
```

**Visual Checks:**
1. **No narrow boxes:** Content should span full width on mobile
2. **MobileShellV2 active:** TopBar + BottomNav visible
3. **Cards full width:** No centered narrow columns
4. **Proper padding:** Content has proper spacing (px-4, px-6)

**Expected Results:**
- ✅ Dashboard: Full-width cards, no centered narrow column
- ✅ Dialog: Full-width sections, no max-w-2xl constraint
- ✅ Profile: Full-width card, no max-w-4xl constraint  
- ✅ Assess: Redirects to funnels (full width)

## Acceptance Criteria

### A. Default Mobile v2 ✅

- [x] Opening `/patient/dialog` renders MobileShellV2 + v2 tokens (no legacy layout)
- [x] Opening `/patient/dashboard`, `/patient/assess`, `/patient/profile` renders MobileShellV2
- [x] Refresh on any route maintains v2 layout
- [x] All patient pages under `(mobile)` route group

### B. Narrow Boxes Fixed ✅

- [x] On `/patient/dialog`, cards/containers are full width (no narrow column)
- [x] No `max-w-*` / `container` constraints in Mobile content path
- [x] Content uses `w-full` for full mobile width
- [x] Padding via tokens (`px-4`, `px-6`), not centering wrappers

### C. Guardrails Enforce ✅

- [x] `npm run verify:ui-v2` fails if patient page created outside (mobile) (not allowlisted)
- [x] `npm run verify:ui-v2` fails if forbidden width patterns introduced
- [x] `npm run verify:ui-v2` fails if legacy layout/container imported
- [x] CI blocks PR reliably on verification failure

### D. Documentation ✅

- [x] Verification guide exists (`docs/v07/E71_UIV2_GUARDRAILS.md`)
- [x] PowerShell commands for manual verification
- [x] UI check instructions
- [x] Architecture documented

## Developer Guide

### Adding New Patient Pages

**DO:**
```bash
# Create page under (mobile) route group
apps/rhythm-patient-ui/app/patient/(mobile)/my-new-page/page.tsx
```

**DON'T:**
```bash
# ❌ Create page outside (mobile) - will fail CI
apps/rhythm-patient-ui/app/patient/my-new-page/page.tsx
```

### Layout Rules for (mobile) Pages

**✅ GOOD:**
```tsx
<div className="w-full px-4 py-8">
  <section className="w-full bg-white rounded-lg p-6">
    <h1>My Content</h1>
  </section>
</div>
```

**❌ BAD:**
```tsx
<div className="max-w-2xl mx-auto px-4 py-8">  {/* ❌ Forbidden */}
  <section className="container">              {/* ❌ Forbidden */}
    <h1>My Content</h1>
  </section>
</div>
```

### Exceptions

**Modal Dialogs/Overlays CAN use max-w-*:**
```tsx
{/* ✅ OK - Modal overlay, not layout container */}
<div className="fixed inset-0 flex items-center justify-center">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
    <h2>Modal Title</h2>
  </div>
</div>
```

## Troubleshooting

### Verification Fails: "Patient route directory exists outside (mobile)"

**Problem:** Created a patient page outside the (mobile) route group.

**Solution:**
1. Move the directory to `apps/rhythm-patient-ui/app/patient/(mobile)/your-page/`
2. OR add to allowlist in `scripts/verify-ui-v2.mjs` if legitimate exception

### Verification Fails: "Forbidden width pattern found"

**Problem:** Used `max-w-*`, `mx-auto`, or `container` in a (mobile) page.

**Solution:**
1. Replace `max-w-* mx-auto` with `w-full`
2. Use padding tokens (`px-4`, `px-6`) for spacing
3. If it's a modal/overlay, it might be OK - check context

### Build Fails: Cannot find MobileShellV2

**Problem:** Import path incorrect.

**Solution:**
```tsx
// ✅ Correct - from parent directory
import { MobileShellV2 } from '../components'

// ❌ Wrong - don't import from sibling
import { MobileShellV2 } from '../../patient/components'
```

## Migration Notes

**Pages Moved to (mobile):**
- `dashboard/` (was at root)
- `dialog/` (was at root)
- `profile/` (was at root)
- `assess/` (was at root)
- `funnel/` (was at root)
- `assessments-v2/` (was at root)
- `assessment-flow-v2/` (was at root)
- `results-v2/` (was at root)
- `insights-v2/` (was at root)
- `funnels/` (was at root)
- `content/` (was at root)
- `assessment/` (was at root)
- `escalation/` (was at root)
- `history/` (was at root)
- `support/` (was at root)

**Routes that stayed outside:**
- `onboarding/` (has separate layout)
- `documents/` (may have different requirements)

**No URL changes:** Routes still accessible at same paths (route groups don't affect URLs).

## References

- **Route Groups:** [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- **MobileShellV2:** `apps/rhythm-patient-ui/app/patient/components/MobileShellV2.tsx`
- **Verification Script:** `scripts/verify-ui-v2.mjs`
- **CI Workflow:** `.github/workflows/patient-ci.yml`
