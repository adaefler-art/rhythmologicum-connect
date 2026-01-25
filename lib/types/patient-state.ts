/**
 * Patient State v0.1 - Type Definitions
 * 
 * Canonical patient state structure for UI consistency across
 * Dialog, Insights, and Dashboard components.
 * 
 * Issue: I2.1 - Canonical Patient State v0.1 (Minimal Persistence + Versioning)
 * 
 * @module lib/types/patient-state
 */

/**
 * Patient State Version Constant
 * Increment when making breaking changes to the state structure
 */
export const PATIENT_STATE_VERSION = '0.1' as const

/**
 * Assessment status enum
 */
export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed'

/**
 * Dialog context enum
 */
export type DialogContext = 'dashboard' | 'results' | 'insights' | 'assessment'

/**
 * Recent activity item
 */
export interface RecentActivity {
  type: string
  label: string
  timestamp: string // ISO 8601 timestamp
}

/**
 * Summary card for results display
 */
export interface SummaryCard {
  id: string
  title: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  severity?: 'low' | 'medium' | 'high'
}

/**
 * Health score with delta tracking
 */
export interface HealthScore {
  current: number | null
  delta: number | null
}

/**
 * Time-series data point for metrics
 */
export interface MetricDataPoint {
  timestamp: string // ISO 8601 timestamp
  value: number
}

/**
 * Assessment State Component
 */
export interface AssessmentState {
  lastAssessmentId: string | null
  status: AssessmentStatus
  progress: number // 0.0 to 1.0
  completedAt: string | null // ISO 8601 timestamp
}

/**
 * Results State Component
 */
export interface ResultsState {
  summaryCards: SummaryCard[]
  recommendedActions: string[] // Array of action IDs or labels
  lastGeneratedAt: string | null // ISO 8601 timestamp
}

/**
 * Dialog State Component
 */
export interface DialogState {
  lastContext: DialogContext
  messageCount: number
  lastMessageAt: string | null // ISO 8601 timestamp
}

/**
 * Activity State Component
 */
export interface ActivityState {
  recentActivity: RecentActivity[]
}

/**
 * Metrics State Component
 */
export interface MetricsState {
  healthScore: HealthScore
  keyMetrics: {
    HR: MetricDataPoint[] // Heart Rate
    BP: MetricDataPoint[] // Blood Pressure
    Sleep: MetricDataPoint[]
    Weight: MetricDataPoint[]
  }
}

/**
 * Complete Patient State v0.1
 */
export interface PatientStateV01 {
  id: string
  patient_id: string
  patient_state_version: typeof PATIENT_STATE_VERSION
  assessment: AssessmentState
  results: ResultsState
  dialog: DialogState
  activity: ActivityState
  metrics: MetricsState
  created_at: string
  updated_at: string
}

/**
 * Partial update payload for PATCH operations
 */
export type PatientStateUpdate = {
  assessment?: Partial<AssessmentState>
  results?: Partial<ResultsState>
  dialog?: Partial<DialogState>
  activity?: Partial<ActivityState>
  metrics?: Partial<MetricsState>
}

/**
 * Factory function: Create default empty patient state
 * 
 * @returns Default patient state structure with version 0.1
 */
export function createDefaultPatientState(): Omit<
  PatientStateV01,
  'id' | 'patient_id' | 'created_at' | 'updated_at'
> {
  return {
    patient_state_version: PATIENT_STATE_VERSION,
    assessment: {
      lastAssessmentId: null,
      status: 'not_started',
      progress: 0,
      completedAt: null,
    },
    results: {
      summaryCards: [],
      recommendedActions: [],
      lastGeneratedAt: null,
    },
    dialog: {
      lastContext: 'dashboard',
      messageCount: 0,
      lastMessageAt: null,
    },
    activity: {
      recentActivity: [],
    },
    metrics: {
      healthScore: {
        current: null,
        delta: null,
      },
      keyMetrics: {
        HR: [],
        BP: [],
        Sleep: [],
        Weight: [],
      },
    },
  }
}

/**
 * Type guard: Check if state has valid version
 * 
 * @param state - State object to check
 * @returns true if state has version 0.1
 */
export function isPatientStateV01(state: unknown): state is PatientStateV01 {
  return (
    typeof state === 'object' &&
    state !== null &&
    'patient_state_version' in state &&
    state.patient_state_version === PATIENT_STATE_VERSION
  )
}
