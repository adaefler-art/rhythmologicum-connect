import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
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
  logUnauthorized,
  logForbidden,
  logDatabaseError,
} from '@/lib/logging/logger'

/**
 * API Route: Save Assessment Answer (Save-on-Tap)
 *
 * POST /api/assessment-answers/save
 */

type RequestBody = {
  assessmentId: string
  questionId: string
  answerValue: number
  clientMutationId?: string
}

export async function POST(request: NextRequest) {
  let assessmentId: string | undefined
  let questionId: string | undefined

  try {
    const body: RequestBody = await request.json()
    assessmentId = body.assessmentId
    questionId = body.questionId
    const { answerValue, clientMutationId } = body

    if (!assessmentId || !questionId || answerValue === undefined || answerValue === null) {
      return missingFieldsResponse(
        'Fehlende Pflichtfelder. Bitte geben Sie assessmentId, questionId und answerValue an.',
      )
    }

    if (!Number.isInteger(answerValue)) {
      return invalidInputResponse('Der Wert answerValue muss eine ganze Zahl sein.')
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: '/api/assessment-answers/save',
        assessmentId,
      })
      return unauthorizedResponse()
    }

    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      logDatabaseError(
        {
          userId: user.id,
          endpoint: '/api/assessment-answers/save',
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil')
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, status')
      .eq('id', assessmentId)
      .single()

    if (assessmentError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: '/api/assessment-answers/save',
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
          endpoint: '/api/assessment-answers/save',
        },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment zu bearbeiten.')
    }

    if (assessment.status === 'completed') {
      return assessmentCompletedResponse()
    }

    if (clientMutationId) {
      const { data: existingMutation } = await (supabase as any)
        .from('idempotency_keys')
        .select('response_body')
        .eq('idempotency_key', clientMutationId)
        .eq('endpoint_path', '/api/assessment-answers/save')
        .maybeSingle()

      if (existingMutation) {
        const cachedResponse = existingMutation.response_body
        if (cachedResponse?.success && cachedResponse?.data) {
          console.log(
            '[assessment-answers/save] Returning cached response for clientMutationId:',
            clientMutationId,
          )

          return new Response(JSON.stringify(cachedResponse), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotency-Cached': 'true',
            },
          })
        }
      }
    }

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
          ignoreDuplicates: false,
        },
      )
      .select()
      .single()

    if (upsertError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          questionId,
          endpoint: '/api/assessment-answers/save',
        },
        upsertError,
      )
      return internalErrorResponse('Fehler beim Speichern der Antwort. Bitte versuchen Sie es erneut.')
    }

    if (clientMutationId) {
      const responseBody = {
        success: true,
        data: {
          id: data.id,
          assessment_id: data.assessment_id,
          question_id: data.question_id,
          answer_value: data.answer_value,
        },
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      await (supabase as any)
        .from('idempotency_keys')
        .insert({
          idempotency_key: clientMutationId,
          user_id: user.id,
          endpoint_path: '/api/assessment-answers/save',
          http_method: 'POST',
          response_status: 200,
          response_body: responseBody,
          expires_at: expiresAt,
        })
        .select()
        .single()
        .catch((err: Error) => {
          console.warn('[assessment-answers/save] Failed to store idempotency key:', err.message)
        })
    }

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
    logDatabaseError(
      {
        assessmentId,
        questionId,
        endpoint: '/api/assessment-answers/save',
      },
      error,
    )
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
  }
}