# E76.4 — Rules vs. Checks Matrix

**Purpose:** Ensure every rule has a check and every check maps to a rule (bidirectional traceability).

**Status:** ✅ Complete  
**Last Updated:** 2026-02-03

---

## Matrix Overview

| Rule ID | Rule Description | Check Type | Check Location | Status | Notes |
|---------|-----------------|------------|----------------|--------|-------|
| R-E76.4-1 | Worker endpoint must have at least one in-repo literal callsite | Code Search | DiagnosisRunsPanel.tsx | ✅ | fetch('/api/studio/diagnosis-runs/${runId}/execute') |
| R-E76.4-2 | Worker endpoint must validate run status is 'queued' before execution | Code Review | route.ts | ✅ | Checks run.status !== 'queued' |
| R-E76.4-3 | Worker endpoint must transition run to 'running' status | Code Review | route.ts | ✅ | Sets status: 'running' with started_at |
| R-E76.4-4 | Worker must use concurrency protection (queued status check in UPDATE) | Code Review | route.ts | ✅ | .eq('status', 'queued') in UPDATE |
| R-E76.4-5 | Worker must fetch patient context pack | Code Review | route.ts | ✅ | Calls buildPatientContextPack() |
| R-E76.4-6 | Worker must call LLM/MCP for diagnosis | Code Review | route.ts | ✅ | Uses Anthropic SDK |
| R-E76.4-7 | Worker must validate diagnosis JSON schema | Code Review | route.ts | ✅ | validateDiagnosisResult() function |
| R-E76.4-8 | Worker must persist artifact on success | Code Review | route.ts | ✅ | Inserts into diagnosis_artifacts table |
| R-E76.4-9 | Worker must link artifact to run | Code Review | route.ts | ✅ | Inserts into diagnosis_run_artifacts table |
| R-E76.4-10 | Worker must set run status to 'succeeded' on success | Code Review | route.ts | ✅ | Sets status: 'succeeded' with completed_at |
| R-E76.4-11 | Worker must set run status to 'failed' on error | Code Review | route.ts | ✅ | Sets status: 'failed' with error_info |
| R-E76.4-12 | Invalid diagnosis result must return VALIDATION_ERROR | Code Review | route.ts | ✅ | error_code: 'VALIDATION_ERROR' |
| R-E76.4-13 | Feature must be behind feature flag | Code Review | featureFlags.ts + .env.example | ✅ | DIAGNOSIS_WORKER_ENABLED (default: false) |
| R-E76.4-14 | Worker endpoint must enforce clinician/admin role | Code Review | route.ts | ✅ | hasAdminOrClinicianRole() called |
| R-E76.4-15 | Worker endpoint must validate UUID format | Code Review | route.ts | ✅ | UUID regex validation |
| R-E76.4-16 | Worker endpoint must use standardized error responses | Code Review | route.ts | ✅ | Uses lib/api/responses helpers |
| R-E76.4-17 | Worker endpoint must log errors with requestId | Code Review | route.ts | ✅ | logError() called with requestId |
| R-E76.4-18 | Endpoint must have @endpoint-intent annotation | Code Review | route.ts | ✅ | @endpoint-intent studio:diagnosis-worker |
| R-E76.4-19 | Verification script must exist and pass | CI Script | verify-e76-4-worker.mjs | ✅ | npm run verify:e76-4 |
| R-E76.4-20 | Rules vs. Checks Matrix must exist | CI Script | This file | ✅ | E76_4_RULES_VS_CHECKS_MATRIX.md |

---

## Detailed Rule → Check Mapping

### R-E76.4-1: Worker Endpoint Must Have Literal Callsite

**Rule:**
Worker endpoint must have at least one in-repo literal callsite (fetch('/api/...') literal).

**Check Implementation:**
- **Type:** Code Search
- **Location:** `apps/rhythm-studio-ui/components/studio/DiagnosisRunsPanel.tsx`

