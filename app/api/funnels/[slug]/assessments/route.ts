import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'
import { loadFunnelWithClient, loadFunnelVersionWithClient } from '@/lib/funnels/loadFunnelVersion'
import {
  versionedSuccessResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  sessionExpiredResponse,
  notFoundResponse,
  invalidInputResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { isSessionExpired } from '@/lib/api/authHelpers'
import { logUnauthorized, logDatabaseError, logAssessmentStarted } from '@/lib/logging/logger'
import { trackAssessmentStarted } from '@/lib/monitoring/kpi'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type StartAssessmentResponseData,
} from '@/lib/api/contracts/patient'
import { withIdempotency } from '@/lib/api/idempotency'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitFunnelStarted } from '@/lib/telemetry/events'

/**
 * B5/B8: Start a new assessment for a funnel
 *
 * POST /api/funnels/[slug]/assessments
 *
 * Creates a new assessment for the authenticated patient and returns
 * the assessment ID and first step information.
 *
 * E6.2.4: Supports idempotency via Idempotency-Key header.
 * Duplicate requests with same key return cached response.
 * 
 * E6.4.8: Emits FUNNEL_STARTED telemetry event.
 *
 * Response (B8 standardized):
 * {
 *   success: true,
 *   data: {
 *     assessmentId: string,
 *     status: 'in_progress',
 *     currentStep: { stepId, title, type, ... }
 *   }
 * }
 */

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params

  // E6.2.4: Wrap handler with idempotency support
  return withIdempotency(
    request,
    {
      endpointPath: `/api/funnels/${slug}/assessments`,
      checkPayloadConflict: false, // No payload for this endpoint
    },
    async () => {
      return handleStartAssessment(request, slug)
    },
  )
}

async function handleStartAssessment(request: NextRequest, slug: string) {
  // E6.4.8: Get correlation ID for telemetry
  const correlationId = getCorrelationId(request)
  
  try {
    // Validate slug parameter
    if (!slug) {
      return missingFieldsResponse('Funnel-Slug fehlt.', undefined, correlationId)
    }

    const supabase = await createServerSupabaseClient()

    // E6.2.6: Check authentication with session expiry detection
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      if (isSessionExpired(authError)) {
        return sessionExpiredResponse(correlationId)
      }
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments`,
        requestId: correlationId,
      })
      return unauthorizedResponse('Authentifizierung fehlgeschlagen.', correlationId)
    }

    if (!user) {
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments`,
        requestId: correlationId,
      })
      return unauthorizedResponse('Authentifizierung fehlgeschlagen.', correlationId)
    }

    // Get patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      logDatabaseError(
        {
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments`,
          requestId: correlationId,
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    // Try to load funnel from legacy table first, then fall back to funnels_catalog
    let funnelId: string
    let funnelTitle: string
    let isLegacyFunnel = false
    
    // First try legacy funnels table
    const { data: legacyFunnel } = await supabase
      .from('funnels')
      .select('id, title, is_active')
      .eq('slug', slug)
      .maybeSingle()

    if (legacyFunnel) {
      if (!legacyFunnel.is_active) {
        return invalidInputResponse('Dieser Funnel ist nicht aktiv.', undefined, correlationId)
      }
      funnelId = legacyFunnel.id
      funnelTitle = legacyFunnel.title
      isLegacyFunnel = true
    } else {
      // Fall back to funnels_catalog (V0.5 path)
      const catalogFunnel = await loadFunnelWithClient(supabase, slug)
      
      if (!catalogFunnel) {
        logDatabaseError(
          {
            userId: user.id,
            endpoint: `/api/funnels/${slug}/assessments`,
            requestId: correlationId,
          },
          new Error('Funnel not found in legacy table or catalog'),
        )
        return notFoundResponse('Funnel', undefined, correlationId)
      }

      if (!catalogFunnel.isActive) {
        return invalidInputResponse('Dieser Funnel ist nicht aktiv.', undefined, correlationId)
      }
      
      funnelId = catalogFunnel.id
      funnelTitle = catalogFunnel.title
    }

    // Create new assessment with status = in_progress
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        patient_id: patientProfile.id,
        funnel: slug,
        funnel_id: funnelId,
        status: 'in_progress',
      })
      .select()
      .single()

    if (assessmentError || !assessment) {
      logDatabaseError(
        {
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments`,
          requestId: correlationId,
        },
        assessmentError,
      )
      return internalErrorResponse('Fehler beim Erstellen des Assessments.', correlationId)
    }

    // Determine first step using appropriate method
    let currentStep: { stepId: string; title: string; type: string; orderIndex: number; stepIndex: number } | null = null
    
    if (isLegacyFunnel) {
      // Legacy path: use B3 navigation logic with funnel_steps table
      currentStep = await getCurrentStep(supabase, assessment.id, funnelId)
    } else {
      // V0.5 path: derive first step from questionnaire_config
      try {
        const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
        const firstStep = loadedVersion.manifest.questionnaire_config.steps[0]
        
        if (firstStep) {
          currentStep = {
            stepId: firstStep.id,
            title: firstStep.title,
            type: 'question_step',
            orderIndex: 0,
            stepIndex: 0,
          }
        }
      } catch (err) {
        console.warn('[assessments] Failed to load V0.5 funnel version:', err)
      }
    }

    if (!currentStep) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId: assessment.id,
          endpoint: `/api/funnels/${slug}/assessments`,
          requestId: correlationId,
        },
        new Error('Failed to determine first step'),
      )
      return internalErrorResponse('Fehler beim Ermitteln des ersten Schritts.', correlationId)
    }

    // Log successful assessment start
    logAssessmentStarted({
      userId: user.id,
      assessmentId: assessment.id,
      endpoint: `/api/funnels/${slug}/assessments`,
      funnel: slug,
      requestId: correlationId,
    })

    // V05-I10.3: Track KPI - Assessment start
    await trackAssessmentStarted({
      actor_user_id: user.id,
      assessment_id: assessment.id,
      funnel_slug: slug,
      funnel_id: funnelId,
    }).catch((err) => {
      // Don't fail the request if KPI tracking fails
      console.error('[assessments] Failed to track KPI event', err)
    })

    // E6.4.8: Emit FUNNEL_STARTED telemetry event (best-effort)
    await emitFunnelStarted({
      correlationId,
      assessmentId: assessment.id,
      funnelSlug: slug,
      patientId: patientProfile.id,
      stepId: currentStep.stepId,
    }).catch((err) => {
      // Best-effort: don't fail request if telemetry fails
      console.warn('[TELEMETRY] Failed to emit FUNNEL_STARTED event', err)
    })

    // Return success response
    const responseData: StartAssessmentResponseData = {
      assessmentId: assessment.id,
      status: assessment.status,
      currentStep: {
        stepId: currentStep.stepId,
        title: currentStep.title,
        type: currentStep.type,
        orderIndex: currentStep.orderIndex,
        stepIndex: currentStep.stepIndex,
      },
    }

    return versionedSuccessResponse(
      responseData,
      PATIENT_ASSESSMENT_SCHEMA_VERSION,
      201,
      correlationId,
    )
  } catch (error) {
    logDatabaseError(
      {
        endpoint: 'POST /api/funnels/[slug]/assessments',
        requestId: correlationId,
      },
      error,
    )
    return internalErrorResponse('Interner Fehler.', correlationId)
  }
}
