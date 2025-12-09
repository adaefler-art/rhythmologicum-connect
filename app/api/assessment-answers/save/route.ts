import { NextRequest, NextResponse } from 'next/server'
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
  logUnauthorized,
  logForbidden,
  logDatabaseError,
} from '@/lib/logging/logger'

/**
 * API Route: Save Assessment Answer (Save-on-Tap)
 * 
 * POST /api/assessment-answers/save
 * 
 * Legacy endpoint - kept for backwards compatibility.
 * New clients should use: POST /api/funnels/{slug}/assessments/{id}/answers/save
 * 
 * Saves or updates a single answer for a question in an assessment.
 * Uses UPSERT logic to prevent duplicate answers for the same question.
 * 
 * Request Body:
 * {
 *   assessmentId: string (UUID of the assessment),
 *   questionId: string (question.key from questions table, e.g., "stress_frequency"),
 *   answerValue: number (integer value of the answer)
 * }
 * 
 * Note: questionId should be the question.key (semantic identifier), not question.id (UUID)
 * This maps to the assessment_answers.question_id column which is of type text.
 * 
 * Response (B8 standardized):
 * {
 *   success: boolean,
 *   data?: { id: string, assessment_id: string, question_id: string, answer_value: number },
 *   error?: { code: string, message: string }
 * }
 */

type RequestBody = {
  assessmentId: string
  questionId: string
  answerValue: number
}

export async function POST(request: NextRequest) {
  let assessmentId: string | undefined
  let questionId: string | undefined

  try {
    // Parse request body
    const body: RequestBody = await request.json()
    assessmentId = body.assessmentId
    questionId = body.questionId
    const { answerValue } = body

    // Validate required fields
    if (!assessmentId || !questionId || answerValue === undefined || answerValue === null) {
      return missingFieldsResponse(
        'Fehlende Pflichtfelder. Bitte geben Sie assessmentId, questionId und answerValue an.',
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
        endpoint: '/api/assessment-answers/save',
        assessmentId,
      })
      return unauthorizedResponse()
    }

    // Verify the assessment belongs to this user
    // First get the patient_profile for this user
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

    // Verify assessment ownership
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

    // B5: Prevent saving to completed assessments
    if (assessment.status === 'completed') {
      return assessmentCompletedResponse()
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
          questionId,
          endpoint: '/api/assessment-answers/save',
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
        questionId,
        endpoint: '/api/assessment-answers/save',
      },
      error,
    )
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
  }
}