**Evidence:**
```typescript
// E76.4: POST /api/studio/diagnosis-runs/{runId}/execute
const executeRun = async (runId: string) => {
  const response = await fetch(`/api/studio/diagnosis-runs/${runId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  // ...
}
```

**Status:** ✅ Pass - Literal callsite found

---

### R-E76.4-2: Validate Run Status is Queued

**Rule:**
Worker endpoint must validate that run status is 'queued' before execution.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~165

**Evidence:**
```typescript
// Concurrency protection: Only 'queued' runs can be executed
if (run.status !== 'queued') {
  return withRequestId(
    conflictResponse(
      `Run is not in 'queued' status (current: ${run.status})`,
      undefined,
      requestId
    ),
    requestId
  )
}
```

**Status:** ✅ Pass - Status validation implemented

---

### R-E76.4-3: Transition Run to Running Status

**Rule:**
Worker endpoint must transition run to 'running' status when execution begins.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~175

**Evidence:**
```typescript
// Transition to 'running' status
const { error: runningError } = await supabase
  .from('diagnosis_runs')
  .update({
    status: 'running',
    started_at: new Date().toISOString(),
  })
  .eq('id', runId)
  .eq('status', 'queued') // Additional concurrency check
```

**Status:** ✅ Pass - Running transition implemented

---

### R-E76.4-4: Concurrency Protection

**Rule:**
Worker must use concurrency protection to prevent double execution.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~180

**Evidence:**
```typescript
.eq('id', runId)
.eq('status', 'queued') // Additional concurrency check
```

**Status:** ✅ Pass - Double-check in UPDATE prevents race conditions

---

### R-E76.4-5: Fetch Patient Context Pack

**Rule:**
Worker must fetch patient context pack before calling LLM.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~200

**Evidence:**
```typescript
// Step 1: Build patient context pack
const adminSupabase = createAdminSupabaseClient()
const contextPack = await buildPatientContextPack(adminSupabase, run.patient_id)
```

**Status:** ✅ Pass - Context pack builder called

---

### R-E76.4-6: Call LLM/MCP for Diagnosis

**Rule:**
Worker must call LLM/MCP to generate diagnosis.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~205-250

**Evidence:**
```typescript
// Step 2: Call LLM for diagnosis
const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
})

const response = await anthropic.messages.create({
  model,
  max_tokens: 2048,
  messages: [
    {
      role: 'user',
      content: userPrompt,
    },
  ],
  system: systemPrompt,
})
```

**Status:** ✅ Pass - LLM call implemented with Anthropic SDK

---

### R-E76.4-7: Validate Diagnosis JSON Schema

**Rule:**
Worker must validate diagnosis JSON schema before persisting.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~40-95, ~270

**Evidence:**
```typescript
function validateDiagnosisResult(data: unknown): { valid: boolean; errors?: string[] } {
  const errors: string[] = []
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Diagnosis result must be an object'] }
  }
  
  const diagnosis = data as Record<string, unknown>
  
  // Required fields
  if (!diagnosis.summary || typeof diagnosis.summary !== 'string') {
    errors.push('summary is required and must be a string')
  }
  // ... more validation
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

// Usage:
const validation = validateDiagnosisResult(diagnosisResult)
if (!validation.valid) {
  errorInfo = {
    error_code: 'VALIDATION_ERROR',
    message: 'Invalid diagnosis schema',
    validation_errors: validation.errors,
    raw_response: textContent.text,
  }
  // Set run to failed...
}
```

**Status:** ✅ Pass - Schema validation implemented

---

### R-E76.4-8: Persist Artifact on Success

**Rule:**
Worker must persist diagnosis artifact on successful execution.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~290-300

**Evidence:**
```typescript
// Step 4: Persist artifact
const { data: artifact, error: artifactError } = await supabase
  .from('diagnosis_artifacts')
  .insert({
    organization_id: run.organization_id,
    artifact_type: 'diagnosis_report',
    artifact_name: `Diagnosis Report for Run ${runId}`,
    artifact_data: diagnosisResult,
  })
  .select()
  .single()
