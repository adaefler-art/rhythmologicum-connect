/**
 * Patient State API Contracts - I2.1
 *
 * Canonical Patient State v0.1
 * Minimal, versioned state structure for patient UI (Dashboard, Dialog, Insights)
 */

import { z } from 'zod'

export const PATIENT_STATE_VERSION = '0.1' as const

/**
 * Assessment Summary (I72.6)
 * Detailed metadata about the last assessment for AMY orchestrator handoff
 */
export const AssessmentSummarySchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']),
  funnelSlug: z.string().nullable(),
  updatedAt: z.string().datetime().nullable(),
  answersCount: z.number().int().nonnegative().default(0),
  reportId: z.string().uuid().nullable(),
})

export type AssessmentSummary = z.infer<typeof AssessmentSummarySchema>

/**
 * Assessment State
 * Tracks current assessment progress
 */
export const AssessmentStateSchema = z.object({
  lastAssessmentId: z.string().uuid().nullable(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  progress: z.number().min(0).max(1), // 0 to 1 (0% to 100%)
  completedAt: z.string().datetime().nullable(),
  lastAssessment: AssessmentSummarySchema.nullable(), // I72.6: Assessment Handoff Contract
})

export type AssessmentState = z.infer<typeof AssessmentStateSchema>

/**
 * Results Summary Card
 * Brief summary card for results display
 */
export const ResultsSummaryCardSchema = z.object({
  id: z.string(),
  type: z.enum(['risk', 'recommendation', 'metric', 'insight']),
  title: z.string(),
  value: z.string(),
  trend: z.enum(['up', 'down', 'stable', 'none']).nullable(),
  priority: z.number().int().min(0).max(10),
})

export type ResultsSummaryCard = z.infer<typeof ResultsSummaryCardSchema>

/**
 * Results State
 * Summary of assessment results and recommendations
 */
export const ResultsStateSchema = z.object({
  summaryCards: z.array(ResultsSummaryCardSchema).max(5), // Maximum 5 cards for bounded UI
  recommendedActions: z.array(z.string()), // Array of action IDs
  lastGeneratedAt: z.string().datetime().nullable(),
})

export type ResultsState = z.infer<typeof ResultsStateSchema>

/**
 * Dialog Context State
 * Tracks dialog/AMY conversation context
 */
export const DialogStateSchema = z.object({
  lastContext: z.enum(['dashboard', 'results', 'insights', 'assessment', 'none']),
  messageCount: z.number().int().nonnegative(),
  lastMessageAt: z.string().datetime().nullable(),
})

export type DialogState = z.infer<typeof DialogStateSchema>

/**
 * Recent Activity Item
 * Tracks user activities for dashboard display
 */
export const ActivityItemSchema = z.object({
  type: z.enum(['assessment_completed', 'result_generated', 'dialog_session', 'measure_recorded', 'other']),
  label: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type ActivityItem = z.infer<typeof ActivityItemSchema>

/**
 * Activity State
 * Recent activity log
 */
export const ActivityStateSchema = z.object({
  recentActivity: z.array(ActivityItemSchema).max(10), // Keep last 10 activities
})

export type ActivityState = z.infer<typeof ActivityStateSchema>

/**
 * Health Metric Time Series Point
 */
export const MetricDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  value: z.number(),
})

export type MetricDataPoint = z.infer<typeof MetricDataPointSchema>

/**
 * Health Metric Series
 */
export const MetricSeriesSchema = z.object({
  metricType: z.enum(['HR', 'BP_systolic', 'BP_diastolic', 'Sleep', 'Weight', 'other']),
  unit: z.string(),
  data: z.array(MetricDataPointSchema).max(30), // Keep last 30 points for minimal series
})

export type MetricSeries = z.infer<typeof MetricSeriesSchema>

/**
 * Metrics State
 * Health score and key metrics
 */
export const MetricsStateSchema = z.object({
  healthScore: z.object({
    current: z.number().min(0).max(100),
    delta: z.number(), // Change from previous
    updatedAt: z.string().datetime().nullable(),
  }),
  keyMetrics: z.array(MetricSeriesSchema).max(5), // Track 5 key metrics
})

export type MetricsState = z.infer<typeof MetricsStateSchema>

/**
 * Complete Patient State v0.1
 * Canonical state structure
 */
export const PatientStateV01Schema = z.object({
  patient_state_version: z.literal(PATIENT_STATE_VERSION),
  assessment: AssessmentStateSchema,
  results: ResultsStateSchema,
  dialog: DialogStateSchema,
  activity: ActivityStateSchema,
  metrics: MetricsStateSchema,
  updatedAt: z.string().datetime(),
})

export type PatientStateV01 = z.infer<typeof PatientStateV01Schema>

/**
 * API Response for GET /api/patient/state
 */
export const PatientStateResponseSchema = z.object({
  success: z.literal(true),
  data: PatientStateV01Schema.nullable(),
  schemaVersion: z.literal(PATIENT_STATE_VERSION),
  requestId: z.string().optional(),
})

export type PatientStateResponse = z.infer<typeof PatientStateResponseSchema>

/**
 * API Request for POST /api/patient/state
 * Allows partial updates to state
 */
export const UpdatePatientStateRequestSchema = z.object({
  assessment: AssessmentStateSchema.partial().optional(),
  results: ResultsStateSchema.partial().optional(),
  dialog: DialogStateSchema.partial().optional(),
  activity: ActivityStateSchema.partial().optional(),
  metrics: MetricsStateSchema.partial().optional(),
})

export type UpdatePatientStateRequest = z.infer<typeof UpdatePatientStateRequestSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Creates an empty patient state (default initial state)
 */
export function createEmptyPatientState(): PatientStateV01 {
  return {
    patient_state_version: PATIENT_STATE_VERSION,
    assessment: {
      lastAssessmentId: null,
      status: 'not_started',
      progress: 0,
      completedAt: null,
      lastAssessment: null, // I72.6: No assessment data initially
    },
    results: {
      summaryCards: [],
      recommendedActions: [],
      lastGeneratedAt: null,
    },
    dialog: {
      lastContext: 'none',
      messageCount: 0,
      lastMessageAt: null,
    },
    activity: {
      recentActivity: [],
    },
    metrics: {
      healthScore: {
        current: 0,
        delta: 0,
        updatedAt: null,
      },
      keyMetrics: [],
    },
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Validates patient state
 */
export function validatePatientState(data: unknown): PatientStateV01 {
  return PatientStateV01Schema.parse(data)
}

/**
 * Safely validates patient state
 */
export function safeValidatePatientState(data: unknown): PatientStateV01 | null {
  const result = PatientStateV01Schema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Merges partial state update into existing state
 */
export function mergePatientState(
  currentState: PatientStateV01,
  update: UpdatePatientStateRequest,
): PatientStateV01 {
  return {
    ...currentState,
    assessment: update.assessment
      ? { ...currentState.assessment, ...update.assessment }
      : currentState.assessment,
    results: update.results
      ? { ...currentState.results, ...update.results }
      : currentState.results,
    dialog: update.dialog
      ? { ...currentState.dialog, ...update.dialog }
      : currentState.dialog,
    activity: update.activity
      ? { ...currentState.activity, ...update.activity }
      : currentState.activity,
    metrics: update.metrics
      ? { ...currentState.metrics, ...update.metrics }
      : currentState.metrics,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * I72.6: Build AssessmentSummary from database assessment record
 * Helper for AMY Orchestrator handoff
 */
export function buildAssessmentSummary(assessment: {
  status: string
  funnel_slug?: string | null
  updated_at?: string | null
  answers_count?: number | null
  report_id?: string | null
}): AssessmentSummary {
  return {
    status: (assessment.status as AssessmentSummary['status']) || 'not_started',
    funnelSlug: assessment.funnel_slug || null,
    updatedAt: assessment.updated_at || null,
    answersCount: assessment.answers_count || 0,
    reportId: assessment.report_id || null,
  }
}
