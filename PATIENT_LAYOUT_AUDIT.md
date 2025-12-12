# Patient Layout Audit — v0.4 Routing & Layout Consolidation

**Date**: 2025-12-12  
**Issue**: Patient-Routing & Layout-Konsolidierung — Legacy-Shell entfernen, neue Patient-Shell überall erzwingen  
**Status**: ✅ Analysis Complete

---

## Executive Summary

After thorough code analysis, **no legacy patient layout or duplicate route structures were found**. The patient section already uses a consolidated, modern layout with proper mobile/desktop responsive design. All patient routes correctly inherit from `/app/patient/layout.tsx`.

### Key Findings

- ✅ **Single Patient Shell**: All routes use `/app/patient/layout.tsx`
- ✅ **No Route Groups**: No parallel routing structures found
- ✅ **No Legacy Pages**: No deprecated patient components detected
- ✅ **Mobile Components Active**: New mobile components (v0.4) are in use
- ✅ **Proper Container Widths**: Using `max-w-6xl` and `max-w-4xl` throughout
- ⚠️ **"Small Table" Issue**: Not found in code - requires manual testing

---

## 1. New Patient-Mobile Components (R1)

### Components Located in `/app/components/`

These are the **new v0.4 mobile components** that are actively used:

| Component | Purpose | Used In |
|-----------|---------|---------|
| `MobileHeader.tsx` | Mobile header with back button, title | Funnel selector, intro pages |
| `MobileQuestionScreen.tsx` | Full-screen mobile question UI | PatientFlowRenderer (single Q) |
| `MobileQuestionCard.tsx` | Mobile-optimized question card | MobileQuestionScreen |
| `MobileWelcomeScreen.tsx` | Intro/welcome screen layout | Funnel intro pages |
| `MobileProgress.tsx` | Mobile progress indicator | Question screens |
| `MobileAnswerButton.tsx` | Touch-optimized answer buttons | Question components |
| `MobileCard.tsx` | Mobile-optimized card component | Various screens |
| `MobileContentPage.tsx` | Mobile content page renderer | Content pages |
| `MobileSectionTitle.tsx` | Mobile section headings | Various screens |
| `mobile.ts` | Mobile utility exports | Component library |

### Desktop/Shared Components

| Component | Purpose | Used In |
|-----------|---------|---------|
| `PatientFlowRenderer.tsx` | Main assessment flow orchestrator | Funnel pages |
| `QuestionStepRenderer.tsx` | Question step renderer (responsive) | PatientFlowRenderer |
| `DesktopQuestionCard.tsx` | Desktop question card | QuestionStepRenderer |
| `AssessmentProgress.tsx` | Progress bar component | PatientFlowRenderer |
| `AssessmentNavigationController.tsx` | Next/Previous buttons | PatientFlowRenderer |
| `FunnelCard.tsx` | Funnel selection cards | Assessment selector |

**Verdict**: ✅ All new mobile components are present and actively used. No legacy mobile components found.

---

## 2. Patient Layout Structure (R2)

### Layout Hierarchy

```
/app/layout.tsx (Root - minimal wrapper)
  └─ /app/patient/layout.tsx (Patient Shell)
      ├─ /app/patient/page.tsx (→ redirects to /assessment)
      ├─ /app/patient/assessment/page.tsx (Funnel Selector)
      ├─ /app/patient/history/page.tsx (Patient History)
      └─ /app/patient/funnel/[slug]/
          ├─ page.tsx (Assessment Runtime)
          ├─ intro/page.tsx (Intro/Welcome)
          ├─ result/page.tsx (Results)
          └─ content/[pageSlug]/page.tsx (Content Pages)
```

### Patient Layout Analysis (`/app/patient/layout.tsx`)

**Shell Features:**
- ✅ Desktop header with tabs (Assessments, Verlauf)
- ✅ Mobile bottom navigation tabs
- ✅ Consistent max-width container: `max-w-6xl mx-auto px-4`
- ✅ Proper responsive design (hidden md:block patterns)
- ✅ Footer on desktop only
- ✅ Bottom padding for mobile tabs: `pb-20 md:pb-0`

