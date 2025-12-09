import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  // Get all steps for this funnel
  const { data: steps, error: stepsError } = await supabase
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
