# V05 Cleanup Backlog

**Generated:** 2026-01-02 09:50:00  
**Repository:** Rhythmologicum Connect  
**Version:** v0.5.x  
**Purpose:** Prioritized cleanup tasks derived from audit findings

---

## Overview

This document outlines prioritized cleanup tasks identified during the V05 cleanup audit. These tasks address potentially unused code, consolidate duplicate implementations, and improve documentation.

### Priority Distribution

- **High Priority:** 3 items (verify critical integrations)
- **Medium Priority:** 4 items (consolidate implementations)
- **Low Priority:** 3 items (documentation and polish)

### Total Estimated Effort

- **High Priority:** ~8 hours
- **Medium Priority:** ~6 hours
- **Low Priority:** ~4 hours
- **Total:** ~18 hours (2-3 days)

---

## Top 10 Cleanup Items

---

### 1. Verify AMY Integration Status ⚠️ HIGH PRIORITY

**Issue ID:** TV05-CLEANUP-1

**Scope:** Determine if AMY (AI report generation) endpoints are still part of v0.5 architecture

**Current State:**

- Two AMY endpoints exist: `/api/amy/stress-report`, `/api/amy/stress-summary`
- Both implement POST methods using Anthropic Claude API
- Zero client-side references found in codebase
- Funnel Runtime (Epic B) may have replaced this functionality
- Risk of unnecessary AI API costs if endpoints are unused

**Root Cause:**

- AMY was implemented in earlier versions
- Funnel Runtime evolved to include report generation
- Unclear if AMY is still canonical approach

**Acceptance Criteria:**

- [ ] Review v0.5 architecture documentation for AMY references
- [ ] Check if Funnel Runtime includes report generation
- [ ] Verify if `/api/funnels/[slug]/assessments/[assessmentId]/result` replaced AMY
- [ ] Document decision: KEEP or REMOVE AMY endpoints
- [ ] If REMOVE: Create migration to clean up unused code
- [ ] If KEEP: Add usage documentation and integrate into UI

**Verification Steps:**

1. Check `docs/V0_4_E2_*` and funnel runtime docs for report generation approach
2. Review `/app/patient/funnel/[slug]/result/page.tsx` for report fetching
3. Search git history for last AMY usage: `git log --all -S "/api/amy/stress-report"`
4. Test report generation in staging environment
5. If removing: Verify no external clients use AMY endpoints

**Implementation Tasks:**

**If KEEP:**

- Add AMY integration documentation
- Create UI button/link to trigger report generation
- Add error handling for Claude API failures
- Document rate limits and costs

**If REMOVE:**

- Remove `app/api/amy/stress-report/route.ts`
- Remove `app/api/amy/stress-summary/route.ts`
- Remove `lib/amyFallbacks.ts` if not used elsewhere
- Update architecture documentation
- Add migration note in CHANGES.md

**Risk Level:** HIGH

**Rationale:**

- Unused AI integration represents cost risk
- Anthropic API calls cost money per request
- Unclear architecture creates maintenance burden
- Security surface should be minimized

**Estimated Effort:** 4 hours

**Dependencies:** None

**Assignee:** TBD

**Labels:** `cleanup`, `high-priority`, `architecture`, `ai-integration`

---

### 2. Consolidate Consent Flow Implementation ⚠️ HIGH PRIORITY

**Issue ID:** TV05-CLEANUP-2

**Scope:** Determine canonical consent implementation and remove duplicate

**Current State:**

- **API Endpoints exist:**
  - `/api/consent/record` (POST)
  - `/api/consent/status` (GET)
- **Server Actions exist:**
  - `lib/actions/onboarding.ts::recordConsent()`
  - `lib/actions/onboarding.ts::getOnboardingStatus()`
- Both implement same functionality
- Onboarding flow (V05-I03.1) uses server actions
- API endpoints have zero client references

**Root Cause:**

- API endpoints implemented first
- Server actions pattern introduced later
- Migration incomplete

**Acceptance Criteria:**

