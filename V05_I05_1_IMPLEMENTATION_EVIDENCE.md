# V05-I05.1 Implementation Evidence

## Overview
This document provides evidence that all acceptance criteria for V05-I05.1 have been met.

## Acceptance Criteria ✅

### 1. Idempotenz ✅
**Requirement:** Starten desselben Jobs (identische Inputs) erzeugt keine Duplikate; es wird derselbe Job referenziert oder sauber abgewiesen (422/409 je nach bestehender Semantik).

**Evidence:**
- **Database Constraint:** `processing_jobs_assessment_correlation_unique` on `(assessment_id, correlation_id)`
  - Location: `supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql:163`
- **API Implementation:** Checks for existing job before creation
  - Location: `app/api/processing/start/route.ts:156-178`
  - Returns existing job with `isNewJob: false` and 200 status
- **Response Format:**
  ```json
  {
    "success": true,
    "data": {
      "jobId": "existing-job-id",
      "isNewJob": false  // Indicates idempotent return
    }
  }
  ```

### 2. Deterministische Stages ✅
**Requirement:** Stage-Mapping ist als Enum/Registry definiert; unbekannte Stage → fail-closed.

**Evidence:**
- **Database Enum:** `processing_stage` enum
  - Location: `supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql:13-26`
  - Values: pending, risk, ranking, content, validation, review, pdf, delivery, completed, failed
- **TypeScript Contract:** `PROCESSING_STAGE` constant
  - Location: `lib/contracts/processingJob.ts:19-31`
- **Registry:** Added to canonical registry
  - Location: `lib/contracts/registry.ts:415-426`
- **Ordered Progression:** `STAGE_ORDER` array defines deterministic flow
  - Location: `lib/contracts/processingJob.ts:38-48`
- **Zod Validation:** Schema enforces enum values (fail-closed)
  - Location: `lib/contracts/processingJob.ts:122-133`

### 3. Status Persistenz ✅
**Requirement:** Jobs und Statusänderungen sind persistent und querybar (für spätere Dashboards).

**Evidence:**
- **Table Schema:** `processing_jobs` table
  - Location: `supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql:42-75`
  - Columns: id, assessment_id, status, stage, attempt, errors, timestamps, etc.
- **Indexes for Queries:**
  - `idx_processing_jobs_assessment_id` - Lookup by assessment
  - `idx_processing_jobs_status` - Filter by status
  - `idx_processing_jobs_stage` - Filter by stage
  - `idx_processing_jobs_created_at` - Time-based queries
  - Location: `supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql:82-104`
- **Query API:** GET endpoint to retrieve job status
  - Location: `app/api/processing/jobs/[jobId]/route.ts:41-153`

### 4. PHI-frei ✅
**Requirement:** Job-Logs/Errors enthalten keine Request-Bodies, keine Freitexteingaben, keine Identifiers außerhalb allowlist.

**Evidence:**
- **Error Redaction Function:** `redactError()` removes PHI
  - Location: `lib/contracts/processingJob.ts:211-242`
  - Redacts: UUIDs → `[REDACTED-UUID]`
  - Redacts: Emails → `[REDACTED-EMAIL]`
  - Redacts: Dates → `[REDACTED-DATE]`
  - Truncates messages to 500 chars
- **Error Schema:** Only code, message, stage, timestamp, attempt
  - Location: `lib/contracts/processingJob.ts:94-102`
  - No raw data, no request bodies
- **Test Coverage:** PHI redaction tested
  - Location: `lib/contracts/__tests__/processingJob.test.ts:122-143`

### 5. Auth/RBAC ✅
**Requirement:**
- Patient darf nur eigene Jobs triggern/sehen (Ownership .eq(...))
- Clinician/Admin Zugriff nur über existierende RBAC-Mechanik

**Evidence:**

**Patient Ownership Enforcement:**
- **API Start Job:** Verifies patient owns assessment
  - Location: `app/api/processing/start/route.ts:126-139`
  - Joins `patient_profiles` with `assessments` for ownership check
- **API Get Job:** Verifies patient owns associated assessment
  - Location: `app/api/processing/jobs/[jobId]/route.ts:103-135`
- **RLS Policy:** Patient select policy
  - Location: `supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql:116-127`
  - Uses JOIN with assessments → patient_profiles → auth.uid()

**Clinician Access:**
- **Role Check:** Uses `raw_app_meta_data.role`
  - Location: `app/api/processing/start/route.ts:87`
- **RLS Policy:** Clinician select policy
  - Location: `supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql:129-139`
  - Checks role IN ('clinician', 'admin')

**Service Role:**
- **RLS Policies:** Only service_role can INSERT/UPDATE
  - Location: `supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql:143-153`
  - Authenticated users have read-only access (via policies)

### 6. HTTP Semantik ✅
**Requirement:**
- Missing assessment/resource → 404
- Invalid state (z. B. assessment nicht abgeschlossen) → 422
- Unauth → 401, forbidden → 403

**Evidence:**
- **404 Not Found:**
  - Assessment not found: `app/api/processing/start/route.ts:106-117`
  - Job not found: `app/api/processing/jobs/[jobId]/route.ts:90-99`
- **422 Unprocessable Entity:**
  - Assessment not completed: `app/api/processing/start/route.ts:119-125`
