import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'
import {
  versionedSuccessResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  sessionExpiredResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { isSessionExpired } from '@/lib/api/authHelpers'
import {
  logUnauthorized,
  logForbidden,
  logDatabaseError,
  logInfo,
  logWarn,
  logNotFound,
} from '@/lib/logging/logger'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type ResumeAssessmentResponseData,
} from '@/lib/api/contracts/patient'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitFunnelResumed } from '@/lib/telemetry/events'

/**
 * B5/B8: Get assessment status and current step
 * 
 * GET /api/funnels/[slug]/assessments/[assessmentId]
 * 
 * Returns the current status of an assessment including:
 * - Assessment status (in_progress, completed)
 * - Current step information
 * - Number of completed steps
 * - Total steps in funnel
 * 
 * Response (B8 standardized):
 * {
 *   success: true,
 *   data: {
 *     assessmentId: string,
 *     status: 'in_progress' | 'completed',
 *     currentStep: { stepId, title, type, stepIndex, orderIndex },
 *     completedSteps: number,
 *     totalSteps: number
 *   }
 * }
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  try {
    const { slug, assessmentId } = await context.params
    const correlationId = getCorrelationId(request)

    // Validate parameters
    if (!slug || !assessmentId) {
      return missingFieldsResponse('Funnel-Slug oder Assessment-ID fehlt.', undefined, correlationId)
    }

    const supabase = await createServerSupabaseClient()

    // E6.2.6: Check authentication with session expiry detection
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      if (isSessionExpired(authError)) {
        return sessionExpiredResponse(undefined, correlationId)
      }
      logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`, assessmentId })
      return unauthorizedResponse(undefined, correlationId)
    }

    if (!user) {
      logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`, assessmentId })
      return unauthorizedResponse(undefined, correlationId)
    }

    // Get patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      // Only log actual DB errors, not "no rows found" (PGRST116)
      if (profileError.code !== 'PGRST116') {
        logDatabaseError({ userId: user.id, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, profileError)
      }
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    if (!patientProfile) {
      logWarn('Patient profile not found', { userId: user.id, assessmentId, slug })
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    // E6.5+ Evidence logging: Log lookup parameters for debugging
    console.log('[getAssessment] Lookup parameters:', {
      correlationId,
      assessmentId,
      slug,
      userId: user.id,
      patientProfileId: patientProfile.id,
    })

    // Load assessment and verify ownership
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status, started_at, completed_at, current_step_id')
      .eq('id', assessmentId)
      .eq('funnel', slug)
      .maybeSingle()

    // E6.5+ Evidence logging: Log query result for debugging
    console.log('[getAssessment] Query result:', {
      correlationId,
      found: !!assessment,
      errorCode: assessmentError?.code,
      errorMessage: assessmentError?.message,
    })

    if (assessmentError) {
      // PGRST116 = no rows found (expected for non-existent assessments)
      if (assessmentError.code === 'PGRST116') {
        logNotFound('Assessment', { userId: user.id, assessmentId, slug })
        return notFoundResponse('Assessment', 'Assessment nicht gefunden.', correlationId)
      }
      logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, assessmentError)
      return internalErrorResponse('Fehler beim Laden des Assessments.', correlationId)
    }

    if (!assessment) {
      logNotFound('Assessment', { userId: user.id, assessmentId, slug })
      return notFoundResponse('Assessment', 'Assessment nicht gefunden.', correlationId)
    }

    // Verify ownership
    if (assessment.patient_id !== patientProfile.id) {
      logForbidden({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, 'Assessment does not belong to user')
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment anzusehen.', correlationId)
    }

    // Handle assessments with missing funnel_id
    // Two cases:
    // 1. Legacy assessments: created before funnel_id FK was added (backfill from funnels table)
    // 2. V0.5 catalog assessments: intentionally created with funnel_id=null (skip backfill)
    if (!assessment.funnel_id) {
      // First check if this is a V0.5 catalog funnel (no backfill needed)
      const { data: catalogFunnel } = await supabase
        .from('funnels_catalog')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (catalogFunnel?.id) {
        // V0.5 catalog funnel - funnel_id=null is intentional, proceed without backfill
        logInfo('V0.5 catalog funnel detected, proceeding without funnel_id backfill', {
          assessmentId,
          slug,
          catalogFunnelId: catalogFunnel.id,
        })
        // For V0.5 funnels, we don't need funnel_id for step navigation
        // The questionnaire_config is derived from the manifest, not funnel_steps table
      } else {
        // Legacy assessment - attempt backfill from funnels table
        logInfo('Legacy assessment detected (missing funnel_id), attempting backfill', {
          assessmentId,
          slug,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`,
        })

        const { data: funnelRow, error: funnelLookupError } = await supabase
          .from('funnels')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()

        if (funnelLookupError) {
          // PGRST116 is handled by maybeSingle() returning null, other errors are logged
          if (funnelLookupError.code !== 'PGRST116') {
            logDatabaseError(
              {
                userId: user.id,
                assessmentId,
                slug,
                endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`,
              },
              funnelLookupError,
            )
          }
        }

        if (!funnelRow?.id) {
          // Funnel doesn't exist in either table - this is an error
          logNotFound('Funnel (legacy lookup)', { userId: user.id, assessmentId, slug })
          return notFoundResponse(
            'Funnel',
            `Der Funnel '${slug}' konnte nicht gefunden werden. Möglicherweise wurde er gelöscht oder umbenannt.`,
            correlationId,
          )
        }

        // Attempt to backfill the funnel_id
        const { error: repairError } = await supabase
          .from('assessments')
          .update({ funnel_id: funnelRow.id })
          .eq('id', assessment.id)

        if (repairError) {
          // Log the error but continue - we can still use the funnel_id we just looked up
          logDatabaseError(
            {
              userId: user.id,
              assessmentId,
              slug,
              endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`,
            },
            repairError,
          )
          logWarn('Failed to backfill funnel_id for legacy assessment, proceeding with in-memory value', {
            assessmentId,
            slug,
            funnelId: funnelRow.id,
          })
        } else {
          logInfo('Successfully backfilled funnel_id for legacy assessment', {
            assessmentId,
            slug,
            funnelId: funnelRow.id,
          })
        }

        // Use the looked-up funnel_id for this request
        assessment.funnel_id = funnelRow.id
      }
    }

    // For V0.5 catalog funnels (funnel_id is still null), use manifest-based navigation
    // For legacy funnels, use funnel_steps table
    let totalSteps = 0
    let currentStep: Awaited<ReturnType<typeof getCurrentStep>> = null

    if (assessment.funnel_id) {
      // Legacy path: use funnel_steps table
      const { data: steps, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('id, order_index')
        .eq('funnel_id', assessment.funnel_id)
        .order('order_index', { ascending: true })

      if (stepsError || !steps) {
        logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, stepsError)
        return internalErrorResponse('Fehler beim Laden der Schritte.', correlationId)
      }

      totalSteps = steps.length
      currentStep = await getCurrentStep(supabase, assessmentId, assessment.funnel_id)
    } else {
      // V0.5 path: use manifest-based navigation
      const { loadFunnelVersionWithClient } = await import('@/lib/funnels/loadFunnelVersion')
      
      try {
        const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
        const steps = loadedVersion.manifest.questionnaire_config?.steps || []
        totalSteps = steps.length

        if (steps.length > 0) {
          // For V0.5, use persisted current_step_id when available
          const targetStepId = assessment.current_step_id ?? steps[0]?.id
          const resolvedIndex = steps.findIndex((step) => step.id === targetStepId)
          const safeIndex = resolvedIndex >= 0 ? resolvedIndex : 0
          const resolvedStep = steps[safeIndex]

          currentStep = {
            stepId: resolvedStep.id,
            title: resolvedStep.title,
            type: 'question_step',
            orderIndex: safeIndex,
            stepIndex: safeIndex,
            hasQuestions: true,
            requiredQuestions: [],
            answeredQuestions: [],
          }
        }
      } catch (err) {
        logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, err)
        return internalErrorResponse('Fehler beim Laden der Funnel-Konfiguration.', correlationId)
      }
    }

    if (!currentStep) {
      logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, new Error('Failed to determine current step'))
      return internalErrorResponse('Fehler beim Ermitteln des aktuellen Schritts.', correlationId)
    }

    // Count completed steps (steps before current step where all required questions are answered)
    const completedSteps = currentStep.stepIndex

    // E6.4.8: Emit FUNNEL_RESUMED telemetry event
    await emitFunnelResumed({
      correlationId,
      assessmentId: assessment.id,
      funnelSlug: slug,
      patientId: patientProfile.id,
      stepId: currentStep.stepId,
      stepIndex: currentStep.stepIndex,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit FUNNEL_RESUMED event', err)
    })

    // Return success response
    const responseData: ResumeAssessmentResponseData = {
      assessmentId: assessment.id,
      status: assessment.status,
      currentStep: {
        stepId: currentStep.stepId,
        title: currentStep.title,
        type: currentStep.type,
        stepIndex: currentStep.stepIndex,
        orderIndex: currentStep.orderIndex,
      },
      completedSteps,
      totalSteps,
    }

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION, 200, correlationId)
  } catch (error) {
    logDatabaseError({ endpoint: 'GET /api/funnels/[slug]/assessments/[assessmentId]' }, error)
    return internalErrorResponse(undefined, getCorrelationId(request))
  }
}
