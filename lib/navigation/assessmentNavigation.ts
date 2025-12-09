import { SupabaseClient } from '@supabase/supabase-js'

/**
 * B3: Assessment Navigation Helper Functions
 * 
 * Provides performant navigation and resume functionality for assessments.
 * Determines current, next, and previous steps based on answered questions.
 */

export type NavigationState = {
  currentStepId: string | null
  currentStepIndex: number
  canGoNext: boolean
  canGoPrevious: boolean
  isComplete: boolean
  totalSteps: number
  answeredQuestions: number
  totalQuestions: number
}

export type StepInfo = {
  stepId: string
  stepIndex: number
  orderIndex: number
  title: string
  type: string
  hasQuestions: boolean
  requiredQuestions: string[]
  answeredQuestions: string[]
}

/**
 * Gets the current step for an assessment based on answered questions.
 * 
 * Logic:
 * 1. Fetch all funnel steps ordered by order_index
 * 2. For each step with questions, check if all required questions are answered
 * 3. Return the first step where not all required questions are answered
 * 4. If all steps are complete, return the last step (summary/complete state)
 * 
 * @param supabase - Supabase client instance
 * @param assessmentId - UUID of the assessment
 * @param cachedFunnelId - Optional funnel_id to avoid re-fetching assessment
 * @returns Current step information or null if assessment not found
 */
export async function getCurrentStep(
  supabase: SupabaseClient,
  assessmentId: string,
  cachedFunnelId?: string,
): Promise<StepInfo | null> {
  // 1. Get assessment with funnel_id (unless cached)
  let funnelId = cachedFunnelId

  if (!funnelId) {
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, funnel_id')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment || !assessment.funnel_id) {
      console.error('Assessment not found or has no funnel_id:', assessmentError)
      return null
    }

    funnelId = assessment.funnel_id
  }

  // 2. Get all answered questions for this assessment
  const { data: answers, error: answersError } = await supabase
    .from('assessment_answers')
    .select('question_id')
    .eq('assessment_id', assessmentId)

  if (answersError) {
    console.error('Error fetching answers:', answersError)
    return null
  }

  const answeredQuestionIds = new Set((answers || []).map((a) => a.question_id))

  // 3. Get all funnel steps with their questions
  const { data: steps, error: stepsError } = await supabase
    .from('funnel_steps')
    .select('id, order_index, title, type')
    .eq('funnel_id', funnelId)
    .order('order_index', { ascending: true })

  if (stepsError || !steps) {
    console.error('Error fetching steps:', stepsError)
    return null
  }

  // 4. Fetch all step questions in one query to avoid N+1 problem
  const stepIds = steps.map((s) => s.id)
  const { data: allStepQuestions, error: allStepQuestionsError } = await supabase
    .from('funnel_step_questions')
    .select('funnel_step_id, question_id, is_required, questions(key)')
    .in('funnel_step_id', stepIds)
    .order('order_index', { ascending: true })

  if (allStepQuestionsError) {
    console.error('Error fetching step questions:', allStepQuestionsError)
    return null
  }

  // Group questions by step ID
  const questionsByStep = new Map<string, Array<{ question_id: string; is_required: boolean }>>()
  ;(allStepQuestions || []).forEach((sq) => {
    if (!questionsByStep.has(sq.funnel_step_id)) {
      questionsByStep.set(sq.funnel_step_id, [])
    }
    questionsByStep.get(sq.funnel_step_id)!.push({
      question_id: sq.question_id,
      is_required: sq.is_required,
    })
  })

  // 5. For each step, check if all required questions are answered
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const stepQuestions = questionsByStep.get(step.id) || []

    const requiredQuestions = stepQuestions
      .filter((sq) => sq.is_required)
      .map(
        (
          sq: {
            question_id: string
            is_required: boolean
            questions?: { key?: string } | { key?: string }[] | null
          },
        ) => {
          const qKey = Array.isArray(sq.questions)
            ? sq.questions?.[0]?.key
            : sq.questions?.key
          const keyOrId = qKey || sq.question_id
          return { id: sq.question_id, key: keyOrId }
        },
      )

    const answeredRequired = requiredQuestions.filter((rq) => answeredQuestionIds.has(rq.key))
    const debugRequired = requiredQuestions.map((rq) => rq.key)
    const debugAnswered = Array.from(answeredQuestionIds)
    console.info('getCurrentStep debug', {
      stepId: step.id,
      required: debugRequired,
      answered: debugAnswered,
      answeredRequired: answeredRequired.map((rq) => rq.key),
    })
    const answeredRequiredIds = answeredRequired.map((rq) => rq.id)

    // If this step has questions and not all required are answered, this is the current step
    if (requiredQuestions.length > 0 && answeredRequired.length < requiredQuestions.length) {
      return {
        stepId: step.id,
        stepIndex: i,
        orderIndex: step.order_index,
        title: step.title,
        type: step.type,
        hasQuestions: true,
        requiredQuestions: requiredQuestions.map((rq) => rq.id),
        answeredQuestions: answeredRequiredIds,
      }
    }
  }

  // All steps complete - return last step
  const lastStep = steps[steps.length - 1]
  return {
    stepId: lastStep.id,
    stepIndex: steps.length - 1,
    orderIndex: lastStep.order_index,
    title: lastStep.title,
    type: lastStep.type,
    hasQuestions: false,
    requiredQuestions: [],
    answeredQuestions: [],
  }
}

