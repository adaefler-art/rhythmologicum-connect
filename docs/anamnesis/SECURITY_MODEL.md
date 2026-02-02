# Anamnesis Security Model

**Version:** 1.0  
**Epic:** E75 — Anamnesis (Medical History) Feature  
**Status:** Active  
**Last Updated:** 2026-02-02

## Overview

The anamnesis feature implements a comprehensive security model using PostgreSQL Row Level Security (RLS) policies. This ensures multi-tenant data isolation and role-based access control at the database level.

**Security Principle:** Defense in depth
- RLS policies enforce access control at the database level
- API routes verify authentication and roles
- Even if API checks fail, RLS prevents unauthorized data access

## Row Level Security (RLS)

RLS is **enabled** on both anamnesis tables:
- `anamnesis_entries`
- `anamnesis_entry_versions`

**Verification:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('anamnesis_entries', 'anamnesis_entry_versions');
```

Expected: `rowsecurity = true` for both tables

---

## Access Model

### Role Hierarchy

1. **Patient** - Can view/edit their own entries only
2. **Clinician** - Can view/edit entries for assigned patients only
3. **Admin** - Can view/edit all entries within their organization

### Assignment Model

**Clinician-Patient Assignments:**
- Stored in `clinician_patient_assignments` table
- Includes: `clinician_user_id`, `patient_user_id`, `organization_id`
- Scoped to single organization (no cross-org assignments)
- Required for clinician access to patient data

**User-Organization Membership:**
- Patients belong to one organization via `patient_profiles.organization_id`
- Clinicians belong to one organization via user metadata
- Admins manage one organization (stored in user role metadata)

---

## RLS Policies - anamnesis_entries

Total policies: **8** (3 for patients, 3 for clinicians, 2 for admins)

### Patient Policies

#### R-E75.1-1: Patients Can View Own Entries

**Policy Name:** `Patients can view own anamnesis entries`  
**Operation:** SELECT  
**Rule ID:** R-E75.1-1

**Policy:**
```sql
CREATE POLICY "Patients can view own anamnesis entries"
ON public.anamnesis_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patient_profiles pp
    WHERE pp.id = anamnesis_entries.patient_id
      AND pp.user_id = auth.uid()
  )
);
```

**Logic:**
- Check if current user (`auth.uid()`) owns the patient profile
- Join `patient_profiles` on `patient_id`
- Filter to only entries where `patient_profiles.user_id = auth.uid()`

**Example:** Patient A (user_id=123) can only see entries where patient_id points to their profile.

---

#### R-E75.1-2: Patients Can Insert Own Entries

**Policy Name:** `Patients can insert own anamnesis entries`  
**Operation:** INSERT  
**Rule ID:** R-E75.1-2

**Policy:**
```sql
CREATE POLICY "Patients can insert own anamnesis entries"
ON public.anamnesis_entries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_profiles pp
    WHERE pp.id = patient_id
      AND pp.user_id = auth.uid()
  )
);
```

**Logic:**
- Verify that the `patient_id` in the new row belongs to the current user
- Prevents patients from creating entries for other patients

---

#### R-E75.1-3: Patients Can Update Own Entries

**Policy Name:** `Patients can update own anamnesis entries`  
**Operation:** UPDATE  
**Rule ID:** R-E75.1-3

**Policy:**
```sql
CREATE POLICY "Patients can update own anamnesis entries"
ON public.anamnesis_entries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patient_profiles pp
    WHERE pp.id = anamnesis_entries.patient_id
      AND pp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_profiles pp
    WHERE pp.id = patient_id
      AND pp.user_id = auth.uid()
  )
);
```

**Logic:**
- `USING`: Can only update rows they own (existing data check)
- `WITH CHECK`: Cannot change `patient_id` to another patient (new data check)

---

### Clinician Policies

#### R-E75.1-4: Clinicians Can View Assigned Patient Entries

**Policy Name:** `Clinicians can view assigned patient anamnesis entries`  
**Operation:** SELECT  
**Rule ID:** R-E75.1-4

**Policy:**
```sql
CREATE POLICY "Clinicians can view assigned patient anamnesis entries"
ON public.anamnesis_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.clinician_patient_assignments cpa
    JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
    WHERE cpa.clinician_user_id = auth.uid()
      AND pp.id = anamnesis_entries.patient_id
      AND cpa.organization_id = anamnesis_entries.organization_id
  )
);
```

**Logic:**
- Join `clinician_patient_assignments` to verify assignment
- Join `patient_profiles` to link `patient_user_id` to `patient_id`
- Verify clinician is assigned to this patient (`clinician_user_id = auth.uid()`)
- Verify same organization (prevents cross-org access)

**Example:** Clinician C (user_id=456) assigned to Patient A can see Patient A's entries but not Patient B's entries.

---

#### R-E75.1-5: Clinicians Can Insert Entries for Assigned Patients

**Policy Name:** `Clinicians can insert anamnesis entries for assigned patients`  
**Operation:** INSERT  
**Rule ID:** R-E75.1-5

**Policy:**
```sql
CREATE POLICY "Clinicians can insert anamnesis entries for assigned patients"
ON public.anamnesis_entries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.clinician_patient_assignments cpa
    JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
    WHERE cpa.clinician_user_id = auth.uid()
      AND pp.id = patient_id
      AND cpa.organization_id = organization_id
  )
);
```

**Logic:**
- Same assignment check as SELECT policy
- Prevents clinicians from creating entries for non-assigned patients

---

#### R-E75.1-6: Clinicians Can Update Entries for Assigned Patients

**Policy Name:** `Clinicians can update anamnesis entries for assigned patients`  
**Operation:** UPDATE  
**Rule ID:** R-E75.1-6

**Policy:**
```sql
CREATE POLICY "Clinicians can update anamnesis entries for assigned patients"
ON public.anamnesis_entries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.clinician_patient_assignments cpa
    JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
    WHERE cpa.clinician_user_id = auth.uid()
      AND pp.id = anamnesis_entries.patient_id
      AND cpa.organization_id = anamnesis_entries.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.clinician_patient_assignments cpa
    JOIN public.patient_profiles pp ON pp.user_id = cpa.patient_user_id
    WHERE cpa.clinician_user_id = auth.uid()
      AND pp.id = patient_id
      AND cpa.organization_id = organization_id
  )
);
```

**Logic:**
- `USING`: Can only update entries for assigned patients (existing data)
- `WITH CHECK`: Cannot change patient_id to non-assigned patient (new data)

---

### Admin Policies

#### R-E75.1-7: Admins Can View Entries in Their Organization

**Policy Name:** `Admins can view anamnesis entries in their organization`  
**Operation:** SELECT  
**Rule ID:** R-E75.1-7

**Policy:**
```sql
CREATE POLICY "Admins can view anamnesis entries in their organization"
ON public.anamnesis_entries
FOR SELECT
TO authenticated
USING (
  public.current_user_role(organization_id) = 'admin'::public.user_role
);
```

**Logic:**
- Uses `current_user_role()` helper function
- Function checks if user has admin role in specified organization
- Returns true only if user is admin AND organization matches

---

#### R-E75.1-8: Admins Can Manage Entries in Their Organization

**Policy Name:** `Admins can manage anamnesis entries in their organization`  
**Operation:** ALL (INSERT, UPDATE, DELETE)  
**Rule ID:** R-E75.1-8

**Policy:**
```sql
CREATE POLICY "Admins can manage anamnesis entries in their organization"
ON public.anamnesis_entries
FOR ALL
TO authenticated
USING (
  public.current_user_role(organization_id) = 'admin'::public.user_role
)
WITH CHECK (
  public.current_user_role(organization_id) = 'admin'::public.user_role
);
```

**Logic:**
- Same organization check as admin SELECT policy
- Allows INSERT, UPDATE, DELETE operations

---

## RLS Policies - anamnesis_entry_versions

Total policies: **3** (SELECT only, versions are immutable)

### Version History Access

**Important:** No INSERT, UPDATE, or DELETE policies exist for versions. Version records are created **only** by the database trigger and are **immutable**.

#### R-E75.1-9: Patients Can View Version History of Own Entries

**Policy Name:** `Patients can view version history of own entries`  
**Operation:** SELECT  
**Rule ID:** R-E75.1-9

**Policy:**
```sql
CREATE POLICY "Patients can view version history of own entries"
ON public.anamnesis_entry_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.anamnesis_entries ae
    JOIN public.patient_profiles pp ON pp.id = ae.patient_id
    WHERE ae.id = anamnesis_entry_versions.entry_id
      AND pp.user_id = auth.uid()
  )
);
```

**Logic:**
- Join to parent entry via `entry_id`
- Join to `patient_profiles` to verify ownership
- Same ownership check as anamnesis_entries SELECT policy

---

#### R-E75.1-10: Clinicians Can View Version History for Assigned Patients

**Policy Name:** `Clinicians can view version history for assigned patient entries`  
**Operation:** SELECT  
**Rule ID:** R-E75.1-10

**Policy:**
```sql
CREATE POLICY "Clinicians can view version history for assigned patient entries"
ON public.anamnesis_entry_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.anamnesis_entries ae
    JOIN public.clinician_patient_assignments cpa 
      ON cpa.organization_id = ae.organization_id
    JOIN public.patient_profiles pp 
      ON pp.id = ae.patient_id AND pp.user_id = cpa.patient_user_id
    WHERE ae.id = anamnesis_entry_versions.entry_id
      AND cpa.clinician_user_id = auth.uid()
  )
);
```

**Logic:**
- Join to parent entry
- Verify clinician assignment via `clinician_patient_assignments`
- Same assignment check as anamnesis_entries SELECT policy

---

#### R-E75.1-11: Admins Can View Version History in Their Organization

**Policy Name:** `Admins can view version history in their organization`  
**Operation:** SELECT  
**Rule ID:** R-E75.1-11

**Policy:**
```sql
CREATE POLICY "Admins can view version history in their organization"
ON public.anamnesis_entry_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.anamnesis_entries ae
    WHERE ae.id = anamnesis_entry_versions.entry_id
      AND public.current_user_role(ae.organization_id) = 'admin'::public.user_role
  )
);
```

**Logic:**
- Join to parent entry
- Use `current_user_role()` to verify admin role in organization
- Same org check as anamnesis_entries admin SELECT policy

---

## Helper Functions

### current_user_role(org_id UUID)

**Purpose:** Checks if current user has a specific role in an organization

**Signature:**
```sql
public.current_user_role(organization_id UUID) RETURNS public.user_role
```

**Implementation:** (Assumed based on usage)
```sql
CREATE OR REPLACE FUNCTION public.current_user_role(org_id UUID)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_organization_memberships
  WHERE user_id = auth.uid()
    AND organization_id = org_id
  LIMIT 1;
