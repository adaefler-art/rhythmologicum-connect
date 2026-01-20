# E6.6.4 — POST /api/patient/triage — Verification Guide

## Overview
This guide provides verification steps for the `/api/patient/triage` endpoint implementation.

## Acceptance Criteria

### AC1: Unauth→401 first
✅ Unauthenticated requests return 401 before any processing

### AC2: Not eligible→403/404
✅ Non-pilot-eligible users receive 403 response

### AC3: Request validated; oversize→413 or 400
✅ Invalid input returns 400
✅ Moderately oversized input (801-1600 chars) returns 400
✅ Very large input (>1600 chars) returns 413

### AC4: Result conforms to schema; rationale bounded; redFlags allowlist enforced
✅ Response follows TriageResultV1 schema
✅ Rationale is bounded (≤280 chars or ≤3 bullets)
✅ redFlags only contain allowlist values

## Manual Verification (PowerShell)

### Prerequisites
1. Server running at `http://localhost:3000`
2. Valid authentication cookie in `$cookie` variable
3. PowerShell environment

### Test 1: Unauthenticated Request (AC1)
```powershell
# Expected: 401 Unauthorized
$body = @{ inputText = "I feel stressed and cannot sleep" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -SkipHttpErrorCheck
$response.StatusCode
# Expected: 401
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
# Expected: { "success": false, "error": { "code": "UNAUTHORIZED", ... } }
```

### Test 2: Authenticated, Eligible Request (AC4)
```powershell
# Expected: 200 OK with valid triage result
$body = @{ inputText = "I feel stressed and cannot sleep" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck
$response.StatusCode
# Expected: 200

$result = $response.Content | ConvertFrom-Json
$result.success
# Expected: true

$result.data
# Expected: 
# {
#   "tier": "ASSESSMENT",
#   "nextAction": "START_FUNNEL_A",
#   "redFlags": [],
#   "rationale": "Basierend auf Ihrer Nachricht...",
#   "version": "v1",
#   "correlationId": "..."
# }
```

### Test 3: Invalid Input - Too Short (AC3)
```powershell
# Expected: 400 Bad Request
$body = @{ inputText = "short" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck
$response.StatusCode
# Expected: 400

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
# Expected: { "success": false, "error": { "code": "INVALID_INPUT", "message": "...10-800 characters..." } }
```

### Test 4: Moderately Oversized Input (AC3)
```powershell
# Expected: 400 Bad Request
$longText = "x" * 900  # 900 characters (> 800, < 1600)
$body = @{ inputText = $longText } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck
$response.StatusCode
# Expected: 400

$result = $response.Content | ConvertFrom-Json
$result.error.code
# Expected: INVALID_INPUT
```

### Test 5: Very Large Input (AC3)
```powershell
# Expected: 413 Payload Too Large
$veryLongText = "x" * 1700  # 1700 characters (> 1600)
$body = @{ inputText = $veryLongText } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck
$response.StatusCode
# Expected: 413

$result = $response.Content | ConvertFrom-Json
$result.error.code
# Expected: PAYLOAD_TOO_LARGE
```

### Test 6: Red Flag Detection (AC4)
```powershell
# Expected: 200 OK with ESCALATE tier and red flags
$body = @{ inputText = "I have thoughts of suicide and cannot go on" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck
$response.StatusCode
# Expected: 200

$result = $response.Content | ConvertFrom-Json
$result.data.tier
# Expected: ESCALATE
$result.data.nextAction
# Expected: SHOW_ESCALATION
$result.data.redFlags
# Expected: ["answer_pattern"] (from allowlist only)
```

### Test 7: Informational Query (AC4)
```powershell
# Expected: 200 OK with INFO tier
$body = @{ inputText = "What is stress and how does it work?" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck
$response.StatusCode
# Expected: 200

$result = $response.Content | ConvertFrom-Json
$result.data.tier
# Expected: INFO
$result.data.nextAction
# Expected: SHOW_CONTENT
```

### Test 8: Optional Fields
```powershell
# Expected: 200 OK - optional fields are properly handled
$body = @{ 
    inputText = "I feel stressed and anxious"
    locale = "de-DE"
    patientContext = @{
        ageRange = "AGE_31_50"
    }
} | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck
$response.StatusCode
# Expected: 200

$result = $response.Content | ConvertFrom-Json
$result.success
# Expected: true
```

### Test 9: Correlation ID
```powershell
# Expected: Correlation ID in both response body and headers
$body = @{ inputText = "I feel stressed" } | ConvertTo-Json
$response = iwr http://localhost:3000/api/patient/triage -Method POST -Body $body -ContentType "application/json" -Headers @{ Cookie = $cookie } -SkipHttpErrorCheck

$result = $response.Content | ConvertFrom-Json
$result.requestId
# Expected: Some UUID-like string

$response.Headers['x-correlation-id']
# Expected: Same value as requestId

$result.data.correlationId
# Expected: Same value as requestId
```

## Response Schema Validation

Every successful response (200 OK) should conform to:

```typescript
{
  success: true,
  data: {
    tier: "INFO" | "ASSESSMENT" | "ESCALATE",
    nextAction: "SHOW_CONTENT" | "START_FUNNEL_A" | "START_FUNNEL_B" | "RESUME_FUNNEL" | "SHOW_ESCALATION",
    redFlags: string[],  // Only values from allowlist: ["report_risk_level", "workup_check", "answer_pattern"]
    rationale: string,   // Bounded: ≤280 chars OR bullet list with ≤3 items
    version: "v1",
    correlationId?: string
  },
  requestId: string
}
```

## Error Response Schema

All error responses should conform to:

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: object
  },
  requestId?: string
}
```

## Implementation Notes

1. **Auth Order**: Authentication is checked BEFORE eligibility, and both are checked BEFORE any request parsing/validation
2. **No DB Calls Before Auth**: The endpoint uses `requirePilotEligibility()` which handles auth+eligibility without additional DB calls
3. **Deterministic Engine**: Uses rule-based triage engine (`runTriageEngine`) for consistent results
4. **Telemetry**: Best-effort event emission (failures don't block the response)
5. **Validation**: Request is validated against TriageRequestV1Schema, result against TriageResultV1Schema

## Common Issues

### Issue: 403 Instead of 401
- **Cause**: Pilot eligibility is checked before auth
- **Expected**: Auth should be checked first (requirePilotEligibility does this correctly)

### Issue: Rationale Too Long
- **Cause**: Engine generates unbounded rationale
- **Expected**: Rationale is bounded by schema validation (≤280 chars or ≤3 bullets)

### Issue: Unknown Red Flags
- **Cause**: Engine returns flags not in allowlist
- **Expected**: Only allowlist values pass schema validation

## Success Criteria

- ✅ All AC1-AC4 tests pass
- ✅ Response schema matches contract
- ✅ Error responses are consistent
- ✅ Correlation IDs are present
- ✅ No TypeScript/ESLint errors
- ✅ Unit tests pass (when test environment is set up)
