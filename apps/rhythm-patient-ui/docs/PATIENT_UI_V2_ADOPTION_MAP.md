# Patient UI v2 Adoption Map

## Summary
- **Total Routes**: 18
- **Fully v2 Compliant**: 6 (33%)
- **Partially Compliant**: 7 (39%)
- **Non-Compliant**: 5 (28%)

---

## Route Details

### /patient (Index)
- **Location**: `apps/rhythm-patient-ui/app/patient/page.tsx`
- **Route Group**: None (root redirect)
- **Status**: ❌ Non-Compliant
- **UI Kit Usage**: No
- **Violations**:
  - ✗ Legacy import: `@/app/components/LoginPage`
  - ✗ No v2 primitives used
  - ✗ Handles authentication & redirect logic (server-side)
- **Components Used**: `LoginPage` (legacy)
- **Action Items**: 
  - Migrate `LoginPage` to use v2 UI Kit
  - Replace `@/app/components` imports with `@/lib/ui/mobile-v2`

### /patient/onboarding (Index)
- **Location**: `apps/rhythm-patient-ui/app/patient/onboarding/page.tsx`
- **Route Group**: None
- **Status**: ✅ Compliant
- **UI Kit Usage**: N/A (server redirect only)
- **Violations**: None
- **Components Used**: None (server component with redirects)
- **Action Items**: No changes needed

### /patient/onboarding/consent
- **Location**: `apps/rhythm-patient-ui/app/patient/onboarding/consent/page.tsx`
- **Route Group**: None
- **Status**: ⚠️ Partial
- **UI Kit Usage**: Partial
- **Violations**:
  - ✗ Uses `prose prose-slate dark:prose-invert` (forbidden)
  - ✗ Uses `max-w-none` (forbidden width constraint)
  - ✗ No v2 form primitives (Button, Input, etc.)
- **Components Used**: Custom HTML (`ConsentClient`)
- **Action Items**:
  - Replace prose markdown classes with v2 Card component
  - Use `Button` and form components from `@/lib/ui/mobile-v2`
  - Remove `max-w-none` constraint

### /patient/onboarding/profile
- **Location**: `apps/rhythm-patient-ui/app/patient/onboarding/profile/page.tsx`
- **Route Group**: None
- **Status**: ⚠️ Partial
- **UI Kit Usage**: Partial
- **Violations**:
  - ✗ No v2 form inputs (using native inputs)
  - ✗ Missing v2 Button, Card primitives
- **Components Used**: Custom form in `ProfileClient`
- **Action Items**:
  - Migrate to v2 Input, Select, Button components
  - Wrap in v2 Card component

### /patient/documents/[id]/confirm
- **Location**: `apps/rhythm-patient-ui/app/patient/documents/[id]/confirm/page.tsx`
- **Route Group**: None
- **Status**: ❌ Non-Compliant
- **UI Kit Usage**: No
- **Violations**:
  - ✗ Uses `container mx-auto px-4 py-8 max-w-4xl` (forbidden)
  - ✗ No v2 components
- **Components Used**: `ConfirmationClient` (legacy)
- **Action Items**:
  - Remove `container` class
  - Use mobile-first full-width layout
  - Migrate form to v2 primitives

### /patient/(mobile)/dashboard
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/dashboard/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ✅ Compliant
- **UI Kit Usage**: Yes
- **Violations**: None
- **Components Used**: 
  - `LoadingSkeleton`, `ErrorState` (v2)
  - `DashboardHeader`, `AMYComposer`, `NextStepCard`, `ContentTilesGrid`, `ProgressSummary`
- **Action Items**: No changes needed

### /patient/(mobile)/assess
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/assess/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ✅ Compliant
- **UI Kit Usage**: Yes
- **Violations**: None
- **Components Used**: 
  - `Card`, `Button`, `Chip`, `LoadingSkeleton`, `EmptyState`, `ErrorState` (v2)
- **Action Items**: No changes needed

### /patient/(mobile)/assessment-flow-v2
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/assessment-flow-v2/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ✅ Compliant (v2 icons migrated)
- **UI Kit Usage**: Yes
- **Violations**: None
- **Components Used**: 
  - `Card`, `Button`, `ProgressBar`, `LoadingSkeleton`, `EmptyState`, `ErrorState`, `Chip` (v2)
  - Icons from v2 icon system: `ChevronDown`, `ChevronUp`
- **Action Items**: ✅ Completed - Icons migrated to v2 system

