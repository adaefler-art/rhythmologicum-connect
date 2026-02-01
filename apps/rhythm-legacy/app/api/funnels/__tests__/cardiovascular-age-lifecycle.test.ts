/**
 * V061-I02: Cardiovascular Age Assessment Lifecycle Tests
 *
 * Tests the deterministic behavior of the cardiovascular-age pilot spine:
 * - CREATE: guarantees DB record and returns assessmentId
 * - SAVE: persists answers with auth/ownership validation
 * - COMPLETE: idempotent completion
 * - RESULT: returns 409 for incomplete, 200 for completed
 */

import { POST as createAssessment } from '../[slug]/assessments/route'
import { POST as saveAnswer } from '../[slug]/assessments/[assessmentId]/answers/save/route'
import { POST as completeAssessment } from '../[slug]/assessments/[assessmentId]/complete/route'
import { GET as getResult } from '../[slug]/assessments/[assessmentId]/result/route'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { StartAssessmentResponseData } from '@/lib/api/contracts/patient'

// Mock dependencies
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@/lib/funnels/loadFunnelVersion', () => ({
  loadFunnelWithClient: jest.fn(),
  loadFunnelVersionWithClient: jest.fn(),
}))

jest.mock('@/lib/validation/stepValidation', () => ({
  ensureStepBelongsToFunnel: jest.fn().mockResolvedValue({ valid: true }),
  ensureQuestionBelongsToStep: jest.fn().mockResolvedValue({ valid: true }),
  ensureStepIsCurrent: jest.fn().mockResolvedValue({ valid: true }),
}))

jest.mock('@/lib/navigation/assessmentNavigation', () => ({
  getCurrentStep: jest.fn(),
}))

jest.mock('@/lib/monitoring/kpi', () => ({
  trackAssessmentStarted: jest.fn().mockResolvedValue(undefined),
  trackAssessmentCompleted: jest.fn().mockResolvedValue(undefined),
  calculateDurationSeconds: jest.fn().mockReturnValue(120),
}))

jest.mock('@/lib/telemetry/events', () => ({
  emitFunnelStarted: jest.fn().mockResolvedValue(undefined),
  emitFunnelCompleted: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/telemetry/correlationId', () => ({
  getCorrelationId: jest.fn().mockReturnValue('test-correlation-id'),
}))

jest.mock('@/lib/workup', () => ({
  performWorkupCheck: jest.fn().mockReturnValue({
    isSufficient: true,
    missingDataFields: [],
  }),
  getRulesetVersion: jest.fn().mockReturnValue('v1.0'),
}))

jest.mock('@/lib/workup/helpers', () => ({
  createEvidencePack: jest.fn().mockResolvedValue({}),
}))

type MockSupabaseClient = {
  auth: {
    getUser: jest.Mock
  }
  from: jest.Mock
}

const createMockBuilder = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
  maybeSingle: jest.fn().mockResolvedValue(result),
})

