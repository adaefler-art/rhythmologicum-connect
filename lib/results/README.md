# Calculated Results Module (E73.3)

This module handles persistence and management of `calculated_results` - the Single Source of Truth (SSOT) for assessment processing outputs.

## Purpose

After the processing pipeline runs risk and ranking stages, the results writer aggregates all outputs into a single `calculated_results` record. This provides:

- **Idempotent storage**: Re-running processing doesn't create duplicates
- **Reproducibility**: Same inputs always produce same hash
- **SSOT**: One canonical location for all calculated data
- **Versioning**: Multiple algorithm versions can coexist

## Files

### `persistence.ts`

Core database operations for `calculated_results` table.

**Functions:**
- `computeInputsHash(inputs)`: Deterministic SHA256 hash with deep key sorting
- `saveCalculatedResults(supabase, input)`: Idempotent upsert
- `loadCalculatedResults(supabase, assessmentId, algorithmVersion?)`: Fetch results

**Example:**
```typescript
import { saveCalculatedResults } from '@/lib/results/persistence'

const result = await saveCalculatedResults(supabase, {
  assessmentId: 'abc-123',
  algorithmVersion: 'v1.0.0',
  scores: { riskScore: 75, stressScore: 68 },
  riskModels: { riskLevel: 'moderate' },
  inputsData: { answers: { q1: 5, q2: 3 } },
})
// => { success: true, resultId: 'xyz-789', isNew: true }
```

### `writer.ts`

High-level interface for writing results from processing pipeline.

**Functions:**
- `writeCalculatedResults(supabase, input)`: Main entry point

**Example:**
```typescript
import { writeCalculatedResults } from '@/lib/results/writer'

const result = await writeCalculatedResults(supabase, {
  assessmentId: 'abc-123',
  algorithmVersion: 'v1.0.0',
  scores: { riskScore: 75 },
  riskModels: { riskLevel: 'moderate' },
  priorityRanking: { topInterventions: [...] },
  inputsData: { answers: {...}, algorithmVersion: 'v1.0.0' },
})
```

## Processing Integration

The results writer is called after risk and ranking stages:

```
Assessment Complete
  ↓
Risk Stage → Risk Bundle
  ↓
Ranking Stage → Priority Ranking
  ↓
Results Stage → Calculated Results (SSOT) ← YOU ARE HERE
  ↓
Content Stage → Report Sections
  ↓
... (PDF, Delivery, etc.)
```

See `lib/processing/resultsStageProcessor.ts` for orchestration logic.

## Database Schema

```sql
CREATE TABLE calculated_results (
  id UUID PRIMARY KEY,
  assessment_id UUID NOT NULL,
  algorithm_version TEXT NOT NULL,
  scores JSONB NOT NULL,              -- Required
  risk_models JSONB,                  -- Optional
  priority_ranking JSONB,             -- Optional
  funnel_version_id UUID,
  computed_at TIMESTAMPTZ NOT NULL,
  inputs_hash TEXT,                   -- For idempotency
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT calculated_results_assessment_version_unique 
    UNIQUE(assessment_id, algorithm_version)
);
```

## Upsert Strategy

1. **Check existing**: Query for (assessment_id, algorithm_version)
2. **Compare hash**: If exists with same inputs_hash → return (no-op)
3. **Upsert**: Insert if new, update if hash differs
4. **Atomic**: Database constraint prevents race conditions

## Idempotency Guarantees

**Scenario 1: First Run**
- No existing record → Insert new row
- Result: `{ success: true, isNew: true }`

**Scenario 2: Re-run (Same Inputs)**
- Existing record with matching inputs_hash → Early return
- No database write
- Result: `{ success: true, isNew: false }`

**Scenario 3: Re-run (Different Inputs)**
- Existing record with different inputs_hash → Update
- New scores, risk_models, priority_ranking, inputs_hash
- Result: `{ success: true, isNew: false }`

## inputs_hash Computation

The hash ensures deterministic equivalence detection:

```typescript
{
  answers: { q1: 5, q2: 3 },
  algorithmVersion: 'v1.0.0',
  assessmentId: 'abc-123',
  funnelVersionId: 'funnel-v1',
}
// => SHA256 hash (64 hex chars)
```

**Key Features:**
- Deep key sorting (nested objects handled)
- Order-independent: `{a: 1, b: 2}` = `{b: 2, a: 1}`
- Cryptographically secure (SHA256)
- 64 character hex string (lowercase)

## API Endpoint

**Route**: `POST /api/processing/results`

**Auth**: Clinician or Admin only

**Request:**
```json
{
  "jobId": "uuid-of-processing-job",
  "algorithmVersion": "v1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resultId": "uuid-of-result",
    "isNew": false
  }
}
```

## Testing

See `__tests__/` directories:
- `persistence.test.ts`: Hash computation, save/load logic
- `resultsStageProcessor.test.ts`: Orchestration, error handling

**Run tests:**
```bash
npm test lib/results/__tests__
npm test lib/processing/__tests__/resultsStageProcessor.test.ts
```

## Error Handling

**Critical Errors** (fail-fast):
- Missing scores (required field)
- Cannot fetch assessment answers (needed for hash)
- Risk bundle not found (prerequisite)

**Non-critical** (warn and continue):
- Cannot fetch funnel_version_id (optional)
- Priority ranking not found (optional)

## Future Work

1. **Automatic Orchestration**: Call results stage after ranking
2. **Audit Logging**: Log to audit_log table
3. **Extended Hash**: Include documents, confirmed data
4. **Monitoring**: Track re-run frequency, hash collisions
5. **Caching**: Cache frequently accessed results

## Documentation

- **Implementation Summary**: `docs/e7/E73_3_IMPLEMENTATION_SUMMARY.md`
- **Security Summary**: `docs/e7/E73_3_SECURITY_SUMMARY.md`
- **API Catalog**: `docs/api/ENDPOINT_CATALOG.md`

## Related Issues

- **E73.1**: Assessment completion triggers job creation
- **E73.2**: Idempotent job creation
- **E73.3**: Calculated results writer (this module) ✅
- **E73.4**: Processing orchestrator (future)
