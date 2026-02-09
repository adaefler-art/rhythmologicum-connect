# Patient Record (Anamnesis) API V1

**Version:** 1.0  
**Epic:** E75 — Patient Record (Anamnesis/Medical History) Feature  
**Status:** Active  
**Last Updated:** 2026-02-08

**UI Terminology:** In user-facing contexts, this feature is called "Patient Record". In technical implementation (database, API routes, code), it uses "anamnesis" for consistency. See Issue 4.

## Overview

RESTful API for managing patient medical history (anamnesis) entries with automatic versioning. The API provides separate endpoints for patients and clinicians with proper role-based access control.

## Base URLs

**Patient UI:**
- Base: `/api/patient/anamnesis`
- Implementation: `apps/rhythm-patient-ui/app/api/patient/anamnesis/`

**Studio UI (Clinicians):**
- Base: `/api/studio`
- Implementation: `apps/rhythm-studio-ui/app/api/studio/`

## Authentication

All endpoints require authentication via Supabase session cookies.

**Headers Required:**
- `Cookie`: Supabase auth session (automatically managed by browser)

**Unauthorized Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

## Response Format

All endpoints use a standard response envelope:

```typescript
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: {
    code: ErrorCode
    message: string
    details?: object
  }
}
```

## Patient Endpoints

### List Patient's Own Entries

**Endpoint:** `GET /api/patient/anamnesis`

**Description:** Returns all anamnesis entries for the authenticated patient (RLS enforced).

**Authorization:** Patient role (any authenticated user with patient profile)

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "uuid",
        "patient_id": "uuid",
        "organization_id": "uuid",
        "title": "Medication List 2026",
        "content": { "medications": [...] },
        "entry_type": "medications",
        "tags": ["current", "daily-meds"],
        "is_archived": false,
        "version_count": 2,
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-01-20T14:45:00Z",
        "created_by": "uuid",
        "updated_by": "uuid"
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not authenticated)
- `500` - Server error

---

### Get Single Entry with Version History

**Endpoint:** `GET /api/patient/anamnesis/[entryId]`

**Description:** Returns a single entry with full version history (RLS enforced).

**Authorization:** Patient must own the entry

**Path Parameters:**
- `entryId` (UUID) - Entry identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "uuid",
      "patient_id": "uuid",
      "organization_id": "uuid",
      "title": "Medication List 2026 (Updated)",
      "content": { "medications": [...] },
      "entry_type": "medications",
      "tags": ["current", "daily-meds"],
      "is_archived": false,
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-20T14:45:00Z",
      "created_by": "uuid",
      "updated_by": "uuid"
    },
    "versions": [
      {
        "id": "uuid",
        "entry_id": "uuid",
        "version_number": 2,
        "title": "Medication List 2026 (Updated)",
        "content": { "medications": [...] },
        "entry_type": "medications",
        "tags": ["current", "daily-meds"],
        "changed_by": "uuid",
        "changed_at": "2026-01-20T14:45:00Z",
        "change_reason": "Added vitamin D supplement"
      },
      {
        "id": "uuid",
        "entry_id": "uuid",
        "version_number": 1,
        "title": "Medication List 2026",
        "content": { "medications": [...] },
        "entry_type": "medications",
        "tags": ["current", "daily-meds"],
        "changed_by": "uuid",
        "changed_at": "2026-01-15T10:30:00Z",
        "change_reason": null
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not authenticated)
- `404` - Entry not found or not accessible (RLS filtered)
- `500` - Server error

---

### Create New Entry

**Endpoint:** `POST /api/patient/anamnesis`

**Description:** Creates a new anamnesis entry and automatically generates version 1.

**Authorization:** Patient role

**Request Body:**
```json
{
  "title": "Medication List 2026",
  "content": {
    "medications": [
      { "name": "Aspirin", "dose": "100mg", "frequency": "daily" }
    ]
  },
  "entry_type": "medications",
  "tags": ["current", "daily-meds"]
}
```

**Request Validation:**
- `title` (required): string, max 500 characters
- `content` (required): object, max 1MB serialized size
- `entry_type` (optional): one of allowed types or null
- `tags` (optional): array of strings or null

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "uuid",
      "patient_id": "uuid",
      "organization_id": "uuid",
      "title": "Medication List 2026",
      "content": { "medications": [...] },
      "entry_type": "medications",
      "tags": ["current", "daily-meds"],
      "is_archived": false,
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z",
      "created_by": "uuid",
      "updated_by": "uuid"
    },
    "version": {
      "id": "uuid",
      "entry_id": "uuid",
      "version_number": 1,
      "title": "Medication List 2026",
      "content": { "medications": [...] },
      "entry_type": "medications",
      "tags": ["current", "daily-meds"],
      "changed_by": "uuid",
      "changed_at": "2026-01-15T10:30:00Z",
      "change_reason": null
    }
  }
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation failed
- `401` - Unauthorized
- `500` - Server error

