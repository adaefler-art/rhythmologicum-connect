# Artifact Schema V1

**Version:** 1.0  
**Status:** Active  
**Epic:** E76 — MCP Integration  
**Last Updated:** 2026-02-04

---

## Overview

This document defines the canonical schema for all artifacts produced by the MCP (Model Context Protocol) server and related diagnostic tools. All inputs and outputs MUST conform to these schemas for type safety and validation.

**Validation:** All schemas use [Zod](https://zod.dev/) for runtime validation  
**Location:** `packages/mcp-server/src/tools.ts`

---

## Core Concepts

### Artifact Types

1. **Tool Inputs** - Parameters required to execute a tool
2. **Tool Outputs** - Results returned by a tool
3. **Version Metadata** - Versioning information for traceability
4. **Error Responses** - Structured error information

### Validation Strategy

- **Input Validation:** ALWAYS validate before processing
- **Output Validation:** ALWAYS validate before returning
- **Fail Fast:** Reject invalid data immediately with clear error messages
- **Type Safety:** Use TypeScript types inferred from Zod schemas

---

## Common Types

### UUID Schema

```typescript
import { z } from 'zod'

export const UUIDSchema = z.string().uuid()
```

**Example:**
```json
"123e4567-e89b-12d3-a456-426614174000"
```

**Validation:**
- Must be valid UUID v4 format
- Lowercase preferred but not enforced
- No braces/hyphens variations

---

### Timestamp Schema

```typescript
export const TimestampSchema = z.string().datetime()
```

**Example:**
```json
"2026-02-04T19:00:00.000Z"
```

**Format:**
- ISO 8601 format
- UTC timezone (Z suffix)
- Millisecond precision

---

### Version Metadata Schema

```typescript
export const VersionMetadataSchema = z.object({
  mcp_server_version: z.string(),
  run_version: z.string(),
  prompt_version: z.string(),
  timestamp: TimestampSchema,
})

export type VersionMetadata = z.infer<typeof VersionMetadataSchema>
```

**Example:**
```json
{
  "mcp_server_version": "0.1.0",
  "run_version": "run_1707069600000_abc123",
  "prompt_version": "v1",
  "timestamp": "2026-02-04T19:00:00.000Z"
}
```

**Fields:**
- `mcp_server_version`: Semantic version of MCP server package
- `run_version`: Unique identifier for this execution (timestamp + hash)
- `prompt_version`: Version of AI prompt template used
- `timestamp`: When this version metadata was generated

---

## Tool: get_patient_context

### Input Schema

```typescript
export const GetPatientContextInputSchema = z.object({
  patient_id: UUIDSchema,
})

export type GetPatientContextInput = z.infer<typeof GetPatientContextInputSchema>
```

**Example:**
```json
{
  "patient_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Validation Rules:**
- `patient_id`: REQUIRED, must be valid UUID
- No additional properties allowed (strict mode)

---

### Output Schema

```typescript
export const GetPatientContextOutputSchema = z.object({
  patient_id: UUIDSchema,
  demographics: z.object({
    age: z.number().int().nonnegative().optional(),
    gender: z.string().optional(),
  }),
  recent_assessments: z.array(
    z.object({
      assessment_id: UUIDSchema,
      funnel_slug: z.string(),
      completed_at: TimestampSchema,
      status: z.string(),
    })
  ),
  active_diagnoses: z.array(z.string()),
  metadata: z.object({
    retrieved_at: TimestampSchema,
    context_version: z.string(),
  }),
})

export type GetPatientContextOutput = z.infer<typeof GetPatientContextOutputSchema>
```

**Example:**
```json
{
  "patient_id": "123e4567-e89b-12d3-a456-426614174000",
  "demographics": {
    "age": 45,
    "gender": "female"
  },
  "recent_assessments": [
    {
      "assessment_id": "abc-123-def-456",
      "funnel_slug": "stress-assessment",
      "completed_at": "2026-02-01T10:00:00.000Z",
      "status": "completed"
    }
  ],
  "active_diagnoses": [
    "Generalized Anxiety Disorder (GAD)",
    "Chronic Stress"
  ],
  "metadata": {
    "retrieved_at": "2026-02-04T19:00:00.000Z",
    "context_version": "v1"
  }
}
```

**Field Descriptions:**

- `patient_id`: UUID of the patient (must match input)
- `demographics`: Optional demographic information
  - `age`: Patient age in years (0+)
  - `gender`: Patient gender (free text, no enum)
- `recent_assessments`: Array of recent completed assessments
  - `assessment_id`: UUID of assessment
  - `funnel_slug`: Slug identifier for funnel type
  - `completed_at`: When assessment was completed
  - `status`: Assessment status (e.g., "completed", "in_progress")
- `active_diagnoses`: Array of current diagnosis strings
- `metadata`: Metadata about this context retrieval
  - `retrieved_at`: When this data was fetched
  - `context_version`: Schema version identifier

**Stub Behavior (E76.1):**
- Demographics: Empty object `{}`
- Recent assessments: Empty array `[]`
- Active diagnoses: Empty array `[]`
- Metadata: `context_version` = `"stub"`

---

## Tool: run_diagnosis

### Input Schema

```typescript
export const RunDiagnosisInputSchema = z.object({
  patient_id: UUIDSchema,
  options: z
    .object({
      assessment_id: UUIDSchema.optional(),
      include_history: z.boolean().optional(),
      max_history_depth: z.number().int().positive().optional(),
    })
    .optional(),
})

export type RunDiagnosisInput = z.infer<typeof RunDiagnosisInputSchema>
```

**Example:**
```json
{
  "patient_id": "123e4567-e89b-12d3-a456-426614174000",
  "options": {
    "assessment_id": "abc-123-def-456",
    "include_history": true,
    "max_history_depth": 5
  }
}
```

**Validation Rules:**
- `patient_id`: REQUIRED, must be valid UUID
- `options`: OPTIONAL object
  - `assessment_id`: OPTIONAL UUID, specific assessment to analyze
  - `include_history`: OPTIONAL boolean, whether to include historical assessments
  - `max_history_depth`: OPTIONAL positive integer, max number of historical assessments to include (default: 3)

---

### Output Schema

```typescript
export const RunDiagnosisOutputSchema = z.object({
  run_id: z.string(),
  patient_id: UUIDSchema,
  diagnosis_result: z.object({
    primary_findings: z.array(z.string()),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    recommendations: z.array(z.string()),
    confidence_score: z.number().min(0).max(1),
  }),
  metadata: z.object({
    run_version: z.string(),
    prompt_version: z.string(),
    executed_at: TimestampSchema,
    processing_time_ms: z.number().nonnegative(),
  }),
})

export type RunDiagnosisOutput = z.infer<typeof RunDiagnosisOutputSchema>
```

**Example:**
```json
{
  "run_id": "run_1707069600000_abc123",
  "patient_id": "123e4567-e89b-12d3-a456-426614174000",
  "diagnosis_result": {
    "primary_findings": [
      "Elevated stress levels detected across multiple assessments",
      "Sleep quality degradation over past 2 months",
      "Anxiety symptoms present in recent evaluations"
    ],
    "risk_level": "medium",
    "recommendations": [
      "Consider cognitive behavioral therapy (CBT) for stress management",
      "Evaluate sleep hygiene practices",
      "Follow-up assessment recommended in 2 weeks"
    ],
    "confidence_score": 0.75
  },
  "metadata": {
    "run_version": "run_1707069600000_abc123",
    "prompt_version": "v1",
    "executed_at": "2026-02-04T19:00:00.000Z",
    "processing_time_ms": 3450
  }
}
```

**Field Descriptions:**

- `run_id`: Unique identifier for this diagnostic run (correlation ID)
- `patient_id`: UUID of patient (must match input)
- `diagnosis_result`: AI-generated diagnostic analysis
  - `primary_findings`: Array of key clinical findings (human-readable strings)
  - `risk_level`: Overall risk assessment (enum: low, medium, high, critical)
  - `recommendations`: Array of recommended actions/interventions
  - `confidence_score`: AI confidence (0.0 = no confidence, 1.0 = highest confidence)
- `metadata`: Execution metadata
  - `run_version`: Unique run identifier (for audit trail)
  - `prompt_version`: Version of AI prompt used
  - `executed_at`: Timestamp when diagnosis was executed
  - `processing_time_ms`: How long the diagnosis took (milliseconds)

**Stub Behavior (E76.1):**
- Primary findings: Single item `["[Stub] No real diagnosis performed yet"]`
- Risk level: Always `"low"`
- Recommendations: Single item `["[Stub] Real recommendations will be provided in future version"]`
- Confidence score: Always `0.0`
- Processing time: Simulated random value 100-500ms

---

## Error Response Schema

```typescript
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    rule_id: z.string().optional(),
  }),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
