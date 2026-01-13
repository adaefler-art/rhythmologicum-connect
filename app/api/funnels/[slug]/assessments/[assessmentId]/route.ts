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
} from '@/lib/logging/logger'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type ResumeAssessmentResponseData,
} from '@/lib/api/contracts/patient'

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

    // Validate parameters
    if (!slug || !assessmentId) {
      return missingFieldsResponse('Funnel-Slug oder Assessment-ID fehlt.')
    }

    const supabase = await createServerSupabaseClient()

    // E6.2.6: Check authentication with session expiry detection
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      if (isSessionExpired(authError)) {
        return sessionExpiredResponse()
      }
      logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`, assessmentId })
      return unauthorizedResponse()
    }

    if (!user) {
      logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`, assessmentId })
      return unauthorizedResponse()
    }

    // Get patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      logDatabaseError({ userId: user.id, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, profileError)
      return notFoundResponse('Benutzerprofil')
    }

    // Load assessment and verify ownership
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status, started_at, completed_at')
      .eq('id', assessmentId)
      .eq('funnel', slug)
      .maybeSingle()

    if (assessmentError) {
      logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, assessmentError)
      return internalErrorResponse('Fehler beim Laden des Assessments.')
    }

    if (!assessment) {
      return notFoundResponse('Assessment', 'Assessment nicht gefunden.')
    }

    // Verify ownership
    if (assessment.patient_id !== patientProfile.id) {
      logForbidden({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, 'Assessment does not belong to user')
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment anzusehen.')
    }

    // Handle legacy assessments missing funnel_id
    // Legacy assessments were created before the funnel_id foreign key was added.
    // They only have a text-based 'funnel' field (slug). We attempt to backfill
    // the funnel_id by looking up the funnel by slug.
    if (!assessment.funnel_id) {
      logInfo('Legacy assessment detected (missing funnel_id), attempting backfill', {
        assessmentId,
        slug,
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`,
      })

      const { data: funnelRow, error: funnelLookupError } = await supabase
        .from('funnels')
        .select('id')
        .eq('slug', slug)
        .single()

      if (funnelLookupError || !funnelRow?.id) {
        // Funnel doesn't exist in the database - this is a data integrity issue
        logDatabaseError(
          {
            userId: user.id,
            assessmentId,
            slug,
            endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`,
          },
          funnelLookupError || new Error(`Funnel with slug '${slug}' not found in database`),
        )
        return notFoundResponse(
          'Funnel',
          `Der Funnel '${slug}' konnte nicht gefunden werden. Möglicherweise wurde er gelöscht oder umbenannt.`,
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

    // Get total steps count
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, order_index')
      .eq('funnel_id', assessment.funnel_id)
      .order('order_index', { ascending: true })

    if (stepsError || !steps) {
      logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, stepsError)
      return internalErrorResponse('Fehler beim Laden der Schritte.')
    }

    const totalSteps = steps.length

    // Determine current step using B3 navigation logic
    const currentStep = await getCurrentStep(supabase, assessmentId, assessment.funnel_id)

    if (!currentStep) {
      logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, new Error('Failed to determine current step'))
      return internalErrorResponse('Fehler beim Ermitteln des aktuellen Schritts.')
    }

    // Count completed steps (steps before current step where all required questions are answered)
    const completedSteps = currentStep.stepIndex

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

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION)
  } catch (error) {
    logDatabaseError({ endpoint: 'GET /api/funnels/[slug]/assessments/[assessmentId]' }, error)
    return internalErrorResponse()
  }
}
