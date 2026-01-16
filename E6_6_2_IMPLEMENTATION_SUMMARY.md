# E6.6.2 — TriageResult v1 Contract Implementation Summary

## Overview

This implementation establishes a stable, testable, governance-ready contract for the AMY triage endpoint using Zod runtime validation. The contract ensures bounded inputs, standardized response structures, and protection against drift in triage logic.

## Problem Statement

Without a hard contract, triage logic could drift over time, leading to:
- Pilot instability
- Inconsistent API responses
- Difficult governance and auditing
- Security vulnerabilities from unbounded inputs

## Solution

Created `TriageRequestV1` and `TriageResultV1` schemas with strict validation rules enforced at runtime using Zod.

## Components Implemented

### 1. Triage Contract Types (`lib/api/contracts/triage/index.ts`)

**Key Features:**
- **TriageRequestV1 Schema:**
  - `inputText`: Bounded 10-800 characters (validated)
  - `locale`: Optional string for i18n
  - `patientContext`: Optional anonymized context (age range buckets, no PHI)

- **TriageResultV1 Schema:**
  - `tier`: Enum - `INFO | ASSESSMENT | ESCALATE`
  - `nextAction`: Enum - `SHOW_CONTENT | START_FUNNEL_A | START_FUNNEL_B | RESUME_FUNNEL | SHOW_ESCALATION`
  - `redFlags`: Array from allowlist only (`report_risk_level`, `workup_check`, `answer_pattern`)
  - `rationale`: Hard-bounded to ≤280 chars OR bullet list with max 3 items
  - `confidenceBand`: Optional AI confidence metadata
  - `version`: Always `'v1'` for this schema version
  - `correlationId`: Optional for request tracing

**Constants:**
```typescript
TRIAGE_INPUT_MIN_LENGTH = 10
TRIAGE_INPUT_MAX_LENGTH = 800
TRIAGE_RATIONALE_MAX_LENGTH = 280
TRIAGE_RATIONALE_MAX_BULLETS = 3
RED_FLAG_ALLOWLIST = ['report_risk_level', 'workup_check', 'answer_pattern']
```

**Helper Functions:**
- `validateTriageRequest()` / `safeValidateTriageRequest()` - Runtime validation with Zod
- `validateTriageResult()` / `safeValidateTriageResult()` - Runtime validation with Zod
- `sanitizeRedFlags()` - AC3: Filters unknown red flags to allowlist only
- `getOversizeErrorStatus()` - AC2: Determines 400 vs 413 status code for oversize inputs
- `boundRationale()` - AC3: Truncates or limits rationale to meet hard bounds

### 2. Contract Tests (`lib/api/contracts/triage/__tests__/index.test.ts`)

**Test Coverage (50 tests, all passing):**

**Request Validation:**
- ✅ Valid minimal request
- ✅ Valid request with all optional fields
- ✅ Reject below minimum length
- ✅ Reject exceeding maximum length
- ✅ Reject missing inputText
- ✅ Accept at exactly min/max boundaries
- ✅ Validate patient context (age ranges)

**Result Validation:**
- ✅ Valid result with all fields
- ✅ Valid result with minimal fields
- ✅ Valid empty redFlags array
- ✅ Reject invalid tier
- ✅ Reject invalid nextAction
- ✅ Reject wrong version
- ✅ Accept redFlags from allowlist
- ✅ Reject redFlags not in allowlist

**Rationale Validation (AC3):**
- ✅ Accept rationale at exactly max length (280 chars)
- ✅ Accept rationale below max length
- ✅ Accept valid bullet list with max bullets (3)
- ✅ Accept valid bullet list with fewer bullets
- ✅ Reject bullet list with more than max bullets (4+)
- ✅ Reject rationale exceeding max length (non-bullet)
- ✅ Accept bullet list with asterisk bullets (*, -, •)

**Helper Functions:**
- ✅ sanitizeRedFlags - keeps allowlist, filters unknown
- ✅ getOversizeErrorStatus - returns 400/413 appropriately
- ✅ boundRationale - truncates or limits bullets
- ✅ validate/safeValidate functions work correctly

**Edge Cases:**
- ✅ Unicode characters in input
- ✅ Special characters in rationale
- ✅ Empty string locale

