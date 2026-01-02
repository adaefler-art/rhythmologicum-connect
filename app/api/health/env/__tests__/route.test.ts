/**
 * Tests for /api/health/env endpoint
 * TV05_03: Environment Self-Check Healthcheck
 *
 * Tests:
 * - Authentication gating (401 for unauthenticated)
 * - Authorization gating (403 for non-admin)
 * - Environment variable checks
 * - Secret redaction (no actual values in response)
 * - Database connectivity check
 */

import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db/supabase.server', () => ({
  getCurrentUser: jest.fn(),
  hasAdminOrClinicianRole: jest.fn(),
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service',
  },
}))

import { GET } from '../route'
import {
  getCurrentUser,
  hasAdminOrClinicianRole,
  createServerSupabaseClient,
} from '@/lib/db/supabase.server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockHasAdminOrClinicianRole = hasAdminOrClinicianRole as jest.MockedFunction<
  typeof hasAdminOrClinicianRole
>
const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.MockedFunction<
  typeof createServerSupabaseClient
>

describe('GET /api/health/env', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication and Authorization', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/health/env')
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
    })

    it('returns 403 when user is not admin/clinician', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-123',
        app_metadata: { role: 'patient' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      expect(response.status).toBe(403)

      const json = await response.json()
      expect(json).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
        },
      })
    })
  })

  describe('Environment Checks', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      // Mock successful database connectivity
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any)
    })

    it('returns 200 with all checks passing for valid environment', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.overallStatus).toBe('pass')
      expect(json.data.timestamp).toBeDefined()
      expect(json.data.checks).toHaveLength(4) // 3 env vars + 1 db check

      // Check each environment variable
      const urlCheck = json.data.checks.find((c: any) => c.name === 'NEXT_PUBLIC_SUPABASE_URL')
      expect(urlCheck).toEqual({
        name: 'NEXT_PUBLIC_SUPABASE_URL',
        pass: true,
        message: 'Valid URL format',
      })

      const anonKeyCheck = json.data.checks.find(
        (c: any) => c.name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      )
      expect(anonKeyCheck).toEqual({
        name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        pass: true,
        message: 'Valid key format',
      })

      const serviceKeyCheck = json.data.checks.find(
        (c: any) => c.name === 'SUPABASE_SERVICE_ROLE_KEY',
      )
      expect(serviceKeyCheck).toEqual({
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        pass: true,
        message: 'Valid key format',
      })

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck).toEqual({
        name: 'Database Connectivity',
        pass: true,
        message: 'Successfully connected to database',
      })
    })

    it('includes database connectivity check', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()
      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')

      expect(dbCheck).toBeDefined()
      expect(mockCreateServerSupabaseClient).toHaveBeenCalled()
    })
  })

  describe('Secret Redaction', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any)
    })

    it('does not include actual secret values in response', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()
      const responseString = JSON.stringify(json)

      // Should not contain actual environment variable values
      expect(responseString).not.toContain('https://test.supabase.co')
      expect(responseString).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test')
      expect(responseString).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service')
    })

    it('only includes check names, pass/fail status, and generic messages', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      json.data.checks.forEach((check: any) => {
        expect(check).toHaveProperty('name')
        expect(check).toHaveProperty('pass')
        expect(check).toHaveProperty('message')
        expect(Object.keys(check)).toHaveLength(3)

        // Messages should be generic, not contain actual values
        expect(check.message).not.toContain('eyJ')
        expect(check.message).not.toContain('https://')
      })
    })
  })

  describe('Failure Scenarios', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)
    })

    it('detects database connectivity issues', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            error: { message: 'Connection refused' },
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck?.pass).toBe(false)
      expect(dbCheck?.message).toContain('Connection refused')
    })

    it('handles database connectivity exceptions', async () => {
      mockCreateServerSupabaseClient.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck?.pass).toBe(false)
      expect(dbCheck?.message).toContain('Network error')
    })
  })

  describe('Response Structure', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any)
    })

    it('has correct response structure', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      expect(json).toHaveProperty('success', true)
      expect(json).toHaveProperty('data')
      expect(json.data).toHaveProperty('checks')
      expect(json.data).toHaveProperty('overallStatus')
      expect(json.data).toHaveProperty('timestamp')

      expect(Array.isArray(json.data.checks)).toBe(true)
      expect(['pass', 'fail']).toContain(json.data.overallStatus)
    })

    it('each check has required fields', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      json.data.checks.forEach((check: any) => {
        expect(check).toHaveProperty('name')
        expect(check).toHaveProperty('pass')
        expect(check).toHaveProperty('message')
        expect(typeof check.name).toBe('string')
        expect(typeof check.pass).toBe('boolean')
        expect(typeof check.message).toBe('string')
      })
    })

    it('timestamp is valid ISO 8601 format', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      const timestamp = new Date(json.data.timestamp)
      expect(timestamp.toISOString()).toBe(json.data.timestamp)
    })
  })

  describe('Error Handling', () => {
    it('handles errors gracefully in database check', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      // Force an error in database connectivity check
      mockCreateServerSupabaseClient.mockImplementation(() => {
        throw new Error('Catastrophic failure')
      })

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.overallStatus).toBe('fail')

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck?.pass).toBe(false)
      expect(dbCheck?.message).toContain('Catastrophic failure')
    })
  })
})
