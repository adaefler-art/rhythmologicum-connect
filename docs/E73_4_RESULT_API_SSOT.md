# E73.4 — Result API SSOT-first + "processing" Contract

## Overview

This document describes the implementation of the SSOT-first result API contract for the assessment result endpoint.

## Feature Flag

**Environment Variable:** `E73_4_RESULT_SSOT`

- **Type:** String (boolean)
- **Values:** `'true'` (enabled) or `undefined`/`'false'` (disabled)
- **Default:** Disabled (legacy behavior)

### Enabling the Feature

Set the environment variable in your deployment or `.env.local`:

```bash
E73_4_RESULT_SSOT=true
```

## API Contract

### Endpoint

```
GET /api/funnels/{slug}/assessments/{assessmentId}/result
```

### Response States

The new contract uses a discriminated union with a `state` field:

#### 1. Ready State (200 OK)

Assessment is completed and calculated results are available.

```json
{
  "success": true,
  "data": {
    "state": "ready",
    "assessmentId": "uuid",
    "result": {
      "scores": { "stress_score": 42, "resilience_score": 75 },
      "riskModels": { "cardiovascular_risk": "medium" },
      "priorityRanking": { "urgency": "normal" },
      "algorithmVersion": "v1.0",
      "computedAt": "2026-01-28T06:00:00Z"
    }
  },
  "schemaVersion": "v1"
}
```

#### 2. Processing State (409 Conflict)

Assessment is completed but calculated results are not yet available (still being processed).

```json
{
  "success": false,
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Die Ergebnisse werden aktuell berechnet. Bitte versuchen Sie es in Kürze erneut.",
    "details": {
      "state": "processing",
      "assessmentId": "uuid"
    }
  },
  "schemaVersion": "v1"
}
```

**Client Action:** Poll the endpoint until state changes to `ready`.

#### 3. In Progress State (409 Conflict)

Assessment is not yet completed.

```json
{
  "success": false,
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Assessment ist noch nicht abgeschlossen.",
    "details": {
      "state": "in_progress",
      "assessmentId": "uuid"
    }
  },
  "schemaVersion": "v1"
}
```

**Client Action:** Do not poll. User must complete the assessment first.

## Implementation Details

### Backend Logic

1. **Authentication & Authorization**
   - Verify user is authenticated
   - Verify user owns the assessment (via patient_profile)

2. **Assessment Status Check**
   - If `status !== 'completed'`: Return 409 with `state: 'in_progress'`

3. **Calculated Results Fetch**
   - Query `calculated_results` table for the assessment
   - If not found: Return 409 with `state: 'processing'`
   - If found: Return 200 with `state: 'ready'` and result data

### Frontend Integration

The `useAssessmentResult` hook in `lib/hooks/useAssessmentResult.ts` supports polling for both states:

```typescript
const { data, error, isPolling, pollTimedOut } = useAssessmentResult({
  slug: 'stress-assessment',
  assessmentId: 'uuid',
  pollOnConflict: true,  // Enable polling for processing state
  pollInterval: 2000,     // Poll every 2 seconds
  pollTimeout: 30000,     // Stop polling after 30 seconds
})
```

The hook automatically:
- Starts polling when it receives a 409 with `state: 'processing'`
- Stops polling when state changes to `ready`
- Times out after the configured duration

## Callsite Requirements

As per the Vertical Slice Requirements, at least one literal callsite must exist:

**Callsite:** `lib/hooks/useAssessmentResult.ts:120`

```typescript
fetch(`/api/funnels/${slug}/assessments/${assessmentId}/result`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  signal: controller.signal,
})
```

## Database Schema

### calculated_results Table

```sql
CREATE TABLE calculated_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  algorithm_version TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_models JSONB DEFAULT '{}'::jsonb,
  priority_ranking JSONB DEFAULT '{}'::jsonb,
  funnel_version_id UUID,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  inputs_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (assessment_id, algorithm_version)
);
```

## Migration Path

### Phase 1: Gated Rollout (Current)

- Feature flag disabled by default
- Both legacy and new behavior coexist
- Production uses legacy behavior

### Phase 2: Gradual Enablement

- Enable flag in staging/testing environments
- Monitor for issues
- Enable for subset of production users

### Phase 3: Full Rollout

- Enable flag for all users
- Monitor for 2+ weeks

### Phase 4: Cleanup (Future)

- Remove legacy code path
- Remove feature flag
- Update contract to only support new format

## Testing

### Manual Testing

1. **In Progress State**
   ```bash
   # Start an assessment but don't complete it
   curl -X GET "http://localhost:3000/api/funnels/stress/assessments/{id}/result" \
     -H "Cookie: ..." \
     -H "E73_4_RESULT_SSOT: true"
   # Should return 409 with state: 'in_progress'
   ```

2. **Processing State**
   ```bash
   # Complete an assessment but don't trigger processing
   curl -X GET "http://localhost:3000/api/funnels/stress/assessments/{id}/result" \
     -H "Cookie: ..." \
     -H "E73_4_RESULT_SSOT: true"
   # Should return 409 with state: 'processing'
   ```

3. **Ready State**
   ```bash
   # Complete assessment and trigger processing
   # Wait for calculated_results to be created
   curl -X GET "http://localhost:3000/api/funnels/stress/assessments/{id}/result" \
     -H "Cookie: ..." \
     -H "E73_4_RESULT_SSOT: true"
   # Should return 200 with state: 'ready' and result data
   ```

## Related Files

- Contract: `packages/rhythm-core/src/contracts/patient/assessments.ts`
- Endpoint (Patient UI): `apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts`
- Endpoint (Legacy): `apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts`
- Hook: `lib/hooks/useAssessmentResult.ts`
- Persistence: `lib/results/persistence.ts`

## Security Considerations

- User authentication is required
- User must own the assessment (ownership verified via patient_profile)
- No sensitive data exposed in error responses
- Rate limiting applies per existing API policies

## Performance Considerations

- Single database query to check calculated_results existence
- No loops or blocking operations
- Client-side polling uses exponential backoff (configurable)
- Poll timeout prevents infinite polling

## Monitoring

When this feature is enabled, monitor:

1. **409 Response Rate**
   - Track percentage of requests returning 409 (should decrease over time)
   - Alert if sustained high rate (indicates processing issues)

2. **Poll Duration**
   - Track how long clients poll before getting results
   - Alert if frequently timing out (indicates slow processing)

3. **Error Rates**
   - Track errors loading calculated_results
   - Alert on database errors

## Rollback Plan

If issues are discovered:

1. Set `E73_4_RESULT_SSOT=false` in environment
2. Deploy/restart affected services
3. Legacy behavior is immediately restored
4. No data loss or corruption (read-only feature)
