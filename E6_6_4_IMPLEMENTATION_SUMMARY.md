# E6.6.4 — POST /api/patient/triage — Implementation Summary

## Overview
Implemented a patient-facing triage endpoint that follows all governance requirements:
- 401-first auth ordering (no DB calls before authentication)
- Pilot eligibility gate
- Request validation with proper HTTP status codes
- Contract-validated responses with bounded output

## Issue Requirements

### Scope
✅ Implement endpoint: Auth→eligibility→validate request→run triage engine→return result  
✅ Rate limiting optional (handled by existing infrastructure)  
✅ No DB calls before auth

### Acceptance Criteria
✅ **AC1**: Unauth→401 first  
✅ **AC2**: Not eligible→403/404  
✅ **AC3**: Request validated; oversize→413 or 400  
✅ **AC4**: Result conforms to schema; rationale bounded; redFlags allowlist enforced

## Implementation Details

### Files Created

#### 1. `app/api/patient/triage/route.ts`
Main endpoint implementation with the following flow:

1. **Authentication** (AC1)
   - Uses `requirePilotEligibility()` which calls `requireAuth()` first
   - Returns 401 if not authenticated
   - No DB calls before auth check

2. **Pilot Eligibility** (AC2)
   - Checks pilot eligibility after auth
   - Returns 403 if not eligible

3. **Request Parsing & Validation** (AC3)
   - Parses JSON body
   - Validates with `TriageRequestV1Schema`
   - Returns 400 for invalid JSON
   - Returns 400 for too short input (<10 chars)
   - Returns 400 for moderately oversized input (>800, ≤1600 chars)
   - Returns 413 for very large input (>1600 chars)

4. **Triage Processing**
   - Runs deterministic `runTriageEngine()` from `lib/triage/engine.ts`
   - Validates result with `validateTriageResult()` (AC4)

5. **Response**
   - Returns standardized success response with validated triage result
   - Includes correlation ID in response body and headers

#### 2. `app/api/patient/triage/__tests__/route.test.ts`
Comprehensive test suite covering:
- AC1: 401 for unauthenticated requests
- AC2: 403 for non-eligible users
- AC3: 400/413 for invalid/oversized input
- AC4: 200 with schema-validated result
- Edge cases: Unicode, boundary lengths, optional fields

#### 3. `E6_6_4_VERIFICATION_GUIDE.md`
Manual verification guide with:
- PowerShell test commands
- Expected responses for each scenario
- Schema documentation
- Common issues and troubleshooting

## Architecture Decisions

### Reuse Existing Components
- **Triage Engine**: `lib/triage/engine.ts` (E6.6.3)
  - Deterministic rule-based classification
  - No LLM/AI - pure rules for governance
- **Contracts**: `lib/api/contracts/triage/index.ts` (E6.6.2)
  - Versioned schemas (v1)
  - Zod validation for runtime safety
- **Auth Helpers**: `lib/api/authHelpers.ts`
  - `requirePilotEligibility()` handles both auth and eligibility
  - 401-first ordering built-in
- **Response Utilities**: `lib/api/responses.ts`
  - Standardized success/error responses
  - Correlation ID support

### No New Dependencies
All functionality uses existing libraries and patterns from the codebase.

### Minimal Changes
Only added the new endpoint, tests, and documentation. No modifications to existing files.

## Response Contract

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "tier": "INFO" | "ASSESSMENT" | "ESCALATE",
    "nextAction": "SHOW_CONTENT" | "START_FUNNEL_A" | "START_FUNNEL_B" | "RESUME_FUNNEL" | "SHOW_ESCALATION",
    "redFlags": ["answer_pattern"],
    "rationale": "Bounded rationale (≤280 chars or ≤3 bullets)",
    "version": "v1",
    "correlationId": "..."
  },
  "requestId": "correlation-id"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentifizierung fehlgeschlagen. Bitte melden Sie sich an."
  },
  "requestId": "correlation-id"
}
```

#### 403 Forbidden (Not Eligible)
```json
{
  "success": false,
  "error": {
    "code": "PILOT_NOT_ELIGIBLE",
    "message": "Zugriff auf Pilotfunktionen nicht verfügbar."
  },
  "requestId": "correlation-id"
}
```

#### 400 Bad Request (Invalid Input)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Input text exceeds maximum length of 800 characters.",
    "details": {
      "maxLength": 800,
      "actualLength": 900
    }
  },
  "requestId": "correlation-id"
}
```

