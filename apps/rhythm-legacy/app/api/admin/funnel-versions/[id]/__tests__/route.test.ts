export {}

type SupabaseQueryResult<T> = { data: T | null; error: unknown }

type MockSupabaseClient = {
  auth: {
    getUser: jest.Mock
  }
  from: jest.Mock
}

type ThenableBuilder<T> = {
  select: jest.Mock
  eq: jest.Mock
  neq: jest.Mock
  update: jest.Mock
  single: jest.Mock
  then: (
    onFulfilled?: (value: SupabaseQueryResult<T>) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>
  catch: (onRejected?: (reason: unknown) => unknown) => Promise<unknown>
  finally: (onFinally?: () => void) => Promise<unknown>
}

function makeThenableBuilder<T>(result: SupabaseQueryResult<T>): ThenableBuilder<T> {
  const builder = {} as unknown as ThenableBuilder<T>

  builder.select = jest.fn(() => builder)
  builder.eq = jest.fn(() => builder)
  builder.neq = jest.fn(() => builder)
  builder.update = jest.fn(() => builder)
  builder.single = jest.fn(() => builder)

  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)
  builder.catch = (onRejected) => Promise.resolve(result).catch(onRejected)
  builder.finally = (onFinally) => Promise.resolve(result).finally(onFinally)

  return builder
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

type EnvOverrides = Partial<{
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}>

async function importRouteWithEnv(overrides: EnvOverrides) {
  jest.resetModules()

  const envMock = {
    NEXT_PUBLIC_SUPABASE_URL: overrides.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: overrides.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon',
    NODE_ENV: 'test',
  }

  jest.doMock('@/lib/env', () => ({ env: envMock }))
  jest.doMock('@/lib/db/supabase.admin', () => ({
    createAdminSupabaseClient: jest.fn(() => {
      throw new Error('Admin client not available in test')
    }),
  }))

  const mod = await import('../route')
  return mod as {
    PATCH: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>
  }
}

function getMocks() {
  const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock }
  const { createServerClient } = jest.requireMock('@supabase/ssr') as {
    createServerClient: jest.Mock
  }

  return { cookies, createServerClient }
}

function setupCookieStore() {
  const { cookies } = getMocks()
  cookies.mockResolvedValue({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })
}

describe('PATCH /api/admin/funnel-versions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject non-UUID version IDs', async () => {
    const { PATCH } = await importRouteWithEnv({})
    
    setupCookieStore()
    
    const request = new Request('http://localhost/api/admin/funnel-versions/not-a-uuid', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'not-a-uuid' }) })

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('VALIDATION_FAILED')
  })

  it('should reject unauthenticated requests', async () => {
    const { PATCH } = await importRouteWithEnv({})
    
    setupCookieStore()
    
    const { createServerClient } = getMocks()
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: jest.fn(),
    } as unknown as MockSupabaseClient

    createServerClient.mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/admin/funnel-versions/550e8400-e29b-41d4-a716-446655440000', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    })

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.success).toBe(false)
  })

  it('should reject non-admin/non-clinician users', async () => {
    const { PATCH } = await importRouteWithEnv({})
    
    setupCookieStore()
    
    const { createServerClient } = getMocks()
    const mockSupabase = {
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
      from: jest.fn(),
    } as unknown as MockSupabaseClient

    createServerClient.mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/admin/funnel-versions/550e8400-e29b-41d4-a716-446655440000', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    })

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.success).toBe(false)
  })

  it('should validate rollout_percent range', async () => {
    const { PATCH } = await importRouteWithEnv({})
    
    setupCookieStore()
    
    const { createServerClient } = getMocks()
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              app_metadata: { role: 'admin' },
            },
          },
          error: null,
        }),
      },
      from: jest.fn(),
    } as unknown as MockSupabaseClient

    createServerClient.mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/admin/funnel-versions/550e8400-e29b-41d4-a716-446655440000', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollout_percent: 150 }),
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    })

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error?.message).toContain('rollout_percent must be between 0 and 100')
  })

  it('should successfully update version settings', async () => {
    const { PATCH } = await importRouteWithEnv({})
    
    setupCookieStore()
    
    const versionId = '550e8400-e29b-41d4-a716-446655440000'
    const funnelId = '660e8400-e29b-41d4-a716-446655440000'

    const { createServerClient } = getMocks()
    
    let fromCallCount = 0
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              app_metadata: { role: 'admin' },
            },
          },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        fromCallCount++
        
        if (fromCallCount === 1 && table === 'funnel_versions') {
          // First call: fetch funnel_id
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { funnel_id: funnelId },
                  error: null,
                })),
              })),
            })),
          }
        }
        
        if (fromCallCount === 2 && table === 'funnel_versions') {
          // Second call: unset other defaults
          return {
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                neq: jest.fn(() => Promise.resolve({
                  data: null,
                  error: null,
                })),
              })),
            })),
          }
        }
        
        if (fromCallCount === 3 && table === 'funnels_catalog') {
          // Third call: update catalog default_version_id
          return {
            update: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({
                data: null,
                error: null,
              })),
            })),
          }
        }
        
        if (fromCallCount === 4 && table === 'funnel_versions') {
          // Fourth call: actual version update
          return {
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({
                    data: {
                      id: versionId,
                      funnel_id: funnelId,
                      is_default: true,
                      rollout_percent: 100,
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  })),
                })),
              })),
            })),
          }
        }
        
        return {
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        }
      }),
    } as unknown as MockSupabaseClient

    createServerClient.mockReturnValue(mockSupabase)

    const request = new Request(`http://localhost/api/admin/funnel-versions/${versionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true, rollout_percent: 100 }),
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: versionId }),
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data?.version).toBeDefined()
  })
})
