/**
 * Tests for POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save
 * 
 * Focus: V0.5 Catalog Funnel support with multiple answer types
 */

import { SaveAnswerRequestSchema } from '@/lib/api/contracts/patient'

describe('SaveAnswerRequestSchema', () => {
  describe('V0.5 Catalog Funnel answer types', () => {
    it('should accept number answerValue (age input)', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q1-age',
        answerValue: 45,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.answerValue).toBe(45)
      }
    })

    it('should accept string answerValue (radio option)', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q2-gender',
        answerValue: 'male',
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.answerValue).toBe('male')
      }
    })

    it('should accept boolean answerValue (consent question)', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q-consent',
        answerValue: true,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.answerValue).toBe(true)
      }
    })

    it('should accept scale value (0-7 exercise days)', () => {
      const request = {
        stepId: 'step-3',
        questionId: 'q6-exercise',
        answerValue: 5,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.answerValue).toBe(5)
      }
    })
  })

  describe('Validation failures', () => {
    it('should reject missing stepId', () => {
      const request = {
        questionId: 'q1-age',
        answerValue: 45,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject missing questionId', () => {
      const request = {
        stepId: 'step-1',
        answerValue: 45,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject missing answerValue', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q1-age',
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject null answerValue', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q1-age',
        answerValue: null,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject object answerValue', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q1-age',
        answerValue: { value: 45 },
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject array answerValue', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q1-age',
        answerValue: [1, 2, 3],
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject empty stepId', () => {
      const request = {
        stepId: '',
        questionId: 'q1-age',
        answerValue: 45,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject empty questionId', () => {
      const request = {
        stepId: 'step-1',
        questionId: '',
        answerValue: 45,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })
  })
})
