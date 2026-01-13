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
  in: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  or: jest.Mock
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
  builder.in = jest.fn(() => builder)
  builder.order = jest.fn(() => builder)
  builder.limit = jest.fn(() => builder)
  builder.or = jest.fn(() => builder)

  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)
  builder.catch = (onRejected) => Promise.resolve(result).catch(onRejected)
  builder.finally = (onFinally) => Promise.resolve(result).finally(onFinally)

  return builder
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

type EnvOverrides = Partial<{
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  adminServiceKey: string
}>

async function importRouteWithEnv(overrides: EnvOverrides) {
  jest.resetModules()

  const serviceRoleKeyEnvName = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_')

  const envMock = {
    NEXT_PUBLIC_SUPABASE_URL: overrides.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: overrides.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon',
    [serviceRoleKeyEnvName]: overrides.adminServiceKey ?? '',
  }

  jest.doMock('@/lib/env', () => ({ env: envMock }))

  const mod = await import('../route')
  return mod as { GET: (request: Request) => Promise<Response> }
}

function getMocks() {
  const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock }
  const { createServerSupabaseClient } = jest.requireMock('@/lib/db/supabase.server') as {
    createServerSupabaseClient: jest.Mock
  }

  return {
    cookies,
    createServerSupabaseClient,
  }
}

function setupCookieStore() {
  const { cookies } = getMocks()
  cookies.mockResolvedValue({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })
}

