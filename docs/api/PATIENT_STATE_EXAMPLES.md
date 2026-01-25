# Patient State v0.1 - Usage Examples

This document provides practical examples for using the Patient State v0.1 API.

## Basic Usage

### 1. Fetching Patient State

```typescript
// Using fetch directly
async function fetchPatientState() {
  try {
    const response = await fetch('/api/patient/state', {
      credentials: 'include'
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Patient state:', result.data)
      return result.data
    } else {
      console.error('Error:', result.error)
      return null
    }
  } catch (error) {
    console.error('Failed to fetch state:', error)
    return null
  }
}

// Using the hook (recommended)
import { usePatientState } from '@/lib/hooks/usePatientState'

function DashboardComponent() {
  const { data, state, error, refresh } = usePatientState()
  
  if (state === 'loading') {
    return <div>Loading patient state...</div>
  }
  
  if (error) {
    return <div>Error: {error}</div>
  }
  
  return (
    <div>
      <h1>Assessment Status: {data?.assessment.status}</h1>
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

### 2. Updating Assessment Progress

```typescript
// Track assessment completion
import { usePatientState } from '@/lib/hooks/usePatientState'

function AssessmentFlow() {
  const { update, updateState } = usePatientState()
  
  const handleStepComplete = async (stepIndex: number, totalSteps: number) => {
    const progress = (stepIndex + 1) / totalSteps
    
    const success = await update({
      assessment: {
        progress: progress
      }
    })
    
    if (success) {
      console.log(`Progress updated to ${progress * 100}%`)
    }
  }
  
  const handleAssessmentComplete = async (assessmentId: string) => {
    const success = await update({
      assessment: {
        lastAssessmentId: assessmentId,
        status: 'completed',
        progress: 1.0,
        completedAt: new Date().toISOString()
      }
    })
    
    if (success) {
      // Navigate to results or show success message
      console.log('Assessment completed!')
    }
  }
  
  return (
    <div>
      <button 
        onClick={() => handleStepComplete(0, 5)}
        disabled={updateState === 'updating'}
      >
        Complete Step 1
      </button>
      
      <button 
        onClick={() => handleAssessmentComplete('assessment-123')}
        disabled={updateState === 'updating'}
      >
        {updateState === 'updating' ? 'Saving...' : 'Complete Assessment'}
      </button>
    </div>
  )
}
```

### 3. Displaying Results Summary

```typescript
import { usePatientState } from '@/lib/hooks/usePatientState'
import type { SummaryCard } from '@/lib/types/patient-state'

function ResultsDashboard() {
  const { data, update } = usePatientState()
  
  // Update results when new assessment completes
  const handleNewResults = async (cards: SummaryCard[]) => {
    await update({
      results: {
        summaryCards: cards,
        lastGeneratedAt: new Date().toISOString()
      }
    })
  }
  
  if (!data?.results.summaryCards.length) {
    return <div>No results available yet</div>
  }
  
  return (
    <div>
      <h2>Your Results</h2>
      <div className="grid">
        {data.results.summaryCards.map((card) => (
          <div key={card.id} className="card">
            <h3>{card.title}</h3>
            <p className="value">{card.value}</p>
            {card.trend && <span className={`trend-${card.trend}`}>{card.trend}</span>}
          </div>
        ))}
      </div>
      <p>Last updated: {data.results.lastGeneratedAt}</p>
    </div>
  )
}
```

### 4. Tracking Dialog Context

```typescript
import { usePatientState } from '@/lib/hooks/usePatientState'

function AMYDialog() {
  const { data, update } = usePatientState()
  
  // Track when dialog is opened
  const handleDialogOpen = async (context: 'dashboard' | 'results' | 'insights') => {
    await update({
      dialog: {
        lastContext: context,
        messageCount: (data?.dialog.messageCount || 0) + 1,
        lastMessageAt: new Date().toISOString()
      }
    })
  }
  
  // Example: Open dialog from results page
  return (
    <button onClick={() => handleDialogOpen('results')}>
      Open AMY Assistant
    </button>
  )
}
```

### 5. Recording Recent Activity

```typescript
import { usePatientState } from '@/lib/hooks/usePatientState'
import type { RecentActivity } from '@/lib/types/patient-state'

