/**
 * Patient Dashboard API Contracts - E6.5.2
 *
 * Versioned schemas for patient dashboard endpoint.
 * Provides a stable, versionized data model for dashboard UI and mobile integration.
 *
 * @module lib/api/contracts/patient/dashboard
 */

import { z } from 'zod'

// ============================================================
// Schema Version
// ============================================================

/**
 * Current schema version for patient dashboard contract
 * Increment when making breaking changes to request/response structure
 */
export const PATIENT_DASHBOARD_SCHEMA_VERSION = 'v1' as const

// ============================================================
// Dashboard Version Marker
// ============================================================

/**
 * Dashboard data contract version
 * E6.5.2 AC3: Version marker for dashboard view model
 */
export const DASHBOARD_VERSION = 1 as const

// ============================================================
// Onboarding Status
// ============================================================

/**
 * Onboarding status enum values
 */
export const ONBOARDING_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type OnboardingStatusValue = (typeof ONBOARDING_STATUS)[keyof typeof ONBOARDING_STATUS]

export const OnboardingStatusSchema = z.enum([
  ONBOARDING_STATUS.NOT_STARTED,
  ONBOARDING_STATUS.IN_PROGRESS,
  ONBOARDING_STATUS.COMPLETED,
])

// ============================================================
// Next Step
// ============================================================

/**
 * Next step type enum
 */
export const NEXT_STEP_TYPE = {
  ONBOARDING: 'onboarding',
  FUNNEL: 'funnel',
  RESULT: 'result',
  CONTENT: 'content',
  NONE: 'none',
} as const

export type NextStepType = (typeof NEXT_STEP_TYPE)[keyof typeof NEXT_STEP_TYPE]

/**
 * Next step schema
 * Tells the UI where the user should go next
 */
export const NextStepSchema = z.object({
  type: z.enum([
    NEXT_STEP_TYPE.ONBOARDING,
    NEXT_STEP_TYPE.FUNNEL,
    NEXT_STEP_TYPE.RESULT,
    NEXT_STEP_TYPE.CONTENT,
    NEXT_STEP_TYPE.NONE,
  ]),
  target: z.string().nullable(),
  label: z.string(),
})

export type NextStep = z.infer<typeof NextStepSchema>

// ============================================================
// Funnel Summary
// ============================================================

/**
 * Funnel status enum
 */
export const FUNNEL_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type FunnelStatusValue = (typeof FUNNEL_STATUS)[keyof typeof FUNNEL_STATUS]

/**
 * Individual funnel summary for dashboard
 * E6.5.2: Minimum 2 pilot funnels
 */
export const FunnelSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum([
    FUNNEL_STATUS.NOT_STARTED,
    FUNNEL_STATUS.IN_PROGRESS,
    FUNNEL_STATUS.COMPLETED,
  ]),
  lastAssessmentId: z.string().uuid().nullable(),
  completedAt: z.string().datetime().nullable(),
  progress: z
    .object({
      current: z.number().int().nonnegative(),
      total: z.number().int().positive(),
    })
    .nullable(),
})

export type FunnelSummary = z.infer<typeof FunnelSummarySchema>

// ============================================================
// Workup Summary
// ============================================================

/**
 * Workup state enum
 */
export const WORKUP_STATE = {
  NO_DATA: 'no_data',
  NEEDS_MORE_DATA: 'needs_more_data',
  READY_FOR_REVIEW: 'ready_for_review',
} as const

export type WorkupStateValue = (typeof WORKUP_STATE)[keyof typeof WORKUP_STATE]

/**
 * Workup summary schema
 * E6.5.2: State + counts for workup status
 */
