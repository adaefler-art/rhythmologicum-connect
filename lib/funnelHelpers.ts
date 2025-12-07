import { supabase } from './supabaseClient'
import type {
  FunnelStep,
  Question,
  FunnelStepQuestion,
  FunnelStepWithQuestions,
  FunnelWithSteps,
  ActiveQuestion,
} from './types/funnel'

/**
 * Fetches a funnel with all its steps and questions
 */
export async function getFunnelWithQuestions(funnelId: string): Promise<FunnelWithSteps> {
  // Fetch funnel
  const { data: funnel, error: funnelError } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', funnelId)
    .single()

  if (funnelError) throw funnelError
  if (!funnel) throw new Error('Funnel not found')

  // Fetch funnel steps ordered by order_index
  const { data: steps, error: stepsError } = await supabase
    .from('funnel_steps')
    .select('*')
    .eq('funnel_id', funnelId)
    .order('order_index', { ascending: true })

  if (stepsError) throw stepsError

  // For each step, fetch associated questions
  const stepsWithQuestions: FunnelStepWithQuestions[] = await Promise.all(
    (steps || []).map(async (step: FunnelStep) => {
      // Fetch funnel_step_questions join table
      const { data: stepQuestions, error: stepQuestionsError } = await supabase
        .from('funnel_step_questions')
        .select('*')
        .eq('funnel_step_id', step.id)
        .order('order_index', { ascending: true })

      if (stepQuestionsError) throw stepQuestionsError

      // Fetch actual questions
      const questionIds = (stepQuestions || []).map((sq) => sq.question_id)
      if (questionIds.length === 0) {
        return { ...step, questions: [] }
      }

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds)

      if (questionsError) throw questionsError

      // Combine questions with their funnel_step_questions metadata
      const questionsWithMeta = (stepQuestions || [])
        .map((sq) => {
          const question = (questions || []).find((q) => q.id === sq.question_id)
          if (!question) return null

          return {
            ...question,
            funnel_step_questions: [sq],
          }
        })
        .filter(Boolean) as FunnelStepWithQuestions['questions']

      return {
        ...step,
        questions: questionsWithMeta,
      }
    }),
  )

  return {
    ...funnel,
    funnel_steps: stepsWithQuestions,
  } as FunnelWithSteps
}

/**
 * Gets the active question based on current progress
 * @param funnelId - The funnel ID
 * @param currentQuestionIndex - The current question index (0-based, across all steps)
 */
export async function getActiveQuestion(
  funnelId: string,
  currentQuestionIndex: number = 0,
): Promise<ActiveQuestion | null> {
  const funnelData = await getFunnelWithQuestions(funnelId)

  // Flatten all questions from all steps
  const allQuestions: Array<{
    question: Question
    stepIndex: number
    questionIndexInStep: number
    funnelStepQuestion: FunnelStepQuestion
  }> = []

  funnelData.funnel_steps.forEach((step: FunnelStepWithQuestions, stepIndex) => {
    step.questions.forEach((q, questionIndexInStep) => {
      const [funnelStepQuestion] = q.funnel_step_questions || []
      if (!funnelStepQuestion) {
        return
      }

      allQuestions.push({
        question: q as Question,
        stepIndex,
        questionIndexInStep,
        funnelStepQuestion,
      })
    })
  })

  if (currentQuestionIndex >= allQuestions.length || currentQuestionIndex < 0) {
    return null
  }

  const activeQ = allQuestions[currentQuestionIndex]

  return {
    question: activeQ.question,
    stepIndex: activeQ.stepIndex,
    questionIndex: currentQuestionIndex,
    totalSteps: funnelData.funnel_steps.length,
    totalQuestions: allQuestions.length,
    funnelStepQuestion: activeQ.funnelStepQuestion,
  }
}

/**
 * Calculates progress percentage based on answered questions
 */
export function calculateProgress(answeredCount: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0
  return Math.round((answeredCount / totalQuestions) * 100)
}
