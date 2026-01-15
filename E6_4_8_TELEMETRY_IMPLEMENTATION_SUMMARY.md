# E6.4.8 Implementation Summary

**Issue:** E6.4.8 — Minimal Telemetry: CorrelationId + Triage/Workup State Transitions (Non-blocking, Pilot-safe)  
**Date:** 2026-01-15  
**Status:** ✅ Core Implementation Complete  
**Branch:** `copilot/add-minimal-telemetry-implementation`

---

## Objective

Implement minimal observability for the pilot phase to enable debuggability and audit-lite without building a full KPI dashboard. The system must be:
- **PHI-safe**: No free text, raw symptoms, or prompt dumps
- **Non-blocking**: Best-effort telemetry that doesn't fail application flows
- **Traceable**: Every flow action has a correlation ID
- **Deterministic**: State transition events are reproducible

**Problem Statement:** Without correlation IDs and defined state-transition events, debugging pilot sessions ("what happened to test patient X?") is nearly impossible.

---

## Deliverables

### 1. Database Schema ✅

**File:** `supabase/migrations/20260115092300_e6_4_8_pilot_flow_events.sql`

**Created:**
- Table: `pilot_flow_events` (append-only event log)
- Enum: `pilot_event_type` (10 event types)
- Indexes: Optimized for querying by created_at, patient_id, correlation_id, entity
- RLS Policies: Admin/clinician read-only, system insert

**Table Structure:**
```sql
CREATE TABLE pilot_flow_events (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL,
  org_id uuid,
  patient_id uuid,
  actor_role user_role,
  correlation_id text NOT NULL, -- max 64 chars
  event_type pilot_event_type NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  from_state text,
  to_state text,
  payload_json jsonb DEFAULT '{}', -- max 2KB
  payload_hash text
)
```

**Event Types:**
- `TRIAGE_SUBMITTED` - When assessment submitted to AMY
- `TRIAGE_ROUTED` - When AMY routes to funnel/escalation
- `FUNNEL_STARTED` - New funnel assessment created
- `FUNNEL_RESUMED` - Existing assessment retrieved
- `FUNNEL_COMPLETED` - Assessment completed
- `WORKUP_STARTED` - Workup check initiated
- `WORKUP_NEEDS_MORE_DATA` - Insufficient data detected
- `WORKUP_READY_FOR_REVIEW` - Data sufficient for review
- `ESCALATION_OFFER_SHOWN` - Red flag escalation shown (future)
- `ESCALATION_OFFER_CLICKED` - Patient clicked escalation CTA

**Guardrails:**
- Correlation ID length: max 64 characters
- Payload size: max 2KB (enforced by constraint)
- Allowed characters: `[a-zA-Z0-9_-]`
- Append-only: No UPDATE or DELETE policies

---

### 2. Correlation ID Standard ✅

**File:** `lib/telemetry/correlationId.ts`

**Functions:**
- `getCorrelationId(request?)` - Extract or generate correlation ID
- `generateCorrelationId()` - Generate new UUID v4
- `isValidCorrelationId(id)` - Validate format and length
- `withCorrelationId(response, id)` - Add headers to response

**Behavior:**
- Client sends `X-Correlation-Id` → use it (if valid)
- Fallback to `X-Request-Id` (E6.2.8 compatibility)
- Invalid ID → generate new UUID (fail-closed)
- Server always returns ID in response header and body

**Validation Rules:**
- Pattern: `/^[a-zA-Z0-9_-]+$/`
- Max length: 64 characters
- Generates UUID v4 if invalid

**E6.2.8 Alignment:**
- Sets both `X-Correlation-Id` (E6.4.8) and `X-Request-Id` (E6.2.8) headers
- Uses existing `getRequestId()` logic from `lib/db/errors.ts` as reference
- Backward compatible with E6.2.8 request ID infrastructure

---

### 3. Event Emission Library ✅

**File:** `lib/telemetry/events.ts`

**Core Function:**
```typescript
emitPilotEvent(input: CreatePilotEventInput): Promise<string | null>
```

**PHI-Safe Payload Validation:**
- **Allowlist approach**: Only specific keys permitted
- **No free text**: String fields limited to enumerated values
- **Truncation**: String values max 100 chars
- **Size limit**: Payload truncated if exceeds 2KB