$$;
```

**Returns:**
- User's role in specified organization
- NULL if user is not a member of the organization

---

## Assignment Management

### clinician_patient_assignments Table

**Purpose:** Maps clinicians to patients within an organization

**Schema:**
```sql
CREATE TABLE public.clinician_patient_assignments (
  id UUID PRIMARY KEY,
  clinician_user_id UUID NOT NULL, -- FK to auth.users
  patient_user_id UUID NOT NULL,   -- FK to auth.users
  organization_id UUID NOT NULL,   -- FK to organizations
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ...
);
```

**Constraints:**
- Unique constraint on (clinician_user_id, patient_user_id, organization_id)
- Both clinician and patient must be in same organization

**Assignment Rules:**
1. Clinicians can only be assigned to patients in the same organization
2. One assignment per clinician-patient pair per organization
3. Deleting assignment revokes clinician access to patient data
4. Assignment must exist for clinician to access patient anamnesis entries

---

## Security Testing

### RLS Smoke Tests

**Script:** `test/e75-1-anamnesis-rls-tests.sql`  
**Script (this issue):** `scripts/ci/verify-rls-smoke.sh` (to be created)

**Test Scenarios:**

1. **Patient Isolation**
   - Patient A can see own entries
   - Patient A cannot see Patient B's entries
   - Patient A cannot create entry for Patient B

2. **Clinician Assignment**
   - Clinician C assigned to Patient A can see A's entries
   - Clinician C not assigned to Patient B cannot see B's entries
   - Removing assignment removes access

3. **Admin Scope**
   - Admin in Org X can see all entries in Org X
   - Admin in Org X cannot see entries in Org Y
   - Admin can manage (CRUD) all entries in their org

4. **Version Immutability**
   - No UPDATE policies on anamnesis_entry_versions
   - No DELETE policies on anamnesis_entry_versions
   - Versions created only by trigger

5. **Cross-Org Isolation**
   - No user can access data from other organizations
   - Assignment table enforces same-org constraint
   - Organization_id is required on all entries

---

## Audit Logging

All changes to anamnesis entries are logged to the `audit_log` table.

**Trigger:** `trigger_anamnesis_entry_audit`  
**Event:** AFTER INSERT OR UPDATE OR DELETE

**Logged Information:**
- `entity_type`: 'anamnesis_entry'
- `entity_id`: Entry UUID
- `action`: 'created', 'updated', 'deleted'
- `actor_user_id`: User who made the change
- `organization_id`: Organization context
- `metadata`: JSON with before/after values
- `created_at`: Timestamp of the action

**Audit Query Example:**
```sql
SELECT * FROM public.audit_log
WHERE entity_type = 'anamnesis_entry'
  AND entity_id = 'entry-uuid'
