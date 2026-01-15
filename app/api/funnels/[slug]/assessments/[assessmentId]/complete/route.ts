import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { validateAllRequiredQuestions } from '@/lib/validation/requiredQuestions'
import {
  versionedSuccessResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import {
  logUnauthorized,
  logForbidden,
  logValidationFailure,
  logDatabaseError,
  logAssessmentCompleted,
} from '@/lib/logging/logger'
import { trackAssessmentCompleted, calculateDurationSeconds } from '@/lib/monitoring/kpi'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type CompleteAssessmentResponseData,
} from '@/lib/api/contracts/patient'
import { withIdempotency } from '@/lib/api/idempotency'
import { performWorkupCheck, getRulesetVersion } from '@/lib/workup'
import { createEvidencePack } from '@/lib/workup/helpers'

/**
 * B5/B8: Complete an assessment
 *
 * POST /api/funnels/[slug]/assessments/[assessmentId]/complete
 *
 * Performs full validation across all steps in the funnel.
 * If all required questions are answered, sets assessment status to 'completed'
 * and records the completion timestamp.
 *
 * E6.2.4: Supports idempotency via Idempotency-Key header.
 * Duplicate requests with same key return cached response.
 *
 * Response (B8 standardized):
 * Success:
 * {
 *   success: true,
 *   data: {
 *     assessmentId: string,
 *     status: 'completed'
 *   }
 * }
 *
 * Validation failed:
 * {
 *   success: false,
 *   error: {
 *     code: 'VALIDATION_FAILED',
 *     message: 'Nicht alle Pflichtfragen wurden beantwortet.',
 *     details: {
 *       missingQuestions: [{ questionId, questionKey, questionLabel, orderIndex }]
 *     }
 *   }
 * }
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  const { slug, assessmentId } = await context.params

  // E6.2.4: Wrap handler with idempotency support
  return withIdempotency(
    request,
    {
      endpointPath: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
      checkPayloadConflict: false, // No payload for this endpoint
    },
    async () => {
      return handleCompleteAssessment(request, slug, assessmentId)
    },
  )
}

async function handleCompleteAssessment(
  request: NextRequest,
  slug: string,
  assessmentId: string,
) {
  try {
    // Validate parameters
    if (!slug || !assessmentId) {
      return missingFieldsResponse('Funnel-Slug oder Assessment-ID fehlt.')
    }

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        assessmentId,
      })
      return unauthorizedResponse()
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil')
    }

    // Load assessment and verify ownership
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status, started_at')
      .eq('id', assessmentId)
      .eq('funnel', slug)
      .single()

    if (assessmentError || !assessment) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        assessmentError,
      )
      return notFoundResponse('Assessment')
    }

    // Verify ownership
    if (assessment.patient_id !== patientProfile.id) {
      logForbidden(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment abzuschließen.')
    }

    // Check if already completed
    if (assessment.status === 'completed') {
      const responseData: CompleteAssessmentResponseData = {
        assessmentId: assessment.id,
        status: 'completed',
        message: 'Assessment wurde bereits abgeschlossen.',
      }
      return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION)
    }

    // Verify funnel_id exists
    if (!assessment.funnel_id) {
      return internalErrorResponse('Funnel-ID fehlt im Assessment.')
    }

    // Perform full validation across all funnel steps
    const validationResult = await validateAllRequiredQuestions(assessmentId, assessment.funnel_id)

    // If validation failed, return missing questions
    if (!validationResult.isValid) {
      logValidationFailure(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        validationResult.missingQuestions,
      )

      return validationErrorResponse('Nicht alle Pflichtfragen wurden beantwortet.', {
        missingQuestions: validationResult.missingQuestions,
      })
    }

    // All questions answered - mark assessment as completed
    const completedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        status: 'completed',
        completed_at: completedAt,
      })
      .eq('id', assessmentId)

    if (updateError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        updateError,
      )
      return internalErrorResponse('Fehler beim Abschließen des Assessments.')
    }

    // Log successful assessment completion
    logAssessmentCompleted({
      userId: user.id,
      assessmentId,
      endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
      funnel: slug,
    })

    // V05-I10.3: Track KPI - Assessment completion
    // Calculate duration if started_at is available
    let durationSeconds: number | undefined
    if (assessment.started_at) {
      durationSeconds = calculateDurationSeconds(assessment.started_at, completedAt)
      // Only include if valid (non-zero)
      if (durationSeconds === 0) {
        console.warn('[complete] Invalid duration calculated', {
          started_at: assessment.started_at,
          completedAt,
        })
        durationSeconds = undefined
      }
    }

    // Track completion event for observability
    await trackAssessmentCompleted({
      actor_user_id: user.id,
      assessment_id: assessmentId,
      funnel_slug: slug,
      funnel_id: assessment.funnel_id,
      started_at: assessment.started_at,
      completed_at: completedAt,
      duration_seconds: durationSeconds,
    }).catch((err) => {
      // Don't fail the request if KPI tracking fails
      console.error('[complete] Failed to track KPI event', err)
    })

    // E6.4.5: Trigger workup check after completion
    // This is async and non-blocking - workup runs in background
    performWorkupCheckAsync(assessmentId, slug).catch((err) => {
      // Don't fail the completion if workup fails
      console.error('[complete] Failed to trigger workup check', err)
    })

    // Success response
    const responseData: CompleteAssessmentResponseData = {
      assessmentId: assessment.id,
      status: 'completed',
    }

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION)
  } catch (error) {
    logDatabaseError(
      {
        endpoint: 'POST /api/funnels/[slug]/assessments/[assessmentId]/complete',
      },
      error,
    )
    return internalErrorResponse()
  }
}

/**
 * E6.4.5: Perform workup check asynchronously
 *
 * Runs workup data sufficiency check in the background after assessment completion.
 * Non-blocking - errors are logged but don't affect completion response.
 *
 * @param assessmentId - The assessment ID
 * @param funnelSlug - The funnel slug
 */
async function performWorkupCheckAsync(assessmentId: string, funnelSlug: string): Promise<void> {
  try {
    // Create evidence pack from assessment data
    const evidencePack = await createEvidencePack(assessmentId, funnelSlug)

    // Perform workup check (deterministic, rule-based)
    const workupResult = performWorkupCheck(evidencePack)

    // Get ruleset version
    const rulesetVersion = getRulesetVersion(funnelSlug) ?? 'default'

    // Store workup results in database
    const supabase = await createServerSupabaseClient()
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        workup_status: workupResult.isSufficient ? 'ready_for_review' : 'needs_more_data',
        missing_data_fields: workupResult.missingDataFields,
      })
      .eq('id', assessmentId)

    if (updateError) {
      console.error('[workup] Failed to update assessment with workup results:', updateError)
      throw updateError
    }

    // Log workup completion
    console.log('[workup] Workup completed', {
      assessmentId,
      funnel: funnelSlug,
      workupStatus: workupResult.isSufficient ? 'ready_for_review' : 'needs_more_data',
      missingFieldsCount: workupResult.missingDataFields.length,
      rulesetVersion,
    })
  } catch (error) {
    console.error('[workup] Error in async workup check:', error)
    throw error
  }
}