### /patient/(mobile)/assess/[id]/flow
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/assess/[id]/flow/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ✅ Compliant
- **UI Kit Usage**: Yes
- **Violations**: None
- **Components Used**: `AssessmentFlowV2Client`
- **Action Items**: No changes needed

### /patient/(mobile)/assessments-v2
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/assessments-v2/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ✅ Compliant (v2 icons migrated)
- **UI Kit Usage**: Yes (client-side)
- **Violations**: None
- **Components Used**: 
  - `Card`, `Chip`, `Button`, `ProgressBar`, `LoadingSkeleton`, `EmptyState`, `ErrorState` (v2)
  - Icons from v2 icon system: `ClipboardCheck`, `Clock`, `TrendingUp`
- **Action Items**: 
  - ✅ Icons migrated to v2 system
  - [ ] Move demo data to separate fixtures file
  - [ ] Integrate real assessment data fetching

### /patient/(mobile)/insights-v2
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/insights-v2/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ⚠️ Partial
- **UI Kit Usage**: Yes (client-side)
- **Violations**:
  - ✗ Uses Lucide icons: `Heart`, `Moon`, `Activity`, `Brain`, `Download`, `FileText`, `TrendingUp`, `Calendar`, `ClipboardList`
  - ✗ Fixture data in client component
- **Components Used**: 
  - `HealthScore`, `WeeklyChart`, `StatCard`, `Card`, `Button`, `Chip`, `ListRow`, `Badge`, `LoadingSkeleton`, `EmptyState`, `ErrorState` (v2)
- **Action Items**:
  - Replace all Lucide icons with v2 equivalents
  - Move fixture data to dedicated file
  - Implement real health data fetching

### /patient/(mobile)/results-v2
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/results-v2/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ⚠️ Partial
- **UI Kit Usage**: Yes (client-side)
- **Violations**:
  - ✗ Uses Lucide icons: `Bot`, `Sparkles`, `Shield`, `CheckCircle`, `Clock`
  - ✗ Fixture data in client
- **Components Used**: 
  - `Card`, `Chip`, `Button`, `LoadingSkeleton`, `EmptyState`, `ErrorState`, `HealthScore`, `ActionCard`, `ListRow` (v2)
- **Action Items**:
  - Replace Lucide icons with v2 equivalents
  - Move fixture data to external fixtures
  - Connect to real assessment results API

### /patient/(mobile)/history
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/history/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ❌ Non-Compliant
- **UI Kit Usage**: No (client uses custom UI)
- **Violations**:
  - ✗ No v2 components imported in page or client
  - ✗ Uses Supabase client directly for data fetching
- **Components Used**: Custom UI in `PatientHistoryClient`
- **Action Items**:
  - Audit `PatientHistoryClient` for v2 component usage
  - Ensure all UI elements use v2 primitives (Card, Button, Table/List, etc.)
  - Replace any legacy styling

### /patient/(mobile)/dialog
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/dialog/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ✅ Compliant (migrated to v2)
- **UI Kit Usage**: Yes
- **Violations**: None
- **Components Used**: 
  - `Card`, `Button`, `Badge` (v2)
- **Action Items**: ✅ Completed - Custom CSS converted to v2 primitives

### /patient/(mobile)/content/[slug]
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/content/[slug]/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ⚠️ Partial (icons migrated, prose still present)
- **UI Kit Usage**: Partial
- **Violations**:
  - ✗ Uses `prose prose-slate max-w-none` (forbidden)
  - ✗ Custom markdown rendering
- **Components Used**: 
  - `ReactMarkdown` with `remark-gfm`
  - Icons from v2 system: `ArrowLeft`
- **Action Items**:
  - ✅ Icons migrated to v2 system
  - [ ] Move markdown rendering to v2-compliant wrapper
  - [ ] Replace `prose` classes with v2 typography tokens
  - [ ] Use v2 `Button` for back navigation

### /patient/(mobile)/profile
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/profile/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ✅ Compliant
- **UI Kit Usage**: Yes
- **Violations**: None
- **Components Used**: 
  - `Card`, `Button` (v2)
- **Action Items**: No changes needed

### /patient/(mobile)/dev/components
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/dev/components/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ⚠️ Partial
- **UI Kit Usage**: Dev/Demo Only
- **Violations**:
  - ✗ Uses Lucide icons: `Heart`, `Activity`, `Zap`, `Moon`
  - ✗ Custom styling for dev gallery
- **Components Used**: Custom gallery components
- **Action Items**:
  - This is a dev-only route; document as such
  - Replace Lucide icons with v2 equivalents in gallery