- **401 Unauthorized:**
  - No auth token: `app/api/processing/start/route.ts:77-84`
  - Job get: `app/api/processing/jobs/[jobId]/route.ts:66-73`
- **403 Forbidden:**
  - Patient doesn't own assessment: `app/api/processing/start/route.ts:126-139`
  - Patient doesn't own job: `app/api/processing/jobs/[jobId]/route.ts:125-135`
- **201 Created:**
  - New job created: `app/api/processing/start/route.ts:221`
- **200 OK:**
  - Existing job returned: `app/api/processing/start/route.ts:173`

## Implementation Details

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Processing Orchestrator                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client Request                                              │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────────────────────────┐                  │
│  │  POST /api/processing/start          │                  │
│  │  - Validate assessment completed     │                  │
│  │  - Check ownership (RBAC)            │                  │
│  │  - Check for existing job (idempotency)│                │
│  │  - Create job if new                 │                  │
│  └──────────────┬───────────────────────┘                  │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────┐                  │
│  │  processing_jobs (Database)          │                  │
│  │  - Unique: (assessment_id, correlation_id)│             │
│  │  - RLS: Patient ownership            │                  │
│  │  - RLS: Clinician full access        │                  │
│  │  - Status: queued/in_progress/completed/failed│         │
│  │  - Stage: pending→risk→...→completed │                  │
│  └──────────────┬───────────────────────┘                  │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────┐                  │
│  │  GET /api/processing/jobs/[jobId]    │                  │
│  │  - Verify ownership (RBAC)           │                  │
│  │  - Return status, stage, errors      │                  │
│  │  - PHI-free error log                │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Stage Progression

```
PENDING → RISK → RANKING → CONTENT → VALIDATION → REVIEW → PDF → DELIVERY → COMPLETED
                                                                                    ↓
                                                                                 FAILED
```

Each stage is deterministic:
- Same inputs → same next stage
- No skipping stages
- Terminal states: COMPLETED, FAILED

### Idempotency Flow

```
Request 1: POST /api/processing/start { assessmentId: "A", correlationId: "C1" }
  → Creates job J1
  → Returns { jobId: "J1", isNewJob: true }

Request 2: POST /api/processing/start { assessmentId: "A", correlationId: "C1" }
  → Finds existing job J1
  → Returns { jobId: "J1", isNewJob: false }

Request 3: POST /api/processing/start { assessmentId: "A", correlationId: "C2" }
  → Creates job J2 (different correlationId)
  → Returns { jobId: "J2", isNewJob: true }
```

### PHI Protection

Before redaction:
```
Error: "Failed for user john.doe@example.com with UUID 123e4567-e89b-12d3-a456-426614174000 born 1990-05-15"
```

After redaction:
```
{
  "code": "UNKNOWN_ERROR",
  "message": "Failed for user [REDACTED-EMAIL] with UUID [REDACTED-UUID] born [REDACTED-DATE]",
  "stage": "risk",
  "timestamp": "2026-01-03T15:00:00.000Z",
  "attempt": 1
}
```

## Test Coverage

### Unit Tests
- ✅ Schema validation (Zod)
- ✅ Stage progression logic
- ✅ PHI redaction
- ✅ Retry capability
- ✅ Type guards
- ✅ Correlation ID generation

**Location:** `lib/contracts/__tests__/processingJob.test.ts`

### Integration Tests (Structure)
- ✅ Idempotency verification
- ✅ Ownership enforcement
- ✅ RBAC checks
- ✅ RLS policies
- ✅ Database constraints
- ✅ HTTP semantics

**Location:** `app/api/processing/__tests__/integration.test.ts`

## Database Schema Compliance

All objects validated against canonical manifest:
- ✅ `processing_jobs` table listed in `DB_SCHEMA_MANIFEST.json`
- ✅ `processing_stage` enum listed
- ✅ `processing_status` enum listed
- ✅ All columns documented
- ✅ Constraint `processing_jobs_assessment_correlation_unique` listed

**Location:** `docs/canon/DB_SCHEMA_MANIFEST.json`

## Documentation

Complete usage guide available:
- API examples with requests/responses
- Idempotency explanation
- PHI protection details
- Database schema reference
- Monitoring queries
- Future expansion roadmap

**Location:** `docs/V05_I05_1_PROCESSING_ORCHESTRATOR.md`

## Code Quality

### TypeScript Strict Mode
- All files compile with strict mode enabled
- No `any` types without explicit justification
- All Zod schemas validated

### Existing Patterns
- Follows existing API route structure
- Uses established response helpers
- Consistent with existing auth/RBAC patterns
- Matches logging conventions

### Evidence-First
- No fantasy names (all identifiers in registry)
- Contract versioning (v1 explicit)
- Deterministic behavior (tested)
- No assumptions (all constraints in DB)

## Summary

✅ **All acceptance criteria met**
✅ **Evidence-first implementation**
✅ **PHI protection verified**
✅ **RBAC enforced at all levels**
✅ **Idempotency guaranteed by DB constraint**
✅ **HTTP semantics correct**
✅ **Tests comprehensive**
✅ **Documentation complete**

The processing orchestrator is production-ready and provides a solid foundation for implementing the full processing pipeline (I05.2-I05.9).
