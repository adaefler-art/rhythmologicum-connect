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
import { randomUUID } from 'crypto'

/**
 * B8: Save Assessment Answer (Save-on-Tap) - Funnel-based endpoint
 *
 * POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  const requestId = randomUUID()

  try {
    const { slug, assessmentId } = await context.params

    const clonedRequest = request.clone()
    let body: unknown
    try {
      body = await clonedRequest.json()
    } catch (parseError) {
      console.error('[answers/save] JSON parse error', {
        requestId,
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      })
      return invalidInputResponse('Ungültiges JSON im Request Body.')
    }

    return withIdempotency(
      request,
      {
        endpointPath: `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
        checkPayloadConflict: true,
      },
      async () => {
        return handleSaveAnswer(request, slug, assessmentId, body, requestId)
      },
      body,
    )
  } catch (error) {
    console.error('[answers/save] Unexpected error in POST handler', {
      requestId,
      error: error instanceof Error ? { name: error.name, message: error.message } : error,
    })
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.')
  }
}

async function handleSaveAnswer(
  request: NextRequest,
  slug: string,
  assessmentId: string,
  body: unknown,
  requestId: string,
) {
  try {
    console.log('[answers/save] Processing request', {
      requestId,
      slug,
      assessmentId,
      bodyKeys: body && typeof body === 'object' ? Object.keys(body) : [],
    })

    const validationResult = SaveAnswerRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return invalidInputResponse(
        'Ungültige Anfragedaten. Bitte überprüfen Sie stepId, questionId und answerValue.',
      )
    }

    const { stepId, questionId, answerValue } = validationResult.data

    const supabase = await createServerSupabaseClient()

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

    const { data: patientProfile, error: profileError } = await (supabase as any)
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

    const { data: assessment, error: assessmentError } = await (supabase as any)
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

    if (assessment.status === 'completed') {
      return assessmentCompletedResponse()
    }

    const isV05CatalogFunnel = assessment.funnel_id === null

    if (isV05CatalogFunnel) {
      console.log('[answers/save] V0.5 catalog funnel detected, using manifest-based validation', {
        assessmentId,
        slug,
        stepId,
        questionId,
      })
    } else {
      const funnelId = assessment.funnel_id!

      const stepBelongsValidation = await ensureStepBelongsToFunnel(supabase, stepId, funnelId)

      if (!stepBelongsValidation.valid) {
        if (stepBelongsValidation.error!.code === 'STEP_NOT_FOUND') {
          return notFoundResponse('Schritt', stepBelongsValidation.error!.message)
        }
        if (stepBelongsValidation.error!.code === 'STEP_NOT_IN_FUNNEL') {
          return notFoundResponse('Schritt', stepBelongsValidation.error!.message)
        }
        return forbiddenResponse(stepBelongsValidation.error!.message)
      }

      const questionBelongsValidation = await ensureQuestionBelongsToStep(
        supabase,
        questionId,
        stepId,
      )

      if (!questionBelongsValidation.valid) {
        if (
          questionBelongsValidation.error!.code === 'QUESTION_NOT_FOUND' ||
          questionBelongsValidation.error!.code === 'QUESTION_NOT_IN_STEP'
        ) {
          return notFoundResponse('Frage', questionBelongsValidation.error!.message)
        }
        return invalidInputResponse(questionBelongsValidation.error!.message)
      }

      const stepValidation = await ensureStepIsCurrent(
        supabase,
        assessmentId,
        stepId,
        funnelId,
        user.id,
      )

      if (!stepValidation.valid) {
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

    let numericValue: number
    if (typeof answerValue === 'number') {
      numericValue = Math.round(answerValue)
    } else if (typeof answerValue === 'boolean') {
      numericValue = answerValue ? 1 : 0
    } else {
      numericValue = 0
    }

    console.log('[answers/save] Upserting answer', {
      requestId,
      assessmentId,
      questionId,
      answerValueType: typeof answerValue,
      numericValue,
      isV05CatalogFunnel,
    })

    const { data, error: upsertError } = await (supabase as any)
      .from('assessment_answers')
      .upsert(
        {
          assessment_id: assessmentId,
          question_id: questionId,
          answer_value: numericValue,
          answer_data: isV05CatalogFunnel ? answerValue : undefined,
        },
        {
          onConflict: 'assessment_id,question_id',
          ignoreDuplicates: false,
        },
      )
      .select()
      .single()

    if (upsertError || !data) {
      console.error('[answers/save] Upsert failed', {
        requestId,
        assessmentId,
        questionId,
        error: upsertError,
        errorType: typeof upsertError,
        errorCode: (upsertError as { code?: string })?.code,
        errorMessage: (upsertError as { message?: string })?.message,
        errorStack: (upsertError as { stack?: string })?.stack,
        errorDetails: upsertError,
        answerValue,
        numericValue,
        isV05CatalogFunnel,
        upsertPayload: {
          assessment_id: assessmentId,
          question_id: questionId,
          answer_value: numericValue,
          answer_data: isV05CatalogFunnel ? answerValue : undefined,
        },
      })
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
      const errorCode = (upsertError as { code?: string })?.code
      if (errorCode === '23503') {
        return notFoundResponse('Assessment')
      }
      if (errorCode === '23502') {
        return invalidInputResponse('Fehlende Felder oder ungültige Daten beim Speichern der Antwort.')
      }
      if (errorCode === '23505') {
        return invalidInputResponse('Antwort für diese Frage existiert bereits.')
      }
      return internalErrorResponse('Fehler beim Speichern der Antwort. Bitte versuchen Sie es erneut.')
    }

    if (!isV05CatalogFunnel) {
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ current_step_id: stepId })
        .eq('id', assessmentId)
        .eq('patient_id', patientProfile.id)

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
      }
    }

    console.log('[answers/save] Success', {
      requestId,
      assessmentId,
      questionId,
      dataId: data.id,
    })

    const responseData: SaveAnswerResponseData = {
      id: data.id,
      assessment_id: data.assessment_id,
      question_id: questionId,
      answer_value: data.answer_value,
      answer_data: answerValue ?? null,
    }

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION, 200)
  } catch (error) {
    console.error('[answers/save] Unhandled exception', {
      requestId,
      slug,
      assessmentId,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    logDatabaseError(
      {
        endpoint: 'POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save',
        requestId,
      },
      error,
    )
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
  }
}