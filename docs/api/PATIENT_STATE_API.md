# Patient State v0.1 API Documentation

## Overview

The Patient State v0.1 API provides persistent, versioned state management for patient data across Dialog, Insights, and Dashboard components. This ensures state consistency across page reloads and navigation.

**Issue Reference**: I2.1 - Canonical Patient State v0.1 (Minimal Persistence + Versioning)

## Key Features

- ✅ **Versioned Structure**: Schema version tracking (currently v0.1)
- ✅ **Persistent Storage**: Database-backed state (survives page reloads)
- ✅ **RLS Security**: Patient can only access their own state; clinicians view all
- ✅ **Idempotent Updates**: Partial state updates with deep merge
- ✅ **Default State**: Automatic initialization with sensible defaults
- ✅ **Type Safety**: Full TypeScript support with custom types

## Database Schema

### Table: `patient_state`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `patient_id` | uuid | Foreign key to `patient_profiles.id` (unique) |
| `patient_state_version` | text | Schema version (default: "0.1") |
| `assessment` | jsonb | Assessment progress state |
| `results` | jsonb | Results summary state |
| `dialog` | jsonb | Dialog context state |
| `activity` | jsonb | Recent activity state |
| `metrics` | jsonb | Health metrics state |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp (auto-updated) |

### State Structure (v0.1)

```typescript
{
  patient_state_version: "0.1",
  assessment: {
    lastAssessmentId: string | null,
    status: "not_started" | "in_progress" | "completed",
    progress: number, // 0.0 to 1.0
    completedAt: string | null // ISO 8601 timestamp
  },
  results: {
    summaryCards: SummaryCard[], // 3-5 cards
    recommendedActions: string[], // Action IDs or labels
    lastGeneratedAt: string | null // ISO 8601 timestamp
  },
  dialog: {
    lastContext: "dashboard" | "results" | "insights" | "assessment",
    messageCount: number,
    lastMessageAt: string | null // ISO 8601 timestamp
  },
  activity: {
    recentActivity: RecentActivity[] // {type, label, timestamp}
  },
  metrics: {
    healthScore: {
      current: number | null,
      delta: number | null
    },
    keyMetrics: {
      HR: MetricDataPoint[], // Heart Rate
      BP: MetricDataPoint[], // Blood Pressure
      Sleep: MetricDataPoint[],
      Weight: MetricDataPoint[]
    }
  }
}
```

## API Endpoints

### GET /api/patient/state

Fetches the current patient state. If no state exists, creates and returns a default empty state.

**Authentication**: Required (patient must be logged in)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_state_version": "0.1",
    "assessment": { ... },
    "results": { ... },
    "dialog": { ... },
    "activity": { ... },
    "metrics": { ... },
    "created_at": "2026-01-25T11:00:00Z",
    "updated_at": "2026-01-25T11:00:00Z"
  },
  "meta": {
    "version": "0.1",
    "created": false
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Patient profile not found
- `500 Internal Server Error`: Database error

**Example Usage**:
```typescript
const response = await fetch('/api/patient/state', {
  credentials: 'include'
})

const { success, data, meta } = await response.json()

if (success) {
  console.log('Current state:', data)
  console.log('Was created:', meta.created)
}
```

### PATCH /api/patient/state

Updates the patient state with partial data. Uses idempotent update logic with deep merge.

**Authentication**: Required (patient must be logged in)

**Request Body**:
```typescript
{
  assessment?: Partial<AssessmentState>,
  results?: Partial<ResultsState>,
  dialog?: Partial<DialogState>,
  activity?: Partial<ActivityState>,
  metrics?: Partial<MetricsState>
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_state_version": "0.1",
    "assessment": { ... },
    "results": { ... },
    "dialog": { ... },
    "activity": { ... },
    "metrics": { ... },
    "created_at": "2026-01-25T11:00:00Z",
    "updated_at": "2026-01-25T11:05:00Z"
  },
  "meta": {
    "version": "0.1",
    "updated": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid JSON payload
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Patient profile not found
- `500 Internal Server Error`: Database error

**Example Usage**:
```typescript
// Update assessment status
const response = await fetch('/api/patient/state', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    assessment: {
      status: 'completed',
      progress: 1.0,
      completedAt: new Date().toISOString()
    }
  })
})

const { success, data } = await response.json()

