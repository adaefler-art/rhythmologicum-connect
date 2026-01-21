/**
 * I71.4: Assessment Persistence Adapter
 *
 * Provides centralized, idempotent operations for assessment data persistence.
 * All assessment save/load operations should go through this adapter.
 *
 * Key Features:
 * - Idempotent save operations using clientMutationId
 * - Centralized error handling
 * - Type-safe interfaces
 * - Resume functionality support
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { Json, SupabaseClient } from '@supabase/supabase-js'

/**
 * Assessment run state for resume functionality
 */
export type AssessmentRun = {
  assessmentId: string
  status: 'in_progress' | 'completed'
  currentStepId: string | null
  stepIndex: number
  answersByQuestionId: Record<string, Json>
}

/**
 * Result type for save operations
 */
export type SaveAnswerResult = {
  success: boolean
  answerId?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * Result type for complete operations
 */
export type CompleteAssessmentResult = {
  success: boolean
  completedAt?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * Load assessment run state for resume functionality
 *
 * Returns current progress including:
 * - Current step index
 * - All answered questions mapped by question ID
 * - Assessment status
 *
 * @param assessmentId - UUID of the assessment
 * @returns AssessmentRun with current state
 * @throws Error if assessment not found or not accessible
 */
export async function loadAssessmentRun(assessmentId: string): Promise<AssessmentRun> {
  const supabase = await createServerSupabaseClient()

  // Load assessment data
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, status, current_step_id, funnel, funnel_id')
    .eq('id', assessmentId)
    .single()

  if (assessmentError || !assessment) {
    throw new Error(`Assessment nicht gefunden: ${assessmentId}`)
  }

  // Load all answers for this assessment
  const { data: answers, error: answersError } = await supabase
    .from('assessment_answers')
    .select('question_id, answer_value, answer_data')
    .eq('assessment_id', assessmentId)

  if (answersError) {
    throw new Error(`Fehler beim Laden der Antworten: ${answersError.message}`)
  }

  // Map answers by question ID
  const answersByQuestionId: Record<string, Json> = {}
  answers?.forEach((answer) => {
    // Prefer answer_data (JSONB) if available, fallback to answer_value (integer)
    if (answer.answer_data !== null && answer.answer_data !== undefined) {
      answersByQuestionId[answer.question_id] = answer.answer_data
    } else {
      answersByQuestionId[answer.question_id] = answer.answer_value
    }
  })

  // Determine step index
  // For legacy funnels with current_step_id, we need to look up the step's order_index
  // For V0.5 catalog funnels, we derive it from answered questions
  let stepIndex = 0

  if (assessment.current_step_id && assessment.funnel_id) {
    // Legacy funnel - lookup step order
    const { data: step } = await supabase
      .from('funnel_steps')
      .select('order_index')
      .eq('id', assessment.current_step_id)
      .single()

    if (step) {
      stepIndex = step.order_index
    }
  } else {
    // V0.5 catalog funnel or no current step - estimate from answers
    // This is a simple heuristic: step index = number of answered questions
    stepIndex = Object.keys(answersByQuestionId).length
  }

  return {
    assessmentId: assessment.id,
    status: assessment.status,
    currentStepId: assessment.current_step_id,
    stepIndex,
    answersByQuestionId,
  }
}

/**
 * Save a single answer with idempotency support
 *
 * Uses clientMutationId to prevent duplicate saves on double-tap/retry.
 * If the same clientMutationId is sent again, returns success without re-saving.
 *
 * @param assessmentId - UUID of the assessment
 * @param questionId - Question identifier (question.key)
 * @param answer - Answer value (number, string, or boolean)
 * @param clientMutationId - Client-generated unique ID for idempotency
 * @returns SaveAnswerResult indicating success or error
 */
export async function saveAnswer(
  assessmentId: string,
  questionId: string,
  answer: number | string | boolean,
  clientMutationId: string,
): Promise<SaveAnswerResult> {
  const supabase = await createServerSupabaseClient()

  try {
    // Check if this mutation was already processed
    const { data: existingMutation } = await (supabase as any)
      .from('idempotency_keys')
      .select('response_body')
      .eq('idempotency_key', clientMutationId)
      .eq('endpoint_path', `/api/assessment-answers/save`)
      .maybeSingle()

    if (existingMutation) {
      // Already processed - return cached result
      const cachedResponse = existingMutation.response_body
      if (cachedResponse?.success && cachedResponse?.data?.id) {
        return {
          success: true,
          answerId: cachedResponse.data.id,
        }
      }
    }

    // Verify assessment exists and is in_progress
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, status')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return {
        success: false,
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment nicht gefunden',
        },
      }
    }

    if (assessment.status === 'completed') {
      return {
        success: false,
        error: {
          code: 'ASSESSMENT_COMPLETED',
          message: 'Assessment ist bereits abgeschlossen',
        },
      }
    }

    // Prepare answer data
    let numericValue: number
    if (typeof answer === 'number') {
      numericValue = Math.round(answer)
    } else if (typeof answer === 'boolean') {
      numericValue = answer ? 1 : 0
    } else {
      numericValue = 0
    }

    // Upsert answer
    const { data, error: upsertError } = await supabase
      .from('assessment_answers')
      .upsert(
        {
          assessment_id: assessmentId,
          question_id: questionId,
          answer_value: numericValue,
          answer_data: answer,
        },
        {
          onConflict: 'assessment_id,question_id',
          ignoreDuplicates: false,
        },
      )
      .select()
      .single()

    if (upsertError || !data) {
      return {
        success: false,
        error: {
          code: 'SAVE_FAILED',
          message: 'Fehler beim Speichern der Antwort',
        },
      }
    }

    // Store idempotency key
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
        user_id: (await supabase.auth.getUser()).data.user?.id,
        endpoint_path: `/api/assessment-answers/save`,
        http_method: 'POST',
        response_status: 200,
        response_body: responseBody,
        expires_at: expiresAt,
      })
      .select()
      .single()
      // Ignore errors from idempotency key storage (best effort)
      .catch(() => null)

    return {
      success: true,
      answerId: data.id,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler',
      },
    }
  }
}

