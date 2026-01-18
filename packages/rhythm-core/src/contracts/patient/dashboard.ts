/**
 * Rhythm Core - Patient Dashboard Contracts
 */

import { z } from 'zod'

export const PATIENT_DASHBOARD_SCHEMA_VERSION = 'v1' as const
export const DASHBOARD_VERSION = 1 as const

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

export const NEXT_STEP_TYPE = {
  ONBOARDING: 'onboarding',
  FUNNEL: 'funnel',
  RESULT: 'result',
  CONTENT: 'content',
  NONE: 'none',
} as const

export type NextStepType = (typeof NEXT_STEP_TYPE)[keyof typeof NEXT_STEP_TYPE]

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

export const FUNNEL_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type FunnelStatusValue = (typeof FUNNEL_STATUS)[keyof typeof FUNNEL_STATUS]

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

export const WORKUP_STATE = {
  NO_DATA: 'no_data',
  NEEDS_MORE_DATA: 'needs_more_data',
  READY_FOR_REVIEW: 'ready_for_review',
} as const

export type WorkupStateValue = (typeof WORKUP_STATE)[keyof typeof WORKUP_STATE]

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

export const CONTENT_TILE_TYPE = {
  INFO: 'info',
  ACTION: 'action',
  PROMOTION: 'promotion',
} as const

export type ContentTileType = (typeof CONTENT_TILE_TYPE)[keyof typeof CONTENT_TILE_TYPE]

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

export const DashboardMetaSchema = z.object({
  version: z.literal(DASHBOARD_VERSION),
  correlationId: z.string().uuid(),
  generatedAt: z.string().datetime(),
})

export type DashboardMeta = z.infer<typeof DashboardMetaSchema>

export const DashboardViewModelV1Schema = z.object({
  onboardingStatus: OnboardingStatusSchema,
  nextStep: NextStepSchema,
  funnelSummaries: z.array(FunnelSummarySchema),
  workupSummary: WorkupSummarySchema,
  contentTiles: z.array(ContentTileSchema),
  meta: DashboardMetaSchema,
})

export type DashboardViewModelV1 = z.infer<typeof DashboardViewModelV1Schema>

export const DashboardResponseSchema = z.object({
  success: z.literal(true),
  data: DashboardViewModelV1Schema,
  schemaVersion: z.literal(PATIENT_DASHBOARD_SCHEMA_VERSION),
  requestId: z.string().optional(),
})

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>

export const DashboardViewModelSchema = DashboardViewModelV1Schema
export type DashboardViewModel = DashboardViewModelV1
