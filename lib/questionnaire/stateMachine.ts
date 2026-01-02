/**
 * Questionnaire State Machine (V05-I03.2)
 * 
 * Manages the state and sequencing of questionnaire steps with conditional logic.
 * All types from registry and funnelManifest contracts.
 */

import type {
  FunnelQuestionnaireConfig,
  QuestionnaireStep,
  QuestionConfig,
} from '@/lib/contracts/funnelManifest'
import { getVisibleSteps, type AnswersMap } from './conditionalLogic'

export type QuestionnaireState = {
  /** Current step index in visible steps */
  currentStepIndex: number
  /** All steps (including hidden) */
  allSteps: QuestionnaireStep[]
  /** Currently visible steps based on answers */
  visibleSteps: QuestionnaireStep[]
  /** User answers: questionId -> value */
  answers: AnswersMap
  /** Whether questionnaire is complete */
  isComplete: boolean
}

/**
 * Initializes questionnaire state
 */
export function initQuestionnaireState(
  config: FunnelQuestionnaireConfig,
): QuestionnaireState {
  return {
    currentStepIndex: 0,
    allSteps: config.steps,
    visibleSteps: config.steps, // Initially all visible
    answers: {},
    isComplete: false,
  }
}

/**
 * Updates questionnaire state with new answer
 * Recalculates visible steps based on updated answers
 */
export function updateAnswer(
  state: QuestionnaireState,
  questionId: string,
  value: string | number | boolean | string[],
): QuestionnaireState {
  const newAnswers = {
    ...state.answers,
    [questionId]: value,
  }

  const newVisibleSteps = getVisibleSteps(state.allSteps, newAnswers)

  // Ensure current step is still valid
  let newCurrentStepIndex = state.currentStepIndex
  if (newCurrentStepIndex >= newVisibleSteps.length) {
    newCurrentStepIndex = Math.max(0, newVisibleSteps.length - 1)
  }

  return {
    ...state,
    answers: newAnswers,
    visibleSteps: newVisibleSteps,
    currentStepIndex: newCurrentStepIndex,
  }
}

/**
 * Moves to next step if available
 */
export function goToNextStep(state: QuestionnaireState): QuestionnaireState {
  if (state.currentStepIndex >= state.visibleSteps.length - 1) {
    // Last step - mark as complete
    return {
      ...state,
      isComplete: true,
    }
  }

  return {
    ...state,
    currentStepIndex: state.currentStepIndex + 1,
  }
}

/**
 * Moves to previous step if available
 */
export function goToPreviousStep(state: QuestionnaireState): QuestionnaireState {
  if (state.currentStepIndex <= 0) {
    return state // Already at first step
  }

  return {
    ...state,
    currentStepIndex: state.currentStepIndex - 1,
  }
}

/**
 * Gets current step
 */
export function getCurrentStep(state: QuestionnaireState): QuestionnaireStep | null {
  return state.visibleSteps[state.currentStepIndex] || null
}

/**
 * Gets required questions in current step
 */
export function getRequiredQuestions(step: QuestionnaireStep): QuestionConfig[] {
  return step.questions.filter((q) => q.required)
}

/**
 * Validates current step - checks all required questions are answered
 */
export function validateCurrentStep(
  state: QuestionnaireState,
): { isValid: boolean; missingQuestions: QuestionConfig[] } {
  const currentStep = getCurrentStep(state)
  if (!currentStep) {
    return { isValid: false, missingQuestions: [] }
  }

  const requiredQuestions = getRequiredQuestions(currentStep)
  const missingQuestions = requiredQuestions.filter((q) => {
    const answer = state.answers[q.id]
    // Only check for undefined/null - empty string is valid for text fields
    if (answer === undefined || answer === null) {
      return true
    }
    // For arrays (checkbox), check if empty
    if (Array.isArray(answer) && answer.length === 0) {
      return true
    }
    return false
  })

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  }
}

/**
 * Gets progress information
 */
export function getProgress(state: QuestionnaireState): {
  currentStep: number
  totalSteps: number
  percentComplete: number
  answeredQuestions: number
  totalQuestions: number
} {
  const totalQuestions = state.allSteps.reduce((sum, step) => sum + step.questions.length, 0)
  const answeredQuestions = Object.keys(state.answers).length

  return {
    currentStep: state.currentStepIndex + 1,
    totalSteps: state.visibleSteps.length,
    percentComplete: state.visibleSteps.length > 0 
      ? ((state.currentStepIndex + 1) / state.visibleSteps.length) * 100 
      : 0,
    answeredQuestions,
    totalQuestions,
  }
}

/**
 * Checks if we can go to next step
 */
export function canGoNext(state: QuestionnaireState): boolean {
  return state.currentStepIndex < state.visibleSteps.length - 1
}

/**
 * Checks if we can go to previous step
 */
export function canGoBack(state: QuestionnaireState): boolean {
  return state.currentStepIndex > 0
}
