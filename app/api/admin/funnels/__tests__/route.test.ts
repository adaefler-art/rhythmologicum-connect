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
  in: jest.Mock
  order: jest.Mock
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
  builder.in = jest.fn(() => builder)
  builder.order = jest.fn(() => builder)

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
  SUPABASE_SERVICE_ROLE_KEY: string
}>

async function importRouteWithEnv(overrides: EnvOverrides) {
  jest.resetModules()

  const envMock = {
    NEXT_PUBLIC_SUPABASE_URL: overrides.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: overrides.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon',
    SUPABASE_SERVICE_ROLE_KEY: overrides.SUPABASE_SERVICE_ROLE_KEY ?? '',
  }

  jest.doMock('@/lib/env', () => ({ env: envMock }))

  const mod = await import('../route')
  return mod as { GET: (request: Request) => Promise<Response> }
}

function getMocks() {
  const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock }
  const { createServerClient } = jest.requireMock('@supabase/ssr') as {
    createServerClient: jest.Mock
  }
  const { createClient } = jest.requireMock('@supabase/supabase-js') as { createClient: jest.Mock }

  return { cookies, createServerClient, createClient }
}

function setupCookieStore() {
  const { cookies } = getMocks()
  cookies.mockResolvedValue({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })
}

describe('GET /api/admin/funnels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('happy path => 200 (canonical shape)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({
      data: [
        {
          id: 'p1',
          key: 'movement',
          title: 'Movement',
          description: null,
          sort_order: 1,
        },
      ],
      error: null,
    })

    const funnelsBuilder = makeThenableBuilder({
      data: [
        {
          id: 'f1',
          slug: 'a',
          title: 'A',
          description: null,
          pillar_id: 'p1',
          est_duration_min: 10,
          outcomes: [],
          is_active: true,
          default_version_id: 'v1',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    })

    const versionsBuilder = makeThenableBuilder({
      data: [
        {
          id: 'v1',
          version: 'v1',
          funnel_id: 'f1',
        },
      ],
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        if (table === 'funnel_versions') return versionsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/admin/funnels'))

    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBeTruthy()

    const json = (await res.json()) as unknown as {
      success: boolean
      data: {
        pillars: Array<{ pillar: { id: string }; funnels: Array<{ default_version: string | null }> }>
        uncategorized_funnels: unknown[]
      }
    }

    expect(json.success).toBe(true)
    expect(json.data.pillars).toHaveLength(1)
    expect(json.data.pillars[0].funnels).toHaveLength(1)
    expect(json.data.pillars[0].funnels[0].default_version).toBe('v1')
  })

  it('funnels_catalog permission denied => 403 FORBIDDEN + x-request-id echoed', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({ data: [], error: null })
    const funnelsBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42501', message: 'permission denied for relation funnels_catalog' },
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(
      new Request('http://localhost/api/admin/funnels', {
        headers: { 'x-request-id': 'rid-403' },
      }),
    )

    expect(res.status).toBe(500)
    expect(res.headers.get('x-request-id')).toBe('rid-403')

    const json = (await res.json()) as unknown as {
      success: boolean
      error: { code: string; message: string; requestId: string }
    }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INTERNAL_ERROR')
    expect(json.error.requestId).toBe('rid-403')
  })

  it('missing relation 42P01 => 500 INTERNAL_ERROR (requestId in body)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({ data: [], error: null })
    const funnelsBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42P01', message: 'relation "funnels_catalog" does not exist' },
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(
      new Request('http://localhost/api/admin/funnels', {
        headers: { 'x-request-id': 'rid-503' },
      }),
    )

    expect(res.status).toBe(500)
    expect(res.headers.get('x-request-id')).toBe('rid-503')

    const json = (await res.json()) as unknown as {
      success: boolean
      error: { code: string; requestId: string }
    }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INTERNAL_ERROR')
    expect(json.error.requestId).toBe('rid-503')
  })

  it('blank env => 500 INTERNAL_ERROR (no client construction)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    const { createServerClient } = getMocks()

    const res = await GET(new Request('http://localhost/api/admin/funnels'))

    expect(res.status).toBe(500)
    expect(res.headers.get('x-request-id')).toBeTruthy()
    expect(createServerClient).not.toHaveBeenCalled()

    const json = (await res.json()) as unknown as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INTERNAL_ERROR')
  })

  it('no funnels => does not query funnel_versions (avoid .in([]))', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({ data: [], error: null })
    const funnelsBuilder = makeThenableBuilder({ data: [], error: null })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        if (table === 'funnel_versions') throw new Error('should not query funnel_versions')
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/admin/funnels'))
    expect(res.status).toBe(200)

    expect(mockClient.from).toHaveBeenCalledWith('pillars')
    expect(mockClient.from).toHaveBeenCalledWith('funnels_catalog')
    expect(mockClient.from).not.toHaveBeenCalledWith('funnel_versions')
  })

  it('schema cache missing relation (PGRST205) => 500 INTERNAL_ERROR (requestId in body)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({
      data: null,
      error: { code: 'PGRST205', message: "Could not find the 'pillars' table in the schema cache" },
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        throw new Error(`should not query table after pillars error: ${table}`)
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/admin/funnels', { headers: { 'x-request-id': 'rid-pgrst205' } }))

    expect(res.status).toBe(500)
    const json = (await res.json()) as unknown as { success: boolean; error: { code: string; requestId: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INTERNAL_ERROR')
    expect(json.error.requestId).toBe('rid-pgrst205')
    expect(res.headers.get('x-request-id')).toBe('rid-pgrst205')
  })

  it('no authenticated user => 401 UNAUTHORIZED', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: jest.fn(() => {
        throw new Error('should not query database when not authenticated')
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/admin/funnels', { headers: { 'x-request-id': 'rid-401' } }))

    expect(res.status).toBe(401)
    expect(res.headers.get('x-request-id')).toBe('rid-401')

    const json = (await res.json()) as unknown as {
      success: boolean
      error: { code: string; requestId: string }
    }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
    expect(json.error.requestId).toBe('rid-401')
  })

  it('authenticated but not clinician/admin => 403 FORBIDDEN (requestId in body)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'patient' } } } }),
      },
      from: jest.fn(() => {
        throw new Error('should not query database when forbidden')
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/admin/funnels', { headers: { 'x-request-id': 'rid-forbidden' } }))

    expect(res.status).toBe(403)
    expect(res.headers.get('x-request-id')).toBe('rid-forbidden')

    const json = (await res.json()) as unknown as {
      success: boolean
      error: { code: string; requestId: string }
    }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
    expect(json.error.requestId).toBe('rid-forbidden')
  })

  it('pillars db error => 500 INTERNAL_ERROR includes deterministic requestId in body', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({
      data: null,
      error: { code: 'XX000', message: 'boom', details: 'full details', hint: 'try again' },
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        throw new Error(`should not query table after pillars error: ${table}`)
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/admin/funnels', { headers: { 'x-request-id': 'rid-500' } }))

    expect(res.status).toBe(500)
    expect(res.headers.get('x-request-id')).toBe('rid-500')

    const json = (await res.json()) as unknown as {
      success: boolean
      error: { code: string; message: string; requestId: string }
    }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INTERNAL_ERROR')
    expect(json.error.requestId).toBe('rid-500')
  })
})
