/**
 * Tests for TV05_01B: Pillars SOT Audit Endpoint
 * Verify auth gating, PHI-free response, and data structure
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
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NODE_ENV: 'test',
  },
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

// Mock Supabase client with proper chaining
const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
  }

  // Setup chaining - each method returns the mock object
  mockClient.from.mockReturnValue(mockClient)
  mockClient.select.mockReturnValue(mockClient)
  mockClient.eq.mockReturnValue(mockClient)

  return mockClient
}

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

  it('returns audit data for admin user with valid structure', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)

    // Create a proper chainable mock that resolves at the end
    const createChainableMock = () => {
      const chain: any = {
        from: jest.fn(),
        select: jest.fn(),
        eq: jest.fn(),
        maybeSingle: jest.fn(),
        // Make it thenable so awaiting works
        then: jest.fn(),
      }

      // All chaining methods return the chain
      chain.from.mockImplementation(() => chain)
      chain.select.mockImplementation(() => chain)
      chain.eq.mockImplementation(() => chain)
      
      // maybeSingle resolves the chain
      chain.maybeSingle.mockImplementation(() => {
        // Return a promise-like object
        return Promise.resolve({
          data: { id: 'stress-123', table_type: 'BASE TABLE' },
          error: null,
          count: 7,
        })
      })

      // When awaited directly (without maybeSingle), resolve with count
      chain.then.mockImplementation((resolve: any) => {
        resolve({ error: null, count: 7, data: null })
        return Promise.resolve({ error: null, count: 7, data: null })
      })

      return chain
    }

    mockCreateAdminSupabaseClient.mockImplementation(() => createChainableMock() as any)

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()

    const data = json.data

    // Verify environment data structure
    expect(data.environment).toMatchObject({
      supabaseUrl: 'https://test.supabase.co',
      envName: 'test',
      hasSupabaseServiceRoleKey: true,
      hasSupabaseAnonKey: true,
    })

    // Verify tables data structure exists
    expect(data.tables).toHaveProperty('pillars')
    expect(data.tables).toHaveProperty('funnels_catalog')
    expect(data.tables).toHaveProperty('funnel_versions')

    // All tables should exist with this mock
    expect(data.tables.pillars.metadata.exists).toBe(true)
    expect(data.tables.funnels_catalog.metadata.exists).toBe(true)
    expect(data.tables.funnel_versions.metadata.exists).toBe(true)

    // Verify seeds data structure
    expect(data.seeds).toHaveProperty('stressFunnelPresent')
    expect(data.seeds).toHaveProperty('pillarCount')
    expect(data.seeds).toHaveProperty('expectedPillarCount')
    expect(data.seeds.expectedPillarCount).toBe(7)

    // Verify generatedAt timestamp
    expect(data.generatedAt).toBeDefined()
    expect(new Date(data.generatedAt).getTime()).toBeGreaterThan(0)
  })

  it('handles missing tables gracefully', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)

    // Create mock for non-existent tables
    const createErrorChain = () => {
      const chain: any = {
        from: jest.fn(),
        select: jest.fn(),
        eq: jest.fn(),
        maybeSingle: jest.fn(),
      }
      chain.from.mockReturnValue(chain)
      chain.select.mockResolvedValue({
        error: { code: '42P01', message: 'relation does not exist' },
        count: null,
      })
      return chain
    }

    mockCreateAdminSupabaseClient.mockImplementation(() => createErrorChain() as any)

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)

    const data = json.data

    // All tables should be marked as not existing
    expect(data.tables.pillars.metadata.exists).toBe(false)
    expect(data.tables.funnels_catalog.metadata.exists).toBe(false)
    expect(data.tables.funnel_versions.metadata.exists).toBe(false)

    // Row counts should be undefined for non-existent tables
    expect(data.tables.pillars.rowCount).toBeUndefined()
    expect(data.tables.funnels_catalog.rowCount).toBeUndefined()
    expect(data.tables.funnel_versions.rowCount).toBeUndefined()

    // Seeds should reflect missing data
    expect(data.seeds.stressFunnelPresent).toBe(false)
    expect(data.seeds.pillarCount).toBe(0)
  })

  it('works for clinician user', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'clinician-123',
      app_metadata: { role: 'clinician' },
    } as any)
    mockHasAdminOrClinicianRole.mockResolvedValue(true)

    const createSimpleChain = (count: number) => {
      const chain: any = {
        from: jest.fn(),
        select: jest.fn(),
        eq: jest.fn(),
        maybeSingle: jest.fn(),
      }
      chain.from.mockReturnValue(chain)
      chain.select.mockReturnValue(chain)
      chain.eq.mockReturnValue(chain)
      chain.select.mockResolvedValue({ error: null, count })
      chain.maybeSingle.mockResolvedValue({
        data: { table_type: 'BASE TABLE' },
        error: null,
      })
      return chain
    }

    let callIndex = 0
    const mockClients = [
      createSimpleChain(7), // pillars check
      createSimpleChain(0), // pillars info schema
      createSimpleChain(1), // pillars policies
      createSimpleChain(1), // catalog check
      createSimpleChain(0), // catalog info schema
      createSimpleChain(1), // catalog policies
      createSimpleChain(1), // versions check
      createSimpleChain(0), // versions info schema
      createSimpleChain(0), // versions policies
      createSimpleChain(7), // pillars row count
      createSimpleChain(1), // catalog row count
      createSimpleChain(1), // versions row count
      createSimpleChain(1), // stress funnel
    ]

    mockCreateAdminSupabaseClient.mockImplementation(() => {
      const client = mockClients[callIndex] || createSimpleChain(0)
      callIndex++
      return client as any
    })

    const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect((await response.json()).success).toBe(true)
  })

  describe('PHI compliance', () => {
    it('does not include PHI in response', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      const createSimpleChain = (count: number) => {
        const chain: any = { from: jest.fn(), select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() }
        chain.from.mockReturnValue(chain)
        chain.select.mockReturnValue(chain)
        chain.eq.mockReturnValue(chain)
        chain.select.mockResolvedValue({ error: null, count })
        chain.maybeSingle.mockResolvedValue({ data: { table_type: 'BASE TABLE', id: 'test' }, error: null })
        return chain
      }

      mockCreateAdminSupabaseClient.mockImplementation(() => createSimpleChain(1) as any)

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

      // Should not include full service role key
      expect(jsonString).not.toMatch(/test-service-role-key/)
      expect(jsonString).not.toMatch(/test-anon-key/)
    })

    it('redacts Supabase URL to domain only', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      const createSimpleChain = () => {
        const chain: any = { from: jest.fn(), select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() }
        chain.from.mockReturnValue(chain)
        chain.select.mockResolvedValue({ error: null, count: 0 })
        chain.maybeSingle.mockResolvedValue({ data: null, error: null })
        return chain
      }

      mockCreateAdminSupabaseClient.mockImplementation(() => createSimpleChain() as any)

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

      const createSimpleChain = () => {
        const chain: any = { from: jest.fn(), select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() }
        chain.from.mockReturnValue(chain)
        chain.select.mockResolvedValue({ error: null, count: 0 })
        chain.maybeSingle.mockResolvedValue({ data: null, error: null })
        return chain
      }

      mockCreateAdminSupabaseClient.mockImplementation(() => createSimpleChain() as any)

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

  describe('Response structure', () => {
    it('returns machine-readable JSON with stable schema', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        app_metadata: { role: 'admin' },
      } as any)
      mockHasAdminOrClinicianRole.mockResolvedValue(true)

      const createSimpleChain = () => {
        const chain: any = { from: jest.fn(), select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() }
        chain.from.mockReturnValue(chain)
        chain.select.mockResolvedValue({ error: null, count: 1 })
        chain.maybeSingle.mockResolvedValue({ data: { table_type: 'BASE TABLE', id: 'test' }, error: null })
        return chain
      }

      mockCreateAdminSupabaseClient.mockImplementation(() => createSimpleChain() as any)

      const request = new NextRequest('http://localhost/api/admin/diagnostics/pillars-sot')
      const response = await GET(request)

      const json = await response.json()

      // Verify top-level structure
      expect(json).toHaveProperty('success')
      expect(json).toHaveProperty('data')

      const data = json.data

      // Verify all required sections
      expect(data).toHaveProperty('environment')
      expect(data).toHaveProperty('tables')
      expect(data).toHaveProperty('seeds')
      expect(data).toHaveProperty('generatedAt')

      // Verify environment structure
      expect(data.environment).toHaveProperty('supabaseUrl')
      expect(data.environment).toHaveProperty('envName')
      expect(data.environment).toHaveProperty('hasSupabaseServiceRoleKey')
      expect(data.environment).toHaveProperty('hasSupabaseAnonKey')

      // Verify tables structure
      expect(data.tables).toHaveProperty('pillars')
      expect(data.tables).toHaveProperty('funnels_catalog')
      expect(data.tables).toHaveProperty('funnel_versions')

      // Verify each table has metadata and optionally rowCount
      for (const tableName of ['pillars', 'funnels_catalog', 'funnel_versions']) {
        expect(data.tables[tableName]).toHaveProperty('metadata')
        expect(data.tables[tableName].metadata).toHaveProperty('exists')
      }

      // Verify seeds structure
      expect(data.seeds).toHaveProperty('stressFunnelPresent')
      expect(data.seeds).toHaveProperty('pillarCount')
      expect(data.seeds).toHaveProperty('expectedPillarCount')
    })
  })
})
