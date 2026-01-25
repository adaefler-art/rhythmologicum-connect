# I2.1 Implementation Summary: Canonical Patient State v0.1

**Epic:** I2 - Patient State & Dialog Enhancement  
**Issue:** [I2.1] Canonical Patient State v0.1 (Minimal Persistence + Versioning)  
**Status:** ✅ Complete  
**Date:** 2026-01-25

## Overview

Implemented a minimal, versioned, persistent patient state structure to support Dialog/Insights with stable state across navigation and reload. Uses existing storage patterns (Supabase + PostgreSQL JSONB).

## Implementation Details

### 1. Database Schema

**Migration:** `supabase/migrations/20260125215548_i2_1_create_patient_state.sql`

- Created `patient_state` table with:
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users, unique)
  - `patient_state_version` (text, default "0.1")
  - `state_data` (jsonb, stores the actual state)
  - `created_at`, `updated_at` (timestamps with auto-update trigger)
  
- **RLS Policies:**
  - Patients can SELECT/INSERT/UPDATE their own state
  - Clinicians can SELECT all patient states (read-only)
  
- **Added to canonical manifest:** `docs/canon/DB_SCHEMA_MANIFEST.json`

### 2. TypeScript Contracts

**File:** `lib/api/contracts/patient/state.ts`

Defined versioned PatientStateV01 schema with Zod validation:

```typescript
{
  patient_state_version: "0.1",
  assessment: {
    lastAssessmentId: string | null,
    status: 'not_started' | 'in_progress' | 'completed',
    progress: 0-1,
    completedAt: datetime | null
  },
  results: {
    summaryCards: ResultsSummaryCard[], // max 5
    recommendedActions: string[],
    lastGeneratedAt: datetime | null
  },
  dialog: {
    lastContext: 'dashboard' | 'results' | 'insights' | 'assessment' | 'none',
    messageCount: number,
    lastMessageAt: datetime | null
  },
  activity: {
    recentActivity: ActivityItem[] // max 10
  },
  metrics: {
    healthScore: { current, delta, updatedAt },
    keyMetrics: MetricSeries[] // max 5
  },
  updatedAt: datetime
}
```

**Helper functions:**
- `createEmptyPatientState()` - Returns default/empty state
- `validatePatientState(data)` - Validates state against schema
- `safeValidatePatientState(data)` - Safe validation with null on error
- `mergePatientState(current, update)` - Merges partial updates

### 3. API Routes

**File:** `apps/rhythm-patient-ui/app/api/patient/state/route.ts`

**GET /api/patient/state**
- Fetches current patient state for authenticated user
- Returns empty state if no state exists (not an error)
- Auth-first design (401 before any DB operations)
- RLS-safe queries

**POST /api/patient/state**
- Updates patient state (supports partial updates)
- Creates state if it doesn't exist (upsert pattern)
- Request body validated with Zod schema
- Merges updates into existing state

**Response format:**
```json
{
  "success": true,
  "data": PatientStateV01,
  "schemaVersion": "0.1",
  "requestId": "uuid"
}
```

## Guardrails Verification

All guardrails passed:

✅ **Migration Linter:** Passed - `patient_state` table validated against canonical manifest  
✅ **RLS Verification:** Passed - All 16 user data tables have RLS enabled  
✅ **TypeGen:** Passed - Generated types match committed types (hash verified)  
✅ **Build:** Successful - TypeScript compilation clean  
✅ **Code Review:** Completed and all issues addressed

## Testing

### Manual Test Scenarios

**Test 1: State Creation**
```bash
# As authenticated patient
curl -X POST http://localhost:3000/api/patient/state \
  -H "Content-Type: application/json" \
  -d '{"assessment": {"status": "in_progress", "progress": 0.5}}'
```

**Test 2: State Retrieval**
```bash
# As authenticated patient
curl http://localhost:3000/api/patient/state
# Should return empty state if never created, or current state
```

**Test 3: Partial Update**
```bash
# Update only activity
curl -X POST http://localhost:3000/api/patient/state \
  -H "Content-Type: application/json" \
  -d '{"activity": {"recentActivity": [{"type": "assessment_completed", "label": "Stress Assessment", "timestamp": "2026-01-25T22:00:00Z"}]}}'
```