if (success) {
  console.log('Updated state:', data)
}
```

## Client Hook: `usePatientState`

A React hook for easy state management following the `useDashboardData` pattern.

**Import**:
```typescript
import { usePatientState } from '@/lib/hooks/usePatientState'
```

**Usage**:
```typescript
function MyComponent() {
  const { 
    data,           // Current patient state
    state,          // Fetch state: 'idle' | 'loading' | 'revalidating' | 'error'
    error,          // Error message (if any)
    isStale,        // True if showing stale data while revalidating
    updateState,    // Update state: 'idle' | 'updating' | 'error'
    updateError,    // Update error message (if any)
    refresh,        // Manually refresh state
    retry,          // Retry after error
    update          // Update state with partial data
  } = usePatientState()

  // Loading state
  if (state === 'loading') {
    return <LoadingSpinner />
  }

  // Error state
  if (error) {
    return <ErrorState onRetry={retry} message={error} />
  }

  // Update example
  const handleComplete = async () => {
    const success = await update({
      assessment: {
        status: 'completed',
        progress: 1.0
      }
    })
    
    if (success) {
      console.log('State updated successfully')
    }
  }

  return (
    <div>
      <h1>Assessment Progress: {data?.assessment.progress * 100}%</h1>
      <button onClick={handleComplete} disabled={updateState === 'updating'}>
        {updateState === 'updating' ? 'Saving...' : 'Mark Complete'}
      </button>
    </div>
  )
}
```

**Features**:
- ✅ Auto-fetch on mount (configurable)
- ✅ Stale-while-revalidate pattern
- ✅ Concurrent fetch prevention
- ✅ AbortController for cleanup
- ✅ Partial updates with optimistic UI

## TypeScript Types

**Import**:
```typescript
import type { 
  PatientStateV01,
  PatientStateUpdate,
  AssessmentState,
  ResultsState,
  DialogState,
  ActivityState,
  MetricsState,
  SummaryCard,
  RecentActivity,
  MetricDataPoint
} from '@/lib/types/patient-state'

import { 
  PATIENT_STATE_VERSION,
  createDefaultPatientState,
  isPatientStateV01 
} from '@/lib/types/patient-state'
```

**Type Definitions**:
- `PatientStateV01`: Complete patient state structure
- `PatientStateUpdate`: Partial update payload type
- `AssessmentState`: Assessment progress state
- `ResultsState`: Results summary state
- `DialogState`: Dialog context state
- `ActivityState`: Recent activity state
- `MetricsState`: Health metrics state

**Helper Functions**:
- `createDefaultPatientState()`: Creates default empty state
- `isPatientStateV01(state)`: Type guard for v0.1 state
- `PATIENT_STATE_VERSION`: Current version constant ("0.1")

## Versioning Strategy

The `patient_state_version` field tracks schema evolution:

- **v0.1 (Current)**: Initial implementation with assessment, results, dialog, activity, and metrics
- **Future versions**: Will be backward compatible or provide migration path
- **Type guards**: Use `isPatientStateV01()` to check version at runtime

**Migration Planning**:
When introducing v0.2, add:
1. New version constant: `PATIENT_STATE_VERSION_V02 = '0.2'`
2. New type: `PatientStateV02`
3. Migration function: `migrateV01toV02(state: PatientStateV01): PatientStateV02`
4. Update API to handle both versions during transition

## Security

### Row Level Security (RLS)

The `patient_state` table has the following RLS policies:

1. **patient_state_select_own**: Patients can SELECT their own state
2. **patient_state_insert_own**: Patients can INSERT their own state (first-time)
3. **patient_state_update_own**: Patients can UPDATE their own state
4. **patient_state_select_clinician**: Clinicians can SELECT all patient states

**Policy Logic**:
- Patient access: `patient_id` matches the logged-in user's `patient_profiles.id`
- Clinician access: User has `role` = 'clinician' or 'admin' in `user_profiles.metadata`

### Authentication

All API endpoints require:
1. Valid Supabase session cookie
2. User authenticated via Supabase Auth
3. RLS policies automatically enforce user-scoped access

## Performance Considerations

- **Default State**: Created on first access (lazy initialization)
- **Indexes**: `patient_id` and `patient_state_version` are indexed
- **Unique Constraint**: One state record per patient (`patient_id` unique)
- **Auto-update**: `updated_at` timestamp automatically maintained by trigger
- **Stale-while-revalidate**: Client hook shows cached data while fetching updates

## Testing Checklist

### Manual Testing Steps

1. **First Access**:
   - Login as patient
   - Call GET `/api/patient/state`
   - Verify default state is created
   - Verify `meta.created = true`

2. **State Persistence**:
   - Update state via PATCH
   - Reload page
   - Verify state persists

3. **Partial Updates**:
   - PATCH with only `assessment` field
   - Verify other fields remain unchanged

4. **RLS Enforcement**:
   - Login as Patient A
   - Try to access Patient B's state
   - Verify access denied (empty result)

5. **Clinician Access**:
   - Login as clinician
   - Verify can access all patient states

## Troubleshooting

### Common Issues

**Issue**: API returns 404 "Patient profile not found"
- **Cause**: User doesn't have a `patient_profiles` record
- **Solution**: Ensure onboarding creates patient profile

**Issue**: Build errors with type mismatches
- **Cause**: Supabase types not regenerated
- **Solution**: Run `pwsh scripts/db/typegen.ps1 -Generate`

**Issue**: State not persisting
- **Cause**: RLS policies blocking writes
- **Solution**: Check user authentication and patient profile ID

## Related Documentation

- [I2.1 Issue Description](../../../docs/I2.1-PATIENT-STATE.md)
- [DB Schema Manifest](../../../docs/canon/DB_SCHEMA_MANIFEST.json)
- [Migration File](../../../supabase/migrations/20260125110900_i2_1_patient_state_v0_1.sql)
- [TypeScript Types](../../../lib/types/patient-state.ts)
- [Client Hook](../../../lib/hooks/usePatientState.ts)

## Changelog

### v0.1 (2026-01-25)
- Initial implementation
- Database table creation
- API endpoints (GET, PATCH)
- Client hook
- TypeScript types
- RLS policies
- Documentation