#### 413 Payload Too Large
```json
{
  "success": false,
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "Input text is too large. Maximum 800 characters allowed.",
    "details": {
      "maxLength": 800,
      "actualLength": 1700
    }
  },
  "requestId": "correlation-id"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  },
  "requestId": "correlation-id"
}
```

## Triage Engine Behavior

The endpoint uses the deterministic rule-based engine from E6.6.3:

### Tier Classification
1. **Red Flag Keywords** → `ESCALATE` tier
   - Detects crisis keywords (suicide, self-harm, emergency, etc.)
   - Always takes priority over other classifications
   
2. **Info Keywords** → `INFO` tier
   - "What is...", "How does...", "Can you explain..."
   
3. **Assessment Keywords** → `ASSESSMENT` tier
   - stress, burnout, anxiety, sleep problems, etc.
   
4. **Default** → `ASSESSMENT` tier
   - Conservative approach: when in doubt, offer assessment

### Next Actions
- `INFO` → `SHOW_CONTENT`
- `ASSESSMENT` → `START_FUNNEL_A`
- `ESCALATE` → `SHOW_ESCALATION`

### Red Flags
Only values from allowlist:
- `report_risk_level`
- `workup_check`
- `answer_pattern`

Any red flag keyword detection adds `answer_pattern` to the result.

## Telemetry

The endpoint emits telemetry events (best-effort, non-blocking):

1. **TRIAGE_SUBMITTED** - When request is validated
2. **TRIAGE_ROUTED** - When triage result is generated

Both events include:
- `correlationId` - For request tracking
- `patientId` - User ID
- `assessmentId` - Synthetic ID for non-funnel triage

## Security Considerations

1. **Auth-First**: Authentication is checked before any processing
2. **No DB Access Before Auth**: Uses `requirePilotEligibility()` which doesn't make DB calls until after auth
3. **Input Validation**: All input is validated against schema before processing
4. **Output Validation**: Triage result is validated before sending to client
5. **Rate Limiting**: Relies on existing infrastructure (not implemented in endpoint)
6. **No PHI in Logs**: Only anonymized data (lengths, tiers, etc.) in logs

## Testing

### Unit Tests
Located in `app/api/patient/triage/__tests__/route.test.ts`:
- 15+ test cases covering all ACs
- Mocked dependencies (auth, telemetry, monitoring)
- Edge cases (Unicode, boundary values)

### Manual Testing
See `E6_6_4_VERIFICATION_GUIDE.md` for:
- PowerShell commands
- Expected responses
- Schema validation examples

### Integration Testing
To be performed with actual:
- Supabase authentication
- Pilot eligibility configuration
- Next.js dev/production server

## Code Quality

✅ TypeScript strict mode compliant  
✅ Uses constants from contracts (no magic numbers)  
✅ Explicit null checks (no unsafe non-null assertions)  
✅ Follows existing code patterns  
✅ Comprehensive error handling  
✅ Structured logging with correlation IDs  

## Next Steps

1. **Manual Verification**
   - Run dev server: `npm run dev`
   - Execute PowerShell tests from verification guide
   - Verify responses match expected format

2. **Integration Testing**
   - Test with real auth cookies
   - Verify pilot eligibility checks
   - Test with different input scenarios

3. **Deployment**
   - Merge PR after review
   - Deploy to staging
   - Verify in production environment

## Related Issues/PRs

- **E6.6.1**: AMY Triage UX (frontend consumer)
- **E6.6.2**: Triage contracts (schemas used by this endpoint)
- **E6.6.3**: Triage engine (logic used by this endpoint)

## References

- Implementation: `app/api/patient/triage/route.ts`
- Tests: `app/api/patient/triage/__tests__/route.test.ts`
- Verification: `E6_6_4_VERIFICATION_GUIDE.md`
- Contracts: `lib/api/contracts/triage/index.ts`
- Engine: `lib/triage/engine.ts`
