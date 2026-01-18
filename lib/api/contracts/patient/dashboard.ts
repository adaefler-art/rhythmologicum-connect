/**
 * Patient Dashboard API Contracts - E6.5.2
 *
 * Versioned schemas for patient dashboard endpoint.
 * Provides a stable, versionized data model for dashboard UI and mobile integration.
 */

import { z } from 'zod'
import {
  DASHBOARD_VERSION,
  NEXT_STEP_TYPE,
  ONBOARDING_STATUS,
  PATIENT_DASHBOARD_SCHEMA_VERSION,
  WORKUP_STATE,
  DashboardResponseSchema,
  DashboardViewModelV1Schema,
  type DashboardResponse,
  type DashboardViewModelV1,
} from 'rhythm-core/contracts/patient/dashboard'

export * from 'rhythm-core/contracts/patient/dashboard'

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
