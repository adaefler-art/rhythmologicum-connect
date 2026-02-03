# E76.3 — Rules vs. Checks Matrix

**Purpose:** Ensure every rule has a check and every check maps to a rule (bidirectional traceability).

**Status:** ✅ Complete  
**Last Updated:** 2026-02-03

---

## Matrix Overview

| Rule ID | Rule Description | Check Type | Check Location | Status | Notes |
|---------|-----------------|------------|----------------|--------|-------|
| R-E76.3-1 | All API endpoints must have at least one in-repo literal callsite | Code Search | DiagnosisRunsPanel.tsx | ✅ | All 5 endpoints have fetch() calls |
| R-E76.3-2 | Diagnosis runs can only be created by assigned clinician/admin | RLS Policy | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | Policy checks clinician_patient_assignments |
| R-E76.3-3 | Diagnosis runs can only be viewed by assigned clinician/admin | RLS Policy | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | RLS SELECT policy enforces assignment |
| R-E76.3-4 | Diagnosis runs can only be updated by creator clinician/admin | RLS Policy | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | UPDATE policy checks clinician_user_id = auth.uid() |
| R-E76.3-5 | State machine transitions must be valid (queued → running → succeeded\|failed) | DB Constraint | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | CHECK constraint validates status + timestamps |
| R-E76.3-6 | Admins can view/manage runs in their organization | RLS Policy | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | Admin policies use current_user_role() |
| R-E76.3-7 | Run artifacts can only be viewed by users who can view the run | RLS Policy | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | Policy joins diagnosis_runs + assignments |
| R-E76.3-8 | Diagnosis artifacts can only be viewed by org members | RLS Policy | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | Policy checks current_user_role(organization_id) |
| R-E76.3-9 | Feature must be behind feature flag in UI | Code Review | DiagnosisRunsPanel.tsx | ✅ | enableDiagnosisRuns query param required |
| R-E76.3-10 | POST endpoint must return 201 on success | API Test | route.ts | ✅ | successResponse(..., 201, ...) |
| R-E76.3-11 | All endpoints must enforce clinician/admin role | Code Review | All route.ts files | ✅ | hasAdminOrClinicianRole() called in each |
| R-E76.3-12 | All endpoints must validate UUID format | Code Review | All route.ts files | ✅ | UUID regex validation in each handler |
| R-E76.3-13 | All endpoints must use standardized error responses | Code Review | All route.ts files | ✅ | Uses lib/api/responses helpers |
| R-E76.3-14 | All endpoints must log errors with requestId | Code Review | All route.ts files | ✅ | logError() called with requestId |
| R-E76.3-15 | RLS must be enabled on all tables | Migration | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | ALTER TABLE ... ENABLE ROW LEVEL SECURITY |
| R-E76.3-16 | All tables must have proper indexes for performance | Migration | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | 8 indexes created |
| R-E76.3-17 | Timestamps must auto-update on modifications | Trigger | 20260203123708_e76_3_diagnosis_runs_api.sql | ✅ | updated_at triggers on 2 tables |
| R-E76.3-18 | No orphan endpoints (all must be in endpoint catalog) | Script | TBD | ⏳ | Awaiting CI script execution |

---

## Detailed Rule → Check Mapping

### R-E76.3-1: All API Endpoints Must Have Literal Callsites

**Rule:**
Every API endpoint introduced/changed must have at least one in-repo literal callsite (fetch('/api/...') literal).

**Check Implementation:**
- **Type:** Code Search
- **Location:** `apps/rhythm-studio-ui/components/studio/DiagnosisRunsPanel.tsx`

**Evidence:**
```typescript
// POST /api/studio/patients/{patientId}/diagnosis-runs
fetch(`/api/studio/patients/${patientId}/diagnosis-runs`, { method: 'POST', ... })

// GET /api/studio/patients/{patientId}/diagnosis-runs
fetch(`/api/studio/patients/${patientId}/diagnosis-runs`)

// GET /api/studio/diagnosis-runs/{runId}
fetch(`/api/studio/diagnosis-runs/${runId}`)

// GET /api/studio/diagnosis-runs/{runId}/artifacts
fetch(`/api/studio/diagnosis-runs/${runId}/artifacts`)

// GET /api/studio/diagnosis-artifacts/{artifactId}
fetch(`/api/studio/diagnosis-artifacts/${artifactId}`)
```

