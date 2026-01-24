# Patient API Contract Schemas - E6.2.3

## Overview

This document describes the versioned contract schemas for patient-facing assessment endpoints, implemented as part of E6.2.3, and extended with Patient State API in I2.1.

## Purpose

The contract schemas provide:

1. **Explicit Type Safety**: All request and response types are defined using Zod schemas
2. **Runtime Validation**: Requests are validated at runtime to ensure data integrity
3. **Version Markers**: All responses include a `schemaVersion` field for iOS compatibility
4. **Exportable Schemas**: Schemas can be exported and used by iOS clients for consistent validation

## Location

Contract schemas are located in:
- `lib/api/contracts/patient/assessments.ts` - Assessment endpoint contracts
- `lib/api/contracts/patient/dashboard.ts` - Dashboard endpoint contracts (E6.5.2)
- `lib/api/contracts/patient/state.ts` - Patient State endpoint contracts (I2.1)
- `lib/api/contracts/patient/index.ts` - Central export point

## Schema Versions

- **Assessments**: `v1`
- **Dashboard**: `v1`
- **Patient State**: `v1`

The schema version constants should be incremented when making breaking changes to request/response structure.

## Covered Endpoints

### Patient State API (I2.1)

#### 1. Get Patient State
**GET** `/api/patient/state`

- **Request**: No body required
- **Response**: Patient state with all sections (assessment, results, dialog, activity, metrics)
- **Schema**: `PatientStateResponseSchema`
- **Empty State**: Returns default/empty state if none exists (lazy initialization)

#### 2. Update Patient State
**POST** `/api/patient/state`

- **Request**: Partial state update (only include fields to update)
- **Request Validation**: `PatientStateUpdateRequestSchema`
- **Response**: Updated patient state
- **Schema**: `PatientStateUpdateResponseSchema`
- **Behavior**: Upsert (creates if doesn't exist, updates if exists)

**Documentation**: See [I2_1_PATIENT_STATE_API.md](./I2_1_PATIENT_STATE_API.md) for detailed usage.

### Assessment API (E6.2.3)

### 1. Start Assessment
**POST** `/api/funnels/{slug}/assessments`

- **Request**: No body required
- **Response**: Assessment ID, status, and current step information
- **Schema**: `StartAssessmentResponseSchema`

### 2. Resume Assessment
**GET** `/api/funnels/{slug}/assessments/{assessmentId}`

- **Request**: No body required
- **Response**: Assessment status, current step, progress (completed/total steps)
- **Schema**: `ResumeAssessmentResponseSchema`

### 3. Save Answer
**POST** `/api/funnels/{slug}/assessments/{assessmentId}/answers/save`

- **Request**: `{ stepId, questionId, answerValue }`
- **Request Validation**: `SaveAnswerRequestSchema`
- **Response**: Saved answer details
- **Schema**: `SaveAnswerResponseSchema`

### 4. Complete Assessment
**POST** `/api/funnels/{slug}/assessments/{assessmentId}/complete`

- **Request**: No body required
- **Response**: Assessment ID and completion status
- **Schema**: `CompleteAssessmentResponseSchema`

### 5. Get Result
**GET** `/api/funnels/{slug}/assessments/{assessmentId}/result`

- **Request**: No body required
- **Response**: Assessment details, completion time, funnel information
- **Schema**: `GetResultResponseSchema`

## Response Format

All successful responses follow this structure:

```typescript
{
  success: true,
  data: { /* endpoint-specific data */ },
  schemaVersion: "v1"
}
```

All error responses follow this structure:

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: Record<string, unknown>
  },
  schemaVersion: "v1"
}
```

## Usage Examples

### Validating Request Data

```typescript
import { SaveAnswerRequestSchema } from '@/lib/api/contracts/patient'

// In an API route handler
const body = await request.json()
const validationResult = SaveAnswerRequestSchema.safeParse(body)

if (!validationResult.success) {
  return invalidInputResponse('Invalid request data')
}

const { stepId, questionId, answerValue } = validationResult.data
```

### Creating Versioned Responses

```typescript
import { versionedSuccessResponse } from '@/lib/api/responses'
import { 
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type StartAssessmentResponseData 
} from '@/lib/api/contracts/patient'

// Prepare response data
const responseData: StartAssessmentResponseData = {
  assessmentId: assessment.id,
  status: assessment.status,
  currentStep: { /* ... */ }
}

// Return versioned response
return versionedSuccessResponse(
  responseData,
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  201
)
```

### Type-Safe Response Handling (Client)

```typescript
import { safeValidateStartAssessmentResponse } from '@/lib/api/contracts/patient'

const response = await fetch('/api/funnels/stress/assessments', { method: 'POST' })
const data = await response.json()

// Validate response matches schema
const validatedData = safeValidateStartAssessmentResponse(data)

if (validatedData) {
  // TypeScript knows the exact shape of validatedData
  console.log(validatedData.data.assessmentId) // ✅ Type-safe
  console.log(validatedData.schemaVersion)      // ✅ Always "v1"
}
```

## Helper Functions

Each schema has corresponding helper functions:

- `validate*()` - Throws if validation fails
- `safeValidate*()` - Returns `null` if validation fails

Example:
- `validateStartAssessmentResponse(data)` - Throws on invalid data
- `safeValidateStartAssessmentResponse(data)` - Returns `null` on invalid data

## Design Decisions

### Why lenient stepId validation?

The `SaveAnswerRequestSchema` validates `stepId` as a string (not strict UUID) to allow downstream validation to provide more specific error codes:
- Invalid format → 400 Bad Request
- Valid format but not found → 404 Not Found
- Valid format but unauthorized → 403 Forbidden

This maintains backwards compatibility with existing error handling logic.

### Why string type instead of enum?

The `CurrentStepSchema` uses `type: z.string()` instead of a strict enum to accommodate the database's flexible step type values. Step types are validated at the database level.

## Testing

All contract schemas have comprehensive test coverage in `lib/api/contracts/patient/__tests__/assessments.test.ts`:

- Schema validation (valid and invalid inputs)
- Version marker enforcement
- Helper function behavior
- Edge cases (null values, optional fields, etc.)

Run tests:
```bash
npm test -- lib/api/contracts/patient/__tests__/assessments.test.ts
```

## Future Enhancements

When adding new patient endpoints:

1. Define schemas in `lib/api/contracts/patient/assessments.ts` (or new file)
2. Export from `lib/api/contracts/patient/index.ts`
3. Add comprehensive tests
4. Use `versionedSuccessResponse()` in route handlers
5. Validate requests with schema `.safeParse()` where applicable

When making breaking changes:
1. Increment `PATIENT_ASSESSMENT_SCHEMA_VERSION` (e.g., "v1" → "v2")
2. Update all response schemas to use new version
3. Update tests to verify new version
4. Document migration guide for iOS clients
