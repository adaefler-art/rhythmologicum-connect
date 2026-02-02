/**
 * Tests for E74.7: Start/Resume Idempotency
 *
 * Verifies:
 * - RESUME_OR_CREATE default behavior (returns existing in-progress assessment)
 * - forceNew=true creates new assessment and completes old one
 * - No duplicate assessments for parallel/repeat requests
 * - Database constraint prevents multiple in-progress assessments
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { loadFunnelWithClient, loadFunnelVersionWithClient } from '@/lib/funnels/loadFunnelVersion'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'

// Mock dependencies
jest.mock('@/lib/db/supabase.server')
jest.mock('@/lib/funnels/loadFunnelVersion')
jest.mock('@/lib/navigation/assessmentNavigation')
jest.mock('@/lib/telemetry/correlationId', () => ({
  getCorrelationId: jest.fn(() => 'test-correlation-id'),
}))
jest.mock('@/lib/telemetry/events', () => ({
  emitFunnelStarted: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/monitoring/kpi', () => ({
  trackAssessmentStarted: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/logging/logger', () => ({
  logUnauthorized: jest.fn(),
  logDatabaseError: jest.fn(),
  logAssessmentStarted: jest.fn(),
  logNotFound: jest.fn(),
  logWarn: jest.fn(),
}))
jest.mock('@/lib/api/idempotency', () => ({
  withIdempotency: jest.fn((_req, _opts, handler) => handler()),
}))

const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.Mock
const mockLoadFunnelWithClient = loadFunnelWithClient as jest.Mock
const mockLoadFunnelVersionWithClient = loadFunnelVersionWithClient as jest.Mock
const mockGetCurrentStep = getCurrentStep as jest.Mock

type MockAssessment = {
  id: string
  patient_id: string
  funnel: string
  funnel_id: string | null
  status: string
  started_at: string
  completed_at: string | null
}

// Helper to create mock Supabase client
function createMockSupabase(overrides: {
  user?: { id: string } | null
  authError?: Error | null
  patientProfile?: { id: string } | null
  profileError?: Error | null
  legacyFunnel?: { id: string; title: string; is_active: boolean } | null
  legacyError?: Error | null
  existingAssessment?: MockAssessment | null
  existingAssessmentError?: Error | null
  assessmentInsertResult?: { id: string; status: string } | null
  assessmentInsertError?: { code?: string; message?: string } | null
  updateResult?: { success: boolean }
  updateError?: Error | null
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

    if (table === 'funnels') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: overrides.legacyFunnel ?? null,
          error: overrides.legacyError ?? null,
        }),
      }
    }

    if (table === 'assessments') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: overrides.existingAssessment ?? null,
          error: overrides.existingAssessmentError ?? null,
        }),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: overrides.assessmentInsertResult ?? { id: 'new-assessment-123', status: 'in_progress' },
          error: overrides.assessmentInsertError ?? null,
        }),
        update: jest.fn().mockReturnThis(),
      }
    }

    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
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

describe('E74.7: Start/Resume Idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('RESUME_OR_CREATE behavior (default)', () => {
    it('should return existing in-progress assessment with 200 status', async () => {
      const existingAssessment: MockAssessment = {
        id: 'existing-assessment-456',
        patient_id: 'patient-123',
        funnel: 'stress-assessment',
        funnel_id: 'funnel-id-789',
        status: 'in_progress',
        started_at: '2026-01-01T10:00:00Z',
        completed_at: null,
      }

      const mockSupabase = createMockSupabase({
        existingAssessment,
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      mockGetCurrentStep.mockResolvedValue({
        stepId: 'step-2',
        title: 'Second Step',
        type: 'question_step',
        orderIndex: 1,
        stepIndex: 1,
      })

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // No forceNew
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      expect(response.status).toBe(200) // 200 for resume, not 201
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe('existing-assessment-456')
      expect(body.data.currentStep.stepId).toBe('step-2')
      expect(body.data.status).toBe('in_progress')
    })

    it('should create new assessment when no in-progress assessment exists', async () => {
      const mockSupabase = createMockSupabase({
        existingAssessment: null, // No existing in-progress assessment
        // Add mock for legacy funnel check - return null (not a legacy funnel)
      })
      
      // Add legacy funnel null result to mock
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'patient_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'patient-123' },
              error: null,
            }),
          }
        }
        if (table === 'funnels') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: null, // Not a legacy funnel
              error: null,
            }),
          }
        }
        if (table === 'assessments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: null, // No existing assessment
              error: null,
            }),
            insert: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'new-assessment-123', status: 'in_progress', patient_id: 'patient-123', funnel: 'stress-assessment' },
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
      
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      // Mock catalog funnel
      mockLoadFunnelWithClient.mockResolvedValue({
        id: 'catalog-funnel-id',
        slug: 'stress-assessment',
        title: 'Stress Assessment',
        isActive: true,
      })

      mockLoadFunnelVersionWithClient.mockResolvedValue({
        manifest: {
          questionnaire_config: {
            steps: [
              { id: 'step-1', title: 'First Step', questions: [] },
            ],
          },
        },
      })

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      expect(response.status).toBe(201) // 201 for create
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe('new-assessment-123')
    })
  })

  describe('forceNew=true behavior', () => {
    it('should complete existing assessment and create new one', async () => {
      const existingAssessment: MockAssessment = {
        id: 'old-assessment-999',
        patient_id: 'patient-123',
        funnel: 'stress-assessment',
        funnel_id: null,
        status: 'in_progress',
        started_at: '2026-01-01T10:00:00Z',
        completed_at: null,
      }

      let updateCalled = false
      const mockFrom = jest.fn((table: string) => {
        if (table === 'patient_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'patient-123' },
              error: null,
            }),
          }
        }

        if (table === 'funnels') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }
        }

        if (table === 'assessments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: updateCalled ? null : existingAssessment,
              error: null,
            }),
            update: jest.fn(() => {
              updateCalled = true
              return {
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
              }
            }),
            insert: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'force-new-assessment-777', status: 'in_progress' },
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

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: mockFrom,
      }

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      mockLoadFunnelWithClient.mockResolvedValue({
        id: 'catalog-funnel-id',
        slug: 'stress-assessment',
        title: 'Stress Assessment',
        isActive: true,
      })

      mockLoadFunnelVersionWithClient.mockResolvedValue({
        manifest: {
          questionnaire_config: {
            steps: [
              { id: 'new-step-1', title: 'New First Step', questions: [] },
            ],
          },
        },
      })

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceNew: true }),
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      expect(response.status).toBe(201) // 201 for new assessment
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe('force-new-assessment-777')
      expect(updateCalled).toBe(true) // Existing assessment should have been updated/completed
    })
  })

  describe('Database constraint enforcement', () => {
    it('should handle unique constraint violation gracefully', async () => {
      const mockSupabase = createMockSupabase({
        existingAssessment: null,
        legacyFunnel: { id: 'stress-funnel-id', title: 'Stress Assessment', is_active: true },
        assessmentInsertError: {
          code: '23505', // PostgreSQL unique violation
          message: 'duplicate key value violates unique constraint',
        },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      // Should return 400 for data integrity error
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.message).toContain('Datenintegritätsfehler')
    })
  })
})