function ActivityTracker() {
  const { data, update } = usePatientState()
  
  const addActivity = async (type: string, label: string) => {
    const newActivity: RecentActivity = {
      type,
      label,
      timestamp: new Date().toISOString()
    }
    
    // Keep only last 10 activities
    const existingActivities = data?.activity.recentActivity || []
    const updatedActivities = [newActivity, ...existingActivities].slice(0, 10)
    
    await update({
      activity: {
        recentActivity: updatedActivities
      }
    })
  }
  
  // Example: Track assessment start
  const handleAssessmentStart = () => {
    addActivity('assessment', 'Started Stress Assessment')
  }
  
  // Display recent activity
  return (
    <div>
      <h3>Recent Activity</h3>
      <ul>
        {data?.activity.recentActivity.map((activity, idx) => (
          <li key={idx}>
            <strong>{activity.type}:</strong> {activity.label}
            <span className="timestamp">
              {new Date(activity.timestamp).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 6. Updating Health Metrics

```typescript
import { usePatientState } from '@/lib/hooks/usePatientState'
import type { MetricDataPoint } from '@/lib/types/patient-state'

function MetricsUpdater() {
  const { data, update } = usePatientState()
  
  const addMetricDataPoint = async (
    metricKey: 'HR' | 'BP' | 'Sleep' | 'Weight',
    value: number
  ) => {
    const dataPoint: MetricDataPoint = {
      timestamp: new Date().toISOString(),
      value
    }
    
    // Get existing data points
    const existingMetrics = data?.metrics.keyMetrics || {
      HR: [],
      BP: [],
      Sleep: [],
      Weight: []
    }
    
    // Add new data point (keep last 30 entries)
    const updatedMetrics = {
      ...existingMetrics,
      [metricKey]: [...existingMetrics[metricKey], dataPoint].slice(-30)
    }
    
    await update({
      metrics: {
        keyMetrics: updatedMetrics
      }
    })
  }
  
  const updateHealthScore = async (current: number, delta: number) => {
    await update({
      metrics: {
        healthScore: {
          current,
          delta
        }
      }
    })
  }
  
  return (
    <div>
      <button onClick={() => addMetricDataPoint('Sleep', 7.5)}>
        Log Sleep (7.5 hours)
      </button>
      
      <button onClick={() => updateHealthScore(85, +5)}>
        Update Health Score
      </button>
    </div>
  )
}
```

### 7. Complete Dashboard Example

```typescript
'use client'

import { usePatientState } from '@/lib/hooks/usePatientState'
import { useEffect } from 'react'

function PatientDashboard() {
  const { 
    data, 
    state, 
    error, 
    isStale,
    refresh, 
    retry,
    update 
  } = usePatientState()
  
  // Auto-refresh on focus
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    
    document.addEventListener('visibilitychange', handleFocus)
    return () => document.removeEventListener('visibilitychange', handleFocus)
  }, [refresh])
  
  // Loading state
  if (state === 'loading') {
    return (
      <div className="dashboard">
        <div className="skeleton">Loading your dashboard...</div>
      </div>
    )
  }
  
  // Error state with retry
  if (error) {
    return (
      <div className="dashboard error">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
        <button onClick={retry}>Try Again</button>
      </div>
    )
  }
  
  // No data (shouldn't happen, but good to handle)
  if (!data) {
    return <div>No data available</div>
  }
  
  return (
    <div className="dashboard">
      {/* Show stale indicator while revalidating */}
      {isStale && (
        <div className="banner warning">
          Updating dashboard...
        </div>
      )}
      
      {/* Assessment Status Card */}
      <div className="card">
        <h2>Assessment Progress</h2>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${data.assessment.progress * 100}%` }}
          />
        </div>
        <p>Status: {data.assessment.status}</p>
        {data.assessment.completedAt && (
          <p>Completed: {new Date(data.assessment.completedAt).toLocaleDateString()}</p>
        )}
      </div>
      
      {/* Results Summary */}
      {data.results.summaryCards.length > 0 && (
        <div className="card">
          <h2>Your Results</h2>
          <div className="summary-grid">
            {data.results.summaryCards.map((card) => (
              <div key={card.id} className="summary-card">
                <h3>{card.title}</h3>
                <span className="value">{card.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Health Metrics */}
      {data.metrics.healthScore.current !== null && (
        <div className="card">
          <h2>Health Score</h2>
          <div className="score">
            <span className="current">{data.metrics.healthScore.current}</span>
            {data.metrics.healthScore.delta !== null && (
              <span className={`delta ${data.metrics.healthScore.delta >= 0 ? 'positive' : 'negative'}`}>
                {data.metrics.healthScore.delta > 0 ? '+' : ''}
                {data.metrics.healthScore.delta}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Recent Activity */}
      {data.activity.recentActivity.length > 0 && (
        <div className="card">
          <h2>Recent Activity</h2>
          <ul className="activity-list">
            {data.activity.recentActivity.slice(0, 5).map((activity, idx) => (
              <li key={idx}>
                <span className="type">{activity.type}</span>
                <span className="label">{activity.label}</span>
                <span className="time">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Manual Refresh */}
      <button onClick={refresh} className="refresh-btn">
        Refresh Dashboard
      </button>
    </div>
  )
}

export default PatientDashboard
```

## Advanced Patterns

### Custom Hook for Specific State Section

```typescript
import { usePatientState } from '@/lib/hooks/usePatientState'

// Hook for managing only assessment state
export function useAssessmentState() {
  const { data, update, updateState, updateError } = usePatientState()
  
  const updateAssessment = async (
    assessment: Partial<AssessmentState>
  ) => {
    return await update({ assessment })
  }
  
  return {
    assessment: data?.assessment,
    updateAssessment,
    isUpdating: updateState === 'updating',
    error: updateError
  }
}

// Usage
function AssessmentComponent() {
  const { assessment, updateAssessment, isUpdating } = useAssessmentState()
  
  return (
    <div>
      <p>Progress: {(assessment?.progress || 0) * 100}%</p>
      <button 
        onClick={() => updateAssessment({ progress: 0.5 })}
        disabled={isUpdating}
      >
        Update Progress
      </button>
    </div>
  )
}
```

### Optimistic UI Updates

```typescript
import { usePatientState } from '@/lib/hooks/usePatientState'
import { useState } from 'react'

function OptimisticProgressBar() {
  const { data, update } = usePatientState()
  const [optimisticProgress, setOptimisticProgress] = useState<number | null>(null)
  
  const displayProgress = optimisticProgress ?? data?.assessment.progress ?? 0
  
  const handleProgressUpdate = async (newProgress: number) => {
    // Optimistically update UI
    setOptimisticProgress(newProgress)
    
    // Perform actual update
    const success = await update({
      assessment: { progress: newProgress }
    })
    
    // Clear optimistic state
    setOptimisticProgress(null)
    
    if (!success) {
      // Handle error - optimistic update will be rolled back
      alert('Failed to update progress')
    }
  }
  
  return (
    <div className="progress-bar">
      <div 
        className="fill" 
        style={{ width: `${displayProgress * 100}%` }}
      />
    </div>
  )
}
```

## Migration Example (for future v0.2)

```typescript
import type { PatientStateV01 } from '@/lib/types/patient-state'

// Example migration function for future use
function migrateV01toV02(stateV01: PatientStateV01): PatientStateV02 {
  return {
    ...stateV01,
    patient_state_version: '0.2',
    // Add new fields with defaults
    newField: 'default_value',
    // Transform existing fields if needed
    assessment: {
      ...stateV01.assessment,
      // Add new assessment fields
    }
  }
}

// In API route or hook, check version and migrate
const state = await fetchState()
if (state.patient_state_version === '0.1') {
  const migratedState = migrateV01toV02(state)
  await updateState(migratedState)
}
```

## Testing Examples

```typescript
// Mock data for testing
export const mockPatientState: PatientStateV01 = {
  id: 'state-123',
  patient_id: 'patient-456',
  patient_state_version: '0.1',
  assessment: {
    lastAssessmentId: 'assessment-789',
    status: 'completed',
    progress: 1.0,
    completedAt: '2026-01-25T10:00:00Z'
  },
  results: {
    summaryCards: [
      {
        id: 'card-1',
        title: 'Stress Level',
        value: 'Medium',
        severity: 'medium'
      }
    ],
    recommendedActions: ['action-1', 'action-2'],
    lastGeneratedAt: '2026-01-25T10:00:00Z'
  },
  dialog: {
    lastContext: 'results',
    messageCount: 5,
    lastMessageAt: '2026-01-25T09:00:00Z'
  },
  activity: {
    recentActivity: [
      {
        type: 'assessment',
        label: 'Completed Stress Assessment',
        timestamp: '2026-01-25T10:00:00Z'
      }
    ]
  },
  metrics: {
    healthScore: {
      current: 75,
      delta: +5
    },
    keyMetrics: {
      HR: [{ timestamp: '2026-01-25T08:00:00Z', value: 72 }],
      BP: [],
      Sleep: [{ timestamp: '2026-01-25T07:00:00Z', value: 7.5 }],
      Weight: []
    }
  },
  created_at: '2026-01-20T12:00:00Z',
  updated_at: '2026-01-25T10:00:00Z'
}
```
