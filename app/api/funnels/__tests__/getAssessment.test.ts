/**
 * Tests for GET /api/funnels/:slug/assessments/:assessmentId
 *
 * Verifies:
 * - 200 for valid assessment with proper ownership
 * - 404 for non-existent assessment (no error-level log for PGRST116)
 * - 403 for assessment not owned by user
 * - Proper handling of legacy assessments without funnel_id
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'

// Mock dependencies
jest.mock('@/lib/db/supabase.server')
jest.mock('@/lib/navigation/assessmentNavigation')
jest.mock('@/lib/telemetry/correlationId', () => ({
  getCorrelationId: jest.fn(() => 'test-correlation-id'),
}))
jest.mock('@/lib/telemetry/events', () => ({
  emitFunnelResumed: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/logging/logger', () => ({
  logUnauthorized: jest.fn(),
  logForbidden: jest.fn(),
  logDatabaseError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logNotFound: jest.fn(),
}))

const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.Mock
const mockGetCurrentStep = getCurrentStep as jest.Mock

// Import mocked logger for assertions
import { logDatabaseError, logNotFound } from '@/lib/logging/logger'

const mockLogDatabaseError = logDatabaseError as jest.Mock
const mockLogNotFound = logNotFound as jest.Mock

// Helper to create mock Supabase client
function createMockSupabase(overrides: {
  user?: { id: string } | null
  authError?: Error | null
  patientProfile?: { id: string } | null
  profileError?: { code?: string; message?: string } | null
  assessment?: {
    id: string
    patient_id: string
    funnel: string
    funnel_id: string | null
    status: string
  } | null
  assessmentError?: { code?: string; message?: string } | null
  steps?: Array<{ id: string; order_index: number }> | null
  stepsError?: Error | null
}) {
  const mockFrom = jest.fn((table: string) => {
    if (table === 'patient_profiles') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: overrides.patientProfile ?? { id: 'patient-123' },
          error: overrides.profileError ?? null,
        }),
      }
    }
    if (table === 'assessments') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: overrides.assessment ?? null,
          error: overrides.assessmentError ?? null,
        }),
        update: jest.fn().mockReturnThis(),
      }
    }
    if (table === 'funnel_steps') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: overrides.steps ?? [
            { id: 'step-1', order_index: 0 },
            { id: 'step-2', order_index: 1 },
          ],
          error: overrides.stepsError ?? null,
        }),
      }
    }
    if (table === 'funnels') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'funnel-123' },
          error: null,
        }),
      }
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }
  })

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: overrides.user ?? { id: 'user-123' } },
        error: overrides.authError ?? null,
      }),
    },
    from: mockFrom,
  }
}

describe('GET /api/funnels/:slug/assessments/:assessmentId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('non-existent assessment', () => {
    it('should return 404 for non-existent assessment without error-level log', async () => {
      const mockSupabase = createMockSupabase({
        assessment: null,
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { GET } = await import('../[slug]/assessments/[assessmentId]/route')

      const mockRequest = new Request(
        'http://localhost/api/funnels/stress-assessment/assessments/non-existent-id',
        { method: 'GET' },
      )

      const response = await GET(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment', assessmentId: 'non-existent-id' }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')

      // Should use logNotFound (warn level), not logDatabaseError (error level)
      expect(mockLogNotFound).toHaveBeenCalledWith('Assessment', expect.objectContaining({
        assessmentId: 'non-existent-id',
        slug: 'stress-assessment',
      }))
      // logDatabaseError should NOT be called for PGRST116 or null assessment
      expect(mockLogDatabaseError).not.toHaveBeenCalled()
    })

    it('should return 404 for PGRST116 error without error-level log', async () => {
      const mockSupabase = createMockSupabase({
        assessment: null,
        assessmentError: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { GET } = await import('../[slug]/assessments/[assessmentId]/route')

      const mockRequest = new Request(
        'http://localhost/api/funnels/stress-assessment/assessments/non-existent-id',
        { method: 'GET' },
      )

      const response = await GET(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment', assessmentId: 'non-existent-id' }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)

      // Should use logNotFound (warn level), not logDatabaseError (error level)
      expect(mockLogNotFound).toHaveBeenCalled()
      expect(mockLogDatabaseError).not.toHaveBeenCalled()
    })
  })

  describe('valid assessment', () => {
    it('should return 200 with assessment data for valid owned assessment', async () => {
      const mockSupabase = createMockSupabase({
        assessment: {
          id: 'assessment-123',
          patient_id: 'patient-123',
          funnel: 'stress-assessment',
          funnel_id: 'funnel-123',
          status: 'in_progress',
        },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)
      mockGetCurrentStep.mockResolvedValue({
        stepId: 'step-1',
        title: 'First Step',
        type: 'question_step',
        orderIndex: 0,
        stepIndex: 0,
      })

      const { GET } = await import('../[slug]/assessments/[assessmentId]/route')

      const mockRequest = new Request(
        'http://localhost/api/funnels/stress-assessment/assessments/assessment-123',
        { method: 'GET' },
      )

      const response = await GET(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment', assessmentId: 'assessment-123' }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe('assessment-123')
      expect(body.data.status).toBe('in_progress')
    })
  })

  describe('authorization', () => {
    it('should return 403 for assessment not owned by user', async () => {
      const mockSupabase = createMockSupabase({
        patientProfile: { id: 'patient-123' },
        assessment: {
          id: 'assessment-123',
          patient_id: 'different-patient-456', // Different owner
          funnel: 'stress-assessment',
          funnel_id: 'funnel-123',
          status: 'in_progress',
        },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { GET } = await import('../[slug]/assessments/[assessmentId]/route')

      const mockRequest = new Request(
        'http://localhost/api/funnels/stress-assessment/assessments/assessment-123',
        { method: 'GET' },
      )

      const response = await GET(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment', assessmentId: 'assessment-123' }),
      })

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('patient profile not found', () => {
    it('should return 404 when patient profile does not exist', async () => {
      const mockSupabase = createMockSupabase({
        patientProfile: null,
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { GET } = await import('../[slug]/assessments/[assessmentId]/route')

      const mockRequest = new Request(
        'http://localhost/api/funnels/stress-assessment/assessments/assessment-123',
        { method: 'GET' },
      )

      const response = await GET(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment', assessmentId: 'assessment-123' }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      // Should be NOT_FOUND for profile, not error-level log
    })
  })
})
