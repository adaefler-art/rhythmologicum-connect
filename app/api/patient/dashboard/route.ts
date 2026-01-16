import { requirePilotEligibility } from '@/lib/api/authHelpers'
import { versionedSuccessResponse, internalErrorResponse } from '@/lib/api/responses'
import { randomUUID } from 'crypto'
import {
  PATIENT_DASHBOARD_SCHEMA_VERSION,
  createEmptyDashboardViewModel,
  type DashboardViewModelV1,
  WORKUP_STATE,
} from '@/lib/api/contracts/patient/dashboard'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { resolveNextStep, type NextStepResolverInput } from '@/lib/nextStep/resolver'

/**
 * E6.5.3: Patient Dashboard API - Enhanced with RLS and Bounded IO
 * E6.5.5: Integrated with Next Step Resolver v1
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
 * E6.5.5 AC1: Same inputs → same nextStep (deterministic resolver)
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
    
    // If supabase is not properly initialized (e.g., in tests), return empty state
    if (!supabase) {
      const dashboardData: DashboardViewModelV1 = createEmptyDashboardViewModel(correlationId)
      return versionedSuccessResponse(
        dashboardData,
        PATIENT_DASHBOARD_SCHEMA_VERSION,
        200,
        correlationId,
      )
    }
    
    // E6.5.5: Query data needed for Next Step Resolver
    // Get patient profile for onboarding status
    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('id, onboarding_status')
      .eq('user_id', user.id)
      .single()

    // Get in-progress assessments
    const { data: inProgressAssessments } = await supabase
      .from('assessments')
      .select('id, funnel_id, funnels_catalog(slug)')
      .eq('patient_id', patientProfile?.id || '')
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)

    // Get all assessments to check if any started
    const { data: allAssessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('patient_id', patientProfile?.id || '')
      .limit(1)

    // Get workup status for completed assessments
    const { data: workupAssessments } = await supabase
      .from('assessments')
      .select('workup_status')
      .eq('patient_id', patientProfile?.id || '')
      .eq('status', 'completed')
      .not('workup_status', 'is', null)

    // Get red flags from reports (high risk level)
    const { data: highRiskReports } = await supabase
      .from('reports')
      .select('id, assessment_id, risk_level')
      .eq('risk_level', 'high')
      .in(
        'assessment_id',
        (allAssessments || []).map((a) => a.id),
      )
      .limit(1)

    // E6.5.5: Build resolver input from queried data
    const hasInProgressFunnel = Boolean(inProgressAssessments && inProgressAssessments.length > 0)
    const inProgressFunnel = inProgressAssessments?.[0] || null
    
    // Extract funnel slug safely from joined data
    let funnelSlug: string | null = null
    if (inProgressFunnel?.funnels_catalog && typeof inProgressFunnel.funnels_catalog === 'object') {
      const catalog = inProgressFunnel.funnels_catalog as Record<string, unknown>
      funnelSlug = typeof catalog.slug === 'string' ? catalog.slug : null
    }

    const workupNeedsMoreDataCount =
      workupAssessments?.filter((a) => a.workup_status === 'needs_more_data').length || 0
    const workupReadyForReviewCount =
      workupAssessments?.filter((a) => a.workup_status === 'ready_for_review').length || 0

    let workupState: NextStepResolverInput['workupState'] = WORKUP_STATE.NO_DATA
    if (workupNeedsMoreDataCount > 0) {
      workupState = WORKUP_STATE.NEEDS_MORE_DATA
    } else if (workupReadyForReviewCount > 0) {
      workupState = WORKUP_STATE.READY_FOR_REVIEW
    }

    const hasRedFlags = Boolean(highRiskReports && highRiskReports.length > 0)
    const redFlagAssessmentId = highRiskReports?.[0]?.assessment_id || null

    const resolverInput: NextStepResolverInput = {
      onboardingStatus: patientProfile?.onboarding_status || 'not_started',
      workupState,
      workupNeedsMoreDataCount,
      hasInProgressFunnel,
      inProgressFunnelSlug: funnelSlug,
      hasStartedAnyFunnel: Boolean(allAssessments && allAssessments.length > 0),
      hasRedFlags,
      redFlagAssessmentId,
    }

    // E6.5.5 AC1: Resolve next step deterministically
    const resolution = resolveNextStep(resolverInput)

    // E6.5.2: Build Dashboard View Model V1
    // For now, return mostly empty state with resolved nextStep
    const dashboardData: DashboardViewModelV1 = {
      ...createEmptyDashboardViewModel(correlationId),
      onboardingStatus: resolverInput.onboardingStatus,
      nextStep: resolution.nextStep,
      workupSummary: {
        state: workupState,
        counts: {
          needsMoreData: workupNeedsMoreDataCount,
          readyForReview: workupReadyForReviewCount,
          total: (workupAssessments?.length || 0),
        },
      },
    }
    
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
