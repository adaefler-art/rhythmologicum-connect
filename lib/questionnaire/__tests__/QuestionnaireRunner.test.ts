/**
 * Integration Test for Complete Questionnaire Flow (V05-I03.2)
 * 
 * Tests the complete flow using state machine directly (no UI rendering)
 */

import {
  initQuestionnaireState,
  initQuestionnaireStateWithResume,
  updateAnswer,
  goToNextStep,
  goToPreviousStep,
  validateCurrentStep,
  getProgress,
} from '../stateMachine'
import type { FunnelQuestionnaireConfig } from '@/lib/contracts/funnelManifest'
import { QUESTION_TYPE } from '@/lib/contracts/registry'

describe('Complete Questionnaire Flow Integration', () => {
  const mockConfig: FunnelQuestionnaireConfig = {
    version: '1.0',
    steps: [
      {
        id: 'step1',
        title: 'Basic Info',
        description: 'Tell us about yourself',
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
        title: 'Adult Questions',
        questions: [
          {
            id: 'q2',
            key: 'occupation',
            type: QUESTION_TYPE.TEXT,
            label: 'What is your occupation?',
            required: true,
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
        title: 'Preferences',
        questions: [
          {
            id: 'q3',
            key: 'contact_method',
            type: QUESTION_TYPE.RADIO,
            label: 'Preferred contact method?',
            required: true,
            options: [
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
              { value: 'sms', label: 'SMS' },
            ],
          },
        ],
      },
    ],
  }

  describe('Complete flow with branching', () => {
    it('completes questionnaire with all steps when adult', () => {
      let state = initQuestionnaireState(mockConfig)

      // Step 1: Answer age >= 18
      state = updateAnswer(state, 'q1', 25)
      expect(state.visibleSteps).toHaveLength(3) // All steps visible

      // Validate and advance
      const validation1 = validateCurrentStep(state)
      expect(validation1.isValid).toBe(true)
      state = goToNextStep(state)

      // Step 2: Adult questions (should be visible)
      expect(state.currentStepIndex).toBe(1)
      expect(state.visibleSteps[1].id).toBe('step2')

      state = updateAnswer(state, 'q2', 'Software Engineer')
      const validation2 = validateCurrentStep(state)
      expect(validation2.isValid).toBe(true)
      state = goToNextStep(state)

      // Step 3: Preferences
      expect(state.currentStepIndex).toBe(2)
      state = updateAnswer(state, 'q3', 'email')

      const validation3 = validateCurrentStep(state)
      expect(validation3.isValid).toBe(true)
      state = goToNextStep(state)

      // Complete
      expect(state.isComplete).toBe(true)
      expect(state.answers).toEqual({
        q1: 25,
        q2: 'Software Engineer',
        q3: 'email',
      })
    })

    it('skips adult questions when minor', () => {
      let state = initQuestionnaireState(mockConfig)

      // Step 1: Answer age < 18
      state = updateAnswer(state, 'q1', 15)
      expect(state.visibleSteps).toHaveLength(2) // Step2 hidden

      state = goToNextStep(state)

      // Should skip to step3 directly
      expect(state.currentStepIndex).toBe(1)
      expect(state.visibleSteps[1].id).toBe('step3')

      state = updateAnswer(state, 'q3', 'phone')
      state = goToNextStep(state)

      expect(state.isComplete).toBe(true)
      expect(state.answers).toEqual({
        q1: 15,
        q3: 'phone',
      })
    })

    it('re-evaluates conditional logic when answer changes', () => {
      let state = initQuestionnaireState(mockConfig)

      // Start as adult
      state = updateAnswer(state, 'q1', 25)
      expect(state.visibleSteps).toHaveLength(3)

      // Change to minor
      state = updateAnswer(state, 'q1', 15)
      expect(state.visibleSteps).toHaveLength(2)
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['step1', 'step3'])

      // Change back to adult
      state = updateAnswer(state, 'q1', 30)
      expect(state.visibleSteps).toHaveLength(3)
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['step1', 'step2', 'step3'])
    })
  })

  describe('Validation across complete flow', () => {
    it('blocks navigation when required questions not answered', () => {
      const state = initQuestionnaireState(mockConfig)

      const validation = validateCurrentStep(state)
      expect(validation.isValid).toBe(false)
      expect(validation.missingQuestions).toHaveLength(1)
      expect(validation.missingQuestions[0].id).toBe('q1')
    })

    it('allows navigation when all required questions answered', () => {
      let state = initQuestionnaireState(mockConfig)

      state = updateAnswer(state, 'q1', 25)

      const validation = validateCurrentStep(state)
      expect(validation.isValid).toBe(true)
      expect(validation.missingQuestions).toHaveLength(0)
    })
  })

  describe('Progress tracking', () => {
    it('tracks progress correctly through questionnaire', () => {
      let state = initQuestionnaireState(mockConfig)

      let progress = getProgress(state)
      expect(progress.currentStep).toBe(1)
      expect(progress.totalSteps).toBe(3)
      expect(progress.answeredQuestions).toBe(0)
      expect(progress.totalQuestions).toBe(3)

      // Answer question
      state = updateAnswer(state, 'q1', 25)
      progress = getProgress(state)
      expect(progress.answeredQuestions).toBe(1)

      // Move to next step
      state = goToNextStep(state)
      progress = getProgress(state)
      expect(progress.currentStep).toBe(2)
    })
  })

  describe('Navigation', () => {
    it('navigates forward and backward correctly', () => {
      let state = initQuestionnaireState(mockConfig)

      state = updateAnswer(state, 'q1', 25)
      state = goToNextStep(state)
      expect(state.currentStepIndex).toBe(1)

      state = goToPreviousStep(state)
      expect(state.currentStepIndex).toBe(0)

      state = goToNextStep(state)
      state = goToNextStep(state)
      expect(state.currentStepIndex).toBe(2)

      state = goToPreviousStep(state)
      expect(state.currentStepIndex).toBe(1)
    })
  })

  describe('Manifest compatibility', () => {
    it('loads manifest shaped exactly like funnel_versions.questionnaire_config', () => {
      // This manifest structure exactly matches the schema from funnelManifest.ts
      // which is what gets stored in funnel_versions.questionnaire_config JSONB
      const manifestFromDB: FunnelQuestionnaireConfig = {
        version: '1.0',
        steps: [
          {
            id: 'demographics',
            title: 'Demographics',
            description: 'Basic information',
            questions: [
              {
                id: 'age_q',
                key: 'age',
                type: QUESTION_TYPE.NUMBER,
                label: 'Age?',
                required: true,
                validation: { min: 18, max: 120 },
              },
            ],
          },
          {
            id: 'conditional_step',
            title: 'Adult Only',
            questions: [
              {
                id: 'job_q',
                key: 'job',
                type: QUESTION_TYPE.TEXT,
                label: 'Job?',
                required: true,
              },
            ],
            conditionalLogic: {
              type: 'show',
              conditions: [{ questionId: 'age_q', operator: 'gte', value: 18 }],
              logic: 'and',
            },
          },
        ],
        metadata: {
          created_at: '2026-01-03T00:00:00Z',
          created_by: 'system',
        },
      }

      // Initialize from manifest
      let state = initQuestionnaireState(manifestFromDB)

      // Verify structure
      expect(state.allSteps).toHaveLength(2)
      expect(state.visibleSteps).toHaveLength(2)

      // Answer and verify conditional logic works
      state = updateAnswer(state, 'age_q', 25)

      // Step order should be stable
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['demographics', 'conditional_step'])

      // Change answer to hide conditional step
      state = updateAnswer(state, 'age_q', 15)
      expect(state.visibleSteps.map((s) => s.id)).toEqual(['demographics'])
    })

    it('deterministically processes manifest with metadata', () => {
      const manifest: FunnelQuestionnaireConfig = {
        version: '1.0',
        steps: [
          {
            id: 's1',
            title: 'Step 1',
            questions: [
              {
                id: 'q1',
                key: 'q1',
                type: QUESTION_TYPE.RADIO,
                label: 'Question 1',
                required: true,
                options: [
                  { value: 'a', label: 'A' },
                  { value: 'b', label: 'B' },
                ],
              },
            ],
          },
        ],
        metadata: {
          funnel_id: 'stress-assessment',
          version_number: 2,
        },
      }

      // Run 1
      const state1 = initQuestionnaireState(manifest)
      const state1WithAnswer = updateAnswer(state1, 'q1', 'a')

      // Run 2
      const state2 = initQuestionnaireState(manifest)
      const state2WithAnswer = updateAnswer(state2, 'q1', 'a')

      // Deterministic result
      expect(state1WithAnswer.visibleSteps.map((s) => s.id)).toEqual(
        state2WithAnswer.visibleSteps.map((s) => s.id),
      )
      expect(state1WithAnswer.currentStepIndex).toBe(state2WithAnswer.currentStepIndex)
    })
  })
})
