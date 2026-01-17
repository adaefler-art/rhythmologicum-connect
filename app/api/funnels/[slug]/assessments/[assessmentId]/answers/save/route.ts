import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  versionedSuccessResponse,
  missingFieldsResponse,
  invalidInputResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  assessmentCompletedResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import {
  ensureStepIsCurrent,
  ensureStepBelongsToFunnel,
  ensureQuestionBelongsToStep,
} from '@/lib/validation/stepValidation'
import {
  logUnauthorized,
  logForbidden,
  logDatabaseError,
} from '@/lib/logging/logger'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  SaveAnswerRequestSchema,
  type SaveAnswerResponseData,
} from '@/lib/api/contracts/patient'
import { withIdempotency } from '@/lib/api/idempotency'

/**
 * B8: Save Assessment Answer (Save-on-Tap) - Funnel-based endpoint
 * 
 * POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save
 * 
 * Enhanced version of the save endpoint with full funnel integration:
 * - Validates question belongs to step
 * - Validates step belongs to funnel
 * - Prevents step-skipping
 * - Prevents saving to completed assessments
 * 
 * E6.2.4: Supports idempotency via Idempotency-Key header.
 * Duplicate requests with same key return cached response.
 * 
 * Request Body:
 * {
 *   stepId: string (UUID of the current step),
 *   questionId: string (question.key from questions table, e.g., "stress_frequency"),
 *   answerValue: number (integer value of the answer)
 * }
 * 
 * Response (B8 standardized + E6.2.3 versioned):
 * {
 *   success: boolean,
 *   data?: { id: string, assessment_id: string, question_id: string, answer_value: number },
 *   schemaVersion: string,
 *   error?: { code: string, message: string }
 * }
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  const { slug, assessmentId } = await context.params

  // E6.2.4: Wrap handler with idempotency support
  // We need to parse the body here to pass it to both the handler and idempotency check
  // Clone the request to allow reading body multiple times
  const clonedRequest = request.clone()
  const body: unknown = await clonedRequest.json()

  return withIdempotency(
    request,
    {
      endpointPath: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
      checkPayloadConflict: true, // Check payload for conflicts
    },
    async () => {
      return handleSaveAnswer(request, slug, assessmentId, body)
    },
    body, // Pass payload for conflict detection
  )
}

async function handleSaveAnswer(
  request: NextRequest,
  slug: string,
  assessmentId: string,
  body: unknown,
) {
  try {
    // E6.2.3: Validate request against schema
    const validationResult = SaveAnswerRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return invalidInputResponse(
        'Ungültige Anfragedaten. Bitte überprüfen Sie stepId, questionId und answerValue.',
      )
    }

    const { stepId, questionId, answerValue } = validationResult.data

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil')
    }

    // Verify assessment ownership and load assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, status, funnel, funnel_id')
      .eq('id', assessmentId)
      .eq('funnel', slug)
      .single()

    if (assessmentError || !assessment) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
        },
        assessmentError,
      )
      return notFoundResponse('Assessment')
    }

    if (assessment.patient_id !== patientProfile.id) {
      logForbidden(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
        },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment zu bearbeiten.')
    }

    // B5: Prevent saving to completed assessments
    if (assessment.status === 'completed') {
      return assessmentCompletedResponse()
    }

    // Determine if this is a V0.5 catalog funnel (funnel_id is null)
    const isV05CatalogFunnel = assessment.funnel_id === null

    if (isV05CatalogFunnel) {
      // V0.5 path: Validate against manifest-based questions
      // Step/question validation is done client-side via questionnaire_config
      // Here we only verify the assessment ownership and status (already done above)
      console.log('[answers/save] V0.5 catalog funnel detected, using manifest-based validation', {
        assessmentId,
        slug,
        stepId,
        questionId,
      })

      // For V0.5 funnels, we trust the client's step/question IDs from the manifest
      // The client gets these from GET /api/funnels/{slug}/definition which is authoritative
    } else {
      // Legacy path: Verify funnel_id exists and validate via DB tables
      // TypeScript: funnel_id is guaranteed non-null here due to the if check above
      const funnelId = assessment.funnel_id!

      // B8: Verify step belongs to funnel
      const stepBelongsValidation = await ensureStepBelongsToFunnel(supabase, stepId, funnelId)

      if (!stepBelongsValidation.valid) {
        // V05-I03.3 Hardening: Return 404 for "not found" scenarios, 403 for authorization issues
        if (stepBelongsValidation.error!.code === 'STEP_NOT_FOUND') {
          return notFoundResponse('Schritt', stepBelongsValidation.error!.message)
        }
        if (stepBelongsValidation.error!.code === 'STEP_NOT_IN_FUNNEL') {
          return notFoundResponse('Schritt', stepBelongsValidation.error!.message)
        }
        return forbiddenResponse(stepBelongsValidation.error!.message)
      }

      // B8: Verify question belongs to step
      const questionBelongsValidation = await ensureQuestionBelongsToStep(
        supabase,
        questionId,
        stepId,
      )

      if (!questionBelongsValidation.valid) {
        // V05-I03.3 Hardening: Return 404 for "not found" scenarios
        if (
          questionBelongsValidation.error!.code === 'QUESTION_NOT_FOUND' ||
          questionBelongsValidation.error!.code === 'QUESTION_NOT_IN_STEP'
        ) {
          return notFoundResponse('Frage', questionBelongsValidation.error!.message)
        }
        return invalidInputResponse(questionBelongsValidation.error!.message)
      }

      // B8: Prevent step-skipping
      const stepValidation = await ensureStepIsCurrent(
        supabase,
        assessmentId,
        stepId,
        funnelId,
        user.id,
      )

      if (!stepValidation.valid) {
        // V05-I03.3 Hardening: Return 404 for "not found", 403 for authorization issues
        if (stepValidation.error!.code === 'CURRENT_STEP_NOT_FOUND') {
          return notFoundResponse('Schritt', stepValidation.error!.message)
        }
        if (stepValidation.error!.code === 'STEP_NOT_FOUND') {
          return notFoundResponse('Schritt', stepValidation.error!.message)
        }
        if (stepValidation.error!.code === 'STEP_SKIPPING_PREVENTED') {
          return forbiddenResponse(stepValidation.error!.message)
        }
        return internalErrorResponse(stepValidation.error!.message)
      }
    }

    // Perform upsert operation
    // Using ON CONFLICT clause to update if the answer already exists
    const { data, error: upsertError } = await supabase
      .from('assessment_answers')
      .upsert(
        {
          assessment_id: assessmentId,
          question_id: questionId,
          answer_value: answerValue,
        },
        {
          onConflict: 'assessment_id,question_id',
          ignoreDuplicates: false, // Update existing records
        },
      )
      .select()
      .single()

    if (upsertError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          stepId,
          questionId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
        },
        upsertError,
      )
      return internalErrorResponse('Fehler beim Speichern der Antwort. Bitte versuchen Sie es erneut.')
    }

    // V05-I03.3: Update current_step_id for save/resume functionality
    // This ensures the user can resume from the current step even if they only answered
    // questions without explicitly navigating to the next step
    // IMPORTANT: Only update after all validations passed (fail-closed)
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ current_step_id: stepId })
      .eq('id', assessmentId)
      .eq('patient_id', patientProfile.id) // Double-check ownership

    if (updateError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          stepId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
        },
        updateError,
      )
      // Note: Answer was saved successfully, but current_step_id update failed
      // This is non-critical - resume will still work based on answered questions
    }

    // Success response with standardized format
    const responseData: SaveAnswerResponseData = {
      id: data.id,
      assessment_id: data.assessment_id,
      question_id: data.question_id,
      answer_value: data.answer_value,
    }

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION, 200)
  } catch (error) {
    // Catch-all error handler
    logDatabaseError(
      {
        endpoint: 'POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save',
      },
      error,
    )
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
  }
}