**Test 4: Reload Persistence**
1. Navigate to /patient/dashboard
2. Complete an action that updates state
3. Reload page
4. State should persist (fetched from DB)

## Architecture Decisions

**Storage Choice:** PostgreSQL with JSONB
- **Rationale:** Uses existing Supabase infrastructure, no new services
- **Pros:** Flexible schema evolution, RLS support, familiar patterns
- **Cons:** None significant for this use case

**Versioning:** String field "0.1"
- **Rationale:** Enables schema evolution without breaking changes
- **Future:** Can add migration logic when upgrading to v0.2+

**Partial Updates:** Merge pattern in POST
- **Rationale:** Allows updating specific sections without sending full state
- **Implementation:** `mergePatientState()` helper function

**Empty State Behavior:** Return default, not 404
- **Rationale:** Simplifies client logic (no special case for "no state yet")
- **Implementation:** `createEmptyPatientState()` used when state not found

## Files Changed

```
docs/canon/DB_SCHEMA_MANIFEST.json               +1 table
lib/api/contracts/patient/index.ts               +1 export
lib/api/contracts/patient/state.ts               +253 lines (new)
lib/types/supabase.ts                            +38 lines (typegen)
apps/rhythm-patient-ui/app/api/patient/state/route.ts  +356 lines (new)
supabase/migrations/20260125215548_i2_1_create_patient_state.sql  +72 lines (new)
```

## Known Limitations / Future Work

1. **Client Integration:** Not included in v0.1 minimal implementation
   - Dashboard can consume state in follow-up work
   - Insights can use state for context
   - Dialog can track conversation state

2. **State Cleanup:** No TTL or cleanup policy
   - Could add in future if storage becomes concern
   - Current: State persists indefinitely

3. **Clinician Write Access:** RLS allows read-only for clinicians
   - Intentional for v0.1 (patient-owned state)
   - Can add clinician write policies if needed for clinical workflows

4. **Optimistic Locking:** Not implemented
   - Concurrent updates use last-write-wins
   - Consider adding version field if needed

## Acceptance Criteria

✅ **AC1:** State is versioned (patient_state_version: "0.1")  
✅ **AC2:** State persists across reload (deterministic DB storage)  
✅ **AC3:** Empty state is explicit (createEmptyPatientState default)  
✅ **AC4:** Storage uses existing mechanisms (Supabase/PostgreSQL)  
✅ **AC5:** All guardrails pass (migration linter, RLS, typegen, build)

## Evidence

**Migration Linter:**
```
✅ Loaded canonical manifest (v0.5.0)
⚠️  WARNINGS (3 deprecated objects detected) - unrelated to this change
```

**RLS Verification:**
```
✅ Table public.patient_state: RLS enabled with patient policy
✅ All RLS checks passed!
ℹ️  Checked 16 user data tables
```

**TypeGen Verification:**
```
✅ ✓ Types match! Files are identical.
ℹ️  Committed:  BB1777E16C886BA5B01533FAB4AF2A4621D0FD8E5EE278D1F89947E08017DEB3
ℹ️  Generated:  BB1777E16C886BA5B01533FAB4AF2A4621D0FD8E5EE278D1F89947E08017DEB3
```

**Build:**
```
✓ Compiled successfully in 12.3s
```

## API Usage Example

```typescript
// Fetch current state
const response = await fetch('/api/patient/state')
const { data: state } = await response.json()

// Update state (partial)
await fetch('/api/patient/state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assessment: {
      status: 'completed',
      progress: 1.0,
      completedAt: new Date().toISOString()
    },
    activity: {
      recentActivity: [
        {
          type: 'assessment_completed',
          label: 'Completed Stress Assessment',
          timestamp: new Date().toISOString()
        }
      ]
    }
  })
})
```

## References

- Issue: [I2.1] Canonical Patient State v0.1
- Epic: I2 - Patient State & Dialog Enhancement
- Migration: `20260125215548_i2_1_create_patient_state.sql`
- Contract: `lib/api/contracts/patient/state.ts`
- API: `apps/rhythm-patient-ui/app/api/patient/state/route.ts`