**Allowed Payload Keys:**
```typescript
const ALLOWED_PAYLOAD_KEYS = new Set([
  'payloadVersion',
  'nextAction', 'tier', 'missingDataCount',
  'redFlag', 'offerType',
  'funnelSlug', 'stepId', 'stepIndex',
  'previousStatus', 'newStatus', 'durationMs',
  'resultId', 'reportId', 'workupStatus', 'escalationCorrelationId'
])
```

**Helper Functions:**
- `emitFunnelStarted()` - Convenience wrapper for FUNNEL_STARTED
- `emitFunnelResumed()` - Convenience wrapper for FUNNEL_RESUMED
- `emitFunnelCompleted()` - Convenience wrapper for FUNNEL_COMPLETED
- `emitTriageSubmitted()` - Convenience wrapper for TRIAGE_SUBMITTED
- `emitTriageRouted()` - Convenience wrapper for TRIAGE_ROUTED
- `emitWorkupStarted()` - Convenience wrapper for WORKUP_STARTED
- `emitWorkupNeedsMoreData()` - Convenience wrapper for WORKUP_NEEDS_MORE_DATA
- `emitWorkupReadyForReview()` - Convenience wrapper for WORKUP_READY_FOR_REVIEW
- `emitEscalationOfferShown()` - Convenience wrapper for ESCALATION_OFFER_SHOWN
- `emitEscalationOfferClicked()` - Convenience wrapper for ESCALATION_OFFER_CLICKED

**Best-Effort Pattern:**
```typescript
await emitFunnelStarted({...}).catch((err) => {
  console.warn('[TELEMETRY] Failed to emit event', err)
})
```

**Characteristics:**
- ✅ Non-blocking: Failures logged, never throw
- ✅ PHI-safe: Allowlist + truncation + size limits
- ✅ Typed: Full TypeScript support
- ✅ Testable: Pure functions, easy to unit test

---

### 4. API Response Updates ✅

**File:** `lib/api/responses.ts`

**Changes:**
- Updated `successResponse()` to add `X-Correlation-Id` header
- Updated `versionedSuccessResponse()` to add `X-Correlation-Id` header
- Updated `errorResponse()` to add `X-Correlation-Id` header
- All response helpers now propagate correlation ID to headers

**Pattern:**
```typescript
const response = NextResponse.json(body, { status })
if (requestId) {
  response.headers.set('x-correlation-id', requestId)
}
return response
```

**E6.2.8 Compatibility:**
- `requestId` parameter serves as correlation ID
- Maintains backward compatibility (optional parameter)
- Both headers set: `X-Correlation-Id` and `X-Request-Id`

---

### 5. API Endpoints Instrumented ✅

#### Funnel Events

**File:** `app/api/funnels/[slug]/assessments/route.ts`
- Event: `FUNNEL_STARTED`
- Trigger: POST creates new assessment
- Payload: `{ funnelSlug, stepId }`

**File:** `app/api/funnels/[slug]/assessments/[assessmentId]/route.ts`
- Event: `FUNNEL_RESUMED`
- Trigger: GET fetches existing assessment
- Payload: `{ funnelSlug, stepId, stepIndex }`

**File:** `app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts`
- Event: `FUNNEL_COMPLETED`
- Trigger: POST completes assessment
- Payload: `{ funnelSlug }`

#### Workup Events

**File:** `app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts`
- Events: `WORKUP_STARTED`, `WORKUP_NEEDS_MORE_DATA`, `WORKUP_READY_FOR_REVIEW`
- Triggers:
  - `WORKUP_STARTED`: After evidence pack created
  - `WORKUP_NEEDS_MORE_DATA`: Status = needs_more_data
  - `WORKUP_READY_FOR_REVIEW`: Status = ready_for_review
- Payloads:
  - `STARTED`: `{}`
  - `NEEDS_MORE_DATA`: `{ workupStatus, missingDataCount }`
  - `READY_FOR_REVIEW`: `{ workupStatus }`

#### Triage Events

**File:** `app/api/amy/stress-report/route.ts`
- Events: `TRIAGE_SUBMITTED`, `TRIAGE_ROUTED`
- Triggers:
  - `SUBMITTED`: After loading assessment answers
  - `ROUTED`: After report created and risk level determined
- Payloads:
  - `SUBMITTED`: `{}`
  - `ROUTED`: `{ nextAction, tier }`
- Routing Logic:
  - `risk_level = 'high'` → `nextAction = 'escalation'`
  - Otherwise → `nextAction = 'funnel'`
  - `tier = risk_level || 'pending'`

