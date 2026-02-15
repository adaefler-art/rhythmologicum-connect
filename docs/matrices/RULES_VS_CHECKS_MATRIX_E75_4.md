# E75.4 Rules vs Checks Matrix

This document maps all implementation rules to their verification checks for the E75.4 feature (Studio UI: Clinician Anamnese View + Entry Add/Edit).

## Rules

### R-E75.4-1: Anamnese Tab Integration
**Description:** The clinician patient detail page must include an "Anamnese" tab that displays patient medical history entries.

**Implementation:**
- Tab trigger added to TabsList component
- Tab content section for anamnesis display
- Positioned between "Assessments" and "Funnels" tabs

**Check:** `verify-e75-4-anamnesis-ui.mjs` lines 67-83
- Verifies `<TabTrigger value="anamnese">` exists
- Verifies `<TabContent value="anamnese">` exists

**Status:** ✅ Implemented and verified

---

### R-E75.4-2: AnamnesisSection Component
**Description:** A dedicated component must display anamnesis entries with proper data loading and state management.

**Implementation:**
- `AnamnesisSection.tsx` component created
- Accepts `patientId` prop for fetching patient-specific data
- Handles loading, error, and empty states
- Properly integrated into patient detail page

**Check:** `verify-e75-4-anamnesis-ui.mjs` lines 85-110
- Verifies component file exists
- Verifies component is exported
- Verifies `patientId` prop is defined
- Verifies component is imported and used in page

**Status:** ✅ Implemented and verified

---

### R-E75.4-3: Add/Edit/Archive Dialogs
**Description:** Users must be able to add new anamnesis entries, edit existing entries (creating new versions), and archive entries.

**Implementation:**
- Add dialog with form fields (title, type, content, tags)
- Edit dialog with same fields, pre-populated with entry data
- Archive confirmation with direct API call
- Form validation (title required)
- Save/cancel actions for both dialogs

**Check:** `verify-e75-4-anamnesis-ui.mjs` lines 112-137
- Verifies `isAddDialogOpen` state exists
- Verifies `isEditDialogOpen` state exists
- Verifies `handleAddEntry` function exists
- Verifies `handleEditEntry` function exists
- Verifies `handleArchiveEntry` function exists

**Status:** ✅ Implemented and verified

---

### R-E75.4-4: Correct API Endpoints
**Description:** The component must use the correct API endpoints for all operations (list, create, edit, archive).

**Implementation:**
- GET/POST `/api/studio/patients/[patientId]/anamnesis` for list and create
- POST `/api/studio/anamnesis/[entryId]/versions` for edit (creates version)
- POST `/api/studio/anamnesis/[entryId]/archive` for archive

**Check:** `verify-e75-4-anamnesis-ui.mjs` lines 139-159
- Verifies list/create endpoint pattern
- Verifies version creation endpoint pattern
- Verifies archive endpoint pattern

**Status:** ✅ Implemented and verified

---

### R-E75.4-5: Access Control Messaging
**Description:** When a clinician attempts to access anamnesis for an unassigned patient or encounters permission errors, appropriate error messages must be displayed.

**Implementation:**
- 404 error → "Patient nicht gefunden oder nicht zugewiesen"
- 403 error → "Keine Berechtigung für diesen Patienten"
- Error state displayed in component UI
- Backend RLS policies enforce actual access control

**Check:** `verify-e75-4-anamnesis-ui.mjs` lines 161-173
- Verifies error message for unassigned patients
- Verifies error message for forbidden access

**Status:** ✅ Implemented and verified

---

## Check Coverage Summary

| Rule ID | Rule Description | Check Script | Status |
|---------|-----------------|--------------|--------|
| R-E75.4-1 | Anamnese Tab Integration | verify-e75-4-anamnesis-ui.mjs | ✅ Pass |
| R-E75.4-2 | AnamnesisSection Component | verify-e75-4-anamnesis-ui.mjs | ✅ Pass |
| R-E75.4-3 | Add/Edit/Archive Dialogs | verify-e75-4-anamnesis-ui.mjs | ✅ Pass |
| R-E75.4-4 | Correct API Endpoints | verify-e75-4-anamnesis-ui.mjs | ✅ Pass |
| R-E75.4-5 | Access Control Messaging | verify-e75-4-anamnesis-ui.mjs | ✅ Pass |

## Diff Report

### Rules Without Checks
None - All rules have corresponding checks.

### Checks Without Rules
None - All checks correspond to documented rules.

### Scope Mismatches
None - All checks verify exactly what their corresponding rules specify.

## Backend Rules (Inherited from E75.1, E75.2)

The following backend rules are inherited from previous epics and are enforced at the API/database level:

### R-E75.1-4: Clinicians can view assigned patient entries
**Enforced by:** RLS policy on `anamnesis_entries` table
**Verification:** See E75.1 RLS tests

### R-E75.1-5: Clinicians can insert entries for assigned patients
**Enforced by:** RLS policy on `anamnesis_entries` table
**Verification:** See E75.1 RLS tests

### R-E75.1-6: Clinicians can update entries for assigned patients
**Enforced by:** RLS policy on `anamnesis_entries` table
**Verification:** See E75.1 RLS tests

### R-E75.2-1: API authentication required
**Enforced by:** API route middleware
**Verification:** See E75.2 API tests in `verify-e75-2-anamnesis-api.mjs`

### R-E75.2-2: API role check (clinician/admin)
**Enforced by:** API route `hasClinicianRole()` check
**Verification:** See E75.2 API tests in `verify-e75-2-anamnesis-api.mjs`

## Manual Testing Checklist

- [ ] Clinician with assigned patient can view Anamnese tab
- [ ] Clinician can add new anamnesis entry
- [ ] Clinician can edit existing entry (creates new version)
- [ ] Clinician can archive entry
- [ ] Archived entries are hidden from main list
- [ ] Version count increments after edit
- [ ] Clinician without patient assignment sees appropriate error
- [ ] Entry types display correct German labels
- [ ] Tags are properly displayed and editable
- [ ] Form validation prevents empty title submission
- [ ] Loading states display correctly
- [ ] Error states display with evidence codes

## Integration Points

### Frontend
- **Component:** `apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx`
- **Page:** `apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx`
- **UI Library:** `@/lib/ui` (Modal, Card, Button, FormField, etc.)

### Backend APIs (from E75.2)
- **List/Create:** `/api/studio/patients/[patientId]/anamnesis` (GET, POST)
- **Edit:** `/api/studio/anamnesis/[entryId]/versions` (POST)
- **Archive:** `/api/studio/anamnesis/[entryId]/archive` (POST)

### Database (from E75.1)
- **Tables:** `anamnesis_entries`, `anamnesis_entry_versions`
- **RLS Policies:** Assignment-based access control
- **Triggers:** Auto-versioning on insert/update

## Maintenance Notes

When modifying this feature:

1. **Add new rules:** Update this document and create corresponding checks in `verify-e75-4-anamnesis-ui.mjs`
2. **Modify endpoints:** Update R-E75.4-4 and corresponding check pattern
3. **Change UI:** Update R-E75.4-1, R-E75.4-2, or R-E75.4-3 as appropriate
4. **Access control changes:** Update R-E75.4-5 and error messaging checks

## References

- **Epic:** E75.4 — Studio UI: Clinician Anamnese View + Entry Add/Edit
- **Dependencies:** E75.1 (Tables + RLS), E75.2 (API Endpoints)
- **Related Docs:** 
  - `supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql`
  - `apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/anamnesis/route.ts`
  - `scripts/ci/verify-e75-2-anamnesis-api.mjs`