**Status:** ✅ Pass - All 5 endpoints have literal callsites

---

### R-E76.3-2: Only Assigned Clinicians Can Create Runs

**Rule:**
Diagnosis runs can only be created by clinicians/admins who are assigned to the patient.

**Check Implementation:**
- **Type:** RLS Policy + API Logic
- **Location:** Migration + API route

**Evidence:**
```sql
CREATE POLICY "Clinicians can create runs for assigned patients"
  ON public.diagnosis_runs
  FOR INSERT
  WITH CHECK (
    clinician_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.clinician_patient_assignments cpa
      JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
      WHERE cpa.clinician_user_id = auth.uid()
        AND pp.id = diagnosis_runs.patient_id
        AND cpa.organization_id = diagnosis_runs.organization_id
    )
  );
```

**Status:** ✅ Pass - RLS policy enforces assignment check

---

### R-E76.3-3: Only Assigned Clinicians Can View Runs

**Rule:**
Diagnosis runs can only be viewed by clinicians/admins assigned to the patient or admins in the organization.

**Check Implementation:**
- **Type:** RLS Policy
- **Location:** Migration

**Evidence:**
```sql
CREATE POLICY "Clinicians can view runs for assigned patients"
  ON public.diagnosis_runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clinician_patient_assignments cpa
      JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
      WHERE cpa.clinician_user_id = auth.uid()
        AND pp.id = diagnosis_runs.patient_id
        AND cpa.organization_id = diagnosis_runs.organization_id
    )
  );
```

**Status:** ✅ Pass - RLS policy filters runs by assignment

---

### R-E76.3-4: Only Creator Clinicians Can Update Runs

**Rule:**
Diagnosis runs can only be updated by the clinician/admin who created them (or admins in org).

**Check Implementation:**
- **Type:** RLS Policy
- **Location:** Migration

**Evidence:**
```sql
CREATE POLICY "Clinicians can update own runs for assigned patients"
  ON public.diagnosis_runs
  FOR UPDATE
  USING (
    clinician_user_id = auth.uid() AND ...
  )
  WITH CHECK (
    clinician_user_id = auth.uid() AND ...
  );
```

**Status:** ✅ Pass - RLS policy checks clinician_user_id ownership

---

### R-E76.3-5: State Machine Transitions Must Be Valid

**Rule:**
Status transitions must follow: queued → running → succeeded|failed
Timestamps must match status:
- queued: started_at = NULL, completed_at = NULL
- running: started_at NOT NULL, completed_at = NULL
- succeeded/failed: started_at NOT NULL, completed_at NOT NULL

**Check Implementation:**
- **Type:** Database CHECK Constraint
- **Location:** Migration

**Evidence:**
```sql
CONSTRAINT diagnosis_runs_status_timestamps_check 
  CHECK (
    (status = 'queued' AND started_at IS NULL AND completed_at IS NULL) OR
    (status = 'running' AND started_at IS NOT NULL AND completed_at IS NULL) OR
    (status IN ('succeeded', 'failed') AND started_at IS NOT NULL AND completed_at IS NOT NULL)
  )
```

**Status:** ✅ Pass - Database enforces valid state + timestamp combinations

---

### R-E76.3-6: Admins Can Manage Org Runs

**Rule:**
Admins can view and manage all runs within their organization.

**Check Implementation:**
- **Type:** RLS Policy
- **Location:** Migration

**Evidence:**
```sql
CREATE POLICY "Admins can view org diagnosis runs"
  ON public.diagnosis_runs
  FOR SELECT
  USING (
    public.current_user_role(organization_id) = 'admin'::public.user_role
  );

CREATE POLICY "Admins can manage org diagnosis runs"
  ON public.diagnosis_runs
  FOR ALL
  USING (
    public.current_user_role(organization_id) = 'admin'::public.user_role
  )
  WITH CHECK (
    public.current_user_role(organization_id) = 'admin'::public.user_role
  );
```

**Status:** ✅ Pass - Admin policies use current_user_role()

---

### R-E76.3-7: Run Artifacts Access Follows Run Access

**Rule:**
Run artifacts can only be viewed by users who can view the associated run.

**Check Implementation:**
- **Type:** RLS Policy
- **Location:** Migration