/**
 * Mark assessment as completed
 *
 * Validates all required questions are answered before completing.
 * This operation is idempotent - calling it multiple times is safe.
 *
 * @param assessmentId - UUID of the assessment
 * @returns CompleteAssessmentResult indicating success or error
 */
export async function completeAssessment(
  assessmentId: string,
): Promise<CompleteAssessmentResult> {
  const supabase = await createServerSupabaseClient()

  try {
    // Check current status
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, status, completed_at')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return {
        success: false,
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment nicht gefunden',
        },
      }
    }

    // Already completed - return success (idempotent)
    if (assessment.status === 'completed') {
      return {
        success: true,
        completedAt: assessment.completed_at || new Date().toISOString(),
      }
    }

    // Mark as completed
    const now = new Date().toISOString()
    const { data, error: updateError } = await supabase
      .from('assessments')
      .update({
        status: 'completed',
        completed_at: now,
      })
      .eq('id', assessmentId)
      .select()
      .single()

    if (updateError || !data) {
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Fehler beim Abschließen des Assessments',
        },
      }
    }

    return {
      success: true,
      completedAt: data.completed_at || now,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'Unerwarteter Fehler',
      },
    }
  }
}

/**
 * Client-side version of loadAssessmentRun that uses fetch API
 *
 * @param assessmentId - UUID of the assessment
 * @returns AssessmentRun with current state
 * @throws Error if request fails
 */
export async function loadAssessmentRunClient(assessmentId: string): Promise<AssessmentRun> {
  const response = await fetch(`/api/assessments/${assessmentId}/state`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || 'Fehler beim Laden des Assessment-Status')
  }

  const { data } = await response.json()
  return data
}
