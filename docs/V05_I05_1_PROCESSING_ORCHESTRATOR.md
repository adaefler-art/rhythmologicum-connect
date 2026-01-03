# V05-I05.1: Processing Orchestrator - Usage Guide

## Overview

The Processing Orchestrator provides a reliable, idempotent, and deterministic job execution system for transforming completed assessments through multiple processing stages.

## Architecture

### Key Components

1. **Processing Job Contract** (`lib/contracts/processingJob.ts`)
   - Versioned schema (ProcessingJobV1)
   - PHI-free error tracking
   - Deterministic stage progression

2. **Database Schema** (`supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql`)
   - `processing_jobs` table with idempotency constraint
   - RLS policies for patient/clinician access
   - Comprehensive indexes

3. **API Routes**
   - `POST /api/processing/start` - Create/retrieve job
   - `GET /api/processing/jobs/[jobId]` - Query job status

### Processing Stages

Jobs progress deterministically through these stages:

```
PENDING → RISK → RANKING → CONTENT → VALIDATION → REVIEW → PDF → DELIVERY → COMPLETED
                                                                                    ↓
                                                                                 FAILED
```

## API Usage

### Starting a Processing Job

**Endpoint:** `POST /api/processing/start`

**Request:**
```json
{
  "assessmentId": "123e4567-e89b-12d3-a456-426614174000",
  "correlationId": "optional-unique-id"  // Auto-generated if not provided
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "jobId": "456e4567-e89b-12d3-a456-426614174001",
    "assessmentId": "123e4567-e89b-12d3-a456-426614174000",
    "correlationId": "assessment-123e4567-e89b-12d3-a456-426614174000-1234567890",
    "status": "queued",
    "stage": "pending",
    "createdAt": "2026-01-03T15:00:00.000Z",
    "isNewJob": true
  }
}
```

**Idempotent Response (200 OK):**
If a job with the same `assessmentId` and `correlationId` already exists:
```json
{
  "success": true,
  "data": {
    "jobId": "456e4567-e89b-12d3-a456-426614174001",
    "assessmentId": "123e4567-e89b-12d3-a456-426614174000",
    "correlationId": "assessment-123e4567-e89b-12d3-a456-426614174000-1234567890",
    "status": "in_progress",
    "stage": "risk",
    "createdAt": "2026-01-03T15:00:00.000Z",
    "isNewJob": false  // Indicates existing job was returned
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Patient doesn't own assessment (for patient role)
- `404 Not Found` - Assessment not found
- `422 Unprocessable Entity` - Assessment not completed yet
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Server error

### Querying Job Status

**Endpoint:** `GET /api/processing/jobs/[jobId]`

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "456e4567-e89b-12d3-a456-426614174001",
    "assessmentId": "123e4567-e89b-12d3-a456-426614174000",
    "correlationId": "assessment-123e4567-e89b-12d3-a456-426614174000-1234567890",
    "status": "in_progress",
    "stage": "risk",
    "attempt": 1,
    "maxAttempts": 3,
    "createdAt": "2026-01-03T15:00:00.000Z",
    "updatedAt": "2026-01-03T15:01:00.000Z",
    "startedAt": "2026-01-03T15:00:30.000Z",
    "completedAt": null,
    "errors": []
  }
}
```

**With Errors (PHI-Free):**
```json
{
  "success": true,
  "data": {
    "jobId": "456e4567-e89b-12d3-a456-426614174001",
    "status": "failed",
    "stage": "failed",
    "attempt": 3,
    "errors": [
      {
        "code": "RISK_CALCULATION_ERROR",
        "message": "Failed to calculate risk score for assessment [REDACTED-UUID]",
        "stage": "risk",
        "timestamp": "2026-01-03T15:02:00.000Z",
        "attempt": 1
      },
      {
        "code": "RISK_CALCULATION_ERROR",
        "message": "Retry failed: [REDACTED-UUID]",
        "stage": "risk",
        "timestamp": "2026-01-03T15:03:00.000Z",
        "attempt": 2
      }
    ]
  }
}
```

## Authorization & RBAC

### Patient Role
- Can only start jobs for their own completed assessments
- Can only view status of their own jobs
- Ownership verified via `patient_profiles` → `assessments` join

### Clinician/Admin Role
- Can start jobs for any completed assessment
- Can view status of any job
- Role checked via `auth.users.raw_app_meta_data.role`

## Idempotency

The orchestrator ensures idempotent job creation:

1. **Unique Constraint:** `(assessment_id, correlation_id)` prevents duplicates
2. **Auto-Generation:** If `correlationId` is not provided, one is generated from `assessment_id + timestamp`
3. **Deterministic Retry:** Same inputs always return the same job