- [ ] Verify onboarding pages use server actions (not API endpoints)
- [ ] Check if any external code uses consent API endpoints
- [ ] Document canonical pattern (likely server actions)
- [ ] Remove duplicate implementation
- [ ] Update architecture documentation on consent flow
- [ ] Ensure audit logging still works after consolidation

**Verification Steps:**

1. Check `/app/patient/onboarding/consent/client.tsx` for `recordConsent` usage
2. Search for API endpoint references: `grep -r "/api/consent" app/ lib/`
3. Review consent flow diagram in docs
4. Test consent flow in dev environment
5. Verify audit logs still capture consent events

**Implementation Tasks:**

**If Server Actions are Canonical:**

- Remove `app/api/consent/record/route.ts`
- Remove `app/api/consent/status/route.ts`
- Update `docs/canon/CONTRACTS.md` to specify server actions pattern
- Add note in CHANGES.md about removal
- Update any architecture diagrams

**If API Endpoints are Canonical:**

- Update onboarding pages to use API endpoints
- Remove server action duplicates from `lib/actions/onboarding.ts`
- Update documentation

**Risk Level:** MEDIUM (Low user impact, but important for architecture consistency)

**Rationale:**

- Duplicate implementations create confusion
- Maintenance burden of keeping both in sync
- Unclear which is "source of truth"
- Future features may choose wrong pattern

**Estimated Effort:** 2 hours

**Dependencies:** None

**Assignee:** TBD

**Labels:** `cleanup`, `high-priority`, `architecture`, `onboarding`

---

### 3. Review Content Resolver Consolidation ⚠️ HIGH PRIORITY

**Issue ID:** TV05-CLEANUP-3

**Scope:** Determine if `/api/content-resolver` and `/api/content/resolve` are duplicates

**Current State:**

- `/api/content-resolver` - 0 references found
- `/api/content/resolve` - 1 reference found
- Both GET endpoints
- Unclear which is canonical
- Content engine (F4) may use one or both

**Root Cause:**

- Content system evolved over time
- Possible renaming or refactoring left orphaned endpoint

**Acceptance Criteria:**

- [ ] Review content engine architecture docs
- [ ] Determine which endpoint is canonical
- [ ] Search for dynamic string construction that might hide usage
- [ ] Remove duplicate endpoint if one exists
- [ ] Document content resolution pattern
- [ ] Update content page rendering docs

**Verification Steps:**

1. Check content engine code: `app/content/[slug]/page.tsx`
2. Search for content resolver usage: `grep -r "content.*resolve" app/ lib/`
3. Review F4 (content engine) implementation docs
4. Test content page rendering in dev
5. Check if content pages load correctly after removal

**Implementation Tasks:**

- Determine canonical endpoint via code review
- Remove duplicate if found
- Update `docs/V0_4_E3_CONTENT_FLOW_ENGINE.md` if needed
- Add content resolution pattern to architecture docs
- Test all content pages still render

**Risk Level:** LOW (Internal content system)

**Rationale:**

- Content system is core functionality
- Duplicate endpoints add confusion
- Single canonical endpoint is cleaner

**Estimated Effort:** 2 hours

**Dependencies:** None

**Assignee:** TBD

**Labels:** `cleanup`, `high-priority`, `content-system`

---

### 4. Add Export Button to Clinician Dashboard 📋 MEDIUM PRIORITY

**Issue ID:** TV05-CLEANUP-4

**Scope:** Make patient measures export feature discoverable in UI

**Current State:**

- API endpoint exists: `/api/patient-measures/export` (GET)
- API endpoint exists: `/api/patient-measures/history` (GET)
- No visible "Export" button in clinician dashboard
- Feature is implemented but not discoverable
- Current "Export" button calls `window.print()`

**Root Cause:**

- API implemented but UI integration incomplete
- Export button exists but uses print instead of API

**Acceptance Criteria:**

- [ ] Add "Export Data" button to clinician dashboard
- [ ] Wire button to `/api/patient-measures/export` endpoint
- [ ] Implement download of exported data (JSON or CSV)
- [ ] Add loading state during export
- [ ] Add error handling for export failures
- [ ] Rename "Exportieren" button to "Drucken" for clarity
- [ ] Test export with various data sizes
- [ ] Document export feature in user guide

