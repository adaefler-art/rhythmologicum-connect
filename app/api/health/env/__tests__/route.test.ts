/**
 * Tests for /api/health/env endpoint
 * TV05_03: Environment Self-Check Healthcheck
 *
 * Tests:
 * - Authentication gating (401 for unauthenticated)
 * - Authorization gating (403 for non-admin)
 * - Environment variable checks
 * - Secret redaction (no actual values in response)
 * - Database connectivity check using pillars table
 * - Fail-safe behavior (returns 200 + RED, not 500)
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
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjQyODQwMCwiZXhwIjoxOTU4MDA0NDAwfQ.test',
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

      // Mock successful database connectivity using pillars table
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as any)
    })

    it('returns 200 with GREEN status when all checks pass', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('GREEN')
      expect(json.data.healthcheckVersion).toBe('1.0.0')
      expect(json.data.requestId).toBeDefined()
      expect(json.data.timestamp).toBeDefined()
      expect(json.data.checks).toHaveLength(3) // 2 env vars + 1 db check
    })

    it('uses pillars table for database connectivity check', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      await GET(request)

      const supabaseMock = await mockCreateServerSupabaseClient()
      expect(supabaseMock.from).toHaveBeenCalledWith('pillars')
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
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ error: null }),
          }),
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
    })

    it('includes ok field and optional hint field', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      json.data.checks.forEach((check: any) => {
        expect(check).toHaveProperty('name')
        expect(check).toHaveProperty('ok')
        expect(check).toHaveProperty('message')
        expect(typeof check.ok).toBe('boolean')
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

    it('detects schema drift (relation does not exist)', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              error: { code: '42P01', message: 'relation "pillars" does not exist' },
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      expect(response.status).toBe(200) // Fail-safe: not 500

      const json = await response.json()
      expect(json.data.status).toBe('RED')

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck?.ok).toBe(false)
      expect(dbCheck?.message).toBe('Schema drift detected')
      expect(dbCheck?.hint).toContain('migrations')
    })

    it('detects invalid API key (permission denied)', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              error: { code: '42501', message: 'permission denied' },
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      expect(response.status).toBe(200) // Fail-safe: not 500

      const json = await response.json()
      expect(json.data.status).toBe('RED')

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck?.ok).toBe(false)
      expect(dbCheck?.message).toBe('Authentication/permission error')
      expect(dbCheck?.hint).toContain('API key')
    })

    it('handles generic database errors', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              error: { message: 'Connection refused' },
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()
      expect(json.data.status).toBe('RED')

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck?.ok).toBe(false)
      expect(dbCheck?.hint).toBe('Connection refused')
    })

    it('handles connection exceptions', async () => {
      mockCreateServerSupabaseClient.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      expect(response.status).toBe(200) // Fail-safe: not 500

      const json = await response.json()
      expect(json.data.status).toBe('RED')

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck?.ok).toBe(false)
      expect(dbCheck?.hint).toContain('Network error')
    })

    it('handles missing environment configuration', async () => {
      mockCreateServerSupabaseClient.mockRejectedValue(
        new Error('Supabase configuration missing'),
      )

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()
      expect(json.data.status).toBe('RED')

      const dbCheck = json.data.checks.find((c: any) => c.name === 'Database Connectivity')
      expect(dbCheck?.ok).toBe(false)
      expect(dbCheck?.message).toBe('Missing environment configuration')
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
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as any)
    })

    it('has correct response structure', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      expect(json).toHaveProperty('success', true)
      expect(json).toHaveProperty('data')
      expect(json.data).toHaveProperty('healthcheckVersion', '1.0.0')
      expect(json.data).toHaveProperty('status')
      expect(json.data).toHaveProperty('checks')
      expect(json.data).toHaveProperty('requestId')
      expect(json.data).toHaveProperty('timestamp')

      expect(Array.isArray(json.data.checks)).toBe(true)
      expect(['GREEN', 'RED']).toContain(json.data.status)
    })

    it('requestId is a valid UUID', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(json.data.requestId).toMatch(uuidRegex)
    })

    it('timestamp is valid ISO 8601 format', async () => {
      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      const json = await response.json()

      const timestamp = new Date(json.data.timestamp)
      expect(timestamp.toISOString()).toBe(json.data.timestamp)
    })
  })

  describe('Fail-Safe Behavior', () => {
    it('returns 200 with RED status on unexpected errors, not 500', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      // Force an unexpected error
      mockCreateServerSupabaseClient.mockImplementation(() => {
        throw new Error('Catastrophic failure')
      })

      const request = new NextRequest('http://localhost/api/health/env')
      const response = await GET(request)

      expect(response.status).toBe(200) // Not 500!

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('RED')

      // Should still have valid structure
      expect(json.data.healthcheckVersion).toBe('1.0.0')
      expect(json.data.requestId).toBeDefined()
      expect(json.data.checks).toHaveLength(3) // 2 env checks + DB check
    })
  })
})
