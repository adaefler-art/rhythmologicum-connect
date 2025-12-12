import { supabase } from './supabaseClient'
import type {
  FunnelStep,
  Question,
  FunnelStepQuestion,
  FunnelStepWithQuestions,
  FunnelWithSteps,
  ActiveQuestion,
  FunnelDefinition,
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

/**
 * B1: Fetches a complete funnel definition from the API
 * This is the recommended way to load funnel structures for UI consumption
 * 
 * @param slug - The funnel slug (e.g., 'stress')
 * @returns Complete funnel definition with all steps and questions structured
 */
export async function getFunnelDefinition(slug: string): Promise<FunnelDefinition> {
  const response = await fetch(`/api/funnels/${slug}/definition`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `Failed to fetch funnel definition: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * B1: Server-side version of getFunnelDefinition for use in Server Components
 * Directly queries the database instead of making an HTTP request
 * 
 * @param slug - The funnel slug (e.g., 'stress')
 * @returns Complete funnel definition with all steps and questions structured
 */
export async function getFunnelDefinitionServer(slug: string): Promise<FunnelDefinition> {
  // 1. Fetch funnel by slug
  const { data: funnel, error: funnelError } = await supabase
    .from('funnels')
    .select('*')
    .eq('slug', slug)
    .single()

  if (funnelError) throw new Error(`Funnel not found: ${funnelError.message}`)
  if (!funnel) throw new Error('Funnel not found')

  // 2. Fetch funnel steps ordered by order_index
  const { data: steps, error: stepsError } = await supabase
    .from('funnel_steps')
    .select('*')
    .eq('funnel_id', funnel.id)
    .order('order_index', { ascending: true })

  if (stepsError) throw new Error(`Error loading steps: ${stepsError.message}`)

  // 3. For each step, fetch associated questions
  const stepsWithQuestions = await Promise.all(
    (steps || []).map(async (step) => {
      const stepType = step.type.toLowerCase()

      // For question steps, fetch questions
      if (stepType === 'question_step' || stepType === 'form') {
        const { data: stepQuestions, error: stepQuestionsError } = await supabase
          .from('funnel_step_questions')
          .select('*')
          .eq('funnel_step_id', step.id)
          .order('order_index', { ascending: true })

        if (stepQuestionsError) throw stepQuestionsError

        const questionIds = (stepQuestions || []).map((sq) => sq.question_id)
        
        type QuestionDef = {
          id: string
          key: string
          label: string
          helpText: string | null
          questionType: string
          minValue: number | null
          maxValue: number | null
          isRequired: boolean
          orderIndex: number
        }
        
        let questions: QuestionDef[] = []
        
        if (questionIds.length > 0) {
          const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds)

          if (questionsError) throw questionsError

          questions = (stepQuestions || [])
            .map((sq) => {
              const question = (questionsData || []).find((q) => q.id === sq.question_id)
              if (!question) return null

              return {
                id: question.id,
                key: question.key,
                label: question.label,
                helpText: question.help_text,
                questionType: question.question_type,
                minValue: question.min_value,
                maxValue: question.max_value,
                isRequired: sq.is_required,
                orderIndex: sq.order_index,
              }
            })
            .filter((q) => q !== null)
        }

        return {
          id: step.id,
          orderIndex: step.order_index,
          title: step.title,
          description: step.description,
          type: stepType,
          questions,
        }
      } else if (stepType === 'info_step' || stepType === 'info') {
        return {
          id: step.id,
          orderIndex: step.order_index,
          title: step.title,
          description: step.description,
          type: stepType,
          content: step.description || '',
        }
      } else if (stepType === 'content_page') {
        // For content page steps, fetch the referenced content page
        const contentPageId = (step as { content_page_id?: string }).content_page_id
        
        if (!contentPageId) {
          return {
            id: step.id,
            orderIndex: step.order_index,
            title: step.title,
            description: step.description,
            type: 'content_page' as const,
            contentPageId: '',
          }
        }

        const { data: contentPage, error: contentPageError } = await supabase
          .from('content_pages')
          .select('id, slug, title, excerpt, body_markdown, status')
          .eq('id', contentPageId)
          .single()

        if (contentPageError) {
          // Check if error is due to missing body_markdown column (migration not run)
          if (contentPageError.code === '42703') {
            console.warn('content_pages.body_markdown missing, retrying with minimal fields (run migration)')
            const { data: fallbackContent, error: fallbackError } = await supabase
              .from('content_pages')
              .select('id, slug, title, excerpt, status')
              .eq('id', contentPageId)
              .single()
            
            if (fallbackError) {
              console.error('Error fetching content page (fallback):', fallbackError)
              throw fallbackError
            }
            
            return {
              id: step.id,
              orderIndex: step.order_index,
              title: step.title,
              description: step.description,
              type: 'content_page' as const,
              contentPageId,
              contentPage: fallbackContent,
            }
          }
          
          console.error('Error fetching content page:', contentPageError)
          throw contentPageError
        }

        return {
          id: step.id,
          orderIndex: step.order_index,
          title: step.title,
          description: step.description,
          type: 'content_page' as const,
          contentPageId,
          contentPage: contentPage,
        }
      } else {
        return {
          id: step.id,
          orderIndex: step.order_index,
          title: step.title,
          description: step.description,
          type: stepType,
        }
      }
    }),
  )

  // 4. Calculate totals
  const totalQuestions = stepsWithQuestions.reduce((total, step) => {
    if ('questions' in step && step.questions) {
      return total + step.questions.length
    }
    return total
  }, 0)

  // 5. Build final funnel definition
  return {
    id: funnel.id,
    slug: funnel.slug,
    title: funnel.title,
    subtitle: funnel.subtitle,
    description: funnel.description,
    theme: funnel.default_theme,
    steps: stepsWithQuestions,
    totalSteps: stepsWithQuestions.length,
    totalQuestions,
    isActive: funnel.is_active,
  }
}