### Example Use Case

```typescript
// Client code - safe to retry on network error
async function startProcessingJob(assessmentId: string) {
  const correlationId = `client-${Date.now()}`
  
  try {
    const response = await fetch('/api/processing/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId, correlationId })
    })
    
    const result = await response.json()
    
    if (result.data.isNewJob) {
      console.log('New job created:', result.data.jobId)
    } else {
      console.log('Existing job returned:', result.data.jobId)
    }
    
    return result.data
  } catch (error) {
    // Safe to retry - idempotency prevents duplicates
    console.error('Failed to start job, will retry:', error)
    throw error
  }
}
```

## PHI Protection

All error logging is PHI-free:
- UUIDs are redacted as `[REDACTED-UUID]`
- Email addresses are redacted as `[REDACTED-EMAIL]`
- Dates are redacted as `[REDACTED-DATE]`
- Error messages are truncated to 500 characters max
- No patient identifiers or clinical data in error logs

## Database Schema

### processing_jobs Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| assessment_id | UUID | Assessment being processed (soft reference) |
| correlation_id | TEXT | Idempotency key |
| status | processing_status | Overall job status |
| stage | processing_stage | Current processing stage |
| attempt | INTEGER | Current attempt (1-10) |
| max_attempts | INTEGER | Max retry attempts (1-10) |
| created_at | TIMESTAMPTZ | Job creation time |
| updated_at | TIMESTAMPTZ | Last update time |
| started_at | TIMESTAMPTZ | Processing start time |
| completed_at | TIMESTAMPTZ | Completion time |
| errors | JSONB | PHI-free error array |
| schema_version | TEXT | Contract version ('v1') |

### Indexes

- `idx_processing_jobs_assessment_id` - Primary lookup
- `idx_processing_jobs_correlation_id` - Idempotency check
- `idx_processing_jobs_status` - Status filtering (partial)
- `idx_processing_jobs_stage` - Stage filtering
- `idx_processing_jobs_created_at` - Time-based queries
- `idx_processing_jobs_status_created` - Combined queries

### Constraints

- `processing_jobs_assessment_correlation_unique` - Idempotency constraint

## Future Expansion (I05.2-I05.9)

This orchestrator provides the foundation for:
- **I05.2:** Risk calculation stage implementation
- **I05.3:** Ranking/prioritization stage
- **I05.4:** Content generation stage
- **I05.5:** Validation stage
- **I05.6:** Review workflow
- **I05.7:** PDF generation
- **I05.8:** Delivery mechanisms
- **I05.9:** Complete end-to-end pipeline

Each stage will:
1. Query for jobs in its specific stage
2. Process the job
3. Update status and transition to next stage
4. Log errors (PHI-free) on failure
5. Implement retry logic within `maxAttempts`

## Testing

### Unit Tests
Located in `lib/contracts/__tests__/processingJob.test.ts`:
- Schema validation
- Stage progression logic
- PHI redaction
- Retry capability checks
- Type guards

### Manual Testing

1. **Create a completed assessment** (via existing assessment flow)
2. **Start processing job:**
   ```bash
   curl -X POST https://your-domain.com/api/processing/start \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"assessmentId": "YOUR_ASSESSMENT_ID"}'
   ```
3. **Check job status:**
   ```bash
   curl https://your-domain.com/api/processing/jobs/YOUR_JOB_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
4. **Verify idempotency:** Repeat step 2 with same assessmentId - should return existing job

## Monitoring Queries

### Active Jobs
```sql
SELECT id, assessment_id, status, stage, attempt, created_at
FROM processing_jobs
WHERE status IN ('queued', 'in_progress')
ORDER BY created_at DESC;
```

### Failed Jobs
```sql
SELECT id, assessment_id, stage, attempt, errors
FROM processing_jobs
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 20;
```

### Jobs by Stage
```sql
SELECT stage, status, COUNT(*) as count
FROM processing_jobs
GROUP BY stage, status
ORDER BY stage;
```

## Acceptance Criteria Verification

✅ **Idempotenz:** Same assessmentId + correlationId returns existing job (no duplicates)

✅ **Deterministische Stages:** Stages defined as enum, unknown stage fails closed

✅ **Status Persistenz:** All jobs and transitions persisted in `processing_jobs` table

✅ **PHI-frei:** Error redaction removes UUIDs, emails, dates; no request bodies logged

✅ **Auth/RBAC:**
- Patients can only trigger/view own jobs (ownership via `patient_profiles`)
- Clinicians can access all jobs (role check via `raw_app_meta_data`)

✅ **HTTP Semantik:**
- Missing assessment → 404
- Assessment not completed → 422
- Unauthorized → 401
- Forbidden → 403
- Success → 200/201