**Verification Steps:**

1. Click new "Export Data" button
2. Verify file downloads with correct format
3. Verify data completeness (all patient measures included)
4. Test with 0, 1, and many patient records
5. Verify error handling if API fails

**Implementation Tasks:**

1. **Update Clinician Dashboard** (`app/clinician/page.tsx`):

   ```typescript
   const handleExport = async () => {
     setExporting(true)
     try {
       const response = await fetch('/api/patient-measures/export')
       const blob = await response.blob()
       const url = window.URL.createObjectURL(blob)
       const a = document.createElement('a')
       a.href = url
       a.download = `patient-measures-${Date.now()}.json`
       a.click()
     } catch (error) {
       setError('Export fehlgeschlagen')
     } finally {
       setExporting(false)
     }
   }
   ```

2. **Add Button:**

   ```tsx
   <Button
     variant="primary"
     size="md"
     icon={<Download />}
     onClick={handleExport}
     disabled={exporting}
   >
     {exporting ? 'Exportiere...' : 'Daten exportieren'}
   </Button>
   ```

3. **Update Print Button:**
   - Change label from "Exportieren" to "Drucken"
   - Keep `window.print()` functionality

**Risk Level:** LOW (Feature addition, no breaking changes)

**Rationale:**

- Existing feature is hidden from users
- Clinicians may need data export for reports
- Easy win for usability

**Estimated Effort:** 2 hours

**Dependencies:** None

**Assignee:** TBD

**Labels:** `cleanup`, `medium-priority`, `ui-integration`, `clinician-dashboard`

---

### 5. Document Dynamic Route Navigation Patterns 📋 MEDIUM PRIORITY

**Issue ID:** TV05-CLEANUP-5

**Scope:** Create documentation explaining programmatic navigation patterns

**Current State:**

- Dynamic routes like `/clinician/patient/[id]` show low static reference counts
- These are accessed programmatically via `router.push()` and row clicks
- Audit flagged them as "potentially unreachable" (false positive)
- No documentation explains this pattern

**Root Cause:**

- Static code search doesn't detect dynamic string construction
- Template literals like `` `patient/${id}` `` don't match `/patient` search
- Missing documentation on navigation patterns

**Acceptance Criteria:**

- [ ] Create `docs/NAVIGATION_PATTERNS.md` document
- [ ] Explain static vs dynamic routes
- [ ] Document programmatic navigation patterns
- [ ] Provide examples for each pattern type
- [ ] Add section to architecture docs
- [ ] Include in developer onboarding materials

**Verification Steps:**

1. Review documentation for completeness
2. Verify all navigation patterns are covered
3. Share with team for feedback
4. Update README.md to link to navigation docs

**Implementation Tasks:**

**Create `docs/NAVIGATION_PATTERNS.md`:**

````markdown
# Navigation Patterns in Rhythmologicum Connect

## Static Routes

Static routes have fixed paths without parameters:

- `/clinician` - Clinician dashboard
- `/patient/funnels` - Funnel catalog
- `/admin/content` - Content management

### Usage

```tsx
import Link from 'next/link'

;<Link href="/clinician">Dashboard</Link>
// or
router.push('/clinician')
```
````

## Dynamic Routes

Dynamic routes have parameters in brackets:

- `/clinician/patient/[id]` - Patient detail (id = patient_id)
- `/patient/funnel/[slug]` - Funnel entry (slug = funnel slug)
- `/clinician/report/[id]` - Report detail (id = report_id)

### Usage

```tsx
// Template literal construction
const patientId = "abc-123"
router.push(`/clinician/patient/${patientId}`)

// Row click handler
<Table onRowClick={(row) => router.push(`/patient/${row.id}`)} />
```

## Navigation Events

### Row Click Navigation

```tsx
const handleRowClick = (patient: Patient) => {
  router.push(`/clinician/patient/${patient.patient_id}`)
}
```

### Button Navigation

```tsx
<Button onClick={() => router.push('/clinician/funnels')}>Manage Funnels</Button>
```

### Conditional Redirects