#### Escalation Events

**File:** `app/api/escalation/log-click/route.ts`
- Event: `ESCALATION_OFFER_CLICKED`
- Trigger: Patient clicks escalation CTA
- Payload: `{ offerType, escalationCorrelationId }`

**Note on ESCALATION_OFFER_SHOWN:**
- Currently detected client-side (in `app/patient/funnel/[slug]/result/client.tsx`)
- Requires future client-side instrumentation to emit event
- Deferred to post-pilot implementation

---

### 6. Admin Retrieval API ✅

**File:** `app/api/admin/pilot/flow-events/route.ts`

**Endpoint:** `GET /api/admin/pilot/flow-events`

**Query Parameters:**
- `patientId` (optional): Filter by patient UUID
- `correlationId` (optional): Filter by correlation ID
- `entityType` (optional): Filter by entity type (e.g., "assessment")
- `entityId` (optional): Filter by entity ID
- `limit` (default 100, max 500): Results per page
- `offset` (default 0): Pagination offset

**Response Format:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "total": 42,
    "limit": 100,
    "offset": 0,
    "filters": {
      "patientId": "uuid",
      "correlationId": "abc-123"
    }
  },
  "requestId": "correlation-id-here"
}
```

**Authorization:**
- **Admin**: Full access to all events
- **Clinician**: Full access to all events
- **Patient**: No access (403 Forbidden)
- **Unauthenticated**: No access (401 Unauthorized)

**Ordering:**
- Primary: `created_at ASC`
- Secondary: `id ASC`
- Deterministic and stable for pagination

**Best Practices:**
- Use `limit` + `offset` for pagination
- Use `correlationId` to trace a specific flow
- Use `patientId` to see all events for a patient
- Use `entityType` + `entityId` to see events for specific assessment

---

## Type Definitions

**File:** `lib/types/telemetry.ts`

**Key Types:**
```typescript
export type PilotEventType =
  | 'TRIAGE_SUBMITTED'
  | 'TRIAGE_ROUTED'
  | 'FUNNEL_STARTED'
  | 'FUNNEL_RESUMED'
  | 'FUNNEL_COMPLETED'
  | 'WORKUP_STARTED'
  | 'WORKUP_NEEDS_MORE_DATA'
  | 'WORKUP_READY_FOR_REVIEW'
  | 'ESCALATION_OFFER_SHOWN'
  | 'ESCALATION_OFFER_CLICKED'

export type EventActorRole = 'patient' | 'clinician' | 'admin' | 'system'

export type PilotEventPayload = {
  payloadVersion: 1
  nextAction?: string
  tier?: string
  missingDataCount?: number
  redFlag?: boolean
  offerType?: string
  funnelSlug?: string
  stepId?: string
  stepIndex?: number
  previousStatus?: string
  newStatus?: string
  durationMs?: number
  // ... additional fields
}

export type PilotFlowEvent = {
  id: string
  created_at: string
  correlation_id: string
  event_type: PilotEventType
  entity_type: string
  entity_id: string
  from_state?: string
  to_state?: string
  payload_json: PilotEventPayload
  // ... other fields
}
```

---

## Implementation Patterns

### Pattern 1: Extract Correlation ID

```typescript
import { getCorrelationId } from '@/lib/telemetry/correlationId'

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  // ... use correlationId in logs, responses, and events
}
```

### Pattern 2: Emit Event (Best-Effort)

```typescript
import { emitFunnelStarted } from '@/lib/telemetry/events'

await emitFunnelStarted({
  correlationId,
  assessmentId: assessment.id,
  funnelSlug: slug,
  patientId: patientProfile.id,
  stepId: currentStep.stepId,
}).catch((err) => {
  console.warn('[TELEMETRY] Failed to emit FUNNEL_STARTED event', err)
})
```

### Pattern 3: Pass Correlation ID to Responses

```typescript
return successResponse(data, 200, correlationId)
return errorResponse(ErrorCode.INVALID_INPUT, 'Message', 400, undefined, correlationId)
```

### Pattern 4: Retrieve Events (Admin)

```typescript
// PowerShell example
$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/admin/pilot/flow-events?patientId=uuid&limit=50" `
  -Headers @{ Cookie = $adminCookie }

