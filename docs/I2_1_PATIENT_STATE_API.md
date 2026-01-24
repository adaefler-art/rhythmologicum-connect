# Patient State API - I2.1

## Overview

The Canonical Patient State v0.1 provides a minimal, versioned, deterministically reloadable state structure for patient-facing features (Dashboard, Dialog, Insights). This replaces UI-only state with server-side persistence that survives reload and navigation.

## Motivation

**Problem**: Dialog/Insights need a common, stable state (Assessment progress, Results summary, Recent Activity). Currently parts are UI-only and lost on reload.

**Solution**: Introduce a minimal canonical patient state structure that:
- Persists across reload/navigation
- Is versioned for iOS compatibility
- Has clean default/empty states
- Is deterministically reloadable

## API Endpoints

### GET `/api/patient/state`

Returns the canonical patient state for the authenticated user. If no state exists, returns a clean default/empty state (lazy initialization).

**Request:**
- No body required
- Requires authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "patient_state_version": "0.1",
    "assessment": {
      "lastAssessmentId": "uuid | null",
      "status": "not_started | in_progress | completed",
      "progress": 0.5,
      "completedAt": "2026-01-24T16:00:00Z | null"
    },
    "results": {
      "summaryCards": [
        {
          "id": "card-1",
          "type": "metric | insight | recommendation",
          "title": "Stress Level",
          "value": "Medium",
          "description": "Your stress level is moderate",
          "priority": 1
        }
      ],
      "recommendedActions": ["action-id-1", "action-id-2"],
      "lastGeneratedAt": "2026-01-24T16:00:00Z | null"
    },
    "dialog": {
      "lastContext": "dashboard | results | assessment | other | null",
      "messageCount": 5,
      "lastMessageAt": "2026-01-24T16:00:00Z | null"
    },
    "activity": {
      "recentActivity": [
        {
          "type": "assessment_completed | result_generated | content_viewed | action_taken",
          "label": "Completed Stress Assessment",
          "timestamp": "2026-01-24T16:00:00Z"
        }
      ]
    },
    "metrics": {
      "healthScore": {
        "current": 75,
        "delta": 5
      },
      "keyMetrics": [
        {
          "type": "hr | bp_systolic | bp_diastolic | sleep_hours | weight",
          "current": 72,
          "unit": "bpm",
          "series": [
            {
              "timestamp": "2026-01-24T16:00:00Z",
              "value": 72
            }
          ]
        }
      ]
    }
  },
  "schemaVersion": "v1",
  "requestId": "correlation-uuid"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "schemaVersion": "v1",
  "requestId": "correlation-uuid"
}
```

**Status Codes:**
- `200` - Success (state returned or empty state)
- `401` - Unauthenticated
- `500` - Internal server error

### POST `/api/patient/state`

Updates the canonical patient state for the authenticated user. Supports partial updates (only include fields you want to update). Uses upsert pattern (creates if doesn't exist, updates if exists).

**Request:**
```json
{
  "assessment": {
    "lastAssessmentId": "uuid",
    "status": "in_progress",
    "progress": 0.5
  },
  "activity": {
    "recentActivity": [
      {
        "type": "assessment_completed",
        "label": "Completed Stress Assessment",
        "timestamp": "2026-01-24T16:00:00Z"
      }
    ]
  }
}
```

**Response:**
Same format as GET endpoint with updated state.

**Status Codes:**
- `200` - Success (state updated)
- `401` - Unauthenticated
- `500` - Internal server error

## Client-Side Usage

### Hook: `usePatientState`

React hook for managing patient state with optimistic updates and error handling.

```typescript
import { usePatientState } from '@/lib/hooks/usePatientState'