### 3. API Route Integration (`app/api/amy/triage/route.ts`)

**Changes Made:**

**Request Validation (AC2):**
```typescript
// Validate with TriageRequestV1 schema
const validatedRequest = safeValidateTriageRequest({
  inputText: body.concern || body.inputText,
  locale: body.locale,
  patientContext: body.patientContext,
})

if (!validatedRequest) {
  // Check for oversize error (AC2)
  const oversizeStatus = getOversizeErrorStatus(inputText)
  if (oversizeStatus) {
    return NextResponse.json(
      { success: false, error: { code: '...', message: '...' } },
      { status: oversizeStatus } // 400 or 413
    )
  }
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_FAILED', message: '...' } },
    { status: 400 }
  )
}
```

**Response Transformation (AC3):**
```typescript
// Get legacy AI response
const legacyTriageResult = await performAITriage(validatedRequest.inputText)

// Convert to v1 contract (sanitizes redFlags, bounds rationale)
const triageResultV1 = convertToV1Result(legacyTriageResult, correlationId)

// Return v1 compliant response
return NextResponse.json({
  success: true,
  data: triageResultV1, // TriageResultV1
})
```

**Mapping Functions:**
- `mapLegacyTierToV1()`: Maps `low|moderate|high|urgent` → `INFO|ASSESSMENT|ESCALATE`
- `mapLegacyNextActionToV1()`: Maps `self-help|funnel|escalation|emergency` → v1 actions
- `convertToV1Result()`: Converts legacy response to TriageResultV1 with sanitization

**Error Responses:**
All error responses now follow the contract:
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_FAILED' | 'REQUEST_TOO_LARGE' | 'INTERNAL_ERROR',
    message: 'Human-readable error message'
  }
}
```

## Acceptance Criteria Verification

### AC1: Zod schema validation exists for request+result ✅

**Evidence:**
- `TriageRequestV1Schema` defined with Zod
- `TriageResultV1Schema` defined with Zod
- 50 passing tests covering all validation scenarios
- Runtime validation with `safeParse()` in API route

**Files:**
- `lib/api/contracts/triage/index.ts` (schemas)
- `lib/api/contracts/triage/__tests__/index.test.ts` (tests)

### AC2: Invalid request returns 400; oversize returns 413 or 400 ✅

**Evidence:**
- Request validation rejects invalid inputs with 400
- `getOversizeErrorStatus()` returns:
  - `400` for moderately oversized (801-1600 chars)
  - `413` for very large (1600+ chars)
- API route uses `getOversizeErrorStatus()` to determine status code

**Test Coverage:**
```typescript
it('should return 400 for moderately oversized input')
it('should return 413 for very large input')
```

**Code:**
```typescript
export function getOversizeErrorStatus(inputText: string): 400 | 413 | null {
  if (inputText.length > TRIAGE_INPUT_MAX_LENGTH) {
    return inputText.length > TRIAGE_INPUT_MAX_LENGTH * 2 ? 413 : 400
  }
  return null
}
```

### AC3: rationale hard-bounded; redFlags from allowlist only ✅

**Evidence:**

**Rationale Bounding:**
- Custom Zod refinement validates rationale length
- Max 280 characters OR bullet list with max 3 items
- `boundRationale()` helper truncates or limits bullets
- Used in `convertToV1Result()` before returning response

**RedFlags Allowlist:**
```typescript
export const RED_FLAG_ALLOWLIST = [
  'report_risk_level',
  'workup_check', 
  'answer_pattern',
] as const

