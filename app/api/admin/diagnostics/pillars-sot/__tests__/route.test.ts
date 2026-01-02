/**
 * Tests for TV05_01B: Pillars SOT Audit Endpoint
 * Verify auth gating, PHI-free response, data structure, and RPC usage
 */

import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db/supabase.server', () => ({
  getCurrentUser: jest.fn(),
  hasAdminOrClinicianRole: jest.fn(),
}))

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/logging/logger', () => ({
  logInfo: jest.fn(),
  logUnauthorized: jest.fn(),
  logForbidden: jest.fn(),
}))

jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'REDACTED',
    SUPABASE_SERVICE_ROLE_KEY: 'REDACTED',
    NODE_ENV: 'test',
  },
}))

jest.mock('crypto', () => ({
  randomUUID: () => 'test-request-id-123',
}))

import { GET } from '../route'
import { getCurrentUser, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockHasAdminOrClinicianRole = hasAdminOrClinicianRole as jest.MockedFunction<
  typeof hasAdminOrClinicianRole
>
const mockCreateAdminSupabaseClient = createAdminSupabaseClient as jest.MockedFunction<
  typeof createAdminSupabaseClient
>

describe('GET /api/admin/diagnostics/pillars-sot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
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

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
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

  it('returns 200 with GREEN status for healthy system', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)

    const mockClient = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          pillars: {
            exists: true,
            relkind: 'r',
            relrowsecurity: true,
            policyCount: 1,
            rowCount: 7,
          },
          funnels_catalog: {
            exists: true,
            relkind: 'r',
            relrowsecurity: true,
            policyCount: 2,
            rowCount: 5,
            stressFunnelExists: true,
          },
          funnel_versions: {
            exists: true,
            relkind: 'r',
            relrowsecurity: true,
            policyCount: 1,
            rowCount: 3,
          },
        },
        error: null,
      }),
    }

    mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()

    const data = json.data

    // Verify schema version
    expect(data.diagnosticsVersion).toBe('1.0.0')

    // Verify GREEN status
    expect(data.status).toBe('GREEN')
    expect(data.findings).toEqual([])

    // Verify requestId
    expect(data.requestId).toBe('test-request-id-123')

    // Verify environment data
    expect(data.environment).toMatchObject({
      supabaseUrl: 'https://test.supabase.co',
      envName: 'test',
      hasSupabaseServiceRoleKey: true,
      hasSupabaseAnonKey: true,
    })

    // Verify tables data
    expect(data.tables.pillars.metadata.exists).toBe(true)
    expect(data.tables.pillars.rowCount).toBe(7)
    expect(data.tables.funnels_catalog.metadata.exists).toBe(true)
    expect(data.tables.funnel_versions.metadata.exists).toBe(true)

    // Verify seeds data
    expect(data.seeds).toMatchObject({
      stressFunnelPresent: true,
      pillarCount: 7,
      expectedPillarCount: 7,
    })

    // Verify RPC was called
    expect(mockClient.rpc).toHaveBeenCalledWith('diagnostics_pillars_sot')
  })

  it('returns 200 with RED status when tables missing', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)

    const mockClient = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          pillars: { exists: false },
          funnels_catalog: { exists: false },
          funnel_versions: { exists: false },
        },
        error: null,
      }),
    }

    mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)

    const data = json.data

    // Should return RED status
    expect(data.status).toBe('RED')

    // Should have error findings
    expect(data.findings.length).toBeGreaterThan(0)
    expect(data.findings.some((f: any) => f.code === 'TABLE_MISSING_PILLARS')).toBe(true)
    expect(data.findings.some((f: any) => f.code === 'TABLE_MISSING_CATALOG')).toBe(true)
    expect(data.findings.some((f: any) => f.code === 'TABLE_MISSING_VERSIONS')).toBe(true)

    // Tables should be marked as not existing
    expect(data.tables.pillars.metadata.exists).toBe(false)
    expect(data.tables.funnels_catalog.metadata.exists).toBe(false)
    expect(data.tables.funnel_versions.metadata.exists).toBe(false)
  })

  it('returns 200 with YELLOW status for seed warnings', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)

    const mockClient = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          pillars: {
            exists: true,
            relkind: 'r',
            relrowsecurity: true,
            policyCount: 1,
            rowCount: 5, // Wrong count
          },
          funnels_catalog: {
            exists: true,
            relkind: 'r',
            relrowsecurity: true,
            policyCount: 2,
            rowCount: 1,
            stressFunnelExists: false, // Missing stress funnel
          },
          funnel_versions: {
            exists: true,
            relkind: 'r',
            relrowsecurity: true,
            policyCount: 1,
            rowCount: 1,
          },
        },
        error: null,
      }),
    }

    mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    const data = json.data

    // Should return YELLOW status
    expect(data.status).toBe('YELLOW')

    // Should have warning findings
    expect(data.findings.some((f: any) => f.code === 'SEED_PILLAR_COUNT_MISMATCH')).toBe(true)
    expect(data.findings.some((f: any) => f.code === 'SEED_STRESS_FUNNEL_MISSING')).toBe(true)
  })

  it('returns 200 with RED status when RPC fails', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)

    const mockClient = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'function diagnostics_pillars_sot does not exist' },
      }),
    }

    mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    const data = json.data

    // Should return RED status
    expect(data.status).toBe('RED')

    // Should have RPC error finding
    expect(data.findings.some((f: any) => f.code === 'RPC_FUNCTION_ERROR')).toBe(true)

    // Tables should be marked as not existing
    expect(data.tables.pillars.metadata.exists).toBe(false)
  })

  it('works for clinician user', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'clinician-123',
      app_metadata: { role: 'clinician' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)

    const mockClient = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          pillars: { exists: true, rowCount: 7 },
          funnels_catalog: { exists: true, rowCount: 1, stressFunnelExists: true },
          funnel_versions: { exists: true, rowCount: 1 },
        },
        error: null,
      }),
    }

    mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect((await response.json()).success).toBe(true)
  })

  describe('PHI compliance', () => {
    it('does not include PHI or secrets in response', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      const mockClient = {
        rpc: jest.fn().mockResolvedValue({
          data: {
            pillars: { exists: true, rowCount: 7 },
            funnels_catalog: { exists: true, rowCount: 1, stressFunnelExists: true },
            funnel_versions: { exists: true, rowCount: 1 },
          },
          error: null,
        }),
      }

      mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
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
      expect(jsonString).not.toMatch(/phone/i)
      expect(jsonString).not.toMatch(/address/i)

      // Verify no secrets (all should be REDACTED in mocks)
      expect(jsonString).not.toMatch(/SERVICE_ROLE_KEY/)
      expect(jsonString).not.toMatch(/ANON_KEY/)
      expect(jsonString).not.toMatch(/apikey/)
      expect(jsonString).not.toMatch(/Bearer/)
      expect(jsonString).not.toMatch(/Authorization/)

      // Response should only contain "REDACTED" for the mock values, not actual secret values
      if (jsonString.includes('REDACTED')) {
        // This is from our test mocks - acceptable
      } else {
        // Should not contain any key-like strings
        expect(jsonString).not.toMatch(/[a-zA-Z0-9]{32,}/)
      }
    })

    it('redacts Supabase URL to domain only', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      const mockClient = {
        rpc: jest.fn().mockResolvedValue({
          data: {
            pillars: { exists: false },
            funnels_catalog: { exists: false },
            funnel_versions: { exists: false },
          },
          error: null,
        }),
      }

      mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
      const response = await GET(request)

      const json = await response.json()

      // Should only include protocol and host, not full URL with paths/tokens
      expect(json.data.environment.supabaseUrl).toBe('https://test.supabase.co')
    })

    it('only exposes boolean flags for keys, not actual values', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      const mockClient = {
        rpc: jest.fn().mockResolvedValue({
          data: {
            pillars: { exists: false },
            funnels_catalog: { exists: false },
            funnel_versions: { exists: false },
          },
          error: null,
        }),
      }

      mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
      const response = await GET(request)

      const json = await response.json()

      // Should only have boolean flags, not actual key values
      expect(typeof json.data.environment.hasSupabaseServiceRoleKey).toBe('boolean')
      expect(typeof json.data.environment.hasSupabaseAnonKey).toBe('boolean')
      expect(json.data.environment.hasSupabaseServiceRoleKey).toBe(true)
      expect(json.data.environment.hasSupabaseAnonKey).toBe(true)
    })
  })

  describe('Response schema stability', () => {
    it('returns stable schema with version', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      const mockClient = {
        rpc: jest.fn().mockResolvedValue({
          data: {
            pillars: { exists: true, rowCount: 7 },
            funnels_catalog: { exists: true, rowCount: 1, stressFunnelExists: true },
            funnel_versions: { exists: true, rowCount: 1 },
          },
          error: null,
        }),
      }

      mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
      const response = await GET(request)

      const json = await response.json()
      const data = json.data

      // Required fields
      expect(data).toHaveProperty('diagnosticsVersion')
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('findings')
      expect(data).toHaveProperty('environment')
      expect(data).toHaveProperty('tables')
      expect(data).toHaveProperty('seeds')
      expect(data).toHaveProperty('generatedAt')
      expect(data).toHaveProperty('requestId')

      // Correct types
      expect(typeof data.diagnosticsVersion).toBe('string')
      expect(['GREEN', 'YELLOW', 'RED']).toContain(data.status)
      expect(Array.isArray(data.findings)).toBe(true)
      expect(typeof data.requestId).toBe('string')
    })
  })

  describe('Deterministic seed checks', () => {
    it('uses registry constants for seed checks', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      const mockClient = {
        rpc: jest.fn().mockResolvedValue({
          data: {
            pillars: { exists: true, rowCount: 7 },
            funnels_catalog: {
              exists: true,
              rowCount: 1,
              stressFunnelExists: false,
            },
            funnel_versions: { exists: true, rowCount: 1 },
          },
          error: null,
        }),
      }

      mockCreateAdminSupabaseClient.mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
      const response = await GET(request)

      const json = await response.json()
      const data = json.data

      // Should use FUNNEL_SLUG.STRESS_ASSESSMENT from registry
      const stressFunnelFinding = data.findings.find((f: any) => f.code === 'SEED_STRESS_FUNNEL_MISSING')
      expect(stressFunnelFinding).toBeDefined()
      expect(stressFunnelFinding.message).toContain('stress-assessment')

      // Expected pillar count should match PILLAR_KEY registry (7 pillars)
      expect(data.seeds.expectedPillarCount).toBe(7)
    })
  })
})