```

**Status:** ✅ Pass - Artifact persistence implemented

---

### R-E76.4-9: Link Artifact to Run

**Rule:**
Worker must link created artifact to the run.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~305-315

**Evidence:**
```typescript
// Link artifact to run
const { error: linkError } = await supabase.from('diagnosis_run_artifacts').insert({
  run_id: runId,
  artifact_id: artifact.id,
  sequence_order: 0,
})
```

**Status:** ✅ Pass - Artifact linking implemented

---

### R-E76.4-10: Set Status to Succeeded on Success

**Rule:**
Worker must set run status to 'succeeded' when execution completes successfully.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~320-335

**Evidence:**
```typescript
// Step 5: Mark run as succeeded
const { error: successError } = await supabase
  .from('diagnosis_runs')
  .update({
    status: 'succeeded',
    output_data: {
      artifact_id: artifact.id,
      diagnosis: diagnosisResult,
      context_hash: contextPack.metadata.inputs_hash,
    },
    completed_at: new Date().toISOString(),
  })
  .eq('id', runId)
```

**Status:** ✅ Pass - Success status transition implemented

---

### R-E76.4-11: Set Status to Failed on Error

**Rule:**
Worker must set run status to 'failed' with error_info when execution fails.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~350-370

**Evidence:**
```typescript
catch (error) {
  // Handle any errors during execution
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  errorInfo = {
    error_code: 'EXECUTION_ERROR',
    message: errorMessage,
    timestamp: new Date().toISOString(),
  }

  // Set run to failed with error info
  await supabase
    .from('diagnosis_runs')
    .update({
      status: 'failed',
      error_info: errorInfo,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)
```

**Status:** ✅ Pass - Error handling with failed status implemented

---

### R-E76.4-12: Invalid Diagnosis Returns VALIDATION_ERROR

**Rule:**
Invalid diagnosis result must return VALIDATION_ERROR error code.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~275-285

**Evidence:**
```typescript
if (!validation.valid) {
  errorInfo = {
    error_code: 'VALIDATION_ERROR',
    message: 'Invalid diagnosis schema',
    validation_errors: validation.errors,
    raw_response: textContent.text,
  }
  
  // Set run to failed with validation error
  await supabase
    .from('diagnosis_runs')
    .update({
      status: 'failed',
      error_info: errorInfo,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)
```

**Status:** ✅ Pass - VALIDATION_ERROR implemented

---

### R-E76.4-13: Feature Behind Feature Flag

**Rule:**
Feature must be behind feature flag for controlled rollout.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `lib/featureFlags.ts` + `.env.example`

**Evidence:**
```typescript
// lib/featureFlags.ts
export type FeatureFlags = {
  // ...
  DIAGNOSIS_WORKER_ENABLED: boolean
}

export const featureFlags: FeatureFlags = {
  // ...
  DIAGNOSIS_WORKER_ENABLED: resolveFlag(
    env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_WORKER_ENABLED,
    false, // Default: disabled
  ),
}
```

**Status:** ✅ Pass - Feature flag implemented (default: false)

---

### R-E76.4-14: Enforce Clinician/Admin Role

**Rule:**
Worker endpoint must enforce clinician/admin role authorization.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~130-135

**Evidence:**
```typescript
// Authorization gate (clinician/admin only)
const isAuthorized = await hasAdminOrClinicianRole()
if (!isAuthorized) {
  return withRequestId(forbiddenResponse(undefined, requestId), requestId)
}
```

**Status:** ✅ Pass - Role check implemented

---

### R-E76.4-15: Validate UUID Format

**Rule:**
Worker endpoint must validate runId is valid UUID format.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` line ~115-120

**Evidence:**
```typescript
// Validate runId format (UUID)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!uuidRegex.test(runId)) {
  return withRequestId(
    validationErrorResponse('Invalid run ID format', undefined, requestId),
    requestId
  )
}
```

**Status:** ✅ Pass - UUID validation implemented

---

### R-E76.4-16: Standardized Error Responses

**Rule:**
Worker endpoint must use standardized error responses from lib/api/responses.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` (imports and usage)

**Evidence:**
```typescript
import {
  successResponse,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
  databaseErrorResponse,
  conflictResponse,
} from '@/lib/api/responses'
```

**Status:** ✅ Pass - Standardized responses used throughout

---

### R-E76.4-17: Log Errors with RequestId

**Rule:**
Worker endpoint must log errors with requestId for correlation.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` (error handling blocks)

**Evidence:**
```typescript
logError({
  requestId,
  operation: 'execute_diagnosis_run',
  userId: user.id,
  error: sanitizeSupabaseError(error),
})
```

**Status:** ✅ Pass - Error logging with requestId implemented

---

### R-E76.4-18: Endpoint Intent Annotation

**Rule:**
Endpoint must have @endpoint-intent annotation for documentation.

**Check Implementation:**
- **Type:** Code Review
- **Location:** `route.ts` header comment

**Evidence:**
```typescript
/**
 * E76.4 API Endpoint: Execute a diagnosis run
 * POST /api/studio/diagnosis-runs/{runId}/execute
 * 
 * @endpoint-intent studio:diagnosis-worker Execute queued diagnosis runs
 */
```

**Status:** ✅ Pass - Intent annotation present

---

### R-E76.4-19: Verification Script Exists

**Rule:**
Verification script must exist and pass all checks.

**Check Implementation:**
- **Type:** CI Script
- **Location:** `scripts/ci/verify-e76-4-worker.mjs`

**Evidence:**
```bash
npm run verify:e76-4
```

**Status:** ✅ Pass - Script implemented in package.json

---

### R-E76.4-20: Rules vs. Checks Matrix Exists

**Rule:**
Rules vs. Checks Matrix must exist for bidirectional traceability.

**Check Implementation:**
- **Type:** CI Script
- **Location:** This file (`docs/e7/E76_4_RULES_VS_CHECKS_MATRIX.md`)

**Status:** ✅ Pass - Matrix document complete

---

## Diff Report

### Rules Without Checks
**Count:** 0

*All rules have corresponding checks.*

---

### Checks Without Rules
**Count:** 0

*All checks map to defined rules.*

---

### Coverage Summary

- **Total Rules:** 20
- **Rules with Checks:** 20
- **Coverage:** 100%
- **Check Types:**
  - Code Review: 17
  - Code Search: 1
  - CI Script: 2

---

## Implementation Notes

### Concurrency Protection Strategy
The worker uses a two-level concurrency protection:
1. **Read check:** Validates status is 'queued' before attempting execution
2. **Write check:** UPDATE query includes `.eq('status', 'queued')` to prevent race conditions

This ensures that even if two workers attempt to execute the same run simultaneously, only one will succeed.

### Error Handling Strategy
The worker uses a try-catch-finally pattern:
- **Inner try-catch:** Handles execution errors (context pack, LLM call, validation, persistence)
- **Outer try-catch:** Handles unexpected errors (database failures, auth issues)
- **Both levels:** Set run status to 'failed' with appropriate error_info

### Validation Strategy
Diagnosis results are validated using a dedicated `validateDiagnosisResult()` function that:
- Validates required fields (summary, findings, recommendations)
- Validates optional fields (risk_level, confidence_score)
- Returns structured error messages for debugging
- Causes run to fail with VALIDATION_ERROR if invalid

### Artifact Strategy
Artifacts are:
1. Created in `diagnosis_artifacts` table (reusable across runs)
2. Linked to run via `diagnosis_run_artifacts` junction table
3. Stored with `sequence_order` for potential multi-artifact runs
4. Include full diagnosis result in `artifact_data` JSONB field

---

**Last Verified:** 2026-02-03  
**Verification Script:** `npm run verify:e76-4`  
**Status:** ✅ All guardrails satisfied
