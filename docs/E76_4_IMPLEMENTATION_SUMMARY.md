# E76.4 - Diagnosis Run Execution Worker Implementation Summary

**Date:** 2026-02-02  
**Issue:** E76.4  
**Status:** ✅ Complete  

## Overview

E76.4 implements an execution worker for processing queued diagnosis runs. The worker fetches context packs, calls LLM/MCP for diagnosis generation, and persists artifacts with comprehensive error handling and validation.

## Implementation Components

### 1. Database Schema

**Migration:** `supabase/migrations/20260202100000_e76_4_create_diagnosis_runs.sql`

- **Table:** `diagnosis_runs`
  - Primary key: `id` (UUID)
  - Status tracking: `status` enum (queued, in_progress, completed, failed)
  - Retry mechanism: `attempt`, `max_attempts`
  - Input: `context_pack` (JSONB)
  - Output: `diagnosis_result` (JSONB)
  - Error tracking: `errors` (JSONB array, PHI-free)
  - Timestamps: `created_at`, `updated_at`, `started_at`, `completed_at`
  - Versioning: `schema_version`

- **Constraints:**
  - Unique: `(assessment_id, correlation_id, schema_version)` for idempotency

- **Indexes:**
  - `idx_diagnosis_runs_assessment_id` - Fast lookup by assessment
  - `idx_diagnosis_runs_correlation_id` - Idempotency checks
  - `idx_diagnosis_runs_status` - Worker queue processing
  - `idx_diagnosis_runs_created_at` - Monitoring/cleanup
  - `idx_diagnosis_runs_status_created` - Composite for common queries

- **RLS Policies:**
  - `diagnosis_runs_patient_select` - Patients can view their own runs
  - `diagnosis_runs_clinician_select` - Clinicians can view assigned patients' runs
  - `diagnosis_runs_system_insert` - Only service role can insert
  - `diagnosis_runs_system_update` - Only service role can update

### 2. Worker Implementation

**Module:** `lib/diagnosis/worker.ts`

**Functions:**

1. **`executeDiagnosisRun(supabase, runId)`**
   - Main worker function
   - Steps:
     1. Fetch run from database
     2. Validate status is 'queued'
     3. Update status to 'in_progress'
     4. Fetch context pack (assessment data, funnel config, patient context)
     5. Call LLM/MCP (Anthropic Claude)
     6. Validate diagnosis result schema
     7. Persist artifact to `diagnosis_result`
     8. Update status to 'completed'
   - Error handling: Sets status to 'failed' with PHI-free error logging

2. **`createDiagnosisRun(supabase, assessmentId, correlationId)`**
   - Idempotent run creation
   - Handles race conditions via unique constraint
   - Returns existing run if already created

3. **`fetchContextPack(supabase, assessmentId)`**
   - Fetches assessment answers
   - Fetches funnel configuration
   - Fetches patient context (limited fields)
   - Returns structured context pack

4. **`generateDiagnosis(contextPack)`**
   - Calls Anthropic Claude API
   - Model: `claude-sonnet-4-5-20250929`
   - Returns structured diagnosis result with confidence and metadata

5. **`validateDiagnosisResult(result)`**
   - Validates diagnosis result schema
   - Checks required fields: `diagnosis`, `confidence`, `metadata`
   - Confidence must be number between 0-1

6. **`redactError(error)` / `addErrorEntry(supabase, runId, code, message)`**
   - PHI-free error logging
   - Appends errors to JSONB array

**Error Codes:**
- `RUN_NOT_FOUND` - Run not found in database
- `INVALID_STATUS` - Run not in queued status
- `CONTEXT_FETCH_ERROR` - Failed to fetch context pack
- `LLM_ERROR` - LLM/MCP call failed
- `VALIDATION_ERROR` - Diagnosis result schema validation failed
- `PERSISTENCE_ERROR` - Failed to persist artifact
- `MAX_ATTEMPTS_REACHED` - Exceeded retry limit

### 3. API Endpoints (Strategy A Compliance)