ORDER BY created_at DESC;
```

---

## Attack Scenarios & Mitigations

### Scenario 1: Patient Tries to Access Other Patient's Data

**Attack:**
```
GET /api/patient/anamnesis/OTHER_PATIENT_ENTRY_ID
```

**Mitigation:**
- RLS policy filters out entries not owned by patient
- API returns 404 (not 403 to avoid information disclosure)
- No data leaked in error message

---

### Scenario 2: Clinician Tries to Access Non-Assigned Patient

**Attack:**
```
GET /api/studio/patients/NON_ASSIGNED_PATIENT_ID/anamnesis
```

**Mitigation:**
- RLS policy requires assignment in `clinician_patient_assignments`
- Database returns empty array (RLS filters results)
- API returns 404 or 403 with generic message

---

### Scenario 3: Clinician Assignment Removed Mid-Request

**Attack:** Clinician fetches data while admin removes assignment

**Mitigation:**
- RLS policies re-evaluated on every query
- Transaction isolation prevents stale reads
- Subsequent requests fail RLS check

---

### Scenario 4: Admin Tries to Access Other Organization's Data

**Attack:**
```
GET /api/studio/patients/ORG_Y_PATIENT_ID/anamnesis
(Admin is in Org X)
```

**Mitigation:**
- RLS policy uses `current_user_role(organization_id)`
- Function returns NULL for other orgs
- RLS filters out all results

---

### Scenario 5: Direct Database Access Bypassing API

**Attack:** Malicious code tries to query database directly

**Mitigation:**
- RLS policies enforced at database level
- Even raw SQL queries filtered by RLS
- No API layer can bypass RLS (unless SECURITY DEFINER function)

---

## Security Best Practices

### ✅ Implemented

1. **RLS Enabled:** All anamnesis tables have RLS enabled
2. **Least Privilege:** Policies grant minimum necessary access
3. **Defense in Depth:** RLS + API auth + role checks
4. **Audit Logging:** All changes tracked with actor and timestamp
5. **Version Immutability:** Version history cannot be tampered with
6. **Organization Isolation:** Multi-tenant data completely isolated
7. **Assignment Validation:** Clinician access requires explicit assignment

### 🔒 Recommended

1. **Regular RLS Audits:** Periodically review policies for gaps
2. **Monitor Audit Logs:** Set up alerts for suspicious patterns
3. **Assignment Reviews:** Regularly review and clean up stale assignments
4. **Access Logging:** Log all access attempts (success and failure)
5. **Penetration Testing:** Test RLS with adversarial scenarios

---

## Performance Considerations

### RLS Policy Performance

RLS policies add WHERE clauses to every query, which can impact performance.

**Optimizations:**
1. **Indexes on Join Columns:**
   - `patient_profiles(user_id)` indexed
   - `clinician_patient_assignments(clinician_user_id)` indexed
   - `anamnesis_entries(patient_id, organization_id)` indexed

2. **EXISTS vs JOIN:**
   - Policies use `EXISTS` for better short-circuit evaluation
   - Database stops searching after first match

3. **Function Caching:**
   - `current_user_role()` can be cached per transaction
   - Consider materialized views for complex role lookups

**Query Plan Analysis:**
```sql
EXPLAIN ANALYZE
SELECT * FROM anamnesis_entries
WHERE patient_id = 'uuid';
```

Look for:
- Index scans (not sequential scans)
- RLS filter applied efficiently
- Minimal row filtering overhead

---

## Compliance Notes

### GDPR / HIPAA

The security model supports compliance requirements:

1. **Access Control:** Only authorized users can access patient data
2. **Audit Trail:** All changes logged with actor and timestamp
3. **Data Minimization:** Users see only necessary data
4. **Right to Erasure:** Cascade delete on patient deletion
5. **Data Portability:** API provides structured access to patient data

---

## References

- **Migration:** `supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql`
- **Schema Documentation:** [SCHEMA_V1.md](./SCHEMA_V1.md)
- **API Documentation:** [API_V1.md](./API_V1.md)
- **RLS Test Script:** `test/e75-1-anamnesis-rls-tests.sql`
- **Rules vs Checks:** `docs/e7/E75_1_RULES_VS_CHECKS_MATRIX.md`

---

**Version:** 1.0  
**Author:** GitHub Copilot  
**Epic:** E75 — Anamnesis Feature