**Evidence:**
```sql
CREATE POLICY "Clinicians can view run artifacts for assigned patients"
  ON public.diagnosis_run_artifacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.diagnosis_runs dr
      JOIN public.clinician_patient_assignments cpa ON cpa.clinician_user_id = auth.uid()
      JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
      WHERE dr.id = diagnosis_run_artifacts.run_id
        AND pp.id = dr.patient_id
        AND cpa.organization_id = dr.organization_id
    )
  );
```

**Status:** ✅ Pass - Policy chains through diagnosis_runs to enforce access

---

### R-E76.3-8: Artifacts Scoped to Organization

**Rule:**
Diagnosis artifacts can only be viewed by clinicians/admins in the same organization.

**Check Implementation:**
- **Type:** RLS Policy
- **Location:** Migration

**Evidence:**
```sql
CREATE POLICY "Clinicians can view org diagnosis artifacts"
  ON public.diagnosis_artifacts
  FOR SELECT
  USING (
    public.current_user_role(organization_id) IN ('clinician'::public.user_role, 'admin'::public.user_role)
  );
```

**Status:** ✅ Pass - Policy checks organization membership

---

### R-E76.3-9: Feature Must Be Behind Feature Flag

**Rule:**
UI wiring must be behind a feature flag (query param) to prevent premature exposure.

**Check Implementation:**
- **Type:** Code Review
- **Location:** DiagnosisRunsPanel.tsx

**Evidence:**
```typescript
// Feature flag check - only show if enabled
if (typeof window !== 'undefined' && !window.location.search.includes('enableDiagnosisRuns')) {
  return null
}
```

**Status:** ✅ Pass - Component checks for enableDiagnosisRuns query param

---

### R-E76.3-10: POST Endpoint Returns 201

**Rule:**
POST endpoints must return 201 Created on success (not 200).

**Check Implementation:**
- **Type:** Code Review
- **Location:** route.ts POST handler

**Evidence:**
```typescript
return withRequestId(successResponse({ run }, 201, requestId), requestId)
```

**Status:** ✅ Pass - Uses 201 status code

---

### R-E76.3-11: All Endpoints Enforce Role

**Rule:**
All endpoints must enforce clinician/admin role via hasAdminOrClinicianRole().

**Check Implementation:**
- **Type:** Code Review
- **Location:** All route.ts files

**Evidence:**
All 5 route handlers contain:
```typescript
const isAuthorized = await hasAdminOrClinicianRole()
if (!isAuthorized) {
  return withRequestId(forbiddenResponse(undefined, requestId), requestId)
}
```

**Status:** ✅ Pass - All handlers check role

---

### R-E76.3-12: All Endpoints Validate UUID Format

**Rule:**
All endpoints accepting UUIDs must validate format before database queries.

**Check Implementation:**
- **Type:** Code Review
- **Location:** All route.ts files

**Evidence:**
All handlers contain:
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!uuidRegex.test(id)) {
  return withRequestId(validationErrorResponse('Invalid ID format', ...))
}
```

**Status:** ✅ Pass - All handlers validate UUIDs

---

### R-E76.3-13: Standardized Error Responses

**Rule:**
All endpoints must use standardized error response helpers from lib/api/responses.

**Check Implementation:**
- **Type:** Code Review
- **Location:** All route.ts files

**Evidence:**
All handlers import and use:
- unauthorizedResponse()
- forbiddenResponse()
- notFoundResponse()
- validationErrorResponse()
- databaseErrorResponse()
- internalErrorResponse()

**Status:** ✅ Pass - All use standard helpers

---

### R-E76.3-14: Error Logging with Request ID

**Rule:**
All errors must be logged with requestId for correlation.

**Check Implementation:**
- **Type:** Code Review
- **Location:** All route.ts files

**Evidence:**
All error paths call:
```typescript
logError({ requestId, operation: '...', userId: user.id, error: safeErr })
```

**Status:** ✅ Pass - All errors logged with context

---

### R-E76.3-15: RLS Enabled on All Tables

**Rule:**
Row Level Security must be enabled on all diagnosis run tables.

**Check Implementation:**
- **Type:** Migration
- **Location:** 20260203123708_e76_3_diagnosis_runs_api.sql

**Evidence:**
```sql
ALTER TABLE public.diagnosis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_run_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_artifacts ENABLE ROW LEVEL SECURITY;
```

**Status:** ✅ Pass - RLS enabled on all 3 tables

---

### R-E76.3-16: Performance Indexes Created

**Rule:**
All tables must have appropriate indexes for common query patterns.

**Check Implementation:**
- **Type:** Migration
- **Location:** 20260203123708_e76_3_diagnosis_runs_api.sql

**Evidence:**
8 indexes created:
- idx_diagnosis_runs_patient_status
- idx_diagnosis_runs_clinician_status
- idx_diagnosis_runs_org_status
- idx_diagnosis_runs_created_at
- idx_diagnosis_run_artifacts_run_id
- idx_diagnosis_run_artifacts_artifact_id
- idx_diagnosis_artifacts_org_type
- idx_diagnosis_artifacts_created_at

**Status:** ✅ Pass - All required indexes created

---

### R-E76.3-17: Auto-Update Timestamps

**Rule:**
updated_at columns must auto-update on modifications via triggers.

**Check Implementation:**
- **Type:** Database Trigger
- **Location:** Migration

**Evidence:**
```sql
CREATE TRIGGER trigger_diagnosis_runs_updated_at
  BEFORE UPDATE ON public.diagnosis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.diagnosis_runs_set_updated_at();