export function sanitizeRedFlags(redFlags: string[]): RedFlagType[] {
  return redFlags.filter((flag): flag is RedFlagType =>
    RED_FLAG_ALLOWLIST.includes(flag as RedFlagType)
  )
}
```

**Test Coverage:**
```typescript
it('should filter out unknown red flags')
it('should return empty array when all flags are unknown')
it('should reject bullet list with more than max bullets')
it('should truncate rationale exceeding max length')
```

## API Contract Examples

### Valid Request
```json
{
  "inputText": "Ich fühle mich sehr gestresst und kann nicht schlafen",
  "locale": "de-DE",
  "patientContext": {
    "ageRange": "AGE_31_50"
  }
}
```

### Valid Response
```json
{
  "success": true,
  "data": {
    "tier": "ASSESSMENT",
    "nextAction": "START_FUNNEL_A",
    "redFlags": [],
    "rationale": "Patient reports stress and sleep issues. Stress assessment recommended for detailed evaluation.",
    "version": "v1",
    "correlationId": "corr-abc123"
  }
}
```

### Error Response (Oversize)
```json
{
  "success": false,
  "error": {
    "code": "REQUEST_TOO_LARGE",
    "message": "Input must not exceed 800 characters"
  }
}
```
HTTP Status: 413

### Error Response (Validation)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed. Input must be 10-800 characters."
  }
}
```
HTTP Status: 400

## Testing Strategy

### Unit Tests (50 tests, all passing)
```bash
npm test -- lib/api/contracts/triage/__tests__/index.test.ts
```

**Coverage:**
- Schema validation (request + result)
- Rationale hard-bounding (length + bullet limits)
- RedFlags allowlist filtering
- Oversize error status determination
- Helper functions (validate, sanitize, bound)
- Edge cases (Unicode, special chars)

### Manual Testing
To manually test the API endpoint:

```bash
# Valid request
curl -X POST http://localhost:3000/api/amy/triage \
  -H "Content-Type: application/json" \
  -d '{"concern": "I am feeling stressed"}'

# Oversize request (should return 400 or 413)
curl -X POST http://localhost:3000/api/amy/triage \
  -H "Content-Type: application/json" \
  -d '{"concern": "'$(printf 'x%.0s' {1..2000})'"}'

# Invalid request (too short, should return 400)
curl -X POST http://localhost:3000/api/amy/triage \
  -H "Content-Type: application/json" \
  -d '{"concern": "hi"}'
```

## Migration Notes

### Backward Compatibility

The API route maintains backward compatibility:
- Accepts legacy `concern` field (mapped to `inputText`)
- Returns new v1 response format
- Legacy telemetry events still use old tier/nextAction values

### Frontend Updates Required

The AMY Composer frontend (`app/patient/dashboard/components/AMYComposer.tsx`) will need updates to:
1. Use new response structure (`data.rationale` instead of `data.summary`)
2. Handle new tier values (`INFO|ASSESSMENT|ESCALATE` instead of `low|moderate|high|urgent`)
3. Handle new nextAction values

**Note:** Frontend updates are NOT part of E6.6.2 scope. This issue focuses solely on the contract definition and API integration.

## Security Improvements

1. **Input Validation:** Hard bounds prevent DoS via large inputs
2. **RedFlags Allowlist:** Prevents injection of arbitrary red flag values
3. **Rationale Bounding:** Prevents unbounded text in responses
4. **Schema Versioning:** Enables safe evolution of contract over time
5. **Runtime Validation:** Catches invalid data before processing

## Files Changed

### Created
- `lib/api/contracts/triage/index.ts` - Contract definitions and helpers
- `lib/api/contracts/triage/__tests__/index.test.ts` - Comprehensive tests

### Modified
- `app/api/amy/triage/route.ts` - Integrated v1 contract validation

## Next Steps (Future Work)

1. **Frontend Integration (E6.6.3?):**
   - Update AMYComposer to use new contract
   - Update tier badge rendering for new tier values
   - Update action routing for new nextAction values

2. **Telemetry Migration:**
   - Update telemetry events to use v1 tier/nextAction values
   - Add telemetry for contract validation failures

3. **Documentation:**
   - Add OpenAPI/Swagger spec for triage endpoint
   - Update mobile contract exports if needed

4. **Monitoring:**
   - Track contract validation failures
   - Alert on frequent 413 errors (potential abuse)

## Conclusion

E6.6.2 successfully implements a stable, testable, governance-ready contract for the triage endpoint. All acceptance criteria are met:
- ✅ AC1: Zod schemas with runtime validation
- ✅ AC2: Proper HTTP status codes (400/413)
- ✅ AC3: Hard-bounded rationale and allowlist-only redFlags

The implementation provides a solid foundation for governance, testing, and safe evolution of the triage feature.
