# E75.6 — Anamnesis JSON Export Documentation

**Version:** 1.0  
**Last Updated:** 2026-02-02  
**Issue:** E75.6 — Export v1: JSON Export (Patient + Clinician)

---

## Overview

This document describes the anamnesis export endpoints that allow patients and clinicians to export anamnesis (medical history) entries in JSON format with proper scoping and audit logging.

### Purpose

Anamnesis export provides:
- Patient access to their own medical history data (GDPR Article 15 - Right of Access)
- Clinician access to assigned patient data for clinical review
- Structured JSON format for data portability
- Optional version history inclusion
- Complete audit trail for compliance

---

## Export Endpoints

### 1. Patient Anamnesis Export

**Endpoint:** `GET /api/patient/anamnesis/export.json`

**Purpose:** Export authenticated patient's own anamnesis entries in JSON format.

#### Authentication

- **Required:** Yes (Session Cookie or Bearer Token)
- **Authorization:** Patient can only export their own data
- **RLS Policy:** Automatic enforcement via database Row Level Security

#### Request

```bash
# Export latest versions only
curl -X GET "http://localhost:3000/api/patient/anamnesis/export.json" \
  -H "Cookie: sb-localhost-auth-token=YOUR_SESSION_COOKIE"

# Export with all version history
curl -X GET "http://localhost:3000/api/patient/anamnesis/export.json?include_versions=true" \
  -H "Cookie: sb-localhost-auth-token=YOUR_SESSION_COOKIE"
```

#### Query Parameters

- `include_versions` (optional, boolean): Include all version history
  - **Default:** `false` (latest version only)
  - **Example:** `?include_versions=true`

#### Response Format

```json
{
  "success": true,
  "data": {
    "metadata": {
      "generated_at": "2026-02-02T15:00:00.000Z",
      "patient_id": "uuid-of-patient-profile",
      "org_id": "uuid-of-organization",
      "entry_count": 3,
      "include_versions": false
    },
    "entries": [
      {
        "id": "uuid-of-entry",
        "title": "Medical History",
        "content": {
          "field1": "value1",
          "field2": "value2"
        },
        "entry_type": "medical_history",
        "tags": ["cardiology", "initial"],
        "is_archived": false,
        "created_at": "2026-01-15T10:00:00.000Z",
        "updated_at": "2026-01-20T14:30:00.000Z",
        "version_count": 2,
        "versions": [
          {
            "id": "uuid-of-version",
            "version_number": 2,
            "title": "Medical History",
            "content": { "field1": "updated_value" },
            "entry_type": "medical_history",
            "tags": ["cardiology", "initial"],
            "changed_by": "uuid-of-user",
            "changed_at": "2026-01-20T14:30:00.000Z",
            "change_reason": "Updated with new information"
          }
        ]
      }
    ]
  }
}
```

#### Field Descriptions

**Metadata:**
- `generated_at` (ISO 8601): Timestamp when export was generated
- `patient_id` (UUID): Patient profile identifier
- `org_id` (UUID | null): Organization identifier
- `entry_count` (number): Number of entries in export
- `include_versions` (boolean): Whether version history is included

**Entry Object:**
- `id` (UUID): Unique entry identifier
- `title` (string): Entry title/summary
- `content` (object): Structured entry data (JSONB)
- `entry_type` (string | null): Entry category (medical_history, symptoms, medications, etc.)
- `tags` (string[]): Searchable tags
- `is_archived` (boolean): Archive status
- `created_at` (ISO 8601): Entry creation timestamp
- `updated_at` (ISO 8601): Last update timestamp
- `version_count` (number): Total number of versions
- `versions` (array, optional): Version history (only if include_versions=true)

**Version Object (if include_versions=true):**
- `id` (UUID): Version identifier
- `version_number` (number): Sequential version number (1, 2, 3...)
- `title` (string): Title at this version
- `content` (object): Content snapshot at this version
- `entry_type` (string | null): Entry type at this version
- `tags` (string[]): Tags at this version
- `changed_by` (UUID | null): User who made the change
- `changed_at` (ISO 8601): When change was made
- `change_reason` (string | null): Reason for change (if provided)

#### Response Headers

```
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="anamnesis-export-2026-02-02.json"
```

#### HTTP Status Codes

- `200 OK`: Export successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: No patient profile found
- `404 Not Found`: Feature not enabled (ANAMNESIS_EXPORT_ENABLED=false)
- `500 Internal Server Error`: Server error during export

---

### 2. Clinician Patient Anamnesis Export

**Endpoint:** `GET /api/studio/patients/[patientId]/anamnesis/export.json`

**Purpose:** Export anamnesis entries for a specific patient (clinician access).

#### Authentication

- **Required:** Yes (Session Cookie)
- **Authorization:** 
  - Requires clinician or admin role
  - RLS enforces assignment: can only export assigned patients
- **RBAC Policy:** Returns 404 (not 403) to prevent resource enumeration

#### Request