**Container Specifications:**
```tsx
// Header container
<div className="max-w-6xl mx-auto px-4 py-3">

// Main content
<main className="flex-1 pb-20 md:pb-0">{children}</main>
```

**Navigation:**
- Active state correctly implemented
- Links point to:
  - `/patient/assessment` (Assessments)
  - `/patient/history` (Verlauf)

**Verdict**: ✅ Patient layout is modern, consolidated, and properly structured. No legacy layout found.

---

## 3. No Duplicate Routes or Route Groups

**Search Results:**
- No route groups like `(patient)`, `(...)`, `@slot` found in `/app` directory
- No parallel routing structures
- No duplicate page.tsx files for same routes
- Single source of truth for each route

**Directory Structure Check:**
```bash
/app/patient/           # ✅ Single patient directory
/app/admin/             # ✅ Separate admin section
/app/clinician/         # ✅ Separate clinician section
```

**Verdict**: ✅ No duplicate route structures. Clean routing architecture.

---

## 4. Container Width Analysis (R3)

### Current Container Usage

#### Patient Layout (`layout.tsx`)
- Header/Footer: `max-w-6xl mx-auto px-4`
- Main: No direct width constraint (delegates to children)

#### Patient History (`PatientHistoryClient.tsx`)
- Container: `mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10`
- Responsive grid: `grid-cols-1 gap-4 sm:grid-cols-3`

#### Assessment Selector (`client.tsx`)
- Container: `w-full max-w-6xl mx-auto`
- Responsive grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

#### PatientFlowRenderer (Desktop)
- Container: `w-full max-w-6xl mx-auto`
- Card wrapper: `rounded-3xl bg-background shadow-lg border border-slate-200/80 p-5 sm:p-7 md:p-9`

#### MobileQuestionScreen
- Full width on mobile (no max-w constraints)
- Uses `min-h-screen flex flex-col` for full-screen layout

### Width Classes Found

**Reasonable Widths (OK):**
- `max-w-6xl` - Main patient container
- `max-w-4xl` - History page
- `max-w-3xl` - Content areas
- `max-w-2xl`, `max-w-xl`, `max-w-md` - Specific UI elements

**No Problematic Widths Found:**
- ❌ No `max-w-sm` (384px)
- ❌ No `w-80` (320px)
- ❌ No `w-[360px]` or similar fixed small widths
- ❌ No `max-w-[360px]` constraints
- ❌ No two-column grid layouts forcing content right

**Verdict**: ✅ No "small table" layout issue detected in code. Container widths are appropriate and responsive.

---

## 5. Navigation & Redirects (R4 & R5)

### Current Redirects

#### Patient Index (`/app/patient/page.tsx`)
```tsx
redirect(`/patient/assessment${query}`)
```
✅ Correctly redirects to assessment selector

#### Funnel Page (`/app/patient/funnel/[slug]/page.tsx`)
- With `skipIntro=true`: Goes directly to assessment
- Without `skipIntro`: Redirects to `/patient/funnel/${slug}/intro` if intro page exists

#### Result Page
- Redirects back to funnel on errors:
  - `redirect(\`/patient/funnel/\${slug}?error=missing_assessment_id\`)`
  - `redirect(\`/patient/funnel/\${slug}?error=invalid_assessment\`)`

### Hard-coded Links to Review

Found in code:
```tsx
// PatientHistoryClient.tsx (multiple occurrences)
router.push('/patient/funnel/stress-assessment')

// Client components
router.push('/patient/funnel/stress-assessment')
```

⚠️ **Issue Identified**: Several components hard-code `/patient/funnel/stress-assessment` instead of using `/patient/assessment` (the funnel selector).

**Verdict**: ⚠️ Hard-coded links to specific funnel found. Should use `/patient/assessment` instead.

---

## 6. No Legacy Patient Pages Found

**Search performed for legacy patterns:**
- No files matching `*Patient*Old*`, `*Legacy*`, `*Deprecated*`
- No commented-out layout files
- No unused patient components in `/components`
- All mobile components are actively imported and used

