/**
 * Rhythm Core - Patient State Contracts v0.1
 * 
 * Canonical patient state structure for Dialog/Insights/Dashboard
 * Minimal, versioned, deterministically reloadable
 */

import { z } from 'zod'

export const PATIENT_STATE_VERSION = '0.1' as const
export const PATIENT_STATE_SCHEMA_VERSION = 'v1' as const

/**
 * Assessment State
 * Tracks the patient's current assessment progress
 */
export const AssessmentStateSchema = z.object({
  lastAssessmentId: z.string().uuid().nullable(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  progress: z.number().min(0).max(1), // 0-1 progress
  completedAt: z.string().datetime().nullable(),
})

export type AssessmentState = z.infer<typeof AssessmentStateSchema>

/**
 * Summary Card for Results
 */
export const SummaryCardSchema = z.object({
  id: z.string(),
  type: z.enum(['metric', 'insight', 'recommendation']),
  title: z.string(),
  value: z.string().nullable(),
  description: z.string().nullable(),
  priority: z.number().int().nonnegative().default(0),
})

export type SummaryCard = z.infer<typeof SummaryCardSchema>

/**
 * Results State
 * Summary of assessment results and recommendations
 */
export const ResultsStateSchema = z.object({
  summaryCards: z.array(SummaryCardSchema).max(5), // Max 3-5 cards
  recommendedActions: z.array(z.string()), // Action IDs
  lastGeneratedAt: z.string().datetime().nullable(),
})

export type ResultsState = z.infer<typeof ResultsStateSchema>

/**
 * Dialog State
 * Tracks dialog/conversation context
 */
export const DialogStateSchema = z.object({
  lastContext: z.enum(['dashboard', 'results', 'assessment', 'other']).nullable(),
  messageCount: z.number().int().nonnegative().default(0),
  lastMessageAt: z.string().datetime().nullable(),
})

export type DialogState = z.infer<typeof DialogStateSchema>

/**
 * Activity Item
 */
export const ActivityItemSchema = z.object({
  type: z.enum(['assessment_completed', 'result_generated', 'content_viewed', 'action_taken']),
  label: z.string(),
  timestamp: z.string().datetime(),
})

export type ActivityItem = z.infer<typeof ActivityItemSchema>

/**
 * Activity State
 * Recent activity log
 */
export const ActivityStateSchema = z.object({
  recentActivity: z.array(ActivityItemSchema).max(10), // Recent 10 activities
})

export type ActivityState = z.infer<typeof ActivityStateSchema>

/**
 * Metric Series Data Point
 */
export const MetricDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  value: z.number(),
})

export type MetricDataPoint = z.infer<typeof MetricDataPointSchema>

/**
 * Key Metric (HR/BP/Sleep/Weight)
 */
export const KeyMetricSchema = z.object({
  type: z.enum(['hr', 'bp_systolic', 'bp_diastolic', 'sleep_hours', 'weight']),
  current: z.number().nullable(),
  unit: z.string(),
  series: z.array(MetricDataPointSchema).max(30), // Max 30 data points (e.g., 30 days)
})

export type KeyMetric = z.infer<typeof KeyMetricSchema>

/**
 * Metrics State
 * Health scores and key metrics
 */
export const MetricsStateSchema = z.object({
  healthScore: z.object({
    current: z.number().min(0).max(100).nullable(),
    delta: z.number().nullable(), // Change from previous
  }),
  keyMetrics: z.array(KeyMetricSchema).max(5), // HR, BP, Sleep, Weight, etc.
})

export type MetricsState = z.infer<typeof MetricsStateSchema>

/**
 * Complete Patient State v0.1
 * Minimal canonical state structure
 */
export const PatientStateV01Schema = z.object({
  patient_state_version: z.literal(PATIENT_STATE_VERSION),
  assessment: AssessmentStateSchema,
  results: ResultsStateSchema,
  dialog: DialogStateSchema,
  activity: ActivityStateSchema,
  metrics: MetricsStateSchema,
})

export type PatientStateV01 = z.infer<typeof PatientStateV01Schema>

/**
 * Patient State Response
 */
export const PatientStateResponseSchema = z.object({
  success: z.literal(true),
  data: PatientStateV01Schema,
  schemaVersion: z.literal(PATIENT_STATE_SCHEMA_VERSION),
  requestId: z.string().optional(),
})

export type PatientStateResponse = z.infer<typeof PatientStateResponseSchema>

/**
 * Patient State Update Request
 * Partial updates allowed
 */
export const PatientStateUpdateRequestSchema = z.object({
  assessment: AssessmentStateSchema.partial().optional(),
  results: ResultsStateSchema.partial().optional(),
  dialog: DialogStateSchema.partial().optional(),
  activity: ActivityStateSchema.partial().optional(),
  metrics: MetricsStateSchema.partial().optional(),
})

export type PatientStateUpdateRequest = z.infer<typeof PatientStateUpdateRequestSchema>

/**
 * Patient State Update Response
 */
export const PatientStateUpdateResponseSchema = z.object({
  success: z.literal(true),
  data: PatientStateV01Schema,
  schemaVersion: z.literal(PATIENT_STATE_SCHEMA_VERSION),
  requestId: z.string().optional(),
})

export type PatientStateUpdateResponse = z.infer<typeof PatientStateUpdateResponseSchema>

/**
 * Error Response
 */
export const PatientStateErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  schemaVersion: z.literal(PATIENT_STATE_SCHEMA_VERSION),
  requestId: z.string().optional(),
})

export type PatientStateError = z.infer<typeof PatientStateErrorSchema>

/**
 * Creates an empty/default patient state
 * Used when no state exists or for initialization
 */
export function createEmptyPatientState(): PatientStateV01 {
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
      lastContext: null,
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
      keyMetrics: [],
    },
  }
}

/**
 * Validates patient state
 */
export function validatePatientState(data: unknown): PatientStateV01 {
  return PatientStateV01Schema.parse(data)
}

/**
 * Safely validates patient state, returns null on failure
 */
export function safeValidatePatientState(data: unknown): PatientStateV01 | null {
  const result = PatientStateV01Schema.safeParse(data)
  return result.success ? result.data : null
}
