/**
 * I71.4: Tests for Assessment Persistence Adapter
 */

import { loadAssessmentRun, saveAnswer, completeAssessment } from '../assessmentPersistence'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

// Mock the Supabase client
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

describe('assessmentPersistence', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn(),
      },
    }

    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('loadAssessmentRun', () => {
    it('should load assessment with answers and step index', async () => {
      const assessmentId = 'test-assessment-id'

      // Mock assessment query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: assessmentId,
                status: 'in_progress',
                current_step_id: 'step-1',
                funnel: 'stress',
                funnel_id: 'funnel-id',
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock answers query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { question_id: 'q1', answer_value: 5, answer_data: 5 },
              { question_id: 'q2', answer_value: 3, answer_data: 3 },
            ],
            error: null,
          }),
        }),
      })

      // Mock step query for order index
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { order_index: 2 },
              error: null,
            }),
          }),
        }),
      })

      const result = await loadAssessmentRun(assessmentId)

      expect(result).toEqual({
        assessmentId,
        status: 'in_progress',
        currentStepId: 'step-1',
        stepIndex: 2,
        answersByQuestionId: {
          q1: 5,
          q2: 3,
        },
      })
    })

    it('should throw error if assessment not found', async () => {
      const assessmentId = 'non-existent-id'

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      })

      await expect(loadAssessmentRun(assessmentId)).rejects.toThrow(
        'Assessment nicht gefunden',
      )
    })
  })

  describe('saveAnswer', () => {
    it('should save answer with idempotency', async () => {
      const assessmentId = 'test-assessment-id'
      const questionId = 'stress_level'
      const answer = 7
      const clientMutationId = 'mutation-123'

      // Mock idempotency check (no existing)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock assessment query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: assessmentId,
                status: 'in_progress',
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock upsert
      mockSupabase.from.mockReturnValueOnce({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'answer-id',
                assessment_id: assessmentId,
                question_id: questionId,
                answer_value: 7,
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock auth for idempotency key storage
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      // Mock idempotency key insert
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          }),
        }),
      })

      const result = await saveAnswer(assessmentId, questionId, answer, clientMutationId)

      expect(result.success).toBe(true)
      expect(result.answerId).toBe('answer-id')
    })

    it('should return cached result for duplicate mutation', async () => {
      const assessmentId = 'test-assessment-id'
      const questionId = 'stress_level'
      const answer = 7
      const clientMutationId = 'mutation-123'

      // Mock idempotency check (existing)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  response_body: {
                    success: true,
                    data: {
                      id: 'cached-answer-id',
                    },
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await saveAnswer(assessmentId, questionId, answer, clientMutationId)

      expect(result.success).toBe(true)
      expect(result.answerId).toBe('cached-answer-id')
    })

    it('should not save to completed assessment', async () => {
      const assessmentId = 'test-assessment-id'
      const questionId = 'stress_level'
      const answer = 7
      const clientMutationId = 'mutation-123'

      // Mock idempotency check (no existing)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock assessment query (completed)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: assessmentId,
                status: 'completed',
              },
              error: null,
            }),
          }),
        }),
      })

      const result = await saveAnswer(assessmentId, questionId, answer, clientMutationId)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('ASSESSMENT_COMPLETED')
    })
  })

  describe('completeAssessment', () => {
    it('should mark assessment as completed', async () => {
      const assessmentId = 'test-assessment-id'

      // Mock assessment query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: assessmentId,
                status: 'in_progress',
                completed_at: null,
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock update
      const completedAt = '2026-01-21T12:00:00Z'
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: assessmentId,
                  status: 'completed',
                  completed_at: completedAt,
                },
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await completeAssessment(assessmentId)

      expect(result.success).toBe(true)
      expect(result.completedAt).toBe(completedAt)
    })

    it('should be idempotent for already completed assessment', async () => {
      const assessmentId = 'test-assessment-id'
      const completedAt = '2026-01-21T12:00:00Z'

      // Mock assessment query (already completed)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: assessmentId,
                status: 'completed',
                completed_at: completedAt,
              },
              error: null,
            }),
          }),
        }),
      })

      const result = await completeAssessment(assessmentId)

      expect(result.success).toBe(true)
      expect(result.completedAt).toBe(completedAt)
    })
  })
})