All endpoints are in `apps/rhythm-studio-ui/app/api/diagnosis-runs/`

1. **`POST /api/diagnosis-runs`**
   - Create/queue a diagnosis run (idempotent)
   - Requires: `assessmentId`, `correlationId`
   - Returns: `runId`, `status`
   - **Literal callsite:** `lib/diagnosis/__tests__/integration.test.ts:11`

2. **`GET /api/diagnosis-runs`**
   - List diagnosis runs for authenticated user
   - RLS enforces ownership filtering
   - Returns up to 50 most recent runs
   - **Literal callsite:** `lib/diagnosis/__tests__/integration.test.ts:38`

3. **`GET /api/diagnosis-runs/[id]`**
   - Get diagnosis run by ID
   - RLS enforces ownership
   - Returns full run details including context_pack and diagnosis_result
   - **Literal callsite:** `lib/diagnosis/__tests__/integration.test.ts:23`

4. **`POST /api/diagnosis-runs/[id]/process`**
   - Execute worker for a queued run
   - Requires admin or system role
   - Calls `executeDiagnosisRun()`
   - **Literal callsite:** `lib/diagnosis/__tests__/integration.test.ts:30`

### 4. Guardrails (Rule-Check Coverage)

**Verification Script:** `scripts/ci/verify-e76-4-diagnosis-runs.mjs`

**Rules & Checks:**

| Rule ID | Description | Check |
|---------|-------------|-------|
| R-E76-001 | Table schema exists | `checkTableSchema()` |
| R-E76-002 | RLS policies exist | `checkRLSPolicies()` |
| R-E76-003 | Unique constraint exists | `checkUniqueConstraint()` |
| R-E76-004 | Status index exists | `checkStatusIndex()` |
| R-E76-005 | Literal callsites exist | `checkLiteralCallsites()` |
| R-E76-006 | Error codes match | `checkErrorCodes()` |

All checks output "violates R-E76-XXX" format for quick diagnosis.

**Run verification:**
```bash
npm run verify:e76-4
```

### 5. Documentation

- **RULES_VS_CHECKS_MATRIX.md** - Updated with E76.4 rules and checks
- **E76_4_IMPLEMENTATION_SUMMARY.md** - This document

## Acceptance Criteria

✅ **Run processed, artifact written**
- Worker fetches context pack
- Calls LLM/MCP
- Persists result to `diagnosis_result` field
- Sets status to `completed`

✅ **Invalid result: status failed with VALIDATION_ERROR**
- `validateDiagnosisResult()` checks schema
- Invalid result sets status to `failed`
- Error logged with code `VALIDATION_ERROR`

✅ **API route has in-repo literal callsite**
- All 4 endpoints have literal callsites in `lib/diagnosis/__tests__/integration.test.ts`
- No orphan endpoints

✅ **Endpoint wiring gate shows no orphan**
- All endpoints have corresponding fetch() calls
- Verified by `checkLiteralCallsites()`

✅ **Guardrails implemented**
- 6 rules defined (R-E76-001 to R-E76-006)
- 6 checks implemented
- 100% coverage
- All checks reference rule IDs
- All violations output "violates R-XYZ"

## Usage Examples

### Create a Diagnosis Run

```typescript
import { createDiagnosisRun } from '@/lib/diagnosis/worker'
import { createServerClient } from '@/lib/db/supabase.server'

const supabase = await createServerClient()

const result = await createDiagnosisRun(
  supabase,
  'assessment-123',
  'correlation-abc'
)

console.log(result.runId, result.status) // => uuid, 'queued'
```

### Execute a Diagnosis Run

```typescript
import { executeDiagnosisRun } from '@/lib/diagnosis/worker'
import { createServerClient } from '@/lib/db/supabase.server'

const supabase = await createServerClient()

const result = await executeDiagnosisRun(supabase, runId)

if (result.success) {
  console.log('Diagnosis completed:', result.runId, result.status)
} else {
  console.error('Diagnosis failed:', result.errorCode, result.error)
}
```