describe('GET /api/funnels/catalog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 on success (with x-request-id)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
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
          pillar_id: 'p1',
          description: null,
          est_duration_min: 10,
          outcomes: [],
          is_active: true,
          default_version_id: null,
          updated_at: null,
          created_at: '2026-01-13T14:24:29Z',
        },
      ],
      error: null,
    })

    const versionsBuilder = makeThenableBuilder({ data: null, error: null })

    // V05-FIXOPT-01: Mock for checking defined funnels (availability)
    const definedFunnelsBuilder = makeThenableBuilder({
      data: [{ slug: 'a' }],
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        if (table === 'funnel_versions') return versionsBuilder
        if (table === 'funnels') return definedFunnelsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBeTruthy()

    const json = (await res.json()) as unknown as { success: boolean }
    expect(json.success).toBe(true)
  })

  it('returns 401 when unauthenticated (with x-request-id)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
    })

    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: jest.fn(),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(401)
    const headerRequestId = res.headers.get('x-request-id')
    expect(headerRequestId).toBeTruthy()

    const json = (await res.json()) as unknown as { success: boolean; requestId?: string }
    expect(json.success).toBe(false)
    expect(json.requestId).toBe(headerRequestId)
  })

  it('returns 503 SCHEMA_NOT_READY when pillars relation is missing', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42P01', message: 'relation "pillars" does not exist' },
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        throw new Error(`should not query table after pillars error: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(503)
    const json = (await res.json()) as unknown as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('SCHEMA_NOT_READY')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('returns 403 FORBIDDEN when pillars are not accessible (RLS/permission denied)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42501', message: 'permission denied for relation pillars' },
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        throw new Error(`should not query table after pillars error: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(403)
    const json = (await res.json()) as unknown as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('degrades gracefully when versions query fails transiently (default_version null)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
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
          pillar_id: 'p1',
          description: null,
          est_duration_min: 10,
          outcomes: [],
          is_active: true,
          default_version_id: 'v-default',
          updated_at: null,
          created_at: '2026-01-13T14:24:29Z',
        },
      ],
      error: null,
    })

    const versionsBuilder = makeThenableBuilder({
      data: null,
      error: { message: 'timeout' },
    })

    // V05-FIXOPT-01: Mock for checking defined funnels (availability)
    const definedFunnelsBuilder = makeThenableBuilder({
      data: [{ slug: 'a' }],
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        if (table === 'funnel_versions') return versionsBuilder
        if (table === 'funnels') return definedFunnelsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(200)
    const json = (await res.json()) as unknown as {
      data: { pillars: Array<{ funnels: Array<{ default_version: string | null }> }> }
    }

    const funnel = json.data.pillars[0].funnels[0]
    expect(funnel.default_version).toBeNull()
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('does not query funnel_versions when there are zero funnels (avoid .in([]))', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({ data: [], error: null })
    const funnelsBuilder = makeThenableBuilder({ data: [], error: null })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        if (table === 'funnel_versions') throw new Error('should not query funnel_versions')
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(200)
    const json = (await res.json()) as unknown as {
      success: boolean
      data: { pillars: unknown[]; uncategorized_funnels: unknown[] }
    }
    expect(json.success).toBe(true)
    expect(json.data.pillars).toEqual([])
    expect(json.data.uncategorized_funnels).toEqual([])
    expect(mockClient.from).toHaveBeenCalledWith('pillars')
    expect(mockClient.from).toHaveBeenCalledWith('funnels_catalog')
    expect(mockClient.from).not.toHaveBeenCalledWith('funnel_versions')
  })

  it('returns 503 SCHEMA_NOT_READY when schema is missing', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({ data: [], error: null })
    const funnelsBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42P01', message: 'relation "funnels_catalog" does not exist' },
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(503)
    const json = (await res.json()) as unknown as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('SCHEMA_NOT_READY')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('returns 500 CONFIGURATION_ERROR when env is blank', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      adminServiceKey: '',
    })

    const { cookies, createServerSupabaseClient } = getMocks()

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(500)
    const json = (await res.json()) as unknown as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('CONFIGURATION_ERROR')
    expect(res.headers.get('x-request-id')).toBeTruthy()

    expect(cookies).not.toHaveBeenCalled()
    expect(createServerSupabaseClient).not.toHaveBeenCalled()
  })

  it('returns 403 FORBIDDEN when funnels_catalog is not accessible (RLS/permission denied)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({ data: [], error: null })
    const funnelsBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42501', message: 'permission denied for relation funnels_catalog' },
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        if (table === 'funnels_catalog') return funnelsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(403)
    const json = (await res.json()) as unknown as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })


  it('returns 500 with requestId in body when pillars query fails (non-RLS, non-schema)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      adminServiceKey: '',
    })

    setupCookieStore()

    const pillarsBuilder = makeThenableBuilder({
      data: null,
      error: {
        code: 'XX000',
        message: 'boom',
        details: 'full details',
        hint: 'try again',
      },
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'pillars') return pillarsBuilder
        throw new Error(`should not query table after pillars error: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/catalog'))

    expect(res.status).toBe(500)
    const headerRequestId = res.headers.get('x-request-id')
    expect(headerRequestId).toBeTruthy()

    const json = (await res.json()) as unknown as { success: boolean; requestId?: string }
    expect(json.success).toBe(false)
    expect(json.requestId).toBe(headerRequestId)
  })

  // E6.2.7: Caching and Pagination Tests
  describe('E6.2.7: Caching Headers', () => {
    it('returns Cache-Control, ETag, and Last-Modified headers', async () => {
      const { GET } = await importRouteWithEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        adminServiceKey: '',
      })

      setupCookieStore()

      const pillarsBuilder = makeThenableBuilder({
        data: [{ id: 'p1', key: 'test', title: 'Test', description: null, sort_order: 1 }],
        error: null,
      })

      const funnelsBuilder = makeThenableBuilder({
        data: [
          {
            id: 'f1',
            slug: 'test-funnel',
            title: 'Test Funnel',
            pillar_id: 'p1',
            description: null,
            est_duration_min: 10,
            outcomes: [],
            is_active: true,
            default_version_id: null,
            updated_at: '2026-01-13T14:24:29Z',
          },
        ],
        error: null,
      })

      const versionsBuilder = makeThenableBuilder({ data: null, error: null })
      const definedFunnelsBuilder = makeThenableBuilder({ data: [{ slug: 'test-funnel' }], error: null })

      const mockClient: MockSupabaseClient = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        from: jest.fn((table: string) => {
          if (table === 'pillars') return pillarsBuilder
          if (table === 'funnels_catalog') return funnelsBuilder
          if (table === 'funnel_versions') return versionsBuilder
          if (table === 'funnels') return definedFunnelsBuilder
          throw new Error(`unexpected table: ${table}`)
        }),
      }

      const { createServerSupabaseClient } = getMocks()
      createServerSupabaseClient.mockResolvedValue(mockClient)

      const res = await GET(new Request('http://localhost/api/funnels/catalog'))

      expect(res.status).toBe(200)
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300, must-revalidate')
      expect(res.headers.get('ETag')).toMatch(/^"funnels:v\d+:/)
      expect(res.headers.get('Last-Modified')).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/)
    })

    it('returns 304 Not Modified when If-None-Match matches ETag', async () => {
      const { GET } = await importRouteWithEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        adminServiceKey: '',
      })

      setupCookieStore()

      const timestamp = '2026-01-13T14:24:29Z'
      const pillarsBuilder = makeThenableBuilder({
        data: [{ id: 'p1', key: 'test', title: 'Test', description: null, sort_order: 1 }],
        error: null,
      })

      const funnelsBuilder = makeThenableBuilder({
        data: [
          {
            id: 'f1',
            slug: 'test',
            title: 'Test',
            pillar_id: 'p1',
            description: null,
            est_duration_min: 10,
            outcomes: [],
            is_active: true,
            default_version_id: null,
            updated_at: timestamp,
          },
        ],
        error: null,
      })

      const versionsBuilder = makeThenableBuilder({ data: null, error: null })
      const definedFunnelsBuilder = makeThenableBuilder({ data: [{ slug: 'test' }], error: null })

      const mockClient: MockSupabaseClient = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        from: jest.fn((table: string) => {
          if (table === 'pillars') return pillarsBuilder
          if (table === 'funnels_catalog') return funnelsBuilder
          if (table === 'funnel_versions') return versionsBuilder
          if (table === 'funnels') return definedFunnelsBuilder
          throw new Error(`unexpected table: ${table}`)
        }),
      }

      const { createServerSupabaseClient } = getMocks()
      createServerSupabaseClient.mockResolvedValue(mockClient)

      // First request to get ETag
      const res1 = await GET(new Request('http://localhost/api/funnels/catalog'))
      const etag = res1.headers.get('ETag')

      // Second request with If-None-Match
      const res2 = await GET(
        new Request('http://localhost/api/funnels/catalog', {
          headers: { 'If-None-Match': etag || '' },
        })
      )

      expect(res2.status).toBe(304)
      expect(res2.headers.get('ETag')).toBe(etag)
    })
  })

  describe('E6.2.7: Pagination', () => {
    it('returns pagination metadata with limit and hasMore', async () => {
      const { GET } = await importRouteWithEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        adminServiceKey: '',
      })

      setupCookieStore()

      const pillarsBuilder = makeThenableBuilder({
        data: [{ id: 'p1', key: 'test', title: 'Test', description: null, sort_order: 1 }],
        error: null,
      })

      // Return limit + 1 funnels to test hasMore
      const funnelsBuilder = makeThenableBuilder({
        data: [
          {
            id: 'f1',
            slug: 'funnel-1',
            title: 'Funnel 1',
            pillar_id: 'p1',
            description: null,
            est_duration_min: 10,
            outcomes: [],
            is_active: true,
            default_version_id: null,
            updated_at: '2026-01-13T14:24:29Z',
          },
          {
            id: 'f2',
            slug: 'funnel-2',
            title: 'Funnel 2',
            pillar_id: 'p1',
            description: null,
            est_duration_min: 10,
            outcomes: [],
            is_active: true,
            default_version_id: null,
            updated_at: '2026-01-13T14:24:29Z',
          },
          {
            id: 'f3',
            slug: 'funnel-3',
            title: 'Funnel 3',
            pillar_id: 'p1',
            description: null,
            est_duration_min: 10,
            outcomes: [],
            is_active: true,
            default_version_id: null,
            updated_at: '2026-01-13T14:24:29Z',
          },
        ],
        error: null,
      })

      const versionsBuilder = makeThenableBuilder({ data: null, error: null })
      const definedFunnelsBuilder = makeThenableBuilder({
        data: [{ slug: 'funnel-1' }, { slug: 'funnel-2' }, { slug: 'funnel-3' }],
        error: null,
      })

      const mockClient: MockSupabaseClient = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        from: jest.fn((table: string) => {
          if (table === 'pillars') return pillarsBuilder
          if (table === 'funnels_catalog') return funnelsBuilder
          if (table === 'funnel_versions') return versionsBuilder
          if (table === 'funnels') return definedFunnelsBuilder
          throw new Error(`unexpected table: ${table}`)
        }),
      }

      const { createServerSupabaseClient } = getMocks()
      createServerSupabaseClient.mockResolvedValue(mockClient)

      const res = await GET(new Request('http://localhost/api/funnels/catalog?limit=2'))

      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        success: boolean
        data: { pagination?: { limit: number; hasMore: boolean; nextCursor: string | null } }
      }
      expect(json.success).toBe(true)
      expect(json.data.pagination).toBeDefined()
      expect(json.data.pagination?.limit).toBe(2)
      expect(json.data.pagination?.hasMore).toBe(true)
      expect(json.data.pagination?.nextCursor).toBeTruthy()
    })

    it('returns 400 for invalid cursor', async () => {
      const { GET } = await importRouteWithEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        adminServiceKey: '',
      })

      setupCookieStore()

      const mockClient: MockSupabaseClient = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        from: jest.fn(),
      }

      const { createServerSupabaseClient } = getMocks()
      createServerSupabaseClient.mockResolvedValue(mockClient)

      const res = await GET(new Request('http://localhost/api/funnels/catalog?cursor=invalid!!!cursor'))

      expect(res.status).toBe(400)
      const json = (await res.json()) as { success: boolean; error?: { code: string } }
      expect(json.success).toBe(false)
      expect(json.error?.code).toBe('INVALID_INPUT')
    })

    it('enforces minimum and maximum limits', async () => {
      const { GET } = await importRouteWithEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        adminServiceKey: '',
      })

      setupCookieStore()

      const pillarsBuilder = makeThenableBuilder({ data: [], error: null })
      const funnelsBuilder = makeThenableBuilder({ data: [], error: null })
      const versionsBuilder = makeThenableBuilder({ data: null, error: null })
      const definedFunnelsBuilder = makeThenableBuilder({ data: [], error: null })

      const mockClient: MockSupabaseClient = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        from: jest.fn((table: string) => {
          if (table === 'pillars') return pillarsBuilder
          if (table === 'funnels_catalog') return funnelsBuilder
          if (table === 'funnel_versions') return versionsBuilder
          if (table === 'funnels') return definedFunnelsBuilder
          throw new Error(`unexpected table: ${table}`)
        }),
      }

      const { createServerSupabaseClient } = getMocks()
      createServerSupabaseClient.mockResolvedValue(mockClient)

      // Test maximum limit (should cap at 100)
      const res1 = await GET(new Request('http://localhost/api/funnels/catalog?limit=200'))
      expect(res1.status).toBe(200)
      const json1 = (await res1.json()) as { data: { pagination?: { limit: number } } }
      expect(json1.data.pagination?.limit).toBe(100)

      // Test minimum limit (should default to 1)
      const res2 = await GET(new Request('http://localhost/api/funnels/catalog?limit=0'))
      expect(res2.status).toBe(200)
      const json2 = (await res2.json()) as { data: { pagination?: { limit: number } } }
      expect(json2.data.pagination?.limit).toBe(1)
    })
  })
})