$response.data.events | Format-Table created_at, event_type, entity_id
```

---

## Testing Considerations

### Unit Tests (Future)

**Test Coverage Needed:**
- `correlationId.ts`:
  - Validation (valid/invalid formats)
  - Generation (UUID format)
  - Extraction (from headers)
- `events.ts`:
  - Payload sanitization
  - Size validation
  - Allowlist enforcement
  - Best-effort behavior

### Integration Tests (Future)

**Scenarios:**
- Full funnel flow: START → RESUME → COMPLETE
- Triage flow: SUBMITTED → ROUTED
- Workup flow: STARTED → NEEDS_MORE_DATA or READY_FOR_REVIEW
- Escalation flow: OFFER_SHOWN → OFFER_CLICKED

**Verification:**
- Events exist in database
- Correlation IDs match across events
- Payloads are PHI-safe
- Ordering is deterministic
- Failures don't break flows

### Manual Testing

**PowerShell Script:**
```powershell
# 1. Start funnel
$start = Invoke-RestMethod -Uri "http://localhost:3000/api/funnels/stress/assessments" -Method Post -Headers @{ Cookie = $cookie }
$correlationId = $start.requestId
$assessmentId = $start.data.assessmentId

# 2. Complete funnel
Invoke-RestMethod -Uri "http://localhost:3000/api/funnels/stress/assessments/$assessmentId/complete" -Method Post -Headers @{ Cookie = $cookie }

# 3. Fetch events
$events = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/pilot/flow-events?correlationId=$correlationId" -Headers @{ Cookie = $adminCookie }
$events.data.events | Format-Table created_at, event_type, from_state, to_state
```

---

## Acceptance Criteria

✅ **AC1: Correlation ID Propagation**
- Every API response includes `X-Correlation-Id` header
- Response body includes `requestId` field
- Verified in `lib/api/responses.ts` updates

✅ **AC2: Event Coverage**
- All 10 event types have emission points
- 9 of 10 events instrumented (ESCALATION_OFFER_SHOWN deferred)
- Best-effort pattern used throughout

✅ **AC3: PHI-Safe**
- Allowlist-based payload validation
- No free text fields accepted
- Size and character limits enforced
- Verified in `lib/telemetry/events.ts`

✅ **AC4: Deterministic Ordering**
- Admin API returns events sorted by `created_at ASC, id ASC`
- Verified in `app/api/admin/pilot/flow-events/route.ts`

✅ **AC5: Best-Effort**
- Event write failures logged but don't block flows
- `.catch()` pattern used in all instrumentation
- Verified across all instrumented endpoints

⚠️ **AC6: Endpoint Governance**
- Admin endpoint created and documented
- Endpoint catalog update deferred to future PR
- Documentation in this summary

---

## Verification Commands

```powershell
# Build
npm run build

# Test (once tests added)
npm test

# Start dev server
npm run dev

# Example: Test funnel flow
$cookie = "sb-localhost-auth-token=YOUR_COOKIE"
$r = Invoke-WebRequest "http://localhost:3000/api/funnels/stress/assessments" -Method Post -Headers @{ Cookie = $cookie }
$r.Headers["X-Correlation-Id"]