```bash
# Export latest versions only
curl -X GET "http://localhost:3000/api/studio/patients/PATIENT_UUID/anamnesis/export.json" \
  -H "Cookie: sb-localhost-auth-token=YOUR_SESSION_COOKIE"

# Export with all version history
curl -X GET "http://localhost:3000/api/studio/patients/PATIENT_UUID/anamnesis/export.json?include_versions=true" \
  -H "Cookie: sb-localhost-auth-token=YOUR_SESSION_COOKIE"
```

#### Path Parameters

- `patientId` (required, UUID): Patient profile identifier

#### Query Parameters

- `include_versions` (optional, boolean): Include all version history
  - **Default:** `false` (latest version only)
  - **Example:** `?include_versions=true`

#### Response Format

Same as patient export (see above), with patient-specific data.

#### Response Headers

```
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="anamnesis-export-patient-12345678-2026-02-02.json"
```

#### HTTP Status Codes

- `200 OK`: Export successful
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not a clinician/admin
- `404 Not Found`: Patient not found OR not assigned OR feature not enabled
- `500 Internal Server Error`: Server error during export

---

## Feature Flag

The export endpoints are controlled by a feature flag:

**Environment Variable:** `NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED`

**Default:** `false` (feature not live)

**Enable:**
```bash
# .env.local
NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED=true
```

When the feature is disabled:
- Endpoints return `404 Not Found` with "Feature not available" message
- Client utilities throw an error if called

---

## Audit Logging

All export operations are logged to the `audit_log` table:

**Audit Entry Structure:**
```json
{
  "actor_user_id": "uuid-of-user",
  "actor_role": "patient" | "clinician" | "admin",
  "entity_type": "anamnesis_export",
  "entity_id": "uuid-of-patient",
  "action": "export",
  "org_id": "uuid-of-organization",
  "source": "api",
  "diff": {
    "entry_count": 3,
    "include_versions": false,
    "exported_at": "2026-02-02T15:00:00.000Z"
  }
}
```

**Audit Policy:**
- Every successful export is audited
- Failed exports are NOT audited
- Audit failures do NOT block exports (logged and continue)

---

## Client-Side Usage

### JavaScript/TypeScript

```typescript
import { 
  exportPatientAnamnesis, 
  exportClinicianPatientAnamnesis,
  downloadAnamnesisExport
} from '@/lib/api/anamnesis/exportClient'

// Patient export (own data)
async function handlePatientExport() {
  const result = await exportPatientAnamnesis(false) // latest only
  
  if (result.success) {
    downloadAnamnesisExport(result.data)
  } else {
    console.error('Export failed:', result.error)
  }
}

// Clinician export (assigned patient)
async function handleClinicianExport(patientId: string) {
  const result = await exportClinicianPatientAnamnesis(
    patientId, 
    true // include versions
  )
  
  if (result.success) {
    downloadAnamnesisExport(result.data, `patient-${patientId}-export.json`)
  } else {
    console.error('Export failed:', result.error)
  }
}
```

### PowerShell

```powershell
# Patient export
$cookie = "sb-localhost-auth-token=YOUR_SESSION_COOKIE"
$headers = @{ "Cookie" = $cookie }

$response = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/patient/anamnesis/export.json" `
    -Method Get -Headers $headers

if ($response.success) {
    $response.data | ConvertTo-Json -Depth 10 | Out-File "anamnesis-export.json" -Encoding UTF8
    Write-Host "✅ Export saved to anamnesis-export.json"
}

# Clinician export with versions
$patientId = "YOUR_PATIENT_UUID"
$response = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/studio/patients/$patientId/anamnesis/export.json?include_versions=true" `
    -Method Get -Headers $headers

if ($response.success) {
    $filename = "patient-$patientId-export.json"
    $response.data | ConvertTo-Json -Depth 10 | Out-File $filename -Encoding UTF8
    Write-Host "✅ Export saved to $filename"
}
```

---

## Strategy A Compliance

### Vertical Slice Requirements

✅ **Endpoint changes require at least one literal callsite**
- Patient endpoint: `/api/patient/anamnesis/export.json` (literal in `exportClient.ts:33`)
- Clinician endpoint: `/api/studio/patients/{patientId}/anamnesis/export.json` (literal in `exportClient.ts:69`)

✅ **Feature not live: gated behind feature flag**
- Flag: `ANAMNESIS_EXPORT_ENABLED` (default: `false`)
- Literal callsites exist but are protected by feature check

✅ **Callsite justification**
- Patient: Self-service data export (GDPR compliance)
- Clinician: Clinical review and documentation

---

## Security & Privacy

### Data Scoping

**Patient Endpoint:**
- Patient can ONLY export their own data
- RLS policies enforce patient_id matching
- No cross-patient data leakage possible

**Clinician Endpoint:**
- Clinician can ONLY export assigned patients
- RLS policies enforce clinician_patient_assignments
- Returns 404 (not 403) to prevent enumeration

### PHI Protection

**What is Exported:**
✅ Anamnesis entries (medical history)
✅ Entry metadata (title, type, tags)
✅ Version history (if requested)
✅ Timestamps and UUIDs

**What is NOT Exported:**
❌ Patient personal information (name, email, address)
❌ Other patients' data
❌ System-internal metadata

### GDPR Compliance

- **Article 15 (Right of Access):** Patients can export their complete anamnesis data
- **Article 20 (Data Portability):** JSON format enables machine-readable transfer
- **Article 30 (Records of Processing):** All exports are audited

---

## Error Handling

### Common Errors

#### 404 - Feature Not Available
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Feature not available"
  }
}
```
**Solution:** Enable `NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED`