---

### Create New Version (Update Entry)

**Endpoint:** `POST /api/patient/anamnesis/[entryId]/versions`

**Description:** Updates an entry by creating a new version. Original entry is preserved in version history.

**Authorization:** Patient must own the entry

**Path Parameters:**
- `entryId` (UUID) - Entry identifier

**Request Body:**
```json
{
  "title": "Medication List 2026 (Updated)",
  "content": {
    "medications": [
      { "name": "Aspirin", "dose": "100mg", "frequency": "daily" },
      { "name": "Vitamin D", "dose": "1000IU", "frequency": "daily" }
    ]
  },
  "entry_type": "medications",
  "tags": ["current", "daily-meds"],
  "change_reason": "Added vitamin D supplement"
}
```

**Request Validation:**
- Same as create endpoint
- `change_reason` (optional): string, reason for the change

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "uuid",
      "title": "Medication List 2026 (Updated)",
      "updated_at": "2026-01-20T14:45:00Z",
      ...
    },
    "version": {
      "version_number": 2,
      "change_reason": "Added vitamin D supplement",
      ...
    }
  }
}
```

**Status Codes:**
- `201` - Version created successfully
- `400` - Validation failed
- `401` - Unauthorized
- `404` - Entry not found or not accessible
- `409` - State conflict (entry is archived)
- `500` - Server error

---

### Archive Entry

**Endpoint:** `POST /api/patient/anamnesis/[entryId]/archive`

**Description:** Soft-deletes an entry by setting `is_archived = true`. Archived entries cannot be updated.

**Authorization:** Patient must own the entry

**Path Parameters:**
- `entryId` (UUID) - Entry identifier

**Request Body:** None (empty or `{}`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "uuid",
      "is_archived": true,
      ...
    }
  }
}
```

**Status Codes:**
- `200` - Archived successfully
- `401` - Unauthorized
- `404` - Entry not found or not accessible
- `500` - Server error

---

## Studio/Clinician Endpoints

### List Patient's Entries (Clinician View)

**Endpoint:** `GET /api/studio/patients/[patientId]/anamnesis`

**Description:** Returns anamnesis entries for a specific patient (RLS enforced: clinician must be assigned to patient).

**Authorization:** Clinician or admin role

**Path Parameters:**
- `patientId` (UUID) - Patient profile identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "uuid",
        "patient_id": "uuid",
        "title": "Medication List 2026",
        "content": { "medications": [...] },
        "entry_type": "medications",
        "tags": ["current"],
        "is_archived": false,
        "version_count": 2,
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-01-20T14:45:00Z"
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not a clinician/admin)
- `404` - Patient not found or not assigned
- `500` - Server error

---

### Create Entry for Patient (Clinician)

**Endpoint:** `POST /api/studio/patients/[patientId]/anamnesis`

**Description:** Creates anamnesis entry for a patient (RLS enforced: clinician must be assigned).

**Authorization:** Clinician or admin role

**Path Parameters:**
- `patientId` (UUID) - Patient profile identifier

**Request Body:** Same as patient create endpoint

**Response (201 Created):** Same structure as patient create endpoint

**Status Codes:**
- `201` - Created successfully
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden (not a clinician/admin)
- `404` - Patient not found or not assigned
- `500` - Server error

---

### Create New Version (Clinician)

**Endpoint:** `POST /api/studio/anamnesis/[entryId]/versions`

**Description:** Updates entry by creating version (RLS enforced: clinician must be assigned to patient).

**Authorization:** Clinician or admin role

**Path Parameters:**
- `entryId` (UUID) - Entry identifier

**Request Body:** Same as patient version endpoint

**Response (201 Created):** Same structure as patient version endpoint

**Status Codes:**
- `201` - Version created successfully
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden (not a clinician/admin)
- `404` - Entry not found or not accessible (patient not assigned)
- `409` - State conflict (entry is archived)
- `500` - Server error

---

### Archive Entry (Clinician)

**Endpoint:** `POST /api/studio/anamnesis/[entryId]/archive`

**Description:** Archives entry (RLS enforced: clinician must be assigned to patient).

**Authorization:** Clinician or admin role

**Path Parameters:**
- `entryId` (UUID) - Entry identifier

**Request Body:** None (empty or `{}`)

**Response (200 OK):** Same structure as patient archive endpoint