/**
 * Gets the navigation state for an assessment.
 * 
 * @param supabase - Supabase client instance
 * @param assessmentId - UUID of the assessment
 * @returns Complete navigation state
 */
export async function getNavigationState(
  supabase: SupabaseClient,
  assessmentId: string,
): Promise<NavigationState | null> {
  const currentStep = await getCurrentStep(supabase, assessmentId)

  if (!currentStep) {
    return null
  }

  // Get total steps and questions
  const { data: assessment } = await supabase
    .from('assessments')
    .select('funnel_id')
    .eq('id', assessmentId)
    .single()

  if (!assessment || !assessment.funnel_id) {
    return null
  }

  const { data: steps } = await supabase
    .from('funnel_steps')
    .select('id')
    .eq('funnel_id', assessment.funnel_id)

  const { data: allStepQuestions } = await supabase
    .from('funnel_step_questions')
    .select('question_id, is_required')
    .in(
      'funnel_step_id',
      (steps || []).map((s) => s.id),
    )

  const totalRequiredQuestions = (allStepQuestions || []).filter((sq) => sq.is_required).length

  const { data: answers } = await supabase
    .from('assessment_answers')
    .select('question_id')
    .eq('assessment_id', assessmentId)

  const answeredCount = (answers || []).length

  const totalSteps = (steps || []).length
  const isComplete = currentStep.stepIndex === totalSteps - 1 && currentStep.requiredQuestions.length === 0

  return {
    currentStepId: currentStep.stepId,
    currentStepIndex: currentStep.stepIndex,
    canGoNext: currentStep.stepIndex < totalSteps - 1,
    canGoPrevious: currentStep.stepIndex > 0,
    isComplete,
    totalSteps,
    answeredQuestions: answeredCount,
    totalQuestions: totalRequiredQuestions,
  }
}

/**
 * Gets the next step ID for an assessment.
 * Returns null if already at the last step.
 * 
 * @param supabase - Supabase client instance
 * @param assessmentId - UUID of the assessment
 * @param currentStep - Optional cached current step to avoid recalculation
 * @returns Next step ID or null
 */
export async function getNextStepId(
  supabase: SupabaseClient,
  assessmentId: string,
  currentStep?: StepInfo,
): Promise<string | null> {
  const stepInfo = currentStep || (await getCurrentStep(supabase, assessmentId))

  if (!stepInfo) {
    return null
  }

  // Get assessment funnel_id
  const { data: assessment } = await supabase
    .from('assessments')
    .select('funnel_id')
    .eq('id', assessmentId)
    .single()

  if (!assessment || !assessment.funnel_id) {
    return null
  }

  // Get next step by order_index
  const { data: nextStep } = await supabase
    .from('funnel_steps')
    .select('id')
    .eq('funnel_id', assessment.funnel_id)
    .gt('order_index', stepInfo.orderIndex)
    .order('order_index', { ascending: true })
    .limit(1)
    .single()

  return nextStep?.id || null
}

/**
 * Gets the previous step ID for an assessment.
 * Returns null if already at the first step.
 * 
 * @param supabase - Supabase client instance
 * @param assessmentId - UUID of the assessment
 * @param currentStep - Optional cached current step to avoid recalculation
 * @returns Previous step ID or null
 */
export async function getPreviousStepId(
  supabase: SupabaseClient,
  assessmentId: string,
  currentStep?: StepInfo,
): Promise<string | null> {
  const stepInfo = currentStep || (await getCurrentStep(supabase, assessmentId))

  if (!stepInfo) {
    return null
  }

  if (stepInfo.stepIndex === 0) {
    return null
  }

  // Get assessment funnel_id
  const { data: assessment } = await supabase
    .from('assessments')
    .select('funnel_id')
    .eq('id', assessmentId)
    .single()

  if (!assessment || !assessment.funnel_id) {
    return null
  }

  // Get previous step by order_index
  const { data: prevStep } = await supabase
    .from('funnel_steps')
    .select('id')
    .eq('funnel_id', assessment.funnel_id)
    .lt('order_index', stepInfo.orderIndex)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  return prevStep?.id || null
}

/**
 * Validates if a step can be navigated to (all previous required questions answered).
 * 
 * @param supabase - Supabase client instance
 * @param assessmentId - UUID of the assessment
 * @param targetStepId - UUID of the target step
 * @returns true if navigation is allowed
 */
export async function canNavigateToStep(
  supabase: SupabaseClient,
  assessmentId: string,
  targetStepId: string,
): Promise<boolean> {
  const currentStep = await getCurrentStep(supabase, assessmentId)

  if (!currentStep) {
    return false
  }

  // Get target step order_index
  const { data: targetStep } = await supabase
    .from('funnel_steps')
    .select('order_index')
    .eq('id', targetStepId)
    .single()

  if (!targetStep) {
    return false
  }

  // Can always go backwards
  if (targetStep.order_index <= currentStep.orderIndex) {
    return true
  }

  // Can go forward if current step is complete
  return currentStep.requiredQuestions.length === currentStep.answeredQuestions.length
}
