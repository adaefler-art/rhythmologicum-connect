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
jest.mock('@/lib/funnels/loadFunnelVersion', () => ({
  loadFunnelVersionWithClient: jest.fn().mockResolvedValue({
    manifest: {
      questionnaire_config: {
        steps: [
          { id: 'v05-step-1', title: 'Step 1' },
          { id: 'v05-step-2', title: 'Step 2' },
        ],
      },
    },
  }),
}))
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
    if (table === 'funnels_catalog') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          // Return catalog funnel for V0.5 tests, null for legacy tests
          data: overrides.assessment?.funnel_id === null ? { id: 'catalog-funnel-123' } : null,
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

  describe('roundtrip consistency', () => {
    it('should return 200 for assessment created with same patient_id', async () => {
      // This test verifies the core bug fix: an assessment created with patient_id X
      // must be readable by a user whose patient_profile.id is also X
      const userId = 'user-roundtrip-123'
      const patientId = 'patient-roundtrip-456'
      const assessmentId = 'assessment-roundtrip-789'

      const mockSupabase = createMockSupabase({
        user: { id: userId },
        patientProfile: { id: patientId },
        assessment: {
          id: assessmentId,
          patient_id: patientId, // Same as patientProfile.id - this is the key!
          funnel: 'cardiovascular-age',
          funnel_id: null, // Catalog funnel (V0.5)
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
        `http://localhost/api/funnels/cardiovascular-age/assessments/${assessmentId}`,
        { method: 'GET' },
      )

      const response = await GET(mockRequest as never, {
        params: Promise.resolve({ slug: 'cardiovascular-age', assessmentId }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe(assessmentId)

      // Verify no error logs were triggered
      expect(mockLogDatabaseError).not.toHaveBeenCalled()
      expect(mockLogNotFound).not.toHaveBeenCalled()
    })

    it('should return 404 when RLS blocks due to patient_id mismatch', async () => {
      // This simulates the bug: assessment exists but RLS returns 0 rows
      // because patient_id stored != get_my_patient_profile_id()
      const userId = 'user-mismatch-123'
      const patientId = 'patient-mismatch-456'
      const assessmentId = 'assessment-blocked-789'

      const mockSupabase = createMockSupabase({
        user: { id: userId },
        patientProfile: { id: patientId },
        // RLS would return null/empty - simulated by assessment: null
        assessment: null,
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { GET } = await import('../[slug]/assessments/[assessmentId]/route')

      const mockRequest = new Request(
        `http://localhost/api/funnels/cardiovascular-age/assessments/${assessmentId}`,
        { method: 'GET' },
      )

      const response = await GET(mockRequest as never, {
        params: Promise.resolve({ slug: 'cardiovascular-age', assessmentId }),
      })

      // When RLS blocks, we get 404 (not 500)
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')

      // logNotFound should be called, not logDatabaseError
      expect(mockLogNotFound).toHaveBeenCalled()
      expect(mockLogDatabaseError).not.toHaveBeenCalled()
    })
  })
})