export const WorkupSummarySchema = z.object({
  state: z.enum([
    WORKUP_STATE.NO_DATA,
    WORKUP_STATE.NEEDS_MORE_DATA,
    WORKUP_STATE.READY_FOR_REVIEW,
  ]),
  counts: z.object({
    needsMoreData: z.number().int().nonnegative(),
    readyForReview: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
})

export type WorkupSummary = z.infer<typeof WorkupSummarySchema>

// ============================================================
// Content Tiles
// ============================================================

/**
 * Content tile type enum
 */
export const CONTENT_TILE_TYPE = {
  INFO: 'info',
  ACTION: 'action',
  PROMOTION: 'promotion',
} as const

export type ContentTileType = (typeof CONTENT_TILE_TYPE)[keyof typeof CONTENT_TILE_TYPE]

/**
 * Individual content tile for dashboard
 * E6.5.2: MVP content tiles
 */
export const ContentTileSchema = z.object({
  id: z.string(),
  type: z.enum([
    CONTENT_TILE_TYPE.INFO,
    CONTENT_TILE_TYPE.ACTION,
    CONTENT_TILE_TYPE.PROMOTION,
  ]),
  title: z.string(),
  description: z.string().nullable(),
  actionLabel: z.string().nullable(),
  actionTarget: z.string().nullable(),
  priority: z.number().int().nonnegative().default(0),
})

export type ContentTile = z.infer<typeof ContentTileSchema>

// ============================================================
// Meta Information
// ============================================================

/**
 * Meta information schema
 * E6.5.2 AC3: Version marker + correlation ID (E6.4.8 alignment)
 */
export const DashboardMetaSchema = z.object({
  version: z.literal(DASHBOARD_VERSION),
  correlationId: z.string().uuid(),
  generatedAt: z.string().datetime(),
})

export type DashboardMeta = z.infer<typeof DashboardMetaSchema>

// ============================================================
// Dashboard View Model V1
// ============================================================

/**
 * E6.5.2: Dashboard View Model V1
 * 
 * Complete dashboard data model with:
 * - onboardingStatus
 * - nextStep object (type + target + label)
 * - funnelSummaries[] (2 pilot funnels minimum)
 * - workupSummary (state + counts)
 * - contentTiles[] (MVP)
 * - meta (version + correlationId)
 */
export const DashboardViewModelV1Schema = z.object({
  onboardingStatus: OnboardingStatusSchema,
  nextStep: NextStepSchema,
  funnelSummaries: z.array(FunnelSummarySchema).min(0),
  workupSummary: WorkupSummarySchema,
  contentTiles: z.array(ContentTileSchema).default([]),
  meta: DashboardMetaSchema,
})

export type DashboardViewModelV1 = z.infer<typeof DashboardViewModelV1Schema>

// ============================================================
// API Response Schemas
// ============================================================

/**
 * Dashboard GET response data schema
 * E6.5.2 AC1: Contract as Zod schema with runtime check
 */
export const DashboardResponseDataSchema = DashboardViewModelV1Schema

export type DashboardResponseData = z.infer<typeof DashboardResponseDataSchema>

/**
 * Complete response schema with version marker
 * E6.5.2 AC2: Response envelope + error semantics standardized
 */
export const DashboardResponseSchema = z.object({
  success: z.literal(true),
  data: DashboardResponseDataSchema,
  schemaVersion: z.literal(PATIENT_DASHBOARD_SCHEMA_VERSION),
  requestId: z.string().optional(),
})

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>

/**
 * Standard error response schema
 * E6.5.2 AC2: Error semantics standardized
 * Matches the existing ApiError structure from lib/api/responseTypes.ts
 */
export const DashboardErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  schemaVersion: z.literal(PATIENT_DASHBOARD_SCHEMA_VERSION),
  requestId: z.string().optional(),
})

export type DashboardError = z.infer<typeof DashboardErrorSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Validates dashboard response
 */
export function validateDashboardResponse(data: unknown): DashboardResponse {
  return DashboardResponseSchema.parse(data)
}

/**
 * Safely validates dashboard response
 */
export function safeValidateDashboardResponse(data: unknown): DashboardResponse | null {
  const result = DashboardResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates dashboard view model
 */
export function validateDashboardViewModel(data: unknown): DashboardViewModelV1 {
  return DashboardViewModelV1Schema.parse(data)
}

/**
 * Safely validates dashboard view model
 */
export function safeValidateDashboardViewModel(data: unknown): DashboardViewModelV1 | null {
  const result = DashboardViewModelV1Schema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Creates an empty dashboard view model
 * Useful for initial state or when no data is available
 */
export function createEmptyDashboardViewModel(correlationId: string): DashboardViewModelV1 {
  return {
    onboardingStatus: ONBOARDING_STATUS.NOT_STARTED,
    nextStep: {
      type: NEXT_STEP_TYPE.ONBOARDING,
      target: '/patient/onboarding',
      label: 'Complete Onboarding',
    },
    funnelSummaries: [],
    workupSummary: {
      state: WORKUP_STATE.NO_DATA,
      counts: {
        needsMoreData: 0,
        readyForReview: 0,
        total: 0,
      },
    },
    contentTiles: [],
    meta: {
      version: DASHBOARD_VERSION,
      correlationId,
      generatedAt: new Date().toISOString(),
    },
  }
}
