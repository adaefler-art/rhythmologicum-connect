/**
 * Tests for Questionnaire State Machine (V05-I03.2)
 */

import {
  initQuestionnaireState,
  initQuestionnaireStateWithResume,
  updateAnswer,
  goToNextStep,
  goToPreviousStep,
  getCurrentStep,
  validateCurrentStep,
  getProgress,
  canGoNext,
  canGoBack,
} from '../stateMachine'
import type { FunnelQuestionnaireConfig } from '@/lib/contracts/funnelManifest'
import { QUESTION_TYPE } from '@/lib/contracts/registry'

describe('Questionnaire State Machine', () => {
  const mockConfig: FunnelQuestionnaireConfig = {
    version: '1.0',
    steps: [
      {
        id: 'step1',
        title: 'Personal Info',
        questions: [
          {
            id: 'q1',
            key: 'age',
            type: QUESTION_TYPE.NUMBER,
            label: 'What is your age?',
            required: true,
          },
        ],
      },
      {
        id: 'step2',
        title: 'Health Info',
        description: 'Tell us about your health',
        questions: [
          {
            id: 'q2',
            key: 'stress_level',
            type: QUESTION_TYPE.SCALE,
            label: 'Stress level?',
            required: true,
            minValue: 1,
            maxValue: 10,
          },
        ],
        conditionalLogic: {
          type: 'show',
          conditions: [{ questionId: 'q1', operator: 'gte', value: 18 }],
          logic: 'and',
        },
      },
      {
        id: 'step3',
        title: 'Summary',
        questions: [
          {
            id: 'q3',
            key: 'comments',
            type: QUESTION_TYPE.TEXTAREA,
            label: 'Any comments?',
            required: false,
          },
        ],
      },
    ],
  }

  describe('initQuestionnaireState', () => {
    it('initializes with correct default values', () => {
      const state = initQuestionnaireState(mockConfig)

      expect(state.currentStepIndex).toBe(0)
      expect(state.allSteps).toEqual(mockConfig.steps)
      expect(state.visibleSteps).toEqual(mockConfig.steps)
      expect(state.answers).toEqual({})
      expect(state.isComplete).toBe(false)
    })
  })

  describe('updateAnswer', () => {
    it('updates answers and recalculates visible steps', () => {
      let state = initQuestionnaireState(mockConfig)

      // Answer with age < 18 (should hide step2)
      state = updateAnswer(state, 'q1', 15)

      expect(state.answers['q1']).toBe(15)
      expect(state.visibleSteps).toHaveLength(2)
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['step1', 'step3'])
    })

    it('shows conditional step when condition is met', () => {
      let state = initQuestionnaireState(mockConfig)

      // Answer with age >= 18 (should show step2)
      state = updateAnswer(state, 'q1', 25)

      expect(state.answers['q1']).toBe(25)
      expect(state.visibleSteps).toHaveLength(3)
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['step1', 'step2', 'step3'])
    })

    it('adjusts current step index if current step becomes hidden', () => {
      let state = initQuestionnaireState(mockConfig)

      // Go to step2
      state = updateAnswer(state, 'q1', 25)
      state = goToNextStep(state)
      expect(state.currentStepIndex).toBe(1)

      // Change answer to hide current step
      state = updateAnswer(state, 'q1', 15)

      // Should adjust to valid step index
      expect(state.currentStepIndex).toBeLessThan(state.visibleSteps.length)
    })
  })

  describe('goToNextStep', () => {
    it('advances to next step', () => {
      let state = initQuestionnaireState(mockConfig)

      state = goToNextStep(state)

      expect(state.currentStepIndex).toBe(1)
      expect(state.isComplete).toBe(false)
    })

    it('marks as complete on last step', () => {
      let state = initQuestionnaireState(mockConfig)

      // Go to last step
      state = { ...state, currentStepIndex: 2 }
      state = goToNextStep(state)

      expect(state.isComplete).toBe(true)
    })
  })

  describe('goToPreviousStep', () => {
    it('goes back to previous step', () => {
      let state = initQuestionnaireState(mockConfig)
      state = goToNextStep(state)
      expect(state.currentStepIndex).toBe(1)

      state = goToPreviousStep(state)

      expect(state.currentStepIndex).toBe(0)
    })

    it('stays at first step when already at beginning', () => {
      let state = initQuestionnaireState(mockConfig)

      state = goToPreviousStep(state)

      expect(state.currentStepIndex).toBe(0)
    })
  })

  describe('getCurrentStep', () => {
    it('returns current step', () => {
      const state = initQuestionnaireState(mockConfig)

      const currentStep = getCurrentStep(state)

      expect(currentStep?.id).toBe('step1')
    })

    it('returns null if no visible steps', () => {
      const state = {
        currentStepIndex: 0,
        allSteps: [],
        visibleSteps: [],
        answers: {},
        isComplete: false,
      }

      expect(getCurrentStep(state)).toBeNull()
    })
  })

  describe('validateCurrentStep', () => {
    it('returns valid when all required questions answered', () => {
      let state = initQuestionnaireState(mockConfig)
      state = updateAnswer(state, 'q1', 25)

      const validation = validateCurrentStep(state)

      expect(validation.isValid).toBe(true)
      expect(validation.missingQuestions).toHaveLength(0)
    })

    it('returns invalid when required questions missing', () => {
      const state = initQuestionnaireState(mockConfig)

      const validation = validateCurrentStep(state)

      expect(validation.isValid).toBe(false)
      expect(validation.missingQuestions).toHaveLength(1)
      expect(validation.missingQuestions[0].id).toBe('q1')
    })

    it('ignores optional questions', () => {
      let state = initQuestionnaireState(mockConfig)
      // Go to step3 which has optional question
      state = { ...state, currentStepIndex: 2 }

      const validation = validateCurrentStep(state)

      expect(validation.isValid).toBe(true) // Optional question not required
    })
  })

  describe('getProgress', () => {
    it('calculates progress correctly', () => {
      let state = initQuestionnaireState(mockConfig)
      state = updateAnswer(state, 'q1', 25)

      const progress = getProgress(state)

      expect(progress.currentStep).toBe(1)
      expect(progress.totalSteps).toBe(3)
      expect(progress.answeredQuestions).toBe(1)
      expect(progress.totalQuestions).toBe(3)
      expect(progress.percentComplete).toBeCloseTo(33.33, 1)
    })

    it('handles empty questionnaire', () => {
      const state = {
        currentStepIndex: 0,
        allSteps: [],
        visibleSteps: [],
        answers: {},
        isComplete: false,
      }

      const progress = getProgress(state)

      expect(progress.currentStep).toBe(1)
      expect(progress.totalSteps).toBe(0)
      expect(progress.percentComplete).toBe(0)
    })
  })

  describe('canGoNext / canGoBack', () => {
    it('canGoNext returns true when not at last step', () => {
      const state = initQuestionnaireState(mockConfig)

      expect(canGoNext(state)).toBe(true)
    })

    it('canGoNext returns false at last step', () => {
      let state = initQuestionnaireState(mockConfig)
      state = { ...state, currentStepIndex: 2 }

      expect(canGoNext(state)).toBe(false)
    })

    it('canGoBack returns false at first step', () => {
      const state = initQuestionnaireState(mockConfig)

      expect(canGoBack(state)).toBe(false)
    })

    it('canGoBack returns true when not at first step', () => {
      let state = initQuestionnaireState(mockConfig)
      state = goToNextStep(state)

      expect(canGoBack(state)).toBe(true)
    })
  })

  describe('Determinism', () => {
    it('produces same sequence for same answers', () => {
      // Run 1
      let state1 = initQuestionnaireState(mockConfig)
      state1 = updateAnswer(state1, 'q1', 25)
      const steps1 = state1.visibleSteps.map((s) => s.id)

      // Run 2
      let state2 = initQuestionnaireState(mockConfig)
      state2 = updateAnswer(state2, 'q1', 25)
      const steps2 = state2.visibleSteps.map((s) => s.id)

      expect(steps1).toEqual(steps2)
    })
  })

  describe('Deterministic Resume', () => {
    it('resumes at first incomplete step when partially answered', () => {
      const initialAnswers = {
        q1: 25, // Step 1 complete (age >= 18, so step2 will be visible)
        // Step 2 (q2) not answered
      }

      const state = initQuestionnaireStateWithResume(mockConfig, initialAnswers)

      // Should be on step2 (index 1) since step1 is complete
      expect(state.currentStepIndex).toBe(1)
      expect(state.visibleSteps[1].id).toBe('step2')
      expect(state.answers).toEqual(initialAnswers)
    })

    it('resumes at correct step with branch A', () => {
      const initialAnswers = {
        q1: 15, // Age < 18, step2 will be hidden
      }

      const state = initQuestionnaireStateWithResume(mockConfig, initialAnswers)

      // Visible steps should be: step1, step3 (step2 hidden)
      expect(state.visibleSteps).toHaveLength(2)
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['step1', 'step3'])

      // Should be on step3 (index 1 in visible steps) since step1 is complete
      expect(state.currentStepIndex).toBe(1)
      expect(getCurrentStep(state)?.id).toBe('step3')
    })

    it('resumes at correct step with branch B', () => {
      const initialAnswers = {
        q1: 25, // Age >= 18, step2 will be visible
        q2: 'Engineer', // Step 2 complete
      }

      const state = initQuestionnaireStateWithResume(mockConfig, initialAnswers)

      // Visible steps should be: step1, step2, step3 (all visible)
      expect(state.visibleSteps).toHaveLength(3)
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['step1', 'step2', 'step3'])

      // Should be on step3 (index 2) since step1 and step2 are complete
      expect(state.currentStepIndex).toBe(2)
      expect(getCurrentStep(state)?.id).toBe('step3')
    })

    it('resume is deterministic - same answers produce same position', () => {
      const initialAnswers = {
        q1: 25,
        q2: 'Engineer',
      }

      // Run 1
      const state1 = initQuestionnaireStateWithResume(mockConfig, initialAnswers)

      // Run 2
      const state2 = initQuestionnaireStateWithResume(mockConfig, initialAnswers)

      // Should produce identical states
      expect(state1.currentStepIndex).toBe(state2.currentStepIndex)
      expect(state1.visibleSteps.map((s) => s.id)).toEqual(state2.visibleSteps.map((s) => s.id))
      expect(state1.answers).toEqual(state2.answers)
    })

    it('stays on last step when all complete', () => {
      const initialAnswers = {
        q1: 25,
        q2: 'Engineer',
        q3: 'Some comment',
      }

      const state = initQuestionnaireStateWithResume(mockConfig, initialAnswers)

      // Should be on last step
      expect(state.currentStepIndex).toBe(2)
      expect(getCurrentStep(state)?.id).toBe('step3')
    })
  })

  describe('Downstream answer invalidation on step hide', () => {
    it('preserves downstream answers when step becomes hidden', () => {
      let state = initQuestionnaireState(mockConfig)

      // Answer all questions
      state = updateAnswer(state, 'q1', 25) // Makes step2 visible
      state = updateAnswer(state, 'q2', 'Engineer')
      state = updateAnswer(state, 'q3', 'Comment')

      expect(state.answers).toEqual({
        q1: 25,
        q2: 'Engineer',
        q3: 'Comment',
      })

      // Change q1 to hide step2
      state = updateAnswer(state, 'q1', 15)

      // Downstream answer (q2) should still be in answers (preserved)
      // but step2 is no longer visible
      expect(state.answers).toEqual({
        q1: 15,
        q2: 'Engineer', // Preserved
        q3: 'Comment',
      })

      expect(state.visibleSteps.map((s) => s.id)).toEqual(['step1', 'step3'])
    })

    it('recalculates current step deterministically when current step becomes hidden', () => {
      let state = initQuestionnaireState(mockConfig)

      // Go to step2
      state = updateAnswer(state, 'q1', 25)
      state = goToNextStep(state)

      expect(state.currentStepIndex).toBe(1)
      expect(getCurrentStep(state)?.id).toBe('step2')

      // Answer q2
      state = updateAnswer(state, 'q2', 'Engineer')

      // Now change q1 to hide step2 (current step)
      state = updateAnswer(state, 'q1', 15)

      // Current step should be recalculated to valid position
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['step1', 'step3'])

      // Should be on step3 (index 1) since step1 was already complete
      expect(state.currentStepIndex).toBe(1)
      expect(getCurrentStep(state)?.id).toBe('step3')
    })
  })
})