```tsx
if (!hasConsent) {
  router.push('/patient/onboarding/consent')
}
```

## Why This Matters

Dynamic routes may appear "unreachable" in static code search because:

1. Template literals don't match exact string patterns
2. Variables in path construction hide the target
3. Event handlers hide navigation calls

But they ARE reachable via user interactions (clicks, form submissions, etc.).

## Verification

To verify a route is truly unreachable:

1. Check for template literal construction: `` `path/${var}` ``
2. Check for event handlers: `onClick`, `onRowClick`
3. Check for conditional redirects: `router.push()` in `useEffect`
4. Manual testing in browser (click through user flows)

````

**Risk Level:** LOW (Documentation only)

**Rationale:**
- Prevents future false positives in audits
- Improves developer onboarding
- Clarifies architecture patterns

**Estimated Effort:** 1.5 hours

**Dependencies:** None

**Assignee:** TBD

**Labels:** `cleanup`, `medium-priority`, `documentation`

---

### 6. Consolidate Funnel Result APIs 📋 MEDIUM PRIORITY

**Issue ID:** TV05-CLEANUP-6

**Scope:** Review and consolidate funnel result/report endpoints

**Current State:**
- `/api/funnels/[slug]/assessments/[assessmentId]/result` - Result endpoint
- `/api/assessments/[id]/current-step` - Current step query
- `/api/assessments/[id]/navigation` - Navigation helpers
- `/api/assessments/[id]/resume` - Resume assessment
- Multiple ways to access assessment data

**Root Cause:**
- Funnel runtime evolved over time (Epic B)
- Multiple API patterns emerged
- Need to consolidate to canonical approach

**Acceptance Criteria:**
- [ ] Review funnel runtime architecture (Epic B docs)
- [ ] Determine canonical assessment access pattern
- [ ] Consolidate redundant endpoints
- [ ] Update client code to use canonical endpoints
- [ ] Document assessment lifecycle API patterns
- [ ] Update B2_IMPLEMENTATION.md if needed

**Verification Steps:**
1. Review Epic B documentation
2. Test funnel flow end-to-end
3. Verify assessment resume works
4. Check result page loads correctly
5. Verify no broken links after consolidation

**Implementation Tasks:**
- Map all assessment-related endpoints
- Determine which are redundant
- Create migration plan for consolidation
- Update funnel runtime client code
- Add API usage examples to docs

**Risk Level:** MEDIUM (User-facing funnel flow)

**Rationale:**
- Multiple endpoints for same purpose create confusion
- Canonical API pattern improves maintainability
- Easier for future developers to understand

**Estimated Effort:** 3 hours

**Dependencies:** Funnel runtime architecture review

**Assignee:** TBD

**Labels:** `cleanup`, `medium-priority`, `funnel-runtime`, `api-consolidation`

---

### 7. Update Admin Design System Documentation 📄 LOW PRIORITY

**Issue ID:** TV05-CLEANUP-7

**Scope:** Add documentation for admin design system page

**Current State:**
- Page exists: `/admin/design-system`
- Shows all UI components with examples
- No documentation on how to use it
- Single navigation reference found

**Root Cause:**
- Developer tool added without docs
- Not discoverable to new team members

**Acceptance Criteria:**
- [ ] Document design system page purpose in README
- [ ] Create developer guide for using design system
- [ ] Add link to design system in developer docs
- [ ] Ensure all components are showcased
- [ ] Add usage examples for each component
- [ ] Link to design tokens documentation

**Verification Steps:**
1. Visit `/admin/design-system` page
2. Verify all components render
3. Check that examples are clear
4. Review documentation for completeness

**Implementation Tasks:**