### Query via API

```typescript
// Create run
const createResponse = await fetch('/api/diagnosis-runs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assessmentId: 'assessment-123',
    correlationId: 'correlation-abc',
  }),
})

const { runId } = await createResponse.json()

// Process run (admin/system only)
const processResponse = await fetch(`/api/diagnosis-runs/${runId}/process`, {
  method: 'POST',
})

// Check status
const statusResponse = await fetch(`/api/diagnosis-runs/${runId}`)
const { run } = await statusResponse.json()

console.log(run.status, run.diagnosis_result)
```

## Security Considerations

1. **PHI Protection:**
   - All errors are redacted before logging
   - `context_pack` contains minimal patient data (IDs only, no names/email)
   - `diagnosis_result` is restricted by RLS policies

2. **Access Control:**
   - RLS policies enforce patient/clinician ownership
   - Worker execution requires admin/system role
   - Service role required for insert/update operations

3. **Concurrency:**
   - Unique constraint prevents duplicate runs
   - Race conditions handled via constraint violations (23505)
   - Idempotent create/execute operations

4. **Rate Limiting:**
   - Max attempts tracked per run (default: 3)
   - Failed runs stop after max attempts

## Future Enhancements

- [ ] Add cron job/queue for automatic processing
- [ ] Implement retry with exponential backoff
- [ ] Add more sophisticated LLM prompt engineering
- [ ] Implement diagnosis result caching
- [ ] Add metrics/monitoring (success rate, processing time)
- [ ] Support multiple LLM providers (fallback chain)

## Related Issues

- E76.1 - Context pack schema definition
- E76.2 - LLM/MCP integration
- E76.3 - Diagnosis queue management
- E76.5 - Result validation and safety checks

## Testing

### Manual Testing

1. **Create run:**
   ```bash
   curl -X POST http://localhost:3000/api/diagnosis-runs \
     -H "Content-Type: application/json" \
     -d '{"assessmentId":"<id>","correlationId":"test-1"}'
   ```

2. **Execute run:**
   ```bash
   curl -X POST http://localhost:3000/api/diagnosis-runs/<runId>/process
   ```

3. **Check status:**
   ```bash
   curl http://localhost:3000/api/diagnosis-runs/<runId>
   ```

### Automated Testing

Run guardrails verification:
```bash
npm run verify:e76-4
```

Expected output:
```
========================================
E76.4 Diagnosis Runs Guardrails Verification
========================================

🔍 Checking R-E76-001: diagnosis_runs table schema...
✅ R-E76-001: diagnosis_runs table schema verified

🔍 Checking R-E76-002: RLS policies...
✅ R-E76-002: RLS policies verified

🔍 Checking R-E76-003: Unique constraint...
✅ R-E76-003: Unique constraint verified

🔍 Checking R-E76-004: Status index...
✅ R-E76-004: Status index verified

🔍 Checking R-E76-005: Literal callsites...
✅ R-E76-005: Literal callsites verified

🔍 Checking R-E76-006: Error codes...
✅ R-E76-006: Error codes verified

========================================
✅ All E76.4 guardrails verified
========================================
```

## Deployment Checklist

- [x] Database migration created and tested
- [x] Worker implementation complete
- [x] API endpoints implemented
- [x] Literal callsites added
- [x] Guardrails verification script created
- [x] Documentation updated
- [x] RULES_VS_CHECKS_MATRIX.md updated
- [x] package.json verify script added
- [ ] Environment variables set (ANTHROPIC_API_KEY)
- [ ] Migration applied to production
- [ ] Monitoring/alerting configured
- [ ] Performance testing completed

## Notes

- LLM calls require `ANTHROPIC_API_KEY` environment variable
- Default model: `claude-sonnet-4-5-20250929`
- Max retries: 3 attempts
- Schema version: `v1`
- Worker designed for manual/API triggering (no automatic queue processing yet)

---

**Implementation:** Complete ✅  
**Verification:** Passing ✅  
**Documentation:** Complete ✅