**Status Codes:**
- `200` - Archived successfully
- `401` - Unauthorized
- `403` - Forbidden (not a clinician/admin)
- `404` - Entry not found or not accessible
- `500` - Server error

---

## Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context (optional)"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized (wrong role or no assignment) |
| `NOT_FOUND` | 404 | Entry not found or RLS filtered |
| `VALIDATION_FAILED` | 400 | Request body validation failed |
| `STATE_CONFLICT` | 409 | Operation conflicts with current state (e.g., updating archived entry) |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Example Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Title is required and must not exceed 500 characters",
    "details": {
      "field": "title",
      "received": "",
      "expected": "string (1-500 chars)"
    }
  }
}
```

**State Conflict (409):**
```json
{
  "success": false,
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Cannot update archived entry",
    "details": {
      "entryId": "uuid",
      "is_archived": true
    }
  }
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Entry not found or not accessible"
  }
}
```

---

## Validation Rules

### Title

- **Required:** Yes
- **Type:** string
- **Min Length:** 1 character
- **Max Length:** 500 characters
- **Trim:** Whitespace trimmed

### Content

- **Required:** Yes
- **Type:** object (JSONB)
- **Max Size:** 1MB (1,048,576 bytes when serialized)
- **Structure:** Any valid JSON object

### Entry Type

- **Required:** No
- **Type:** string or null
- **Allowed Values:**
  - `medical_history`
  - `symptoms`
  - `medications`
  - `allergies`
  - `family_history`
  - `lifestyle`
  - `other`

### Tags

- **Required:** No
- **Type:** array of strings or null
- **Item Type:** string
- **Max Items:** No limit (practical limit ~100)

### Change Reason

- **Required:** No (only for version creation)
- **Type:** string or null
- **Max Length:** 1000 characters

---

## Security

### Row Level Security (RLS)

All database queries are automatically filtered by RLS policies. See [SECURITY_MODEL.md](./SECURITY_MODEL.md) for details.

**Patient Access:**
- Can only see/modify their own entries
- Enforced by checking `patient_profiles.user_id = auth.uid()`

**Clinician Access:**
- Can only see/modify entries for assigned patients
- Enforced by checking `clinician_patient_assignments` table

**Admin Access:**
- Can see/modify all entries within their organization
- Enforced by checking `current_user_role(organization_id) = 'admin'`

### API-Level Authorization

In addition to RLS, API routes verify:
1. User is authenticated (`auth.getUser()`)
2. User has appropriate role (clinician check for studio endpoints)
3. Request is valid (input validation)

**Defense in Depth:** Even if API checks fail, RLS prevents unauthorized data access.

---

## Versioning Behavior

### Transaction Safety

All versioning operations are transactional:
- Entry update + version creation happen in single database transaction
- No race conditions or partial updates
- Automatic rollback on error

### Version Numbering

- Version numbers are sequential integers starting at 1
- Calculated as `COUNT(*) + 1` for each entry
- Guaranteed unique per entry via database constraint

### Immutability

- Version records are immutable (no UPDATE or DELETE RLS policies)
- Only SELECT policies exist for version history
- Versions are created only by database trigger

---

## Rate Limiting

**Current:** No rate limiting implemented

**Future:** Consider implementing rate limits:
- 100 requests per minute per user
- 10 create/update operations per minute per user

---

## Implementation Files

**Patient API Routes:**
- `apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts`
- `apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts`
- `apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/versions/route.ts`
- `apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/archive/route.ts`

**Studio API Routes:**
- `apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/anamnesis/route.ts`
- `apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/versions/route.ts`
- `apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/archive/route.ts`

**Shared Utilities:**
- `lib/api/anamnesis/validation.ts` - Zod schemas and validation
- `lib/api/anamnesis/helpers.ts` - Database query helpers

---

## Testing

**Verification Script:** `scripts/ci/verify-e75-2-anamnesis-api.mjs`  
**Run Command:** `npm run verify:e75-2`

**Test Coverage:**
- Authentication and authorization checks
- RLS enforcement
- Versioning behavior
- Error handling (404, 403, 409)
- Validation rules
- Data integrity

---

## References

- **Schema Documentation:** [SCHEMA_V1.md](./SCHEMA_V1.md)
- **Security Model:** [SECURITY_MODEL.md](./SECURITY_MODEL.md)
- **Implementation Summary:** `/E75.2-COMPLETE.md`
- **Rules vs Checks:** `docs/RULES_VS_CHECKS_MATRIX_E75_2.md`

---

**Version:** 1.0  
**Author:** GitHub Copilot  
**Epic:** E75 — Anamnesis Feature
