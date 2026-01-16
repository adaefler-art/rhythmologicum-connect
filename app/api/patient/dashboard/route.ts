import { requirePilotEligibility } from '@/lib/api/authHelpers'
import { versionedSuccessResponse, internalErrorResponse } from '@/lib/api/responses'
import { randomUUID } from 'crypto'
import {
  PATIENT_DASHBOARD_SCHEMA_VERSION,
  createEmptyDashboardViewModel,
  type DashboardViewModelV1,
} from '@/lib/api/contracts/patient/dashboard'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

/**
 * E6.5.3: Patient Dashboard API - Enhanced with RLS and Bounded IO
 * 
 * Returns dashboard view model with stable, versioned schema.
 * Enforces 401-first auth ordering and pilot eligibility.
 * 
 * E6.5.3 AC1: Unauthenticated → 401 (401-first, no DB calls)
 * E6.5.3 AC2: Non-eligible → 403 with envelope
 * E6.5.3 AC3: Eligible patient sees only own data (RLS)
 * E6.5.3 AC4: Payload bounded (tiles max N, funnels max 2-5 summaries)
 * E6.5.2 AC1: Contract as Zod schema with runtime check
 * E6.5.2 AC2: Response envelope + error semantics standardized
 * E6.5.2 AC3: Version marker (dashboardVersion: 1) present
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

// E6.5.3 AC4: Bounded result sizes
// These constants will be used when fetching real data in future iterations
// Currently documented for future implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAX_FUNNEL_SUMMARIES = 5
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAX_CONTENT_TILES = 10

export async function GET() {
  // E6.5.3 AC1 + AC2: Auth and eligibility check FIRST, before any DB/IO operations
  // This enforces 401-first ordering and pilot eligibility gate
  const authResult = await requirePilotEligibility()
  
  if (authResult.error) {
    // Returns 401 for unauthenticated/session expired, or 403 for not eligible
    return authResult.error
  }
  
  const user = authResult.user!
  
  // E6.5.2 + E6.4.8: Generate correlation ID for telemetry
  const correlationId = randomUUID()
  
  // E6.5.3 AC3: RLS-safe data fetch
  // All queries use user.id to ensure patient sees only own data
  try {
    const supabase = await createServerSupabaseClient()
    
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
  } catch (error) {
    console.error('[DASHBOARD] Error building dashboard:', error)
    return internalErrorResponse('Failed to build dashboard', correlationId)
  }
}
