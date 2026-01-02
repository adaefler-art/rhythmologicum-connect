/**
 * Tests for admin usage endpoint
 * TV05_01: Verify auth gating and PHI-free response
 * TV05_02: Verify enabled flag in response
 */

import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db/supabase.server', () => ({
  getCurrentUser: jest.fn(),
  hasAdminOrClinicianRole: jest.fn(),
}))

jest.mock('@/lib/monitoring/usageTracker', () => ({
  getAggregatedUsage: jest.fn(),
}))

jest.mock('@/lib/monitoring/config', () => ({
  isUsageTelemetryEnabled: jest.fn(() => true), // Default to enabled
}))

jest.mock('@/lib/logging/logger', () => ({
  logInfo: jest.fn(),
  logUnauthorized: jest.fn(),
  logForbidden: jest.fn(),
}))

import { GET } from '../route'
import { getCurrentUser, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { getAggregatedUsage } from '@/lib/monitoring/usageTracker'
import { isUsageTelemetryEnabled } from '@/lib/monitoring/config'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockHasAdminOrClinicianRole = hasAdminOrClinicianRole as jest.MockedFunction<
  typeof hasAdminOrClinicianRole
>
const mockGetAggregatedUsage = getAggregatedUsage as jest.MockedFunction<
  typeof getAggregatedUsage
>
const mockIsUsageTelemetryEnabled = isUsageTelemetryEnabled as jest.MockedFunction<
  typeof isUsageTelemetryEnabled
>

describe('GET /api/admin/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/admin/usage')
    const response = await GET(request)

    expect(response.status).toBe(401)

    const json = await response.json()
    expect(json).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    })

    expect(mockHasAdminOrClinicianRole).not.toHaveBeenCalled()
    expect(mockGetAggregatedUsage).not.toHaveBeenCalled()
  })

  it('returns 403 when user is not admin/clinician', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      app_metadata: { role: 'patient' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/admin/usage')
    const response = await GET(request)

    expect(response.status).toBe(403)

    const json = await response.json()
    expect(json).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })

    expect(mockGetAggregatedUsage).not.toHaveBeenCalled()
  })

  it('returns usage data for admin user', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)
    mockGetAggregatedUsage.mockResolvedValue([
      {
        routeKey: 'POST /api/amy/stress-report',
        count: 42,
        lastSeenAt: '2026-01-02T10:00:00.000Z',
        statusBuckets: {
          '2xx': 40,
          '3xx': 0,
          '4xx': 2,
          '5xx': 0,
        },
        env: 'production',
      },
      {
        routeKey: 'POST /api/consent/record',
        count: 10,
        lastSeenAt: '2026-01-02T09:00:00.000Z',
        statusBuckets: {
          '2xx': 8,
          '3xx': 0,
          '4xx': 1,
          '5xx': 1,
        },
        env: 'production',
      },
    ])

    const request = new NextRequest('http://localhost/api/admin/usage')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.enabled).toBe(true)
    expect(json.data.routes).toHaveLength(2)
    expect(json.data.totalRoutes).toBe(2)
    expect(json.data.generatedAt).toBeDefined()

    expect(json.data.routes[0]).toMatchObject({
      routeKey: 'POST /api/amy/stress-report',
      count: 42,
      lastSeenAt: '2026-01-02T10:00:00.000Z',
      statusBuckets: {
        '2xx': 40,
        '3xx': 0,
        '4xx': 2,
        '5xx': 0,
      },
      env: 'production',
    })
  })

  it('returns usage data for clinician user', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'clinician-123',
      app_metadata: { role: 'clinician' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)
    mockGetAggregatedUsage.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/admin/usage')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.enabled).toBe(true)
    expect(json.data.routes).toEqual([])
    expect(json.data.totalRoutes).toBe(0)
  })

  it('returns 500 on internal error', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)
    mockGetAggregatedUsage.mockRejectedValue(new Error('File system error'))

    const request = new NextRequest('http://localhost/api/admin/usage')
    const response = await GET(request)

    expect(response.status).toBe(500)

    const json = await response.json()
    expect(json).toMatchObject({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
      },
    })
  })

  describe('PHI compliance', () => {
    it('does not include PHI in response', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)
      mockGetAggregatedUsage.mockResolvedValue([
        {
          routeKey: 'POST /api/amy/stress-report',
          count: 42,
          lastSeenAt: '2026-01-02T10:00:00.000Z',
          statusBuckets: {
            '2xx': 40,
            '3xx': 0,
            '4xx': 2,
            '5xx': 0,
          },
          env: 'production',
        },
      ])

      const request = new NextRequest('http://localhost/api/admin/usage')
      const response = await GET(request)

      const json = await response.json()
      const jsonString = JSON.stringify(json)

      // Verify no common PHI fields
      expect(jsonString).not.toMatch(/userId/i)
      expect(jsonString).not.toMatch(/user_id/i)
      expect(jsonString).not.toMatch(/patientId/i)
      expect(jsonString).not.toMatch(/patient_id/i)
      expect(jsonString).not.toMatch(/assessmentId/i)
      expect(jsonString).not.toMatch(/assessment_id/i)
      expect(jsonString).not.toMatch(/email/i)
      expect(jsonString).not.toMatch(/name/i)
      expect(jsonString).not.toMatch(/phone/i)
      expect(jsonString).not.toMatch(/address/i)
    })

    it('only includes allowed fields in route data', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)
      mockGetAggregatedUsage.mockResolvedValue([
        {
          routeKey: 'POST /api/test',
          count: 1,
          lastSeenAt: '2026-01-02T10:00:00.000Z',
          statusBuckets: {
            '2xx': 1,
            '3xx': 0,
            '4xx': 0,
            '5xx': 0,
          },
          env: 'test',
        },
      ])

      const request = new NextRequest('http://localhost/api/admin/usage')
      const response = await GET(request)

      const json = await response.json()
      const route = json.data.routes[0]

      // Only allowed fields
      expect(Object.keys(route).sort()).toEqual([
        'count',
        'env',
        'lastSeenAt',
        'routeKey',
        'statusBuckets',
      ])
    })
  })

  describe('TV05_02: Telemetry enabled flag', () => {
    it('includes enabled:true when telemetry is enabled', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)
      mockGetAggregatedUsage.mockResolvedValue([])
      mockIsUsageTelemetryEnabled.mockReturnValue(true)

      const request = new NextRequest('http://localhost/api/admin/usage')
      const response = await GET(request)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.enabled).toBe(true)
    })

    it('includes enabled:false when telemetry is disabled', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)
      mockGetAggregatedUsage.mockResolvedValue([])
      mockIsUsageTelemetryEnabled.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/admin/usage')
      const response = await GET(request)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.enabled).toBe(false)
      expect(json.data.routes).toEqual([])
    })

    it('returns 200 and enabled:false when telemetry is disabled (not 500)', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)
      mockGetAggregatedUsage.mockResolvedValue([])
      mockIsUsageTelemetryEnabled.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/admin/usage')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.enabled).toBe(false)
    })
  })
})
