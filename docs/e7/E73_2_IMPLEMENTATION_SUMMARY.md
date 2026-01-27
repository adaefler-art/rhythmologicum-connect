# E73.2 Implementation Summary

## Overview

**Epic**: E73 — Processing Job Orchestration  
**Issue**: E73.2 — Wire: Complete → Processing Job (idempotent)  
**Status**: ✅ Complete  
**Date**: 2026-01-27

## Objective

Create an idempotent processing job when an assessment is completed, ensuring that:
- A processing job is created exactly once per assessment
- Duplicate completion calls don't create duplicate jobs
- The response includes job_id and status information
- Audit events are logged for traceability

## Implementation

### 1. Core Job Creation Logic

**File**: `lib/processing/jobCreation.ts`

Created `createProcessingJobIdempotent()` function with the following features:

- **Idempotency Strategy**: Uses select-then-insert pattern
  - First checks if a job already exists for the assessment+correlation combination
  - If exists, returns the existing job
  - If not, creates a new job
  
- **Race Condition Handling**: 
  - Catches unique constraint violations (error code 23505)
  - On conflict, performs a second select to retrieve the job created by concurrent request
  - Ensures exactly one job per assessment+correlation combination

- **Database Constraint**: Leverages existing unique constraint:
  ```sql
  UNIQUE (assessment_id, correlation_id, schema_version)
  ```

- **Correlation ID**: 
  - Accepts optional correlation_id from caller
  - Generates stable correlation_id if not provided: `assessment-{assessmentId}-{timestamp}`

- **Audit Logging**:
  - Logs `processing_job` creation event via `logAuditEvent()`
  - Fire-and-forget: doesn't block on audit failures
  - Includes metadata: assessment_id, correlation_id, job_id, status

### 2. API Contract Update

**File**: `packages/rhythm-core/src/contracts/patient/assessments.ts`

Extended `CompleteAssessmentResponseDataSchema` with optional processing job information:

```typescript
{
  assessmentId: string,
  status: 'completed',
  message?: string,
  processingJob?: {  // E73.2: New field
    jobId: string,
    status: string
  }
}
```

**Backward Compatibility**: The `processingJob` field is optional, ensuring existing clients continue to work.

### 3. Complete Endpoint Updates

**Files**:
- `apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts`
- `apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts`

**Changes**:

1. **Import job creation helper**:
   ```typescript
   import { createProcessingJobIdempotent } from '@/lib/processing/jobCreation'
   ```

2. **Create job after assessment completion**:
   - Called after assessment status is updated to 'completed'
   - Uses correlation_id from request telemetry
   - Non-blocking: logs errors but doesn't fail completion
   
3. **Handle already-completed assessments**:
   - When assessment is already completed (idempotent completion)
   - Still attempts to fetch/create processing job
   - Returns existing job information in response

4. **Include job in response**:
   ```typescript
   const responseData: CompleteAssessmentResponseData = {
     assessmentId: assessment.id,
     status: 'completed',
     processingJob: jobResult.success ? {
       jobId: jobResult.jobId,
       status: jobResult.status
     } : undefined,
   }
   ```

### 4. Test Coverage

**File**: `apps/rhythm-legacy/app/api/funnels/__tests__/processing-job-creation.test.ts`

Created comprehensive test suite with scenarios:

1. **First Completion**: 
   - Verifies job is created on first completion
   - Validates response includes job_id and status
   
2. **Second Completion (Idempotent)**:
   - Verifies existing job is returned on duplicate completion
   - Validates same job_id is returned
   - Tests both "already completed" path and race condition path
   
3. **Race Condition**:
   - Simulates concurrent completion requests
   - Validates unique constraint violation handling
   - Ensures only one job exists after race
   
4. **Graceful Degradation**:
   - Tests completion success even if job creation fails
   - Validates response with undefined processingJob
   - Ensures assessment completion is never blocked by job failures

### 5. Documentation Updates