**Update `README.md`:**
```markdown
## Design System

The admin design system page (`/admin/design-system`) showcases all available UI components with live examples and code snippets.

Access: http://localhost:3000/admin/design-system

Components include:
- Buttons (variants, sizes)
- Cards (padding, shadows)
- Tables (sortable, hoverable)
- Forms (inputs, selects)
- Badges, Spinners, Error States
````

**Create `docs/DESIGN_SYSTEM_USAGE.md`:**

- How to access design system
- How to use each component
- Design token reference
- Adding new components

**Risk Level:** LOW (Documentation only)

**Rationale:**

- Improve developer onboarding
- Make design system more discoverable
- Encourage consistent UI patterns

**Estimated Effort:** 1 hour

**Dependencies:** None

**Assignee:** TBD

**Labels:** `cleanup`, `low-priority`, `documentation`, `design-system`

---

### 8. Add Funnel Management Link to Clinician Nav 📄 LOW PRIORITY

**Issue ID:** TV05-CLEANUP-8

**Scope:** Make funnel management more discoverable in clinician UI

**Current State:**

- `/clinician/funnels` page exists and is functional
- Accessible via "Funnels verwalten" button on dashboard
- Could be added to main navigation for better discoverability

**Root Cause:**

- Funnel management is secondary feature
- Only accessible via dashboard button
- Not in main navigation menu

**Acceptance Criteria:**

- [ ] Review if funnel management should be in main nav
- [ ] If yes: Add to clinician layout navigation
- [ ] If no: Document current navigation pattern
- [ ] Ensure breadcrumbs work correctly
- [ ] Test navigation flow

**Verification Steps:**

1. Check clinician layout for navigation menu
2. Decide if funnels deserve nav menu item
3. If added: verify it appears in menu
4. Test navigation works correctly

**Implementation Tasks:**

**If adding to navigation:**

- Update `app/clinician/layout.tsx`
- Add navigation item for funnels
- Add icon (e.g., `ClipboardList`)
- Test mobile navigation

**If not adding:**

- Document in `docs/NAVIGATION_PATTERNS.md`
- Explain that funnel management is dashboard-launched
- Add note about intentional design decision

**Risk Level:** LOW (UI enhancement)

**Rationale:**

- Improve feature discoverability
- Consistent with other admin features
- Low effort, moderate benefit

**Estimated Effort:** 1 hour

**Dependencies:** None

**Assignee:** TBD

**Labels:** `cleanup`, `low-priority`, `ui-enhancement`, `clinician-dashboard`

---

### 9. Verify Assessment Validation Integration 📄 LOW PRIORITY

**Issue ID:** TV05-CLEANUP-9

**Scope:** Ensure assessment validation API is properly integrated

**Current State:**

- API exists: `/api/assessment-validation/validate-step`
- Single reference found in codebase
- May be part of funnel runtime validation

**Root Cause:**

- Validation endpoint exists but usage unclear
- Need to verify it's integrated into funnel flow

**Acceptance Criteria:**

- [ ] Review funnel step validation code
- [ ] Verify validate-step API is called during funnel flow
- [ ] Test required field validation works
- [ ] Check error message display
- [ ] Document validation rules in funnel docs
- [ ] Add validation examples

**Verification Steps:**

1. Start stress assessment funnel
2. Try to submit step without required fields
3. Verify validation error appears
4. Check network tab for validate-step API call
5. Test different validation scenarios

**Implementation Tasks:**

- Check funnel step component for validation calls
- Review validation rules in database
- Test required vs optional fields
- Document validation behavior
- Add validation examples to funnel docs

**Risk Level:** LOW (Likely already working)

**Rationale:**

- Validation is critical for data quality
- Should verify it's properly integrated
- Low effort to confirm

**Estimated Effort:** 1.5 hours

**Dependencies:** Funnel runtime understanding

**Assignee:** TBD

**Labels:** `cleanup`, `low-priority`, `validation`, `funnel-runtime`

---

### 10. Clean Up Test Data Seeding Scripts 📄 LOW PRIORITY

**Issue ID:** TV05-CLEANUP-10

**Scope:** Review and organize database seeding scripts

**Current State:**

- Multiple seed scripts in `supabase/migrations/`
- Some may be development-only
- Example data in migrations vs seed files
- Need to separate production migrations from test data

**Root Cause:**

- Seed data mixed with schema migrations
- Development convenience vs production cleanliness

**Acceptance Criteria:**

- [ ] Review all migration files for seed data
- [ ] Separate schema migrations from seed data
- [ ] Create dedicated `supabase/seed.sql` or `supabase/seeds/` directory
- [ ] Document which seeds are for dev vs production
- [ ] Update database setup instructions
- [ ] Ensure `npm run db:reset` works correctly

**Verification Steps:**

1. List all migrations with seed data
2. Determine if seed data is needed in production
3. Separate into appropriate files
4. Test `supabase db reset`
5. Test `supabase db seed` (if using separate seeds)

**Implementation Tasks:**

- Identify seed migrations:
  - `20251211070000_seed_stress_funnel_base_pages.sql`
  - `20260101110320_v05_i02_3_additional_funnels.sql` (contains funnel stubs)
  - Any others with "seed" or example data
- Create `supabase/seeds/` directory structure
- Move seed data to separate files
- Add README explaining seed strategy
- Update docs on database setup

**Risk Level:** LOW (Development tooling)

**Rationale:**

- Clean separation of schema vs data
- Easier to understand migrations
- Production databases shouldn't need example data

**Estimated Effort:** 1 hour

**Dependencies:** None

**Assignee:** TBD

**Labels:** `cleanup`, `low-priority`, `database`, `dev-tools`

---

## Execution Strategy

### Week 1: High Priority Items (8 hours)

**Focus:** Critical architecture decisions

1. **Day 1-2:** TV05-CLEANUP-1 (Verify AMY) - 4 hours
2. **Day 2-3:** TV05-CLEANUP-2 (Consolidate Consent) - 2 hours
3. **Day 3:** TV05-CLEANUP-3 (Content Resolvers) - 2 hours

### Week 2: Medium Priority Items (6 hours)

**Focus:** Feature integration and consolidation

4. **Day 4:** TV05-CLEANUP-4 (Export Button) - 2 hours
5. **Day 4-5:** TV05-CLEANUP-6 (Funnel Result APIs) - 3 hours
6. **Day 5:** TV05-CLEANUP-5 (Navigation Docs) - 1.5 hours

### Week 3: Low Priority Items (4 hours)

**Focus:** Documentation and polish

7. **Day 6:** TV05-CLEANUP-7 (Design System Docs) - 1 hour
8. **Day 6:** TV05-CLEANUP-8 (Funnel Nav Link) - 1 hour
9. **Day 7:** TV05-CLEANUP-9 (Validation Integration) - 1.5 hours
10. **Day 7:** TV05-CLEANUP-10 (Test Data Seeding) - 1 hour

### Total Timeline: 2-3 weeks

- **Part-time (2 hours/day):** 9 working days
- **Full-time (8 hours/day):** 2.5 working days
- **Recommended:** 1 item per day with full verification

---

## Success Criteria

✅ All high-priority items completed (architecture decisions made)  
✅ Medium-priority items completed (features integrated)  
✅ Low-priority items completed (documentation updated)  
✅ No breaking changes introduced  
✅ All tests passing after cleanup  
✅ Documentation updated  
✅ Team review completed

---

## Risk Mitigation

### Testing Strategy

- Manual testing for each item before merging
- Regression testing after each cleanup
- Staging deployment before production
- Rollback plan for each change

### Communication

- Create GitHub issue for each cleanup item
- Tag relevant stakeholders
- Document decisions in issue comments
- Update this backlog as items complete

### Rollback Plan

- Each cleanup should be in separate PR
- Revert commit available if issues arise
- Test in staging before production
- Monitor logs after deployment

---

## Monitoring After Cleanup

After completing cleanup items, monitor:

1. **API Usage:** Check logs for 404s on removed endpoints
2. **Error Rates:** Ensure no increase in client errors
3. **User Feedback:** Watch for reports of broken features
4. **Performance:** Verify no degradation in load times

---

## Notes

- This backlog is derived from V05 Cleanup Audit (UNUSED report)
- Items are independent and can be completed in any order within priority levels
- Estimated efforts are approximate and may vary
- Re-run cleanup audit after significant changes
- Update this document as items are completed

---

**Report Generated:** 2026-01-02 09:50:00  
**Generated By:** Cleanup Audit Analysis  
**Version:** 1.0.0  
**Next Review:** After Week 3 completion