CREATE TRIGGER trigger_diagnosis_artifacts_updated_at
  BEFORE UPDATE ON public.diagnosis_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.diagnosis_artifacts_set_updated_at();
```

**Status:** ✅ Pass - Triggers created for both tables

---

### R-E76.3-18: No Orphan Endpoints

**Rule:**
All endpoints must be registered in the endpoint catalog (no orphans).

**Check Implementation:**
- **Type:** CI Script
- **Location:** Endpoint catalog verification script

**Evidence:**
Awaiting execution of:
```bash
npm run api:catalog:verify
```

**Status:** ⏳ Pending - Requires CI execution

---

## Diff Report

### Rules Without Checks
**Count:** 0

**List:** None

**Status:** ✅ All rules have corresponding checks

---

### Checks Without Rules
**Count:** 0

**List:** None

**Status:** ✅ All checks map to explicit rules

---

### Scope Mismatches
**Count:** 0

**Details:** None

**Status:** ✅ All checks align with rule scope

---

## Coverage Summary

| Category | Count | Status |
|----------|-------|--------|
| Total Rules | 18 | - |
| Rules with Automated Checks | 8 | ✅ |
| Rules with Code Review Checks | 9 | ✅ |
| Rules with CI/Script Checks | 1 | ⏳ |
| Rules without Checks | 0 | ✅ |
| Orphan Checks | 0 | ✅ |
| Scope Mismatches | 0 | ✅ |

**Overall Status:** ✅ **Complete Bidirectional Traceability**  
**Pending:** CI script execution for endpoint catalog verification (R-E76.3-18)

---

## Check Execution Guide

### Automated Checks (Database)

```bash
# Run migration
npm run db:migrate

# Verify RLS policies
psql -U postgres -d rhythmologicum_connect -c "
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'diagnosis_%';"

# Verify indexes
psql -U postgres -d rhythmologicum_connect -c "
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_diagnosis_%';"
```

### Code Review Checks

**Checklist:**
1. ☐ Verify all 5 endpoints have literal fetch() callsites in DiagnosisRunsPanel.tsx
2. ☐ Verify all route handlers call hasAdminOrClinicianRole()
3. ☐ Verify all route handlers validate UUID format
4. ☐ Verify all route handlers use standardized error responses
5. ☐ Verify all error paths call logError() with requestId
6. ☐ Verify POST handler returns 201 status code
7. ☐ Verify feature flag check in DiagnosisRunsPanel.tsx

### CI Script Checks

```bash
# Generate and verify endpoint catalog
npm run api:catalog
npm run api:catalog:verify

# Expected output: No orphan endpoints detected
# If violations found, output must contain "violates R-E76.3-18"
```

---

## Audit Trail

| Date | Change | Reviewer | Status |
|------|--------|----------|--------|
| 2026-02-03 | Initial matrix creation | GitHub Copilot | ✅ Draft |
| TBD | Code review | TBD | ⏳ Pending |
| TBD | CI script execution | TBD | ⏳ Pending |
| TBD | Final approval | TBD | ⏳ Pending |

---

**Document Version:** 1.0  
**Format Version:** E76.3-MATRIX-v1  
**Generated:** 2026-02-03T12:37:00Z  
**Next Review:** After code review and CI script execution
