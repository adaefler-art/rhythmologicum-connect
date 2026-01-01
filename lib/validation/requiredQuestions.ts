import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { evaluateRule, describeRule } from './ruleEngine'
import { env } from '@/lib/env'
import type {
  QuestionRule,
  MissingQuestionWithReason,
  ValidationResultExtended,
} from './ruleTypes'

// Legacy types for backward compatibility
export type ValidationResult = {
  isValid: boolean
  missingQuestions: MissingQuestion[]
}

export type MissingQuestion = {
  questionId: string
  questionKey: string
  questionLabel: string
  orderIndex: number
}

// Re-export extended types
export type { MissingQuestionWithReason, ValidationResultExtended }

/**
 * Validates that all required questions for a given funnel step have been answered
 * in the assessment.
 *
 * @param assessmentId - The UUID of the assessment
 * @param stepId - The UUID of the funnel step to validate
 * @returns ValidationResult with isValid flag and list of missing required questions
 */
export async function validateRequiredQuestions(
  assessmentId: string,
  stepId: string,
): Promise<ValidationResult> {
  const supabase = await createServerSupabaseClient()

  // Get all required questions for this step
  const { data: requiredQuestions, error: questionsError } = await supabase
    .from('funnel_step_questions')
    .select(
      `
      order_index,
      questions (
        id,
        key,
        label
      )
    `,
    )
    .eq('funnel_step_id', stepId)
    .eq('is_required', true)
    .order('order_index', { ascending: true })

  if (questionsError) {
    console.error('Error fetching required questions:', questionsError)
    throw new Error('Failed to fetch required questions')
  }

  if (!requiredQuestions || requiredQuestions.length === 0) {
    // No required questions for this step - validation passes
    return {
      isValid: true,
      missingQuestions: [],
    }
  }

  // Get all answered questions for this assessment
  const { data: answeredQuestions, error: answersError } = await supabase
    .from('assessment_answers')
    .select('question_id')
    .eq('assessment_id', assessmentId)

  if (answersError) {
    console.error('Error fetching assessment answers:', answersError)
    throw new Error('Failed to fetch assessment answers')
  }

  // Create a set of answered question keys for quick lookup
  const answeredKeys = new Set(answeredQuestions?.map((a) => a.question_id) || [])

  // Find missing required questions
  const missingQuestions: MissingQuestion[] = []

  for (const item of requiredQuestions) {
    // Handle both array and single object from Supabase join
    const question = Array.isArray(item.questions) ? item.questions[0] : item.questions

    if (!question) continue

    if (!answeredKeys.has(question.key)) {
      missingQuestions.push({
        questionId: question.id,
        questionKey: question.key,
        questionLabel: question.label,
        orderIndex: item.order_index,
      })
    }
  }

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  }
}

/**
 * Validates all required questions for all steps in an assessment's funnel.
 * Used for final assessment validation before submission.
 *
 * @param assessmentId - The UUID of the assessment
 * @param funnelId - The UUID of the funnel
 * @returns ValidationResult with isValid flag and list of all missing required questions
 */
export async function validateAllRequiredQuestions(
  assessmentId: string,
  funnelId: string,
): Promise<ValidationResult> {
  const supabase = await createServerSupabaseClient()

  // Get all steps for this funnel
  const { data: steps, error: stepsError} = await supabase
    .from('funnel_steps')
    .select('id')
    .eq('funnel_id', funnelId)

  if (stepsError) {
    console.error('Error fetching funnel steps:', stepsError)
    throw new Error('Failed to fetch funnel steps')
  }

  if (!steps || steps.length === 0) {
    return {
      isValid: true,
      missingQuestions: [],
    }
  }

  // Validate each step and collect all missing questions
  const allMissingQuestions: MissingQuestion[] = []

  for (const step of steps) {
    const stepValidation = await validateRequiredQuestions(assessmentId, step.id)
    if (!stepValidation.isValid) {
      allMissingQuestions.push(...stepValidation.missingQuestions)
    }
  }

  return {
    isValid: allMissingQuestions.length === 0,
    missingQuestions: allMissingQuestions,
  }
}

/**
 * Extended validation with B4 dynamic rule support.
 * Validates required questions AND evaluates conditional rules.
 *
 * @param assessmentId - The UUID of the assessment
 * @param stepId - The UUID of the funnel step to validate
 * @returns ValidationResultExtended with reason field for each missing question
 */
export async function validateRequiredQuestionsExtended(
  assessmentId: string,
  stepId: string,
): Promise<ValidationResultExtended> {
  const supabase = await createServerSupabaseClient()

  // Get all questions for this step (both required and optional)
  const { data: stepQuestions, error: questionsError } = await supabase
    .from('funnel_step_questions')
    .select(
      `
      order_index,
      is_required,
      questions (
        id,
        key,
        label
      )
    `,
    )
    .eq('funnel_step_id', stepId)
    .order('order_index', { ascending: true })

  if (questionsError) {
    console.error('Error fetching questions:', questionsError)
    throw new Error('Failed to fetch questions')
  }

  if (!stepQuestions || stepQuestions.length === 0) {
    return {
      isValid: true,
      missingQuestions: [],
    }
  }

  // Get all answered questions for this assessment
  const { data: answeredQuestions, error: answersError } = await supabase
    .from('assessment_answers')
    .select('question_id, answer_value')
    .eq('assessment_id', assessmentId)

  if (answersError) {
    console.error('Error fetching assessment answers:', answersError)
    throw new Error('Failed to fetch assessment answers')
  }

  // Create a map of answers: question.key -> answer_value
  // Note: assessment_answers.question_id stores question.key (string), not question.id (UUID)
  const answers: Record<string, number> = {}
  answeredQuestions?.forEach((answer) => {
    answers[answer.question_id] = answer.answer_value
  })

  // Load all active rules for this step
  const { data: rules, error: rulesError } = await supabase
    .from('funnel_question_rules')
    .select('*')
    .eq('funnel_step_id', stepId)
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (rulesError) {
    console.error('Error fetching rules:', rulesError)
    // Continue without rules - backward compatibility
  }

  const activeRules: QuestionRule[] = (rules as QuestionRule[]) || []

  // Track missing questions with reason
  const missingQuestions: MissingQuestionWithReason[] = []

  for (const item of stepQuestions) {
    const question = Array.isArray(item.questions) ? item.questions[0] : item.questions

    if (!question) continue

    const isAnswered = answers[question.key] !== undefined
    const isBaseRequired = item.is_required

    // Check base requirement (B2 logic)
    if (isBaseRequired && !isAnswered) {
      missingQuestions.push({
        questionId: question.id,
        questionKey: question.key,
        questionLabel: question.label,
        orderIndex: item.order_index,
        reason: 'required',
      })
      continue
    }

    // Check conditional rules (B4 logic)
    // Find applicable conditional_required rules for this question
    const conditionalRules = activeRules.filter(
      (rule) => rule.question_id === question.id && rule.rule_type === 'conditional_required',
    )

    for (const rule of conditionalRules) {
      // Evaluate if the rule condition is met
      const ruleApplies = evaluateRule(rule.rule_payload, answers)

      if (ruleApplies && !isAnswered) {
        // Rule condition is met, but question is not answered
        missingQuestions.push({
          questionId: question.id,
          questionKey: question.key,
          questionLabel: question.label,
          orderIndex: item.order_index,
          reason: 'conditional_required',
          ruleId: rule.id,
          ruleDescription: describeRule(rule.rule_payload),
        })
        break // Only report once per question
      }
    }
  }

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  }
}
