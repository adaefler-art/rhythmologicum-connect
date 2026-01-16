import { requireAuth } from '@/lib/api/authHelpers'
import { versionedSuccessResponse, internalErrorResponse } from '@/lib/api/responses'
import { env } from '@/lib/env'
import { randomUUID } from 'crypto'
import {
  PATIENT_DASHBOARD_SCHEMA_VERSION,
  ONBOARDING_STATUS,
  NEXT_STEP_TYPE,
  WORKUP_STATE,
  createEmptyDashboardViewModel,
  type DashboardViewModelV1,
} from '@/lib/api/contracts/patient/dashboard'

/**
 * E6.5.2: Patient Dashboard API - Data Contract v1
 * 
 * Returns dashboard view model with stable, versioned schema.
 * Maintains E6.4.1 401-first auth ordering.
 * 
 * E6.4.1 AC1: Unauthenticated → 401 (401-first, no DB calls)
 * E6.5.2 AC1: Contract as Zod schema with runtime check
 * E6.5.2 AC2: Response envelope + error semantics standardized
 * E6.5.2 AC3: Version marker (dashboardVersion: 1) present
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // E6.4.1 AC1: Auth check FIRST, before any DB/IO operations
  const authResult = await requireAuth()
  
  if (authResult.error) {
    // Returns 401 for unauthenticated or session expired
    return authResult.error
  }
  
  const user = authResult.user!
  
  // E6.5.2 + E6.4.8: Generate correlation ID for telemetry
  const correlationId = randomUUID()
  
  // E6.4.1: Optional pilot eligibility check (preserved from original implementation)
  let pilotEligible: boolean | undefined = undefined
  
  if (env.NEXT_PUBLIC_PILOT_ENABLED === 'true') {
    try {
      const { isPilotEligibleFull } = await import('@/lib/api/pilotEligibility')
      pilotEligible = await isPilotEligibleFull(user)
    } catch (error) {
      console.error('[DASHBOARD] Error checking pilot eligibility:', error)
      return internalErrorResponse('Failed to check pilot eligibility', correlationId)
    }
  }
  
  // E6.5.2: Build Dashboard View Model V1
  // TODO: Replace with real data queries in future iterations
  // For now, return empty state as MVP implementation
  const dashboardData: DashboardViewModelV1 = createEmptyDashboardViewModel(correlationId)
  
  // E6.5.2 AC2: Versioned success response with schemaVersion
  return versionedSuccessResponse(
    dashboardData,
    PATIENT_DASHBOARD_SCHEMA_VERSION,
    200,
    correlationId,
  )
}