```

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid patient_id: must be a valid UUID",
    "details": {
      "field": "patient_id",
      "received": "not-a-uuid",
      "expected": "UUID v4 format"
    },
    "rule_id": "R-E76.9-002"
  }
}
```

**Error Codes:**

See TROUBLESHOOTING.md for complete error code reference:
- `VALIDATION_ERROR` - Input validation failed
- `LLM_ERROR` - LLM API error
- `AUTH_ERROR` - Authentication/authorization error
- `NOT_FOUND_ERROR` - Resource not found
- `INTERNAL_ERROR` - Unexpected server error

**Fields:**
- `success`: Always `false` for errors
- `error.code`: Machine-readable error code (uppercase snake_case)
- `error.message`: Human-readable error message
- `error.details`: OPTIONAL additional context (arbitrary JSON)
- `error.rule_id`: OPTIONAL guardrail rule that was violated (format: R-{DOMAIN}-{NUMBER})

---

## Success Response Schema

```typescript
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    version: VersionMetadataSchema,
  })

export type SuccessResponse<T> = {
  success: true
  data: T
  version: VersionMetadata
}
```

**Example (get_patient_context):**
```json
{
  "success": true,
  "data": {
    "patient_id": "123e4567-e89b-12d3-a456-426614174000",
    "demographics": { ... },
    "recent_assessments": [ ... ],
    "active_diagnoses": [ ... ],
    "metadata": { ... }
  },
  "version": {
    "mcp_server_version": "0.1.0",
    "run_version": "run_1707069600000_abc123",
    "prompt_version": "v1",
    "timestamp": "2026-02-04T19:00:00.000Z"
  }
}
```