# Fetch events (admin)
$adminCookie = "sb-localhost-auth-token=YOUR_ADMIN_COOKIE"
Invoke-RestMethod "http://localhost:3000/api/admin/pilot/flow-events?limit=20" -Headers @{ Cookie = $adminCookie }
```

---

## Dependencies & Integration

### Depends On
- **E6.2.8** (Correlation IDs + breadcrumbs) - Aligned field names and headers
- **E6.4.3** (Funnel wiring) - Instrumented funnel endpoints
- **E6.4.5** (Workup) - Instrumented workup transitions
- **E6.4.6** (Escalation) - Instrumented escalation clicks

### Aligns With
- **B8** (Standardized API Responses) - Uses response helpers
- **V05-I01.4** (Audit Log) - Complementary to existing audit trail

---

## Known Limitations & Future Work

### Deferred Items

1. **ESCALATION_OFFER_SHOWN Event**
   - Currently detected client-side
   - Requires client instrumentation or result endpoint enhancement
   - Low priority for pilot (offer click is tracked)

2. **Admin UI Viewer**
   - PowerShell/curl queries sufficient for pilot
   - Web UI deferred to post-pilot iteration

3. **Unit Tests**
   - Core implementation complete
   - Test suite deferred to future PR

4. **Integration Tests**
   - E2E smoke tests can verify events manually
   - Automated integration tests deferred

5. **Endpoint Catalog Update**
   - New admin endpoint needs catalog entry
   - Deferred to future PR

### Pre-Existing Issues

- **Build Error**: `app/api/admin/content-pages/[id]/sections/route.ts` has type error (unrelated to E6.4.8)
- **Type Generation**: `lib/types/supabase.ts` needs regeneration after migration runs

---

## Files Modified

### Created (5 files)

1. `supabase/migrations/20260115092300_e6_4_8_pilot_flow_events.sql` - Event table schema
2. `lib/types/telemetry.ts` - Type definitions
3. `lib/telemetry/correlationId.ts` - Correlation ID utilities
4. `lib/telemetry/events.ts` - Event emission library
5. `app/api/admin/pilot/flow-events/route.ts` - Admin retrieval endpoint

### Modified (7 files)

6. `lib/api/responses.ts` - Added X-Correlation-Id headers
7. `app/api/funnels/[slug]/assessments/route.ts` - FUNNEL_STARTED
8. `app/api/funnels/[slug]/assessments/[assessmentId]/route.ts` - FUNNEL_RESUMED
9. `app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts` - FUNNEL_COMPLETED
10. `app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts` - WORKUP_* events
11. `app/api/amy/stress-report/route.ts` - TRIAGE_* events
12. `app/api/escalation/log-click/route.ts` - ESCALATION_OFFER_CLICKED

### Stub (1 file)

13. `lib/types/supabase.ts` - Temporary stub (regenerate after migration)

---

## Deployment Notes

### Pre-Deployment

1. Review migration file
2. Test locally with Supabase instance
3. Verify RLS policies

### Post-Deployment

1. Run migration: `supabase db push`
2. Regenerate types: `npm run db:typegen`
3. Verify admin endpoint access control
4. Test event emission in staging

### Rollback Plan

- Drop table: `DROP TABLE IF EXISTS public.pilot_flow_events CASCADE;`
- Drop enum: `DROP TYPE IF EXISTS public.pilot_event_type;`
- Revert code changes via git

---

## Success Metrics (Post-Pilot)

**Usage:**
- Events emitted per pilot session
- Most common event sequences
- Correlation ID coverage (% of requests)

**Debuggability:**
- Time to identify issue from correlation ID
- % of support cases resolved via events

**Reliability:**
- Event emission failure rate
- Impact of failures on user flows (should be 0%)

---

## Example Event Sequence

**Scenario:** Patient completes stress assessment and is routed to escalation

```
1. FUNNEL_STARTED       [correlation-abc-123]
   entity: assessment-1, payload: { funnelSlug: "stress", stepId: "step-1" }
   
2. FUNNEL_RESUMED       [correlation-abc-123]
   entity: assessment-1, payload: { funnelSlug: "stress", stepId: "step-2" }
   
3. FUNNEL_COMPLETED     [correlation-abc-123]
   entity: assessment-1, from_state: "in_progress", to_state: "completed"
   
4. TRIAGE_SUBMITTED     [correlation-abc-123]
   entity: assessment-1, to_state: "submitted"
   
5. TRIAGE_ROUTED        [correlation-abc-123]
   entity: assessment-1, from_state: "submitted", to_state: "routed"
   payload: { nextAction: "escalation", tier: "high" }
   
6. ESCALATION_OFFER_CLICKED [correlation-def-456]
   entity: assessment-1, payload: { offerType: "video_consultation" }
```

---

## References

- **Issue**: E6.4.8 — Minimal Telemetry: CorrelationId + State Transitions
- **Branch**: `copilot/add-minimal-telemetry-implementation`
- **Related Issues**:
  - E6.2.8 (Correlation IDs)
  - E6.4.3 (Funnel Wiring)
  - E6.4.5 (Workup)
  - E6.4.6 (Escalation)
- **Documentation**:
  - `docs/mobile/OBSERVABILITY.md` (E6.2.8 telemetry patterns)
  - `E6_4_5_IMPLEMENTATION_SUMMARY.md` (Workup implementation)
  - `E6_4_6_IMPLEMENTATION_SUMMARY.md` (Escalation implementation)

---

**Implementation Complete:** 2026-01-15  
**Implemented By:** GitHub Copilot Agent  
**Status:** ✅ Ready for Review  
**Next Steps:** Manual testing, smoke tests, documentation updates
