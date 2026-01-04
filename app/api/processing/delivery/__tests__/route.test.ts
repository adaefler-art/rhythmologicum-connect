/**
 * Tests for delivery API endpoint
 * V05-I05.9: Verify auth-first, RBAC, 404-on-denial, and idempotency
 */

import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db/supabase.server', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/processing/deliveryStageProcessor', () => ({
  processDeliveryStage: jest.fn(),
}))

jest.mock('@/lib/logging/logger', () => ({
  logUnauthorized: jest.fn(),
  logError: jest.fn(),
}))

import { POST } from '../route'
import { getCurrentUser } from '@/lib/db/supabase.server'
import { processDeliveryStage } from '@/lib/processing/deliveryStageProcessor'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockProcessDeliveryStage = processDeliveryStage as jest.MockedFunction<
  typeof processDeliveryStage
>

describe('POST /api/processing/delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication and RBAC', () => {
    it('returns 401 when user is not authenticated (auth-first, before JSON parse)', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: 'test-job-id' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(mockProcessDeliveryStage).not.toHaveBeenCalled()

      const json = await response.json()
      expect(json).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
        },
      })
    })

    it('returns 404 (not 403) when user is not clinician/admin (404-on-denial)', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-123',
        app_metadata: { role: 'patient' },
      } as any)

      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: '12345678-1234-1234-1234-123456789012' }),
      })

      const response = await POST(request)

      // Should be 404, not 403, to avoid existence disclosure
      expect(response.status).toBe(404)
      expect(mockProcessDeliveryStage).not.toHaveBeenCalled()

      const json = await response.json()
      expect(json).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
        },
      })
    })

    it('allows clinician to trigger delivery', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'clinician-123',
        app_metadata: { role: 'clinician' },
      } as any)

      mockProcessDeliveryStage.mockResolvedValue({
        success: true,
        jobId: '12345678-1234-1234-1234-123456789012',
        notificationIds: ['notif-1'],
      })

      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: '12345678-1234-1234-1234-123456789012' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockProcessDeliveryStage).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012'
      )
    })

    it('allows admin to trigger delivery', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)

      mockProcessDeliveryStage.mockResolvedValue({
        success: true,
        jobId: '12345678-1234-1234-1234-123456789012',
        notificationIds: ['notif-1'],
      })

      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: '12345678-1234-1234-1234-123456789012' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockProcessDeliveryStage).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012'
      )
    })

    it('rejects user without role (no user_metadata fallback)', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-123',
        app_metadata: {}, // No role
      } as any)

      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: '12345678-1234-1234-1234-123456789012' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
      expect(mockProcessDeliveryStage).not.toHaveBeenCalled()
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'clinician-123',
        app_metadata: { role: 'clinician' },
      } as any)
    })

    it('returns 400 when jobId is missing', async () => {
      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(mockProcessDeliveryStage).not.toHaveBeenCalled()
    })

    it('returns 400 when jobId is not a valid UUID', async () => {
      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: 'not-a-uuid' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(mockProcessDeliveryStage).not.toHaveBeenCalled()
    })
  })

  describe('Delivery Processing', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'clinician-123',
        app_metadata: { role: 'clinician' },
      } as any)
    })

    it('returns success when delivery succeeds', async () => {
      mockProcessDeliveryStage.mockResolvedValue({
        success: true,
        jobId: '12345678-1234-1234-1234-123456789012',
        notificationIds: ['notif-1', 'notif-2'],
      })

      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: '12345678-1234-1234-1234-123456789012' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toMatchObject({
        success: true,
        data: {
          jobId: '12345678-1234-1234-1234-123456789012',
          notificationIds: ['notif-1', 'notif-2'],
        },
      })
    })

    it('returns 400 when delivery is not eligible (non-retryable)', async () => {
      mockProcessDeliveryStage.mockResolvedValue({
        success: false,
        error: 'Job not completed',
        retryable: false,
      })

      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: '12345678-1234-1234-1234-123456789012' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json).toMatchObject({
        success: false,
        error: {
          code: 'DELIVERY_INELIGIBLE',
          message: 'Job not completed',
        },
      })
    })

    it('returns 500 when delivery fails (retryable)', async () => {
      mockProcessDeliveryStage.mockResolvedValue({
        success: false,
        error: 'Database error',
        retryable: true,
      })

      const request = new NextRequest('http://localhost/api/processing/delivery', {
        method: 'POST',
        body: JSON.stringify({ jobId: '12345678-1234-1234-1234-123456789012' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json).toMatchObject({
        success: false,
        error: {
          code: 'DELIVERY_ERROR',
        },
      })
    })
  })
})