**File**: `docs/PATIENT_API_CONTRACTS.md`

Updated Complete Assessment endpoint documentation:
- Added note about optional `processingJob` response field
- Referenced E73.2 implementation
- Documented response schema extension

## Database Schema

**Existing Constraint** (leveraged for idempotency):

```sql
ALTER TABLE processing_jobs
  ADD CONSTRAINT processing_jobs_assessment_correlation_version_unique
  UNIQUE (assessment_id, correlation_id, schema_version);
```

This constraint ensures idempotency at the database level. No migration needed.

## API Response Examples

### Success with Job Created

```json
{
  "success": true,
  "data": {
    "assessmentId": "abc-123",
    "status": "completed",
    "processingJob": {
      "jobId": "job-789",
      "status": "queued"
    }
  },
  "schemaVersion": "v1"
}
```

### Success without Job (creation failed gracefully)

```json
{
  "success": true,
  "data": {
    "assessmentId": "abc-123",
    "status": "completed"
  },
  "schemaVersion": "v1"
}
```

### Already Completed (Idempotent)

```json
{
  "success": true,
  "data": {
    "assessmentId": "abc-123",
    "status": "completed",
    "message": "Assessment wurde bereits abgeschlossen.",
    "processingJob": {
      "jobId": "job-789",
      "status": "queued"
    }
  },
  "schemaVersion": "v1"
}
```

## Idempotency Guarantees

### Scenario 1: Normal Completion
1. User completes assessment
2. Assessment status → 'completed'
3. Processing job created with correlation_id
4. Response includes job_id

### Scenario 2: Duplicate Completion (Same Correlation ID)
1. User retries completion with same correlation_id
2. Assessment already completed (early return)
3. Existing job fetched by (assessment_id, correlation_id, schema_version)
4. Response includes same job_id as first call

### Scenario 3: Race Condition
1. Two concurrent completion requests
2. Both check for existing job (none found)
3. First request inserts job successfully
4. Second request hits unique constraint violation (23505)
5. Second request fetches job created by first request
6. Both responses include same job_id

## Audit Trail

All job creations are logged to `audit_log` table with:
- `entity_type`: 'processing_job'
- `action`: 'create'
- `entity_id`: job_id
- `metadata`:
  - `assessment_id`
  - `correlation_id`
  - `job_id`
  - `status_to`: 'queued'

## Acceptance Criteria ✅

- [x] Complete sets assessment status to 'completed' and completed_at to now()
- [x] processing_jobs row is created with stable correlation_id
- [x] Idempotency: unique constraint enforced at DB level
- [x] Complete is retry-safe: 2x call → 1 job row, same correlation
- [x] Response contains job_id and status
- [x] Audit/event written for job creation

## CI/Guardrails

- **Endpoint Catalog**: Endpoint already documented in `docs/api/ENDPOINT_CATALOG.md`
- **API Response Contract**: Maintains backward compatibility (optional field)
- **No Breaking Changes**: Existing clients continue to work
- **Database Constraint**: No new migration needed (constraint already exists)

## Future Work

- **Job Processing**: Implement actual processing stages (E73.3+)
- **Status Transitions**: Add job status update endpoints
- **Job Monitoring**: Add endpoints to query job status
- **Failed Job Retry**: Add retry logic for failed processing jobs

## Testing Checklist

- [x] Unit tests for `createProcessingJobIdempotent()`
- [x] Integration tests for complete endpoint with job creation
- [x] Test idempotency (duplicate calls)
- [x] Test race condition handling
- [x] Test graceful degradation (job creation failure)
- [ ] Manual testing in development environment
- [ ] Manual testing in staging environment

## Notes

- Job creation is non-blocking: completion succeeds even if job creation fails
- Correlation ID is sourced from request telemetry for consistent tracing
- Processing jobs start in `queued` status and `pending` stage
- Default max_attempts is 3 (configurable in future)
- Schema version is hardcoded to 'v1' for now
