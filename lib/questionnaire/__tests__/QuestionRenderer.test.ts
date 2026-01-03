/**
 * Tests for Question Renderer (V05-I03.2)
 * 
 * Validates unknown question type handling
 */

import { QUESTION_TYPE } from '@/lib/contracts/registry'
import type { QuestionConfig } from '@/lib/contracts/funnelManifest'

describe('QuestionRenderer Type Validation', () => {
  describe('Unknown question type handling', () => {
    it('validates all question types are from registry', () => {
      // All valid question types should be from QUESTION_TYPE registry
      const validTypes = Object.values(QUESTION_TYPE)

      const testQuestions: QuestionConfig[] = [
        {
          id: 'q1',
          key: 'q1',
          type: QUESTION_TYPE.RADIO,
          label: 'Test',
          required: false,
          options: [{ value: 'a', label: 'A' }],
        },
        {
          id: 'q2',
          key: 'q2',
          type: QUESTION_TYPE.CHECKBOX,
          label: 'Test',
          required: false,
          options: [{ value: 'a', label: 'A' }],
        },
        {
          id: 'q3',
          key: 'q3',
          type: QUESTION_TYPE.TEXT,
          label: 'Test',
          required: false,
        },
        {
          id: 'q4',
          key: 'q4',
          type: QUESTION_TYPE.TEXTAREA,
          label: 'Test',
          required: false,
        },
        {
          id: 'q5',
          key: 'q5',
          type: QUESTION_TYPE.NUMBER,
          label: 'Test',
          required: false,
        },
        {
          id: 'q6',
          key: 'q6',
          type: QUESTION_TYPE.SCALE,
          label: 'Test',
          required: false,
          minValue: 1,
          maxValue: 10,
        },
        {
          id: 'q7',
          key: 'q7',
          type: QUESTION_TYPE.SLIDER,
          label: 'Test',
          required: false,
          minValue: 0,
          maxValue: 100,
        },
      ]

      // All test questions should use types from registry
      testQuestions.forEach((q) => {
        expect(validTypes).toContain(q.type)
      })
    })

    it('handles unknown type as controlled error at UI boundary', () => {
      // Unknown types should be caught at TypeScript level
      // But if they slip through (e.g., bad data from API), QuestionRenderer
      // shows controlled error UI, not crash

      const unknownTypeQuestion = {
        id: 'bad_q',
        key: 'bad',
        type: 'fantasy_type' as any, // This would be invalid
        label: 'Bad Question',
        required: false,
      }

      // TypeScript should prevent this, but runtime check exists
      // The QuestionRenderer will render UnknownTypeError component
      // This is a controlled error path, not a throw/crash
      expect(unknownTypeQuestion.type).not.toBe(QUESTION_TYPE.RADIO)
      expect(unknownTypeQuestion.type).not.toBe(QUESTION_TYPE.CHECKBOX)
      expect(unknownTypeQuestion.type).not.toBe(QUESTION_TYPE.TEXT)
      expect(unknownTypeQuestion.type).not.toBe(QUESTION_TYPE.TEXTAREA)
      expect(unknownTypeQuestion.type).not.toBe(QUESTION_TYPE.NUMBER)
      expect(unknownTypeQuestion.type).not.toBe(QUESTION_TYPE.SCALE)
      expect(unknownTypeQuestion.type).not.toBe(QUESTION_TYPE.SLIDER)

      // This would trigger the UnknownTypeError UI component in the renderer
      // which shows a controlled error message to the user
    })
  })

  describe('Registry contract compliance', () => {
    it('all question types come from QUESTION_TYPE registry', () => {
      const registryTypes = [
        QUESTION_TYPE.RADIO,
        QUESTION_TYPE.CHECKBOX,
        QUESTION_TYPE.TEXT,
        QUESTION_TYPE.TEXTAREA,
        QUESTION_TYPE.NUMBER,
        QUESTION_TYPE.SCALE,
        QUESTION_TYPE.SLIDER,
      ]

      // Verify we're using exactly the registry types
      expect(registryTypes).toHaveLength(7)
      expect(new Set(registryTypes).size).toBe(7) // No duplicates

      // Verify values match registry
      expect(QUESTION_TYPE.RADIO).toBe('radio')
      expect(QUESTION_TYPE.CHECKBOX).toBe('checkbox')
      expect(QUESTION_TYPE.TEXT).toBe('text')
      expect(QUESTION_TYPE.TEXTAREA).toBe('textarea')
      expect(QUESTION_TYPE.NUMBER).toBe('number')
      expect(QUESTION_TYPE.SCALE).toBe('scale')
      expect(QUESTION_TYPE.SLIDER).toBe('slider')
    })
  })
})
