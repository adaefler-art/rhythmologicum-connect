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
  funnelNotSupportedResponse,
} from '@/lib/api/responses'
import { isSessionExpired } from '@/lib/api/authHelpers'
import { logUnauthorized, logDatabaseError, logAssessmentStarted, logNotFound, logWarn } from '@/lib/logging/logger'
import { trackAssessmentStarted } from '@/lib/monitoring/kpi'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type StartAssessmentResponseData,
} from '@/lib/api/contracts/patient'
import { withIdempotency } from '@/lib/api/idempotency'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitFunnelStarted } from '@/lib/telemetry/events'

/**
 * B5/B8/E74.7: Start or resume assessment for a funnel
 *
 * POST /api/funnels/[slug]/assessments
 * 
 * E74.7 Behavior:
 * - Default: RESUME_OR_CREATE - returns existing in-progress assessment if found
 * - forceNew=true: Completes existing in-progress and creates new assessment
 * - Atomic with row-level locking to prevent race conditions
 */
export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params

  return withIdempotency(
    request,
    {
      endpointPath: `/api/funnels/${slug}/assessments`,
      checkPayloadConflict: false,
    },
    async () => {
      return handleStartAssessment(request, slug)
    },
  )
}

async function handleStartAssessment(request: NextRequest, slug: string) {
  const correlationId = getCorrelationId(request)

  console.log('[assessments] POST start:', { requestId: correlationId, slug })

  try {
    if (!slug) {
      return missingFieldsResponse('Funnel-Slug fehlt.', undefined, correlationId)
    }

    // E74.7: Parse request body once and store for potential reuse
    let forceNew = false
    let requestBody = null
    try {
      const bodyText = await request.text()
      if (bodyText) {
        requestBody = JSON.parse(bodyText)
        forceNew = requestBody?.forceNew === true
      }
    } catch {
      // No body or invalid JSON - use default behavior (resume or create)
    }

    const supabase = (await createServerSupabaseClient()) as any

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

    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      if (profileError.code !== 'PGRST116') {
        logDatabaseError(
          {
            userId: user.id,
            endpoint: `/api/funnels/${slug}/assessments`,
            requestId: correlationId,
          },
          profileError,
        )
      }
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    if (!patientProfile) {
      logNotFound('Patient profile', { userId: user.id, slug, requestId: correlationId })
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    // E74.7: RESUME_OR_CREATE logic - check for existing in-progress assessment
    // Use FOR UPDATE to lock the row and prevent race conditions
    const { data: existingAssessment, error: existingError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status, started_at')
      .eq('patient_id', patientProfile.id)
      .eq('funnel', slug)
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) {
      console.error('[assessments] Error checking for existing assessment:', {
        requestId: correlationId,
        slug,
        patientId: patientProfile.id,
        errorCode: existingError.code,
        errorMessage: existingError.message,
      })
    }

    // If existing in-progress assessment found and NOT forceNew, return it (RESUME)
    if (existingAssessment && !forceNew) {
      console.log('[assessments] RESUME: Found existing in-progress assessment:', {
        requestId: correlationId,
        assessmentId: existingAssessment.id,
        slug,
        patientId: patientProfile.id,
      })

      // Determine current step for the existing assessment
      let currentStep:
        | { stepId: string; title: string; type: string; orderIndex: number; stepIndex: number }
        | null = null
      let stepLoadError: Error | null = null

      if (existingAssessment.funnel_id) {
        // Legacy funnel
        currentStep = await getCurrentStep(supabase, existingAssessment.id, existingAssessment.funnel_id)
      } else {
        // V0.5 catalog funnel
        try {
          const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
          const steps = loadedVersion.manifest.questionnaire_config?.steps

          if (!steps || steps.length === 0) {
            stepLoadError = new Error('Funnel has no questionnaire_config steps')
          } else {
            const firstStep = steps[0]
            currentStep = {
              stepId: firstStep.id,
              title: firstStep.title,
              type: 'question_step',
              orderIndex: 0,
              stepIndex: 0,
            }
          }
        } catch (err) {
          stepLoadError = err instanceof Error ? err : new Error(String(err))
          console.error('[assessments] Failed to load V0.5 funnel version for resume:', {
            requestId: correlationId,
            slug,
            error: stepLoadError.message,
          })
        }
      }

      if (!currentStep) {
        console.error('[assessments] Cannot determine current step for existing assessment:', {
          requestId: correlationId,
          slug,
          assessmentId: existingAssessment.id,
          stepLoadError: stepLoadError?.message,
        })

        return funnelNotSupportedResponse(
          'Dieser Funnel ist derzeit nicht für Assessments konfiguriert.',
          { slug, assessmentId: existingAssessment.id },
          correlationId,
        )
      }

      const responseData: StartAssessmentResponseData = {
        assessmentId: existingAssessment.id,
        status: existingAssessment.status,
        currentStep: {
          stepId: currentStep.stepId,
          title: currentStep.title,
          type: currentStep.type,
          stepIndex: currentStep.stepIndex,
          orderIndex: currentStep.orderIndex,
        },
      }

      return versionedSuccessResponse(
        responseData,
        PATIENT_ASSESSMENT_SCHEMA_VERSION,
        200, // 200 OK for resume, not 201 Created
        correlationId,
      )
    }

    // If forceNew=true and existing assessment found, complete it first
    if (existingAssessment && forceNew) {
      console.log('[assessments] FORCE_NEW: Completing existing assessment:', {
        requestId: correlationId,
        existingAssessmentId: existingAssessment.id,
        slug,
        patientId: patientProfile.id,
      })

      const { error: completeError } = await supabase
        .from('assessments')
        .update({
          completed_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', existingAssessment.id)
        .is('completed_at', null) // Double-check it's still in-progress

      if (completeError) {
        console.error('[assessments] Error completing existing assessment:', {
          requestId: correlationId,
          assessmentId: existingAssessment.id,
          errorCode: completeError.code,
          errorMessage: completeError.message,
        })
        // Continue anyway - we'll try to create new assessment
      }
    }

    // CREATE: No existing in-progress assessment (or forceNew=true), create new one
    console.log('[assessments] CREATE: Creating new assessment:', {
      requestId: correlationId,
      slug,
      patientId: patientProfile.id,
      forceNew,
    })

    let funnelId: string
    let isLegacyFunnel = false

    const { data: legacyFunnel, error: legacyError } = await supabase
      .from('funnels')
      .select('id, title, is_active')
      .eq('slug', slug)
      .maybeSingle()

    if (legacyError) {
      console.error('[assessments] Error querying legacy funnels:', {
        requestId: correlationId,
        slug,
        errorCode: legacyError.code,
        errorMessage: legacyError.message,
      })
    }

    if (legacyFunnel) {
      if (!legacyFunnel.is_active) {
        return invalidInputResponse('Dieser Funnel ist nicht aktiv.', { slug }, correlationId)
      }
      funnelId = legacyFunnel.id
      isLegacyFunnel = true
    } else {
      let catalogFunnel: Awaited<ReturnType<typeof loadFunnelWithClient>> = null
      try {
        catalogFunnel = await loadFunnelWithClient(supabase, slug)
      } catch (err) {
        console.error('[assessments] Error loading funnel from catalog:', {
          requestId: correlationId,
          slug,
          error: err instanceof Error ? err.message : String(err),
        })
      }

      if (!catalogFunnel) {
        console.warn('[assessments] Funnel not found:', {
          requestId: correlationId,
          slug,
          userId: user.id,
          checkedLegacy: true,
          checkedCatalog: true,
        })
        return notFoundResponse('Funnel', undefined, correlationId)
      }

      if (!catalogFunnel.isActive) {
        return invalidInputResponse('Dieser Funnel ist nicht aktiv.', { slug }, correlationId)
      }

      funnelId = catalogFunnel.id
    }

    console.log('[createAssessment] Insert parameters:', {
      correlationId,
      slug,
      userId: user.id,
      patientProfileId: patientProfile.id,
      isLegacyFunnel,
    })

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        patient_id: patientProfile.id,
        funnel: slug,
        funnel_id: isLegacyFunnel ? funnelId : null,
        status: 'in_progress',
      })
      .select()
      .single()

    if (assessmentError || !assessment) {
      console.error('[assessments] Failed to create assessment:', {
        requestId: correlationId,
        slug,
        userId: user.id,
        patientId: patientProfile.id,
        funnelId,
        isLegacyFunnel,
        errorCode: assessmentError?.code,
        errorMessage: assessmentError?.message,
        errorDetails: assessmentError?.details,
        errorHint: assessmentError?.hint,
      })

      logDatabaseError(
        {
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments`,
          requestId: correlationId,
        },
        assessmentError,
      )

      const pgCode = assessmentError?.code
      if (pgCode === '23502' || pgCode === '23503' || pgCode === '23505') {
        return invalidInputResponse(
          'Assessment konnte nicht erstellt werden: Datenintegritätsfehler.',
          { errorCode: pgCode, slug },
          correlationId,
        )
      }
      if (pgCode === '42501') {
        return unauthorizedResponse('Keine Berechtigung.', correlationId)
      }

      return internalErrorResponse('Fehler beim Erstellen des Assessments.', correlationId)
    }

    console.log('[createAssessment] Created assessment:', {
      correlationId,
      assessmentId: assessment.id,
      patientIdStored: assessment.patient_id,
      funnelStored: assessment.funnel,
      status: assessment.status,
    })

    let currentStep:
      | { stepId: string; title: string; type: string; orderIndex: number; stepIndex: number }
      | null = null
    let stepLoadError: Error | null = null

    if (isLegacyFunnel) {
      currentStep = await getCurrentStep(supabase, assessment.id, funnelId)
    } else {
      try {
        const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
        const steps = loadedVersion.manifest.questionnaire_config?.steps

        if (!steps || steps.length === 0) {
          stepLoadError = new Error('Funnel has no questionnaire_config steps')
        } else {
          const firstStep = steps[0]
          currentStep = {
            stepId: firstStep.id,
            title: firstStep.title,
            type: 'question_step',
            orderIndex: 0,
            stepIndex: 0,
          }
        }
      } catch (err) {
        stepLoadError = err instanceof Error ? err : new Error(String(err))
        console.error('[assessments] Failed to load V0.5 funnel version:', {
          requestId: correlationId,
          slug,
          error: stepLoadError.message,
        })
      }
    }

    if (!currentStep) {
      console.error('[assessments] Cannot determine first step:', {
        requestId: correlationId,
        slug,
        userId: user.id,
        assessmentId: assessment.id,
        isLegacyFunnel,
        stepLoadError: stepLoadError?.message,
      })

      return funnelNotSupportedResponse(
        'Dieser Funnel ist derzeit nicht für Assessments konfiguriert.',
        { slug, assessmentId: assessment.id },
        correlationId,
      )
    }

    logAssessmentStarted({
      userId: user.id,
      assessmentId: assessment.id,
      endpoint: `/api/funnels/${slug}/assessments`,
      funnel: slug,
    })

    await emitFunnelStarted({
      correlationId,
      assessmentId: assessment.id,
      funnelSlug: slug,
      patientId: patientProfile.id,
      stepId: currentStep.stepId,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit FUNNEL_STARTED event', err)
    })

    await trackAssessmentStarted({
      actor_user_id: user.id,
      assessment_id: assessment.id,
      funnel_slug: slug,
      funnel_id: isLegacyFunnel ? funnelId : undefined,
    }).catch((err) => {
      console.error('[assessments] Failed to track KPI event', err)
    })

    const responseData: StartAssessmentResponseData = {
      assessmentId: assessment.id,
      status: assessment.status,
      currentStep: {
        stepId: currentStep.stepId,
        title: currentStep.title,
        type: currentStep.type,
        stepIndex: currentStep.stepIndex,
        orderIndex: currentStep.orderIndex,
      },
    }

    return versionedSuccessResponse(
      responseData,
      PATIENT_ASSESSMENT_SCHEMA_VERSION,
      201,
      correlationId,
    )
  } catch (error) {
    logWarn('Unhandled error in assessment start', {
      slug,
      error: error instanceof Error ? error.message : String(error),
    })
    logDatabaseError({
      endpoint: 'POST /api/funnels/[slug]/assessments',
    }, error)
    return internalErrorResponse(undefined, correlationId)
  }
}