#### 401 - Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
**Solution:** Provide valid session cookie or bearer token

#### 403 - Forbidden (Patient)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Patient profile not found"
  }
}
```
**Solution:** Ensure user has a patient profile

#### 403 - Forbidden (Clinician)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Clinician or admin role required"
  }
}
```
**Solution:** User must have clinician or admin role

#### 404 - Not Found (Clinician)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Patient not found"
  }
}
```
**Solution:** Verify patient ID and clinician assignment

---

## Testing

### Manual Test Cases

#### Test 1: Patient Export (Own Data)
```bash
# Expected: 200 OK with export data
curl -X GET "http://localhost:3000/api/patient/anamnesis/export.json" \
  -H "Cookie: sb-localhost-auth-token=VALID_PATIENT_COOKIE" \
  -w "\nHTTP Status: %{http_code}\n"
```

#### Test 2: Patient Export (Without Auth)
```bash
# Expected: 401 Unauthorized
curl -X GET "http://localhost:3000/api/patient/anamnesis/export.json" \
  -w "\nHTTP Status: %{http_code}\n"
```

#### Test 3: Clinician Export (Assigned Patient)
```bash
# Expected: 200 OK with export data
curl -X GET "http://localhost:3000/api/studio/patients/ASSIGNED_PATIENT_ID/anamnesis/export.json" \
  -H "Cookie: sb-localhost-auth-token=VALID_CLINICIAN_COOKIE" \
  -w "\nHTTP Status: %{http_code}\n"
```

#### Test 4: Clinician Export (Unassigned Patient)
```bash
# Expected: 404 Not Found (RLS prevents access)
curl -X GET "http://localhost:3000/api/studio/patients/UNASSIGNED_PATIENT_ID/anamnesis/export.json" \
  -H "Cookie: sb-localhost-auth-token=VALID_CLINICIAN_COOKIE" \
  -w "\nHTTP Status: %{http_code}\n"
```

#### Test 5: Export with Versions
```bash
# Expected: 200 OK with versions array in each entry
curl -X GET "http://localhost:3000/api/patient/anamnesis/export.json?include_versions=true" \
  -H "Cookie: sb-localhost-auth-token=VALID_PATIENT_COOKIE" \
  -w "\nHTTP Status: %{http_code}\n"
```

#### Test 6: Feature Flag Disabled
```bash
# Set NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED=false
# Expected: 404 Not Found
curl -X GET "http://localhost:3000/api/patient/anamnesis/export.json" \
  -H "Cookie: sb-localhost-auth-token=VALID_PATIENT_COOKIE" \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## Implementation Files

**API Routes:**
- `/apps/rhythm-studio-ui/app/api/patient/anamnesis/export.json/route.ts` - Patient export endpoint
- `/apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/anamnesis/export.json/route.ts` - Clinician export endpoint

**Helper Functions:**
- `/lib/api/anamnesis/export.ts` - Server-side export utilities
- `/lib/api/anamnesis/exportClient.ts` - Client-side export utilities (literal callsites)

**Configuration:**
- `/lib/featureFlags.ts` - Feature flag definition
- `/lib/env.ts` - Environment variable schema

**Documentation:**
- `/docs/pilot/ANAMNESIS_EXPORT.md` - This file

---

## Future Enhancements

Potential improvements for future iterations:

1. **PDF Export:** Generate PDF versions of anamnesis entries
2. **FHIR Export:** Export in FHIR-compliant format
3. **Batch Export:** Export multiple patients (organization-level)
4. **CSV Export:** Tabular format for spreadsheet analysis
5. **Date Range Filtering:** Export entries within specific time periods
6. **Compression:** Gzip or ZIP for large exports
7. **Async Export:** For very large datasets, use background jobs

---

## References

- **Issue:** E75.6 — Export v1: JSON Export (Patient + Clinician)
- **Related:** E75.1 (Anamnesis Tables), E75.2 (Anamnesis API)
- **GDPR:** Articles 15 (Right of Access), 20 (Data Portability), 30 (Records of Processing)
- **Strategy A:** Vertical Slice Requirements (literal callsites, feature flags)

---

**Document Version:** 1.0  
**Last Review:** 2026-02-02  
**Next Review:** After feature goes live
