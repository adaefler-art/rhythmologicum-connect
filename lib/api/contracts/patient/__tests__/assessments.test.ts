/**
 * Tests for Patient Assessment Contracts (E6.2.3)
 */

import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  ASSESSMENT_STATUS,
  STEP_TYPE,
  StartAssessmentResponseSchema,
  ResumeAssessmentResponseSchema,
  SaveAnswerRequestSchema,
  SaveAnswerResponseSchema,
  CompleteAssessmentResponseSchema,
  GetResultResponseSchema,
  PatientAssessmentErrorSchema,
  validateStartAssessmentResponse,
  safeValidateStartAssessmentResponse,
  validateSaveAnswerRequest,
  safeValidateSaveAnswerRequest,
} from '../assessments'

describe('Patient Assessment Contracts', () => {
  describe('Schema Version', () => {
    it('should have consistent schema version', () => {
      expect(PATIENT_ASSESSMENT_SCHEMA_VERSION).toBe('v1')
    })
  })

  describe('StartAssessmentResponseSchema', () => {
    it('should validate a valid start assessment response', () => {
      const validResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.IN_PROGRESS,
          currentStep: {
            stepId: '223e4567-e89b-12d3-a456-426614174001',
            title: 'Step 1',
            type: STEP_TYPE.QUESTIONNAIRE,
            stepIndex: 0,
            orderIndex: 0,
          },
        },
        schemaVersion: 'v1',
      }

      const result = StartAssessmentResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.schemaVersion).toBe('v1')
        expect(result.data.data.assessmentId).toBe('123e4567-e89b-12d3-a456-426614174000')
      }
    })

    it('should reject response without schemaVersion', () => {
      const invalidResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.IN_PROGRESS,
          currentStep: {
            stepId: '223e4567-e89b-12d3-a456-426614174001',
            title: 'Step 1',
            type: STEP_TYPE.QUESTIONNAIRE,
            stepIndex: 0,
            orderIndex: 0,
          },
        },
      }

      const result = StartAssessmentResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })

    it('should reject response with wrong schemaVersion', () => {
      const invalidResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.IN_PROGRESS,
          currentStep: {
            stepId: '223e4567-e89b-12d3-a456-426614174001',
            title: 'Step 1',
            type: STEP_TYPE.QUESTIONNAIRE,
            stepIndex: 0,
            orderIndex: 0,
          },
        },
        schemaVersion: 'v2',
      }

      const result = StartAssessmentResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID for assessmentId', () => {
      const invalidResponse = {
        success: true,
        data: {
          assessmentId: 'not-a-uuid',
          status: ASSESSMENT_STATUS.IN_PROGRESS,
          currentStep: {
            stepId: '223e4567-e89b-12d3-a456-426614174001',
            title: 'Step 1',
            type: STEP_TYPE.QUESTIONNAIRE,
            stepIndex: 0,
            orderIndex: 0,
          },
        },
        schemaVersion: 'v1',
      }

      const result = StartAssessmentResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('ResumeAssessmentResponseSchema', () => {
    it('should validate a valid resume assessment response', () => {
      const validResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.IN_PROGRESS,
          currentStep: {
            stepId: '223e4567-e89b-12d3-a456-426614174001',
            title: 'Step 2',
            type: STEP_TYPE.QUESTIONNAIRE,
            stepIndex: 1,
            orderIndex: 1,
          },
          completedSteps: 1,
          totalSteps: 5,
        },
        schemaVersion: 'v1',
      }

      const result = ResumeAssessmentResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data.completedSteps).toBe(1)
        expect(result.data.data.totalSteps).toBe(5)
      }
    })

    it('should reject negative completedSteps', () => {
      const invalidResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.IN_PROGRESS,
          currentStep: {
            stepId: '223e4567-e89b-12d3-a456-426614174001',
            title: 'Step 2',
            type: STEP_TYPE.QUESTIONNAIRE,
            stepIndex: 1,
            orderIndex: 1,
          },
          completedSteps: -1,
          totalSteps: 5,
        },
        schemaVersion: 'v1',
      }

      const result = ResumeAssessmentResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })

    it('should reject zero or negative totalSteps', () => {
      const invalidResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.IN_PROGRESS,
          currentStep: {
            stepId: '223e4567-e89b-12d3-a456-426614174001',
            title: 'Step 2',
            type: STEP_TYPE.QUESTIONNAIRE,
            stepIndex: 1,
            orderIndex: 1,
          },
          completedSteps: 1,
          totalSteps: 0,
        },
        schemaVersion: 'v1',
      }

      const result = ResumeAssessmentResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('SaveAnswerRequestSchema', () => {
    it('should validate a valid save answer request', () => {
      const validRequest = {
        stepId: '123e4567-e89b-12d3-a456-426614174000',
        questionId: 'stress_frequency',
        answerValue: 3,
      }

      const result = SaveAnswerRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should accept float answerValue (V0.5: number type, not just integer)', () => {
      const request = {
        stepId: '123e4567-e89b-12d3-a456-426614174000',
        questionId: 'stress_frequency',
        answerValue: 3.5,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      // V0.5: answerValue accepts any number (float or integer)
      expect(result.success).toBe(true)
    })

    it('should accept string answerValue (V0.5: radio options)', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q2-gender',
        answerValue: 'male',
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('should accept boolean answerValue (V0.5: yes/no questions)', () => {
      const request = {
        stepId: 'step-1',
        questionId: 'q-consent',
        answerValue: true,
      }

      const result = SaveAnswerRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('should reject empty questionId', () => {
      const invalidRequest = {
        stepId: '123e4567-e89b-12d3-a456-426614174000',
        questionId: '',
        answerValue: 3,
      }

      const result = SaveAnswerRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should accept non-UUID stepId (validation deferred to downstream)', () => {
      const requestWithNonUuid = {
        stepId: 'not-a-uuid',
        questionId: 'stress_frequency',
        answerValue: 3,
      }

      const result = SaveAnswerRequestSchema.safeParse(requestWithNonUuid)
      // Schema validation passes; downstream validation will catch invalid UUIDs
      expect(result.success).toBe(true)
    })
  })

  describe('SaveAnswerResponseSchema', () => {
    it('should validate a valid save answer response', () => {
      const validResponse = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          assessment_id: '223e4567-e89b-12d3-a456-426614174001',
          question_id: 'stress_frequency',
          answer_value: 3,
        },
        schemaVersion: 'v1',
      }

      const result = SaveAnswerResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject response without schemaVersion', () => {
      const invalidResponse = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          assessment_id: '223e4567-e89b-12d3-a456-426614174001',
          question_id: 'stress_frequency',
          answer_value: 3,
        },
      }

      const result = SaveAnswerResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('CompleteAssessmentResponseSchema', () => {
    it('should validate a valid complete assessment response', () => {
      const validResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.COMPLETED,
        },
        schemaVersion: 'v1',
      }

      const result = CompleteAssessmentResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate with optional message', () => {
      const validResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.COMPLETED,
          message: 'Assessment wurde bereits abgeschlossen.',
        },
        schemaVersion: 'v1',
      }

      const result = CompleteAssessmentResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject status other than completed', () => {
      const invalidResponse = {
        success: true,
        data: {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          status: ASSESSMENT_STATUS.IN_PROGRESS,
        },
        schemaVersion: 'v1',
      }

      const result = CompleteAssessmentResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('GetResultResponseSchema', () => {
    it('should validate a valid get result response', () => {
      const validResponse = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          funnel: 'stress-assessment',
          completedAt: '2024-01-01T12:00:00.000Z',
          status: ASSESSMENT_STATUS.COMPLETED,
          funnelTitle: 'Stress Assessment',
          workupStatus: 'ready_for_review' as const,
          missingDataFields: [],
        },
        schemaVersion: 'v1',
      }

      const result = GetResultResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate with null completedAt and funnelTitle', () => {
      const validResponse = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          funnel: 'stress-assessment',
          completedAt: null,
          status: ASSESSMENT_STATUS.IN_PROGRESS,
          funnelTitle: null,
          workupStatus: null,
          missingDataFields: [],
        },
        schemaVersion: 'v1',
      }

      const result = GetResultResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })
  })

  describe('PatientAssessmentErrorSchema', () => {
    it('should validate a valid error response', () => {
      const validError = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentifizierung fehlgeschlagen.',
        },
        schemaVersion: 'v1',
      }

      const result = PatientAssessmentErrorSchema.safeParse(validError)
      expect(result.success).toBe(true)
    })

    it('should validate error with details', () => {
      const validError = {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          details: {
            missingQuestions: ['q1', 'q2'],
          },
        },
        schemaVersion: 'v1',
      }

      const result = PatientAssessmentErrorSchema.safeParse(validError)
      expect(result.success).toBe(true)
    })
  })

  describe('Helper Functions', () => {
    describe('validateStartAssessmentResponse', () => {
      it('should validate and return typed data', () => {
        const validResponse = {
          success: true,
          data: {
            assessmentId: '123e4567-e89b-12d3-a456-426614174000',
            status: ASSESSMENT_STATUS.IN_PROGRESS,
            currentStep: {
              stepId: '223e4567-e89b-12d3-a456-426614174001',
              title: 'Step 1',
              type: STEP_TYPE.QUESTIONNAIRE,
              stepIndex: 0,
              orderIndex: 0,
            },
          },
          schemaVersion: 'v1',
        }

        const result = validateStartAssessmentResponse(validResponse)
        expect(result.data.assessmentId).toBe('123e4567-e89b-12d3-a456-426614174000')
      })

      it('should throw on invalid data', () => {
        expect(() => validateStartAssessmentResponse({})).toThrow()
      })
    })

    describe('safeValidateStartAssessmentResponse', () => {
      it('should return null on invalid data', () => {
        const result = safeValidateStartAssessmentResponse({})
        expect(result).toBeNull()
      })

      it('should return data on valid input', () => {
        const validResponse = {
          success: true,
          data: {
            assessmentId: '123e4567-e89b-12d3-a456-426614174000',
            status: ASSESSMENT_STATUS.IN_PROGRESS,
            currentStep: {
              stepId: '223e4567-e89b-12d3-a456-426614174001',
              title: 'Step 1',
              type: STEP_TYPE.QUESTIONNAIRE,
              stepIndex: 0,
              orderIndex: 0,
            },
          },
          schemaVersion: 'v1',
        }

        const result = safeValidateStartAssessmentResponse(validResponse)
        expect(result).not.toBeNull()
        expect(result?.data.assessmentId).toBe('123e4567-e89b-12d3-a456-426614174000')
      })
    })

    describe('validateSaveAnswerRequest', () => {
      it('should validate and return typed data', () => {
        const validRequest = {
          stepId: '123e4567-e89b-12d3-a456-426614174000',
          questionId: 'stress_frequency',
          answerValue: 3,
        }

        const result = validateSaveAnswerRequest(validRequest)
        expect(result.questionId).toBe('stress_frequency')
      })

      it('should throw on invalid data', () => {
        expect(() => validateSaveAnswerRequest({})).toThrow()
      })
    })

    describe('safeValidateSaveAnswerRequest', () => {
      it('should return null on invalid data', () => {
        const result = safeValidateSaveAnswerRequest({})
        expect(result).toBeNull()
      })

      it('should return data on valid input', () => {
        const validRequest = {
          stepId: '123e4567-e89b-12d3-a456-426614174000',
          questionId: 'stress_frequency',
          answerValue: 3,
        }

        const result = safeValidateSaveAnswerRequest(validRequest)
        expect(result).not.toBeNull()
        expect(result?.questionId).toBe('stress_frequency')
      })
    })
  })
})
