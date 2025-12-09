import { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'
import { logStepSkipping, logForbidden } from '@/lib/logging/logger'

/**
 * B8: Centralized Step Validation Utilities
 * 
 * Provides reusable validation functions for step-skipping prevention
 * and step/question relationship verification.
 */

export type StepValidationResult = {
  valid: boolean
  error?: {
    code: string
    message: string
  }
}

export type QuestionValidationResult = {
  valid: boolean
  stepId?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * Ensures the requested step is the current step or a previous step.
 * Prevents step-skipping by blocking access to future steps.
 * 
 * @param supabase - Supabase client instance
 * @param assessmentId - UUID of the assessment
 * @param requestedStepId - UUID of the step being accessed
 * @param funnelId - UUID of the funnel (optional, for caching)
 * @param userId - User ID for logging
 * @returns Validation result with error details if invalid
 */
export async function ensureStepIsCurrent(
  supabase: SupabaseClient,
  assessmentId: string,
  requestedStepId: string,
  funnelId?: string,
  userId?: string,
): Promise<StepValidationResult> {
  // Get the current step for this assessment
  const currentStep = await getCurrentStep(supabase, assessmentId, funnelId)

  if (!currentStep) {
    return {
      valid: false,
      error: {
        code: 'CURRENT_STEP_NOT_FOUND',
        message: 'Fehler beim Ermitteln des aktuellen Schritts.',
      },
    }
  }

  // Get the requested step's order_index
  const { data: requestedStep, error: stepError } = await supabase
    .from('funnel_steps')
    .select('order_index')
    .eq('id', requestedStepId)
    .single()

  if (stepError || !requestedStep) {
    return {
      valid: false,
      error: {
        code: 'STEP_NOT_FOUND',
        message: 'Schritt nicht gefunden.',
      },
    }
  }

  // Allow access to current step or previous steps (for going back)
  // Block access to future steps (step-skipping)
  if (requestedStep.order_index > currentStep.orderIndex) {
    // Log step-skipping attempt
    logStepSkipping(
      {
        userId,
        assessmentId,
        stepId: currentStep.stepId,
        endpoint: 'step_validation',
      },
      requestedStepId,
    )

    return {
      valid: false,
      error: {
        code: 'STEP_SKIPPING_PREVENTED',
        message: 'Sie können nicht zu einem zukünftigen Schritt springen.',
      },
    }
  }

  return { valid: true }
}

/**
 * Verifies that a question belongs to a specific step in a funnel.
 * 
 * @param supabase - Supabase client instance
 * @param questionKey - Question key (question.key, not UUID)
 * @param stepId - UUID of the step
 * @returns Validation result with error details if invalid
 */
export async function ensureQuestionBelongsToStep(
  supabase: SupabaseClient,
  questionKey: string,
  stepId: string,
): Promise<QuestionValidationResult> {
  // Get the question by its key
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('id')
    .eq('key', questionKey)
    .single()

  if (questionError || !question) {
    return {
      valid: false,
      error: {
        code: 'QUESTION_NOT_FOUND',
        message: 'Frage nicht gefunden.',
      },
    }
  }

  // Check if this question is associated with the given step
  const { data: stepQuestion, error: stepQuestionError } = await supabase
    .from('funnel_step_questions')
    .select('funnel_step_id')
    .eq('funnel_step_id', stepId)
    .eq('question_id', question.id)
    .single()

  if (stepQuestionError || !stepQuestion) {
    return {
      valid: false,
      error: {
        code: 'QUESTION_NOT_IN_STEP',
        message: 'Diese Frage gehört nicht zu diesem Schritt.',
      },
    }
  }

  return {
    valid: true,
    stepId: stepQuestion.funnel_step_id,
  }
}

/**
 * Verifies that a step belongs to a specific funnel.
 * 
 * @param supabase - Supabase client instance
 * @param stepId - UUID of the step
 * @param funnelId - UUID of the funnel
 * @returns Validation result with error details if invalid
 */
export async function ensureStepBelongsToFunnel(
  supabase: SupabaseClient,
  stepId: string,
  funnelId: string,
): Promise<StepValidationResult> {
  const { data: step, error: stepError } = await supabase
    .from('funnel_steps')
    .select('funnel_id')
    .eq('id', stepId)
    .single()

  if (stepError || !step) {
    return {
      valid: false,
      error: {
        code: 'STEP_NOT_FOUND',
        message: 'Schritt nicht gefunden.',
      },
    }
  }

  if (step.funnel_id !== funnelId) {
    logForbidden(
      {
        stepId,
        endpoint: 'step_validation',
      },
      'Step does not belong to funnel',
    )

    return {
      valid: false,
      error: {
        code: 'STEP_NOT_IN_FUNNEL',
        message: 'Dieser Schritt gehört nicht zum Funnel des Assessments.',
      },
    }
  }

  return { valid: true }
}