---

## Validation Examples

### Input Validation (TypeScript)

```typescript
import { GetPatientContextInputSchema } from './tools'

// Valid input
const validInput = { patient_id: '123e4567-e89b-12d3-a456-426614174000' }
const result = GetPatientContextInputSchema.safeParse(validInput)

if (result.success) {
  console.log('Valid input:', result.data)
} else {
  console.error('Validation failed:', result.error.errors)
}

// Invalid input (not a UUID)
const invalidInput = { patient_id: 'not-a-uuid' }
const result2 = GetPatientContextInputSchema.safeParse(invalidInput)
// result2.success === false
// result2.error.errors[0].message === "Invalid uuid"
```

### Output Validation (TypeScript)

```typescript
import { GetPatientContextOutputSchema } from './tools'

const output = {
  patient_id: '123e4567-e89b-12d3-a456-426614174000',
  demographics: {},
  recent_assessments: [],
  active_diagnoses: [],
  metadata: {
    retrieved_at: new Date().toISOString(),
    context_version: 'v1',
  },
}

// Validate before returning
const validated = GetPatientContextOutputSchema.parse(output)
// Throws ZodError if invalid

return {
  success: true,
  data: validated,
  version: getVersionMetadata(),
}
```

---

## Schema Versioning

### Version Migration Strategy

When schemas change:

1. **Minor Changes (backward compatible):**
   - Add optional fields
   - Relax constraints
   - Update `context_version` in metadata

2. **Major Changes (breaking):**
   - Create new schema file (e.g., `ARTIFACT_SCHEMA_V2.md`)
   - Maintain old version for 1 release cycle
   - Update `prompt_version` in version metadata
   - Add version negotiation to API

### Version Indicators

- **mcp_server_version:** Package version (semantic versioning)
- **prompt_version:** AI prompt template version (v1, v2, etc.)
- **context_version:** Schema version for specific artifact (v1, v2, etc.)

---

## Testing

### Schema Validation Tests

**Location:** `packages/mcp-server/__tests__/tools.test.ts`

**Test Cases:**
- Valid inputs pass validation
- Invalid UUIDs rejected
- Missing required fields rejected
- Extra fields rejected (strict mode)
- Type mismatches rejected
- Boundary values handled correctly

### Example Test

```typescript
import { describe, it, expect } from 'jest'
import { GetPatientContextInputSchema } from '../src/tools'

describe('GetPatientContextInputSchema', () => {
  it('accepts valid UUID patient_id', () => {
    const input = { patient_id: '123e4567-e89b-12d3-a456-426614174000' }
    const result = GetPatientContextInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects invalid UUID', () => {
    const input = { patient_id: 'not-a-uuid' }
    const result = GetPatientContextInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing patient_id', () => {
    const input = {}
    const result = GetPatientContextInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
```

---

## References

- **Zod Documentation:** https://zod.dev/
- **MCP Tools Implementation:** `packages/mcp-server/src/tools.ts`
- **Troubleshooting Guide:** `docs/runbooks/TROUBLESHOOTING.md`
- **Security Model:** `docs/runbooks/SECURITY_MODEL.md`
- **MCP Server Runbook:** `docs/runbooks/MCP_SERVER.md`

---

**Schema Version:** 1.0  
**Author:** GitHub Copilot  
**Epic:** E76.9 — Docs & Developer Runbook