describe('V061-I02: Cardiovascular Age Lifecycle', () => {
  const userId = 'user-123'
  const patientId = 'patient-123'
  const assessmentId = 'assessment-456'
  const funnelSlug = 'cardiovascular-age'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CREATE: Assessment creation', () => {
    it('should guarantee DB record creation and return persistent assessmentId', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({ data: { id: patientId }, error: null })
          }
          if (table === 'funnels') {
            return createMockBuilder({ data: null, error: null })
          }
          if (table === 'funnels_catalog') {
            return createMockBuilder({
              data: {
                id: 'funnel-id',
                slug: funnelSlug,
                title: 'Cardiovascular Age',
                isActive: true,
              },
              error: null,
            })
          }
          if (table === 'assessments') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              is: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              insert: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: {
                  id: assessmentId,
                  patient_id: patientId,
                  funnel: funnelSlug,
                  funnel_id: null,
                  status: 'in_progress',
                },
                error: null,
              }),
            }
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      const { loadFunnelWithClient, loadFunnelVersionWithClient } = require('@/lib/funnels/loadFunnelVersion')
      loadFunnelWithClient.mockResolvedValue({
        id: 'funnel-id',
        slug: funnelSlug,
        title: 'Cardiovascular Age',
        isActive: true,
      })
      loadFunnelVersionWithClient.mockResolvedValue({
        manifest: {
          questionnaire_config: {
            steps: [
              {
                id: 'step-1',
                title: 'Basic Info',
                questions: [{ id: 'q1-age', required: true }],
              },
            ],
          },
        },
      })

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost/api/funnels/cardiovascular-age/assessments', {
        method: 'POST',
      })

      const context = { params: Promise.resolve({ slug: funnelSlug }) }
      const response = await createAssessment(request, context)
      const data = (await response.json()) as { success: boolean; data: StartAssessmentResponseData; schemaVersion: string }

      // V061-I02 AC1: Verify DB record created and assessmentId returned
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.assessmentId).toBe(assessmentId)
      expect(data.data.status).toBe('in_progress')
      expect(data.schemaVersion).toBe('v1')
      expect(data.data.currentStep).toBeDefined()
    })
  })

  describe('SAVE: Answer persistence', () => {
    it('should persist answer deterministically with auth validation', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({ data: { id: patientId }, error: null })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: {
                id: assessmentId,
                patient_id: patientId,
                funnel: funnelSlug,
                funnel_id: null,
                status: 'in_progress',
              },
              error: null,
            })
          }
          if (table === 'assessment_answers') {
            return createMockBuilder({
              data: {
                id: 'answer-id',
                assessment_id: assessmentId,
                question_id: 'q1-age',
                answer_value: 54,
                answer_data: 54,
              },
              error: null,
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request(
        `http://localhost/api/funnels/${funnelSlug}/assessments/${assessmentId}/answers/save`,
        {
          method: 'POST',
          body: JSON.stringify({
            stepId: 'step-1',
            questionId: 'q1-age',
            answerValue: 54,
          }),
        },
      )

      const context = {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      }

      const response = await saveAnswer(request, context)
      const data = await response.json()

      // V061-I02 AC2: Verify deterministic save with proper validation
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.assessment_id).toBe(assessmentId)
      expect(data.data.question_id).toBe('q1-age')
    })

    it('should reject save with 401 when user not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
        from: jest.fn(),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request(
        `http://localhost/api/funnels/${funnelSlug}/assessments/${assessmentId}/answers/save`,
        {
          method: 'POST',
          body: JSON.stringify({
            stepId: 'step-1',
            questionId: 'q1-age',
            answerValue: 54,
          }),
        },
      )

      const context = {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      }

      const response = await saveAnswer(request, context)
      const data = await response.json()

      // V061-I02 AC2: Verify 401 for unauthenticated
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('COMPLETE: Assessment completion', () => {
    it('should complete assessment and be idempotent', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({ data: { id: patientId }, error: null })
          }
          if (table === 'assessments') {
            // Need to support both select and update operations
            const assessmentData = {
              id: assessmentId,
              patient_id: patientId,
              funnel: funnelSlug,
              funnel_id: null,
              status: 'in_progress',
              started_at: new Date().toISOString(),
            }
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: assessmentData, error: null }),
              update: jest.fn().mockReturnThis(),
            }
          }
          if (table === 'assessment_answers') {
            // Return all required answers as answered
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [
                  { question_id: 'q1-age' },
                  { question_id: 'q2-gender' },
                  { question_id: 'q3-blood-pressure' },
                ],
                error: null,
              }),
            }
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      const { loadFunnelVersionWithClient } = require('@/lib/funnels/loadFunnelVersion')
      loadFunnelVersionWithClient.mockResolvedValue({
        manifest: {
          questionnaire_config: {
            steps: [
              {
                id: 'step-1',
                questions: [
                  { id: 'q1-age', required: true },
                  { id: 'q2-gender', required: true },
                ],
              },
              {
                id: 'step-2',
                questions: [{ id: 'q3-blood-pressure', required: true }],
              },
            ],
          },
        },
      })

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request(
        `http://localhost/api/funnels/${funnelSlug}/assessments/${assessmentId}/complete`,
        {
          method: 'POST',
        },
      )

      const context = {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      }

      const response = await completeAssessment(request, context)
      const data = await response.json()

      // V061-I02 AC3: Verify completion
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.assessmentId).toBe(assessmentId)
      expect(data.data.status).toBe('completed')
    })

    it('should be idempotent - return 200 on duplicate completion', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({ data: { id: patientId }, error: null })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: {
                id: assessmentId,
                patient_id: patientId,
                funnel: funnelSlug,
                funnel_id: null,
                status: 'completed', // Already completed
                started_at: new Date().toISOString(),
              },
              error: null,
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request(
        `http://localhost/api/funnels/${funnelSlug}/assessments/${assessmentId}/complete`,
        {
          method: 'POST',
        },
      )

      const context = {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      }

      const response = await completeAssessment(request, context)
      const data = await response.json()

      // V061-I02 AC3: Verify idempotency (200, not 500 or 409)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toContain('bereits abgeschlossen')
    })
  })

  describe('RESULT: Assessment result retrieval', () => {
    it('should return 409 for incomplete assessment', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({ data: { id: patientId }, error: null })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: {
                id: assessmentId,
                patient_id: patientId,
                funnel: funnelSlug,
                status: 'in_progress', // Not completed
                completed_at: null,
                workup_status: null,
                missing_data_fields: [],
              },
              error: null,
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request(
        `http://localhost/api/funnels/${funnelSlug}/assessments/${assessmentId}/result`,
        {
          method: 'GET',
        },
      )

      const context = {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      }

      const response = await getResult(request, context)
      const data = await response.json()

      // V061-I02 AC4: Verify 409 for incomplete
      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('STATE_CONFLICT')
      expect(data.error.message).toContain('nicht abgeschlossen')
    })

    it('should return 200 for completed assessment', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({ data: { id: patientId }, error: null })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: {
                id: assessmentId,
                patient_id: patientId,
                funnel: funnelSlug,
                status: 'completed', // Completed
                completed_at: new Date().toISOString(),
                workup_status: 'ready_for_review',
                missing_data_fields: [],
              },
              error: null,
            })
          }
          if (table === 'funnels') {
            return createMockBuilder({
              data: { title: 'Cardiovascular Age' },
              error: null,
            })
          }
          if (table === 'assessment_answers') {
            return createMockBuilder({
              data: [{ question_id: 'q1-age', answer_value: 54, answer_data: 54 }],
              error: null,
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request(
        `http://localhost/api/funnels/${funnelSlug}/assessments/${assessmentId}/result`,
        {
          method: 'GET',
        },
      )

      const context = {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      }

      const response = await getResult(request, context)
      const data = await response.json()

      // V061-I02 AC4: Verify 200 for completed
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(assessmentId)
      expect(data.data.status).toBe('completed')
    })

    it('should return 404 for missing assessment', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({ data: { id: patientId }, error: null })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: null, // Not found
              error: null,
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request(
        `http://localhost/api/funnels/${funnelSlug}/assessments/nonexistent-id/result`,
        {
          method: 'GET',
        },
      )

      const context = {
        params: Promise.resolve({ slug: funnelSlug, assessmentId: 'nonexistent-id' }),
      }

      const response = await getResult(request, context)
      const data = await response.json()

      // V061-I02 AC4: Verify 404 for missing
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })
})
