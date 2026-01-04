/**
 * Review Queue API Tests - V05-I05.7
 * 
 * Tests for HTTP semantics, auth-first pattern, and RBAC enforcement
 */

import { NextRequest } from 'next/server'
import { GET as queueGet } from '@/app/api/review/queue/route'
import { GET as reviewGet } from '@/app/api/review/[id]/route'
import { POST as reviewDecide } from '@/app/api/review/[id]/decide/route'

// Mock Supabase
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/review/persistence', () => ({
  listReviewQueue: jest.fn(),
  countReviewsByStatus: jest.fn(),
  loadReviewRecordById: jest.fn(),
  updateReviewDecision: jest.fn(),
}))

jest.mock('@/lib/audit/log', () => ({
  logAuditEvent: jest.fn(),
}))

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  listReviewQueue,
  loadReviewRecordById,
  updateReviewDecision,
} from '@/lib/review/persistence'

describe('Review Queue API - HTTP Semantics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/review/queue', () => {
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

      const request = new NextRequest('http://localhost:3000/api/review/queue')
      const response = await queueGet(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('AUTHENTICATION_REQUIRED')
    })

    it('should return 404 (not 403) when authenticated but wrong role', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/review/queue')
      const response = await queueGet(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Resource not found')
    })
  })

  describe('GET /api/review/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      })

      const request = new NextRequest('http://localhost:3000/api/review/review-123')
      const context = { params: Promise.resolve({ id: 'review-123' }) }
      const response = await reviewGet(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('AUTHENTICATION_REQUIRED')
    })

    it('should return 404 (not 403) when authenticated but wrong role', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/review/review-123')
      const context = { params: Promise.resolve({ id: 'review-123' }) }
      const response = await reviewGet(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Resource not found')
    })
  })

  describe('POST /api/review/[id]/decide - Auth-First Pattern', () => {
    it('should return 401 when not authenticated (before parsing body)', async () => {
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      })

      // Invalid JSON body - should still get 401, not parse error
      const request = new NextRequest('http://localhost:3000/api/review/review-123/decide', {
        method: 'POST',
        body: 'INVALID JSON {',
        headers: { 'Content-Type': 'application/json' },
      })

      const context = { params: Promise.resolve({ id: 'review-123' }) }
      const response = await reviewDecide(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('AUTHENTICATION_REQUIRED')
    })

    it('should return 404 (not 403) when authenticated but wrong role', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/review/review-123/decide', {
        method: 'POST',
        body: JSON.stringify({
          status: 'APPROVED',
          reasonCode: 'APPROVED_SAFE',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const context = { params: Promise.resolve({ id: 'review-123' }) }
      const response = await reviewDecide(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('Resource not found')
    })

    it('should authenticate before parsing body (invalid JSON with wrong role)', async () => {
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-123',
                app_metadata: { role: 'nurse' },
              },
            },
            error: null,
          }),
        },
      })

      // Invalid JSON but should still get 404 for wrong role, not parse error
      const request = new NextRequest('http://localhost:3000/api/review/review-123/decide', {
        method: 'POST',
        body: 'INVALID JSON {',
        headers: { 'Content-Type': 'application/json' },
      })

      const context = { params: Promise.resolve({ id: 'review-123' }) }
      const response = await reviewDecide(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })

  describe('RBAC - Global Clinician Access', () => {
    it('should allow any clinician to access queue (no per-patient assignment)', async () => {
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

      ;(createAdminSupabaseClient as jest.Mock).mockReturnValue({})
      ;(listReviewQueue as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            reviewId: 'review-1',
            jobId: 'job-1',
            status: 'PENDING',
            queueReasons: ['VALIDATION_FAIL'],
            isSampled: false,
            createdAt: '2026-01-04T10:00:00Z',
            updatedAt: '2026-01-04T10:00:00Z',
          },
        ],
      })

      const request = new NextRequest('http://localhost:3000/api/review/queue')
      const response = await queueGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.items.length).toBeGreaterThan(0)
    })

    it('should allow admin to access queue', async () => {
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
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
      })

      ;(createAdminSupabaseClient as jest.Mock).mockReturnValue({})
      ;(listReviewQueue as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })

      const request = new NextRequest('http://localhost:3000/api/review/queue')
      const response = await queueGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
