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

  it('admin client invalid API key => falls back to auth client (200)', async () => {
    const { GET } = await importRouteWithEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
    })

    setupCookieStore()

    // Admin client fails on first query
    const adminFunnelsBuilder = makeThenableBuilder({
      data: null,
      error: {
        message: 'Invalid API key',
        hint: 'Double check your Supabase `anon` or `service_role` API key.',
      },
    })

    const adminClient: Pick<MockSupabaseClient, 'from'> = {
      from: jest.fn((table: string) => {
        if (table === 'funnels') return adminFunnelsBuilder
        throw new Error(`admin should only be used for funnels in this test: ${table}`)
      }),
    }

    // Auth client succeeds
    const authFunnelsBuilder = makeThenableBuilder({
      data: {
        id: 'f1',
        slug: 'stress',
        title: 'Stress',
        subtitle: null,
        description: null,
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })

    const authStepsBuilder = makeThenableBuilder({
      data: [],
      error: null,
    })

    const authClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnels') return authFunnelsBuilder
        if (table === 'funnel_steps') return authStepsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerClient, createClient } = getMocks()
    createServerClient.mockReturnValue(authClient)
    createClient.mockReturnValue(adminClient)

    const { createAdminSupabaseClient } = jest.requireMock('@/lib/db/supabase.admin') as {
      createAdminSupabaseClient: jest.Mock
    }
    createAdminSupabaseClient.mockReturnValue(adminClient)

    const res = await GET(
      new Request('http://localhost/api/admin/funnels/f1', { headers: { 'x-request-id': 'rid-detail-fallback' } }),
      { params: Promise.resolve({ id: 'f1' }) },
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBe('rid-detail-fallback')

    const json = (await res.json()) as unknown as {
      success: boolean
      data: { funnel: { id: string }; steps: unknown[] }
    }

    expect(json.success).toBe(true)
    expect(json.data.funnel.id).toBe('f1')
    expect(Array.isArray(json.data.steps)).toBe(true)
  })
})