function MyComponent() {
  const { state, fetchState, error, updateState, retry } = usePatientState()

  // Update assessment progress
  const handleUpdateProgress = async () => {
    await updateState({
      assessment: {
        lastAssessmentId: 'uuid',
        status: 'in_progress',
        progress: 0.5
      }
    })
  }

  // Add activity
  const handleAddActivity = async () => {
    const newActivity = [
      ...(state?.activity.recentActivity || []),
      {
        type: 'assessment_completed',
        label: 'Completed Stress Assessment',
        timestamp: new Date().toISOString()
      }
    ]
    
    await updateState({
      activity: {
        recentActivity: newActivity.slice(-10) // Keep last 10
      }
    })
  }

  if (fetchState === 'loading') return <LoadingSkeleton />
  if (error) return <ErrorState onRetry={retry} />
  
  return <Dashboard state={state} />
}
```

**Hook Options:**
- `autoFetch` (boolean, default: true) - Automatically fetch on mount

**Hook Returns:**
- `state` - Current patient state (null if not loaded)
- `fetchState` - 'idle' | 'loading' | 'updating' | 'error'
- `error` - Error message if any
- `refresh()` - Manually refresh state from server
- `updateState(update)` - Update state (partial updates supported)
- `retry()` - Retry after error

## Schema Version

**Current Version:** `v1`

The `schemaVersion` field in responses allows iOS clients to detect and handle schema changes. The version should be incremented when making breaking changes to the response structure.

## Empty/Default State

When no patient state exists in the database (e.g., new user), the API returns a clean default state:

```typescript
{
  patient_state_version: "0.1",
  assessment: {
    lastAssessmentId: null,
    status: "not_started",
    progress: 0,
    completedAt: null
  },
  results: {
    summaryCards: [],
    recommendedActions: [],
    lastGeneratedAt: null
  },
  dialog: {
    lastContext: null,
    messageCount: 0,
    lastMessageAt: null
  },
  activity: {
    recentActivity: []
  },
  metrics: {
    healthScore: {
      current: null,
      delta: null
    },
    keyMetrics: []
  }
}
```

## Database Schema

The patient state is stored in the `patient_state` table with Row Level Security (RLS) policies ensuring users can only access their own state.

**Table:** `public.patient_state`

**Key Fields:**
- `user_id` - Foreign key to auth.users (unique constraint)
- `patient_state_version` - Version marker ("0.1")
- Assessment fields: `assessment_last_assessment_id`, `assessment_status`, `assessment_progress`, `assessment_completed_at`
- Results fields: `results_summary_cards` (JSONB), `results_recommended_actions` (JSONB), `results_last_generated_at`
- Dialog fields: `dialog_last_context`, `dialog_message_count`, `dialog_last_message_at`
- Activity fields: `activity_recent` (JSONB)
- Metrics fields: `metrics_health_score_current`, `metrics_health_score_delta`, `metrics_key_metrics` (JSONB)
- Metadata: `created_at`, `updated_at`

**RLS Policies:**
- `patient_state_select_policy` - Users can only read their own state
- `patient_state_insert_policy` - Users can only insert their own state
- `patient_state_update_policy` - Users can only update their own state
- `patient_state_delete_policy` - Users can only delete their own state

## Acceptance Criteria

✅ **AC1: Reload/Navigation persists state**
- State is stored in database, survives page reload and navigation
- Client-side hook fetches state on mount
- Updates are immediately persisted to database

✅ **AC2: State is versioned**
- `patient_state_version: "0.1"` in data
- `schemaVersion: "v1"` in response envelope
- Clean default/empty state when not found

✅ **AC3: No new UI tokens**
- UI consumes only state from hook
- No hard-coded values or local-only state for canonical data

## Verification Steps

### Manual Testing

1. **Test Empty State (New User)**
   ```bash
   # Login as new user
   # Navigate to /patient/dashboard
   # API should return empty state, UI should render gracefully
   ```

2. **Test State Update**
   ```typescript
   // Update assessment progress
   await updateState({
     assessment: { status: 'in_progress', progress: 0.5 }
   })
   
   // Reload page
   // State should persist (progress still 0.5)
   ```

3. **Test Reload Persistence**
   ```bash
   # Update state via UI or API
   # Hard reload (Ctrl+Shift+R)
   # Verify state is maintained
   ```

4. **Test Navigation**
   ```bash
   # Update state on dashboard
   # Navigate to another page
   # Navigate back to dashboard
   # Verify state is maintained
   ```

### PowerShell Verify

```powershell
npm run build
# Manual:
# /patient/dashboard → update state → reload → state persists
# Check browser DevTools Network tab for API calls
# Verify responses include schemaVersion: "v1"
```

## Migration Path

The migration `20260124164201_i2_1_patient_state_v0_1.sql` creates the table, RLS policies, indexes, and triggers. Run migrations:

```bash
# Local development
supabase db reset

# Production
supabase db push
```

## Future Enhancements

- **v0.2**: Add caching layer for frequently accessed state
- **v0.3**: Add state change subscriptions for real-time updates
- **v0.4**: Add state history/audit trail for debugging

## Contract Location

Contracts are defined in:
- `packages/rhythm-core/src/contracts/patient/state.ts` - Source of truth
- `lib/api/contracts/patient/state.ts` - Re-export for app usage

## References

- Issue: [I2.1] Canonical Patient State v0.1 (Minimal Persistence + Versioning)
- Migration: `supabase/migrations/20260124164201_i2_1_patient_state_v0_1.sql`
- API Route: `apps/rhythm-patient-ui/app/api/patient/state/route.ts`
- Client Hook: `lib/hooks/usePatientState.ts`