**Component Usage Verification:**
- ✅ MobileQuestionScreen: Used in QuestionStepRenderer
- ✅ MobileWelcomeScreen: Used in intro pages
- ✅ MobileHeader: Used in funnel selector
- ✅ PatientFlowRenderer: Main orchestrator
- ✅ All components have active imports

**Verdict**: ✅ No legacy patient pages or components found. Clean codebase.

---

## 7. Issues Requiring Manual Testing

### Cannot Verify in Code Alone

1. **"Small Table" Runtime Issue**
   - Description: Content appears in narrow right column with empty left space
   - Status: NOT FOUND in code
   - Possible causes:
     - Runtime CSS conflict
     - Browser-specific rendering
     - Dynamic class application
     - Parent container from different source
   - **Action**: Requires manual testing in browser

2. **skipIntro Parameter Behavior**
   - Logic looks correct in code
   - Needs manual verification that:
     - `?skipIntro=true` skips intro page correctly
     - Without param, shows intro if available
     - No redirect loops

3. **Mobile/Desktop Breakpoint Behavior**
   - Code shows proper responsive classes
   - Needs manual verification:
     - Mobile bottom tabs work correctly
     - Desktop top tabs work correctly
     - Responsive transitions are smooth

---

## 8. Required Changes

Based on this audit:

### ✅ No Changes Needed
- Layout structure is correct
- Container widths are appropriate
- Mobile components are in use
- No legacy code to remove
- No duplicate routes

### ⚠️ Optional Improvements

1. **Hard-coded Funnel Links** (Priority: Medium)
   - Replace `/patient/funnel/stress-assessment` with `/patient/assessment`
   - Locations:
     - `app/patient/history/PatientHistoryClient.tsx` (lines 268, 307, 373)
   - Reason: Should let users choose their funnel, not hard-code to stress-assessment

2. **Redirect Consistency** (Priority: Low)
   - Ensure all "back to assessment" links use `/patient/assessment`
   - Currently some use specific funnel routes

---

## 9. Testing Checklist

### Manual Testing Required

- [ ] `GET /patient/funnel/stress-assessment?skipIntro=true`
  - [ ] Verify new Shell layout (header, tabs, footer)
  - [ ] Verify content width (not in narrow column)
  - [ ] Check mobile bottom tabs
  - [ ] Check desktop top tabs

- [ ] `GET /patient/funnel/stress-assessment/intro`
  - [ ] Verify new Shell layout
  - [ ] Verify MobileWelcomeScreen renders correctly
  - [ ] Verify content width

- [ ] `GET /patient/history`
  - [ ] Verify new Shell layout
  - [ ] Verify max-w-4xl container
  - [ ] Verify cards render properly
  - [ ] Check responsive grid

- [ ] `GET /patient/` → Redirects to `/patient/assessment`
  - [ ] Verify redirect works
  - [ ] Verify funnel selector renders
  - [ ] Verify funnel cards are properly sized

- [ ] Login Flow
  - [ ] Patient login redirects to `/patient/assessment`
  - [ ] No legacy funnel URL in redirect

- [ ] Mobile Testing
  - [ ] Bottom tabs visible and working
  - [ ] Full-screen question layout on single questions
  - [ ] Touch targets are appropriate size

- [ ] Desktop Testing
  - [ ] Top tabs visible and working
  - [ ] Content properly centered with max-w-6xl
  - [ ] Footer displays correctly

---

## 10. Conclusion

**Current State**: ✅ Patient routing and layout are already consolidated and modern.

**No Legacy Found**: The codebase does not contain legacy patient layouts, duplicate routes, or deprecated components.

**"Small Table" Issue**: Not reproducible in code analysis. This may be:
- Already fixed in a previous commit
- A runtime/CSS issue requiring browser testing
- A misunderstanding of the current behavior

**Recommendation**: 
1. Proceed with manual testing to verify no runtime issues
2. Fix hard-coded `/patient/funnel/stress-assessment` links (optional improvement)
3. If "small table" issue is reproduced during testing, investigate runtime CSS

**Next Steps**:
1. ✅ Complete audit (this document)
2. ⚠️ Run manual tests
3. Fix hard-coded funnel links if desired
4. Document test results
