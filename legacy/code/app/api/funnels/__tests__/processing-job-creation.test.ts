/**
 * E73.2: Processing Job Creation Tests
 *
 * Tests the idempotent creation of processing jobs when assessments are completed.
 * Validates that:
 * - Jobs are created on first completion
 * - Duplicate completions return the same job (idempotent)
 * - Response includes job_id and status
 * - Race conditions are handled correctly
 */

import { POST as completeAssessment } from '../[slug]/assessments/[assessmentId]/complete/route'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { CompleteAssessmentResponseData } from '@/lib/api/contracts/patient'

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

jest.mock('@/lib/audit/log', () => ({
  logAuditEvent: jest.fn().mockResolvedValue({ success: true }),
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
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
  maybeSingle: jest.fn().mockResolvedValue(result),
})

describe('E73.2: Processing Job Creation (Idempotent)', () => {
  const userId = 'user-123'
  const patientId = 'patient-123'
  const assessmentId = 'assessment-456'
  const jobId = 'job-789'
  const funnelSlug = 'cardiovascular-age'
  const funnelId = 'funnel-abc'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('First completion: creates processing job', () => {
    it('should create processing job and return job_id in response', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({
              data: { id: patientId },
              error: null,
            })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: {
                id: assessmentId,
                patient_id: patientId,
                funnel: funnelSlug,
                funnel_id: funnelId,
                status: 'in_progress',
                started_at: '2024-01-01T10:00:00Z',
              },
              error: null,
            })
          }
          if (table === 'assessment_answers') {
            return createMockBuilder({
              data: [],
              error: null,
            })
          }
          if (table === 'funnel_step_questions') {
            return createMockBuilder({
              data: [],
              error: null,
            })
          }
          if (table === 'processing_jobs') {
            const builder = createMockBuilder({ data: null, error: null })
            // First call (maybeSingle): no existing job
            builder.maybeSingle = jest.fn().mockResolvedValueOnce({
              data: null,
              error: null,
            })
            // Second call (insert + select + single): new job created
            builder.single = jest.fn().mockResolvedValueOnce({
              data: {
                id: jobId,
                status: 'queued',
                stage: 'pending',
                correlation_id: 'test-correlation-id',
              },
              error: null,
            })
            return builder
          }
          if (table === 'patient_state') {
            return createMockBuilder({
              data: null,
              error: { code: 'PGRST116' },
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/funnels/cardiovascular-age/assessments/assessment-456/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await completeAssessment(request, {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      })

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe(assessmentId)
      expect(body.data.status).toBe('completed')
      expect(body.data.processingJob).toBeDefined()
      expect(body.data.processingJob.jobId).toBe(jobId)
      expect(body.data.processingJob.status).toBe('queued')
    })
  })

  describe('Second completion: returns existing job (idempotent)', () => {
    it('should return existing job when completing already-completed assessment', async () => {
      const existingJobId = 'existing-job-123'

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({
              data: { id: patientId },
              error: null,
            })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: {
                id: assessmentId,
                patient_id: patientId,
                funnel: funnelSlug,
                funnel_id: funnelId,
                status: 'completed', // Already completed
                completed_at: '2024-01-01T11:00:00Z',
                started_at: '2024-01-01T10:00:00Z',
              },
              error: null,
            })
          }
          if (table === 'processing_jobs') {
            // Existing job found
            return createMockBuilder({
              data: {
                id: existingJobId,
                status: 'queued',
                stage: 'pending',
                correlation_id: 'test-correlation-id',
              },
              error: null,
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/funnels/cardiovascular-age/assessments/assessment-456/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await completeAssessment(request, {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      })

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe(assessmentId)
      expect(body.data.status).toBe('completed')
      expect(body.data.message).toBe('Assessment wurde bereits abgeschlossen.')
      expect(body.data.processingJob).toBeDefined()
      expect(body.data.processingJob.jobId).toBe(existingJobId)
      expect(body.data.processingJob.status).toBe('queued')
    })

    it('should handle race condition when job is created by concurrent request', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({
              data: { id: patientId },
              error: null,
            })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: {
                id: assessmentId,
                patient_id: patientId,
                funnel: funnelSlug,
                funnel_id: funnelId,
                status: 'in_progress',
                started_at: '2024-01-01T10:00:00Z',
              },
              error: null,
            })
          }
          if (table === 'processing_jobs') {
            const builder = createMockBuilder({ data: null, error: null })
            // First check: no job exists
            builder.maybeSingle = jest.fn().mockResolvedValueOnce({
              data: null,
              error: null,
            })
            // Insert attempt: unique constraint violation (race condition)
            builder.single = jest
              .fn()
              .mockResolvedValueOnce({
                data: null,
                error: { code: '23505', message: 'duplicate key value violates unique constraint' },
              })
              // Retry select: find the job created by concurrent request
              .mockResolvedValueOnce({
                data: {
                  id: jobId,
                  status: 'queued',
                  stage: 'pending',
                  correlation_id: 'test-correlation-id',
                },
                error: null,
              })
            return builder
          }
          if (table === 'assessment_answers') {
            return createMockBuilder({ data: [], error: null })
          }
          if (table === 'funnel_step_questions') {
            return createMockBuilder({ data: [], error: null })
          }
          if (table === 'patient_state') {
            return createMockBuilder({
              data: null,
              error: { code: 'PGRST116' },
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/funnels/cardiovascular-age/assessments/assessment-456/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await completeAssessment(request, {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      })

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.processingJob).toBeDefined()
      expect(body.data.processingJob.jobId).toBe(jobId)
    })
  })

  describe('Job creation failure: does not fail completion', () => {
    it('should complete assessment even if job creation fails', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'patient_profiles') {
            return createMockBuilder({
              data: { id: patientId },
              error: null,
            })
          }
          if (table === 'assessments') {
            return createMockBuilder({
              data: {
                id: assessmentId,
                patient_id: patientId,
                funnel: funnelSlug,
                funnel_id: funnelId,
                status: 'in_progress',
                started_at: '2024-01-01T10:00:00Z',
              },
              error: null,
            })
          }
          if (table === 'processing_jobs') {
            // Job creation fails
            return createMockBuilder({
              data: null,
              error: { message: 'Database connection error' },
            })
          }
          if (table === 'assessment_answers') {
            return createMockBuilder({ data: [], error: null })
          }
          if (table === 'funnel_step_questions') {
            return createMockBuilder({ data: [], error: null })
          }
          if (table === 'patient_state') {
            return createMockBuilder({
              data: null,
              error: { code: 'PGRST116' },
            })
          }
          return createMockBuilder({ data: null, error: null })
        }),
      } as unknown as MockSupabaseClient

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/funnels/cardiovascular-age/assessments/assessment-456/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await completeAssessment(request, {
        params: Promise.resolve({ slug: funnelSlug, assessmentId }),
      })

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.assessmentId).toBe(assessmentId)
      expect(body.data.status).toBe('completed')
      // Job creation failed, so processingJob should be undefined
      expect(body.data.processingJob).toBeUndefined()
    })
  })
})
