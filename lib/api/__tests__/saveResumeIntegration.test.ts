/**
 * I71.4: Integration Tests for Assessment Save/Resume Flow
 * 
 * Tests the complete flow:
 * 1. Start assessment
 * 2. Answer questions
 * 3. Reload page
 * 4. Resume with previous answers
 * 5. Test idempotency (double-tap prevention)
 */

import { NextRequest } from 'next/server'
import { POST as saveAnswerHandler } from '@/app/api/assessment-answers/save/route'
import { GET as getStateHandler } from '@/app/api/assessments/[id]/state/route'

// Mock dependencies
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/logging/logger', () => ({
  logUnauthorized: jest.fn(),
  logForbidden: jest.fn(),
  logDatabaseError: jest.fn(),
}))

jest.mock('@/lib/api/contracts/patient', () => ({
  PATIENT_ASSESSMENT_SCHEMA_VERSION: '1.0.0',
}))

jest.mock('@/lib/telemetry/correlationId', () => ({
  getCorrelationId: () => 'test-correlation-id',
}))

jest.mock('@/lib/api/authHelpers', () => ({
  isSessionExpired: () => false,
}))

import { createServerSupabaseClient } from '@/lib/db/supabase.server'

describe('I71.4: Assessment Save/Resume Integration', () => {
  let mockSupabase: any
  const mockUserId = 'user-123'
  const mockPatientId = 'patient-123'
  const mockAssessmentId = 'assessment-123'
  const mockClientMutationId = 'mutation-123'

  beforeEach(() => {
    jest.clearAllMocks()

    // Create comprehensive mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const mockData: Record<string, any> = {
          patient_profiles: {
            data: { id: mockPatientId, user_id: mockUserId },
            error: null,
          },
          assessments: {
            data: {
              id: mockAssessmentId,
              patient_id: mockPatientId,
              status: 'in_progress',
              funnel: 'stress',
              funnel_id: null,
              current_step_id: null,
            },
            error: null,
          },
          assessment_answers: {
            data: {
              id: 'answer-123',
              assessment_id: mockAssessmentId,
              question_id: 'stress_level',
              answer_value: 7,
            },
            error: null,
          },
          idempotency_keys: {
            data: null,
            error: null,
          },
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue(mockData[table] || { data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          upsert: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
        }
      }),
    }

    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('Scenario: Save answer with idempotency', () => {
    it('should save answer on first request', async () => {
      const request = new NextRequest('http://localhost:3000/api/assessment-answers/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: mockAssessmentId,
          questionId: 'stress_level',
          answerValue: 7,
          clientMutationId: mockClientMutationId,
        }),
      })

      const response = await saveAnswerHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toMatchObject({
        id: 'answer-123',
        assessment_id: mockAssessmentId,
        question_id: 'stress_level',
        answer_value: 7,
      })
    })

    it('should return cached response for duplicate mutation', async () => {
      // First, mock an existing idempotency key
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'idempotency_keys') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                response_body: {
                  success: true,
                  data: {
                    id: 'cached-answer-123',
                    assessment_id: mockAssessmentId,
                    question_id: 'stress_level',
                    answer_value: 7,
                  },
                },
              },
              error: null,
            }),
          }
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      })

      const request = new NextRequest('http://localhost:3000/api/assessment-answers/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: mockAssessmentId,
          questionId: 'stress_level',
          answerValue: 7,
          clientMutationId: mockClientMutationId,
        }),
      })

      const response = await saveAnswerHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.id).toBe('cached-answer-123')
      expect(response.headers.get('X-Idempotency-Cached')).toBe('true')
    })
  })

  describe('Scenario: Resume assessment after reload', () => {
    it('should load assessment state with all answers', async () => {
      // Mock assessment with multiple answers
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'assessments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockAssessmentId,
                patient_id: mockPatientId,
                status: 'in_progress',
                current_step_id: 'step-2',
                funnel: 'stress',
                funnel_id: null,
              },
              error: null,
            }),
          }
        }

        if (table === 'assessment_answers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                { question_id: 'q1', answer_value: 5, answer_data: 5 },
                { question_id: 'q2', answer_value: 7, answer_data: 7 },
                { question_id: 'q3', answer_value: 3, answer_data: 3 },
              ],
              error: null,
            }),
          }
        }

        if (table === 'patient_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: mockPatientId, user_id: mockUserId },
              error: null,
            }),
          }
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      })

      const request = new NextRequest(
        `http://localhost:3000/api/assessments/${mockAssessmentId}/state`,
        {
          method: 'GET',
        },
      )

      const response = await getStateHandler(request, {
        params: Promise.resolve({ id: mockAssessmentId }),
      })

      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toMatchObject({
        assessmentId: mockAssessmentId,
        status: 'in_progress',
        stepIndex: 3, // Based on number of answered questions
        answersByQuestionId: {
          q1: 5,
          q2: 7,
          q3: 3,
        },
      })
    })
  })

  describe('Scenario: Error handling', () => {
    it('should not save to completed assessment', async () => {
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'assessments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockAssessmentId,
                patient_id: mockPatientId,
                status: 'completed',
              },
              error: null,
            }),
          }
        }

        if (table === 'patient_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockPatientId, user_id: mockUserId },
              error: null,
            }),
          }
        }

        if (table === 'idempotency_keys') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      })

      const request = new NextRequest('http://localhost:3000/api/assessment-answers/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: mockAssessmentId,
          questionId: 'stress_level',
          answerValue: 7,
          clientMutationId: mockClientMutationId,
        }),
      })

      const response = await saveAnswerHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(409)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toMatchObject({
        code: 'ASSESSMENT_COMPLETED',
      })
    })
  })
})
