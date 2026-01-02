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
  or: jest.Mock
  in: jest.Mock
  order: jest.Mock
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
  builder.or = jest.fn(() => builder)
  builder.in = jest.fn(() => builder)
  builder.order = jest.fn(() => builder)
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
  jest.doMock('@/lib/db/supabase.admin', () => ({ createAdminSupabaseClient: jest.fn() }))

  const mod = await import('../route')
  return mod as { GET: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> }
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

describe('GET /api/admin/funnels/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches funnel by slug from catalog with versions', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
    })

    setupCookieStore()

    // Mock catalog funnel response
    const funnelBuilder = makeThenableBuilder({
      data: {
        id: 'f1',
        slug: 'stress-assessment',
        title: 'Stress Assessment',
        description: 'Test description',
        pillar_id: 'p1',
        est_duration_min: 10,
        outcomes: ['outcome1', 'outcome2'],
        is_active: true,
        default_version_id: 'v1',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })

    // Mock pillar response
    const pillarBuilder = makeThenableBuilder({
      data: {
        id: 'p1',
        key: 'mental-health',
        title: 'Mental Health',
        description: 'Mental health pillar',
      },
      error: null,
    })

    // Mock versions response
    const versionsBuilder = makeThenableBuilder({
      data: [
        {
          id: 'v1',
          funnel_id: 'f1',
          version: '1.0.0',
          is_default: true,
          rollout_percent: 100,
          questionnaire_config: { steps: [] },
          content_manifest: { pages: [] },
          algorithm_bundle_version: '1.0',
          prompt_version: '1.0',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: null,
        },
      ],
      error: null,
    })

    const authClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelBuilder
        if (table === 'pillars') return pillarBuilder
        if (table === 'funnel_versions') return versionsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(authClient)

    const res = await GET(
      new Request('http://localhost/api/admin/funnels/stress-assessment', {
        headers: { 'x-request-id': 'rid-detail-slug' },
      }),
      { params: Promise.resolve({ id: 'stress-assessment' }) },
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBe('rid-detail-slug')

    const json = (await res.json()) as unknown as {
      success: boolean
      data: { funnel: { id: string; slug: string; pillar: any }; versions: any[]; default_version: any; steps: any[] }
    }

    expect(json.success).toBe(true)
    expect(json.data.funnel.id).toBe('f1')
    expect(json.data.funnel.slug).toBe('stress-assessment')
    expect(json.data.funnel.pillar).toBeTruthy()
    expect(json.data.funnel.pillar.key).toBe('mental-health')
    expect(json.data.versions).toHaveLength(1)
    expect(json.data.default_version).toBeTruthy()
    expect(json.data.default_version.version).toBe('1.0.0')
    expect(Array.isArray(json.data.steps)).toBe(true)
  })

  it('funnel not found => 404', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
    })

    setupCookieStore()

    const funnelBuilder = makeThenableBuilder({
      data: null,
      error: { code: 'PGRST116', message: 'No rows returned' },
    })

    const authClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(authClient)

    const res = await GET(
      new Request('http://localhost/api/admin/funnels/nonexistent', {
        headers: { 'x-request-id': 'rid-404' },
      }),
      { params: Promise.resolve({ id: 'nonexistent' }) },
    )

    expect(res.status).toBe(404)
    expect(res.headers.get('x-request-id')).toBe('rid-404')

    const json = (await res.json()) as unknown as {
      success: boolean
      error: { code: string; message: string }
    }

    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
  })
})
