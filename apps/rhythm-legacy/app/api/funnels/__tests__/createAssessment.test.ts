/**
 * Tests for POST /api/funnels/:slug/assessments
 *
 * Verifies:
 * - 200/201 for valid funnel slugs (stress-assessment, cardiovascular-age)
 * - 404 FUNNEL_NOT_FOUND for unknown slugs
 * - 409 FUNNEL_NOT_SUPPORTED when funnel exists but has no steps
 * - No 500 INTERNAL_ERROR for known edge cases
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

// Helper to create mock Supabase client
function createMockSupabase(overrides: {
  user?: { id: string } | null
  authError?: Error | null
  patientProfile?: { id: string } | null
  profileError?: Error | null
  existingAssessment?: { id: string } | null
  existingAssessmentError?: { code?: string; message?: string } | null
  legacyFunnel?: { id: string; title: string; is_active: boolean } | null
  legacyError?: Error | null
  assessment?: { id: string; status: string } | null
  assessmentError?: { code?: string; message?: string } | null
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
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: overrides.existingAssessment ?? null,
          error: overrides.existingAssessmentError ?? null,
        }),
        single: jest.fn().mockResolvedValue({
          data: overrides.assessment ?? { id: 'assessment-123', status: 'in_progress' },
          error: overrides.assessmentError ?? null,
        }),
      }
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
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

describe('POST /api/funnels/:slug/assessments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('stress-assessment (legacy funnel)', () => {
    it('should return 201 with assessment data for valid legacy funnel', async () => {
      const mockSupabase = createMockSupabase({
        legacyFunnel: { id: 'stress-funnel-id', title: 'Stress Assessment', is_active: true },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)
      mockGetCurrentStep.mockResolvedValue({
        stepId: 'step-1',
        title: 'First Step',
        type: 'question_step',
        orderIndex: 0,
        stepIndex: 0,
      })

      // Import after mocks are set up
      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe('assessment-123')
      expect(body.data.currentStep.stepId).toBe('step-1')
    })

    it('should return 400 when legacy funnel is inactive', async () => {
      const mockSupabase = createMockSupabase({
        legacyFunnel: { id: 'stress-funnel-id', title: 'Stress Assessment', is_active: false },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.message).toContain('nicht aktiv')
    })
  })

  describe('cardiovascular-age (V0.5 catalog funnel)', () => {
    it('should return 201 with assessment data for valid catalog funnel', async () => {
      const mockSupabase = createMockSupabase({
        legacyFunnel: null, // Not in legacy table
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      // Mock V0.5 catalog lookup
      mockLoadFunnelWithClient.mockResolvedValue({
        id: 'cardio-funnel-id',
        slug: 'cardiovascular-age',
        title: 'Cardiovascular Age',
        isActive: true,
      })

      mockLoadFunnelVersionWithClient.mockResolvedValue({
        manifest: {
          questionnaire_config: {
            steps: [
              { id: 'cardio-step-1', title: 'Cardiovascular Intro', questions: [] },
              { id: 'cardio-step-2', title: 'Health History', questions: [] },
            ],
          },
        },
      })

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/cardiovascular-age/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'cardiovascular-age' }),
      })

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe('assessment-123')
      expect(body.data.currentStep.stepId).toBe('cardio-step-1')
      expect(body.data.currentStep.title).toBe('Cardiovascular Intro')
    })

    it('should return 409 when catalog funnel has no steps configured', async () => {
      const mockSupabase = createMockSupabase({
        legacyFunnel: null,
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      mockLoadFunnelWithClient.mockResolvedValue({
        id: 'cardio-funnel-id',
        slug: 'cardiovascular-age',
        title: 'Cardiovascular Age',
        isActive: true,
      })

      // Funnel version has empty steps
      mockLoadFunnelVersionWithClient.mockResolvedValue({
        manifest: {
          questionnaire_config: {
            steps: [], // Empty!
          },
        },
      })

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/cardiovascular-age/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'cardiovascular-age' }),
      })

      // Should be 409 FUNNEL_NOT_SUPPORTED, not 500
      expect(response.status).toBe(409)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('FUNNEL_NOT_SUPPORTED')
    })
  })

  describe('unknown funnel slug', () => {
    it('should return 404 FUNNEL_NOT_FOUND for non-existent funnel', async () => {
      const mockSupabase = createMockSupabase({
        legacyFunnel: null,
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)
      mockLoadFunnelWithClient.mockResolvedValue(null) // Not in catalog either

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/nonexistent-funnel/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'nonexistent-funnel' }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('database constraint errors', () => {
    it('should return 400 for FK constraint violation (23503), not 500', async () => {
      const mockSupabase = createMockSupabase({
        legacyFunnel: { id: 'stress-funnel-id', title: 'Stress Assessment', is_active: true },
        assessmentError: { code: '23503', message: 'violates foreign key constraint' },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      // Should be 400 with typed error, not 500
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.message).toContain('Datenintegritätsfehler')
    })

    it('should return 401 for RLS permission denied (42501), not 500', async () => {
      const mockSupabase = createMockSupabase({
        legacyFunnel: { id: 'stress-funnel-id', title: 'Stress Assessment', is_active: true },
        assessmentError: { code: '42501', message: 'permission denied' },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
    })
  })

  describe('authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const mockSupabase = createMockSupabase({
        user: null,
        authError: new Error('Not authenticated'),
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 when patient profile does not exist', async () => {
      const mockSupabase = createMockSupabase({
        patientProfile: null,
        profileError: { code: 'PGRST116', message: 'No rows found' },
      })
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { POST } = await import('../[slug]/assessments/route')

      const mockRequest = new Request('http://localhost/api/funnels/stress-assessment/assessments', {
        method: 'POST',
      })

      const response = await POST(mockRequest as never, {
        params: Promise.resolve({ slug: 'stress-assessment' }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error.message).toContain('Benutzerprofil')
    })
  })
})