### /patient/(mobile)/dev/design-token-hub
- **Location**: `apps/rhythm-patient-ui/app/patient/(mobile)/dev/design-token-hub/page.tsx`
- **Route Group**: ✅ (mobile)
- **Status**: ⚠️ Partial
- **UI Kit Usage**: Dev/Demo Only
- **Violations**:
  - ✗ Uses Lucide icons extensively for icon gallery
  - ✗ Dev-only route (not user-facing)
- **Components Used**: `DesignTokenHubClient`, Lucide icon library
- **Action Items**:
  - Document as development/internal tooling
  - Keep Lucide for dev reference, document v2 replacements

---

## Compliance Summary by Category

### ✅ Fully Compliant (6 routes)
1. `/patient/onboarding` - Server redirect
2. `/patient/(mobile)/dashboard` - Full v2 implementation
3. `/patient/(mobile)/assess` - Full v2 implementation
4. `/patient/(mobile)/assessment-flow-v2` - Full v2 implementation (v2 icons)
5. `/patient/(mobile)/profile` - Full v2 implementation
6. `/patient/(mobile)/dialog` - Full v2 implementation (migrated)

### ⚠️ Partially Compliant (7 routes)
1. `/patient/onboarding/consent` - Needs prose/width fixes + v2 form primitives
2. `/patient/onboarding/profile` - Needs v2 form primitives
3. `/patient/(mobile)/assessments-v2` - Needs fixture refactor (icons done)
4. `/patient/(mobile)/insights-v2` - Needs Lucide → v2 icon migration + fixture refactor
5. `/patient/(mobile)/results-v2` - Needs Lucide → v2 icon migration + fixture refactor
6. `/patient/(mobile)/content/[slug]` - Needs prose removal (icons done)
7. `/patient/(mobile)/dev/components` - Dev-only, needs icon migration

### ❌ Non-Compliant (5 routes)
1. `/patient` - Uses legacy `@/app/components/LoginPage`
2. `/patient/documents/[id]/confirm` - Uses container + max-w-*, no v2 components
3. `/patient/(mobile)/history` - No v2 components, custom UI
4. `/patient/(mobile)/dev/design-token-hub` - Dev-only but Lucide-heavy

---

## Key Findings

### Forbidden Patterns Found
- **`prose` classes**: 3 routes (consent, content/[slug], AMYComposer)
- **`max-w-*` constraints**: 4 routes (onboarding/consent, documents/confirm, dev components)
- **`container` class**: 1 route (documents/confirm)
- **Lucide icons**: 7 routes (need v2 equivalents)

### Import Violations
- **`@/app/components/*`**: 2 routes (patient index, PatientLayoutClient)
- **`lucide-react`**: 10+ client components
- **Custom CSS classes**: Multiple routes using tailwind directly instead of v2 props

### Migration Priorities
1. **High Priority**: 
   - Replace all Lucide icons with v2 equivalents (7 routes)
   - Remove `prose` and `container` classes (4 routes)
   - Convert form components to v2 (onboarding routes)

2. **Medium Priority**:
   - Migrate legacy `@/app` imports to v2
   - Refactor custom CSS to v2 component props
   - Move fixture data out of client components

3. **Low Priority**:
   - Dev-only routes (can run parallel migration track)
   - Internal tooling routes

---

## UI Kit Adoption Timeline

### Phase 1 (Immediate - 1-2 sprints)
- [ ] Icon migration: Create v2 icon equivalents for 10+ Lucide icons
- [ ] Onboarding forms: Migrate to v2 Input, Select, Button
- [ ] Remove prose classes (3 routes)

### Phase 2 (Short-term - 2-3 sprints)
- [ ] Remove container/max-w constraints (4 routes)
- [ ] Fixture data refactoring (move out of client components)
- [ ] Complete history route audit and migration

### Phase 3 (Medium-term - 3-4 sprints)
- [ ] Legacy import cleanup (LoginPage, PatientNavigation)
- [ ] Dialog/content routes: Custom CSS → v2 props
- [ ] Comprehensive QA and visual regression testing

---

## Notes for Implementation

1. **Icon Strategy**: Create v2 icon wrapper component that maps Lucide → v2 icons
2. **Form Strategy**: Create v2 form hooks similar to existing patterns
3. **Testing**: Ensure mobile responsiveness preserved through migration
4. **Fixtures**: Move all `__DEV_FIXTURE__` data to `/lib/fixtures` directory
5. **Docs**: Update route documentation with v2 status and migration status
