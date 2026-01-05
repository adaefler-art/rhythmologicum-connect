/**
 * Review Details API Tests - V05-I07.3
 * 
 * Tests for /api/review/[id]/details endpoint
 * Coverage: HTTP semantics, auth-first, RBAC, UUID validation, schema versioning
 */

import { NextRequest } from 'next/server'
import { GET as reviewDetails } from '@/app/api/review/[id]/details/route'

// Mock Supabase
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/review/persistence', () => ({
  loadReviewRecordById: jest.fn(),
}))
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { loadReviewRecordById } from '@/lib/review/persistence'
import { REVIEW_STATUS } from '@/lib/contracts/reviewRecord'

describe('GET /api/review/[id]/details - V05-I07.3', () => {
  const VALID_REVIEW_ID = '11111111-1111-4111-8111-111111111111'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('HTTP Semantics - Auth-First Pattern', () => {
    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      })

      const request = new NextRequest('http://localhost:3000/api/review/review-123/details')
      const context = { params: Promise.resolve({ id: 'review-123' }) }
      const response = await reviewDetails(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('AUTHENTICATION_REQUIRED')
    })

    it('should return 403 (not 404) when authenticated but insufficient role', async () => {
      // Mock authenticated but patient role
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-123',
                app_metadata: { role: 'patient' },
              },
            },
            error: null,
          }),
        },
      })

      const request = new NextRequest('http://localhost:3000/api/review/review-123/details')
      const context = { params: Promise.resolve({ id: 'review-123' }) }
      const response = await reviewDetails(request, context)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error.code).toBe('FORBIDDEN')
      expect(data.error.message).toBe('Insufficient permissions')
    })

    it('should return 422 when review ID is invalid UUID', async () => {
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'clinician-123',
                app_metadata: { role: 'clinician' },
              },
            },
            error: null,
          }),
        },
      })

      const request = new NextRequest('http://localhost:3000/api/review/invalid-uuid/details')
      const context = { params: Promise.resolve({ id: 'invalid-uuid' }) }
      const response = await reviewDetails(request, context)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('Invalid review ID format')
    })

    it('should return 404 when review not found', async () => {
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'clinician-123',
                app_metadata: { role: 'clinician' },
              },
            },
            error: null,
          }),
        },
      })
      ;(loadReviewRecordById as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Review record not found',
        errorCode: 'NOT_FOUND',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/review/00000000-0000-0000-0000-000000000000/details'
      )
      const context = { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) }
      const response = await reviewDetails(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('should return 200 with schema-versioned response when review found', async () => {
      const mockReview = {
        id: VALID_REVIEW_ID,
        jobId: 'job-123',
        status: REVIEW_STATUS.PENDING,
        queueReasons: ['VALIDATION_FLAG'],
        isSampled: false,
        reviewIteration: 1,
        validationResultId: 'validation-123',
        safetyCheckId: 'safety-123',
        reviewerUserId: undefined,
        reviewerRole: undefined,
        decisionReasonCode: undefined,
        decisionNotes: undefined,
        decidedAt: undefined,
        auditMetadata: {},
        createdAt: '2026-01-05T10:00:00Z',
        updatedAt: '2026-01-05T10:00:00Z',
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'clinician-123',
                app_metadata: { role: 'clinician' },
              },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'validation-123',
            overall_status: 'flag',
            overall_passed: false,
            flags_raised_count: 5,
            critical_flags_count: 2,
            warning_flags_count: 2,
            info_flags_count: 1,
            rules_evaluated_count: 42,
            validation_data: {},
            validated_at: '2026-01-05T09:00:00Z',
          },
          error: null,
        }),
      }

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(loadReviewRecordById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockReview,
      })

      const request = new NextRequest(`http://localhost:3000/api/review/${VALID_REVIEW_ID}/details`)
      const context = { params: Promise.resolve({ id: VALID_REVIEW_ID }) }
      const response = await reviewDetails(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.version).toBe('v1')
      expect(data.data.review.id).toBe(VALID_REVIEW_ID)
      expect(data.data.review.status).toBe(REVIEW_STATUS.PENDING)
      expect(data.data.validation).toBeDefined()
      expect(data.data.validation.overallStatus).toBe('flag')
      expect(data.data.decision).toBeNull()
    })
  })

  describe('RBAC - Role Access', () => {
    it('should allow clinician role to access details', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'clinician-123',
                app_metadata: { role: 'clinician' },
              },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(loadReviewRecordById as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: VALID_REVIEW_ID,
          jobId: 'job-123',
          status: REVIEW_STATUS.PENDING,
          queueReasons: [],
          isSampled: false,
          reviewIteration: 1,
          createdAt: '2026-01-05T10:00:00Z',
          updatedAt: '2026-01-05T10:00:00Z',
        },
      })

      const request = new NextRequest(`http://localhost:3000/api/review/${VALID_REVIEW_ID}/details`)
      const context = { params: Promise.resolve({ id: VALID_REVIEW_ID }) }
      const response = await reviewDetails(request, context)

      expect(response.status).toBe(200)
    })

    it('should allow admin role to access details', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'admin-123',
                app_metadata: { role: 'admin' },
              },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(loadReviewRecordById as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: VALID_REVIEW_ID,
          jobId: 'job-123',
          status: REVIEW_STATUS.PENDING,
          queueReasons: [],
          isSampled: false,
          reviewIteration: 1,
          createdAt: '2026-01-05T10:00:00Z',
          updatedAt: '2026-01-05T10:00:00Z',
        },
      })

      const request = new NextRequest(`http://localhost:3000/api/review/${VALID_REVIEW_ID}/details`)
      const context = { params: Promise.resolve({ id: VALID_REVIEW_ID }) }
      const response = await reviewDetails(request, context)

      expect(response.status).toBe(200)
    })

    it('should allow nurse role to access details', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'nurse-123',
                app_metadata: { role: 'nurse' },
              },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(loadReviewRecordById as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: VALID_REVIEW_ID,
          jobId: 'job-123',
          status: REVIEW_STATUS.PENDING,
          queueReasons: [],
          isSampled: false,
          reviewIteration: 1,
          createdAt: '2026-01-05T10:00:00Z',
          updatedAt: '2026-01-05T10:00:00Z',
        },
      })

      const request = new NextRequest(`http://localhost:3000/api/review/${VALID_REVIEW_ID}/details`)
      const context = { params: Promise.resolve({ id: VALID_REVIEW_ID }) }
      const response = await reviewDetails(request, context)

      expect(response.status).toBe(200)
    })
  })

  describe('PHI Safety', () => {
    it('should return PHI-free response (no patient identifiers)', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'clinician-123',
                app_metadata: { role: 'clinician' },
              },
            },
            error: null,
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(loadReviewRecordById as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: VALID_REVIEW_ID,
          jobId: 'job-123',
          status: REVIEW_STATUS.PENDING,
          queueReasons: ['VALIDATION_FLAG'],
          isSampled: false,
          reviewIteration: 1,
          createdAt: '2026-01-05T10:00:00Z',
          updatedAt: '2026-01-05T10:00:00Z',
        },
      })

      const request = new NextRequest(`http://localhost:3000/api/review/${VALID_REVIEW_ID}/details`)
      const context = { params: Promise.resolve({ id: VALID_REVIEW_ID }) }
      const response = await reviewDetails(request, context)
      const data = await response.json()

      // Verify response contains only IDs and coded values, no PHI
      expect(data.data.review).toBeDefined()
      expect(data.data.review.id).toBeDefined()
      expect(data.data.review.jobId).toBeDefined()
      expect(data.data.review.status).toBeDefined()
      
      // Ensure no patient-identifying fields
      const responseStr = JSON.stringify(data)
      expect(responseStr).not.toMatch(/patient_name/i)
      expect(responseStr).not.toMatch(/patient_email/i)
      expect(responseStr).not.toMatch(/patient_dob/i)
    })
  })
})
