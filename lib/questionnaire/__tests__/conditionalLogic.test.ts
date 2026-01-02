/**
 * Tests for Conditional Logic Evaluator (V05-I03.2)
 * 
 * Covers all operators and logic combinations as per requirements (min 5 cases)
 */

import {
  evaluateConditionalLogic,
  isStepVisible,
  getVisibleSteps,
  type AnswersMap,
} from '../conditionalLogic'
import type { ConditionalLogic, QuestionnaireStep } from '@/lib/contracts/funnelManifest'

describe('Conditional Logic Evaluator', () => {
  describe('evaluateConditionalLogic', () => {
    // Test Case 1: Simple equality (eq) with AND logic
    it('evaluates eq operator correctly with AND logic', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [
          { questionId: 'q1', operator: 'eq', value: 'yes' },
          { questionId: 'q2', operator: 'eq', value: 5 },
        ],
        logic: 'and',
      }

      const answers: AnswersMap = {
        q1: 'yes',
        q2: 5,
      }

      expect(evaluateConditionalLogic(logic, answers)).toBe(true)
    })

    it('returns false when AND condition not all met', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [
          { questionId: 'q1', operator: 'eq', value: 'yes' },
          { questionId: 'q2', operator: 'eq', value: 5 },
        ],
        logic: 'and',
      }

      const answers: AnswersMap = {
        q1: 'yes',
        q2: 3, // Different value
      }

      expect(evaluateConditionalLogic(logic, answers)).toBe(false)
    })

    // Test Case 2: OR logic
    it('evaluates OR logic correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [
          { questionId: 'q1', operator: 'eq', value: 'yes' },
          { questionId: 'q2', operator: 'eq', value: 5 },
        ],
        logic: 'or',
      }

      const answers: AnswersMap = {
        q1: 'no',
        q2: 5, // Only one condition met
      }

      expect(evaluateConditionalLogic(logic, answers)).toBe(true)
    })

    // Test Case 3: Numeric comparisons (gt, gte, lt, lte)
    it('evaluates numeric gt operator correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [{ questionId: 'age', operator: 'gt', value: 18 }],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, { age: 25 })).toBe(true)
      expect(evaluateConditionalLogic(logic, { age: 18 })).toBe(false)
      expect(evaluateConditionalLogic(logic, { age: 15 })).toBe(false)
    })

    it('evaluates numeric gte operator correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [{ questionId: 'score', operator: 'gte', value: 70 }],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, { score: 80 })).toBe(true)
      expect(evaluateConditionalLogic(logic, { score: 70 })).toBe(true)
      expect(evaluateConditionalLogic(logic, { score: 60 })).toBe(false)
    })

    it('evaluates numeric lt operator correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [{ questionId: 'count', operator: 'lt', value: 10 }],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, { count: 5 })).toBe(true)
      expect(evaluateConditionalLogic(logic, { count: 10 })).toBe(false)
      expect(evaluateConditionalLogic(logic, { count: 15 })).toBe(false)
    })

    it('evaluates numeric lte operator correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [{ questionId: 'max', operator: 'lte', value: 100 }],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, { max: 50 })).toBe(true)
      expect(evaluateConditionalLogic(logic, { max: 100 })).toBe(true)
      expect(evaluateConditionalLogic(logic, { max: 150 })).toBe(false)
    })

    // Test Case 4: Array operators (in, notIn)
    it('evaluates in operator with single value correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [{ questionId: 'color', operator: 'in', value: ['red', 'blue', 'green'] }],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, { color: 'red' })).toBe(true)
      expect(evaluateConditionalLogic(logic, { color: 'yellow' })).toBe(false)
    })

    it('evaluates in operator with array answer correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [
          { questionId: 'symptoms', operator: 'in', value: ['headache', 'fever', 'cough'] },
        ],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, { symptoms: ['headache', 'nausea'] })).toBe(true)
      expect(evaluateConditionalLogic(logic, { symptoms: ['nausea', 'fatigue'] })).toBe(false)
    })

    it('evaluates notIn operator correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [
          { questionId: 'status', operator: 'notIn', value: ['completed', 'archived'] },
        ],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, { status: 'active' })).toBe(true)
      expect(evaluateConditionalLogic(logic, { status: 'completed' })).toBe(false)
    })

    // Test Case 5: Not equal (neq)
    it('evaluates neq operator correctly', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [{ questionId: 'consent', operator: 'neq', value: 'no' }],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, { consent: 'yes' })).toBe(true)
      expect(evaluateConditionalLogic(logic, { consent: 'no' })).toBe(false)
    })

    // Test Case 6: Missing answers
    it('returns false when answer is missing', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [{ questionId: 'q1', operator: 'eq', value: 'yes' }],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, {})).toBe(false)
    })

    // Test Case 7: Empty conditions
    it('returns true for empty conditions array', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [],
        logic: 'and',
      }

      expect(evaluateConditionalLogic(logic, {})).toBe(true)
    })
  })

  describe('isStepVisible', () => {
    it('returns true when no conditional logic', () => {
      expect(isStepVisible(undefined, {})).toBe(true)
    })

    it('shows step when show logic is met', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [{ questionId: 'q1', operator: 'eq', value: 'yes' }],
        logic: 'and',
      }

      expect(isStepVisible(logic, { q1: 'yes' })).toBe(true)
      expect(isStepVisible(logic, { q1: 'no' })).toBe(false)
    })

    it('hides step when hide logic is met', () => {
      const logic: ConditionalLogic = {
        type: 'hide',
        conditions: [{ questionId: 'q1', operator: 'eq', value: 'yes' }],
        logic: 'and',
      }

      expect(isStepVisible(logic, { q1: 'yes' })).toBe(false)
      expect(isStepVisible(logic, { q1: 'no' })).toBe(true)
    })

    it('skips step when skip logic is met', () => {
      const logic: ConditionalLogic = {
        type: 'skip',
        conditions: [{ questionId: 'q1', operator: 'eq', value: 'yes' }],
        logic: 'and',
      }

      expect(isStepVisible(logic, { q1: 'yes' })).toBe(false)
      expect(isStepVisible(logic, { q1: 'no' })).toBe(true)
    })
  })

  describe('getVisibleSteps', () => {
    it('returns all steps when no conditional logic', () => {
      const steps: QuestionnaireStep[] = [
        { id: 'step1', title: 'Step 1', questions: [] },
        { id: 'step2', title: 'Step 2', questions: [] },
        { id: 'step3', title: 'Step 3', questions: [] },
      ]

      expect(getVisibleSteps(steps, {})).toEqual(steps)
    })

    it('filters steps based on conditional logic', () => {
      const steps: QuestionnaireStep[] = [
        { id: 'step1', title: 'Step 1', questions: [] },
        {
          id: 'step2',
          title: 'Step 2',
          questions: [],
          conditionalLogic: {
            type: 'show',
            conditions: [{ questionId: 'q1', operator: 'eq', value: 'yes' }],
            logic: 'and',
          },
        },
        { id: 'step3', title: 'Step 3', questions: [] },
      ]

      // When q1 is 'yes', all steps visible
      expect(getVisibleSteps(steps, { q1: 'yes' })).toHaveLength(3)

      // When q1 is 'no', step2 is hidden
      const visible = getVisibleSteps(steps, { q1: 'no' })
      expect(visible).toHaveLength(2)
      expect(visible.map((s) => s.id)).toEqual(['step1', 'step3'])
    })

    it('handles complex branching scenarios', () => {
      const steps: QuestionnaireStep[] = [
        { id: 'intro', title: 'Intro', questions: [] },
        {
          id: 'high-risk',
          title: 'High Risk',
          questions: [],
          conditionalLogic: {
            type: 'show',
            conditions: [{ questionId: 'risk', operator: 'gte', value: 7 }],
            logic: 'and',
          },
        },
        {
          id: 'low-risk',
          title: 'Low Risk',
          questions: [],
          conditionalLogic: {
            type: 'show',
            conditions: [{ questionId: 'risk', operator: 'lt', value: 7 }],
            logic: 'and',
          },
        },
        { id: 'summary', title: 'Summary', questions: [] },
      ]

      // High risk path
      const highRisk = getVisibleSteps(steps, { risk: 8 })
      expect(highRisk.map((s) => s.id)).toEqual(['intro', 'high-risk', 'summary'])

      // Low risk path
      const lowRisk = getVisibleSteps(steps, { risk: 4 })
      expect(lowRisk.map((s) => s.id)).toEqual(['intro', 'low-risk', 'summary'])
    })
  })

  // Test Case 8: Determinism - same answers always produce same results
  describe('Determinism', () => {
    it('produces same results for same answers across multiple calls', () => {
      const logic: ConditionalLogic = {
        type: 'show',
        conditions: [
          { questionId: 'age', operator: 'gte', value: 18 },
          { questionId: 'country', operator: 'in', value: ['US', 'CA', 'UK'] },
        ],
        logic: 'and',
      }

      const answers: AnswersMap = {
        age: 25,
        country: 'US',
      }

      // Call multiple times
      const result1 = evaluateConditionalLogic(logic, answers)
      const result2 = evaluateConditionalLogic(logic, answers)
      const result3 = evaluateConditionalLogic(logic, answers)

      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
      expect(result1).toBe(true)
    })
  })
})
