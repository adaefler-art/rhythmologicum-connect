import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  successResponse,
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
 * Request Body:
 * {
 *   stepId: string (UUID of the current step),
 *   questionId: string (question.key from questions table, e.g., "stress_frequency"),
 *   answerValue: number (integer value of the answer)
 * }
 * 
 * Response (B8 standardized):
 * {
 *   success: boolean,
 *   data?: { id: string, assessment_id: string, question_id: string, answer_value: number },
 *   error?: { code: string, message: string }
 * }
 */

type RequestBody = {
  stepId: string
  questionId: string
  answerValue: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  let slug: string | undefined
  let assessmentId: string | undefined
  let stepId: string | undefined
  let questionId: string | undefined

  try {
    const paramsResolved = await params
    slug = paramsResolved.slug
    assessmentId = paramsResolved.assessmentId

    // Parse request body
    const body: RequestBody = await request.json()
    stepId = body.stepId
    questionId = body.questionId
    const { answerValue } = body

    // Validate required fields
    if (!assessmentId || !stepId || !questionId || answerValue === undefined || answerValue === null) {
      return missingFieldsResponse(
        'Fehlende Pflichtfelder. Bitte geben Sie stepId, questionId und answerValue an.',
      )
    }

    // Validate answerValue is an integer
    if (!Number.isInteger(answerValue)) {
      return invalidInputResponse('Der Wert answerValue muss eine ganze Zahl sein.')
    }

    // Create Supabase server client with cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

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

    // Verify funnel_id exists
    if (!assessment.funnel_id) {
      return internalErrorResponse('Funnel-ID fehlt im Assessment.')
    }

    // B8: Verify step belongs to funnel
    const stepBelongsValidation = await ensureStepBelongsToFunnel(
      supabase,
      stepId,
      assessment.funnel_id,
    )

    if (!stepBelongsValidation.valid) {
      return forbiddenResponse(stepBelongsValidation.error!.message)
    }

    // B8: Verify question belongs to step
    const questionBelongsValidation = await ensureQuestionBelongsToStep(
      supabase,
      questionId,
      stepId,
    )

    if (!questionBelongsValidation.valid) {
      return invalidInputResponse(questionBelongsValidation.error!.message)
    }

    // B8: Prevent step-skipping
    const stepValidation = await ensureStepIsCurrent(
      supabase,
      assessmentId,
      stepId,
      assessment.funnel_id,
      user.id,
    )

    if (!stepValidation.valid) {
      if (stepValidation.error!.code === 'STEP_SKIPPING_PREVENTED') {
        return forbiddenResponse(stepValidation.error!.message)
      }
      return internalErrorResponse(stepValidation.error!.message)
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

    // Success response with standardized format
    return successResponse(
      {
        id: data.id,
        assessment_id: data.assessment_id,
        question_id: data.question_id,
        answer_value: data.answer_value,
      },
      200,
    )
  } catch (error) {
    // Catch-all error handler
    logDatabaseError(
      {
        assessmentId,
        stepId,
        questionId,
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
      },
      error,
    )
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
  }
}
