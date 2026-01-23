/**
 * Tests for GET /api/funnels/catalog/[slug]
 * 
 * V05-HYGIENE-B: Route-level tests for catalog detail endpoint
 */

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
  single: jest.Mock
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
  builder.eq = jest.fn(() => builder)
  builder.single = jest.fn(() => builder)
  builder.order = jest.fn(() => builder)

  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)
  builder.catch = (onRejected) => Promise.resolve(result).catch(onRejected)
  builder.finally = (onFinally) => Promise.resolve(result).finally(onFinally)

  return builder
}

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/contracts/registry', () => ({
  getCanonicalFunnelSlug: jest.fn((slug: string) => slug),
}))

function getMocks() {
  const { createServerSupabaseClient } = jest.requireMock('@/lib/db/supabase.server') as {
    createServerSupabaseClient: jest.Mock
  }
  return { createServerSupabaseClient }
}

describe('GET /api/funnels/catalog/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 on success with x-request-id', async () => {
    const { GET } = await import('../route')

    const funnelBuilder = makeThenableBuilder({
      data: {
        id: 'f1',
        slug: 'stress',
        title: 'Stress Assessment',
        description: 'Test',
        pillar_id: 'p1',
        est_duration_min: 10,
        outcomes: ['outcome1'],
        is_active: true,
        default_version_id: 'v1',
      },
      error: null,
    })

    const pillarBuilder = makeThenableBuilder({
      data: { key: 'mental', title: 'Mental Health' },
      error: null,
    })

    const versionsBuilder = makeThenableBuilder({
      data: [{ id: 'v1', funnel_id: 'f1', version: '1.0', is_default: true }],
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelBuilder
        if (table === 'pillars') return pillarBuilder
        if (table === 'funnel_versions') return versionsBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const params = Promise.resolve({ slug: 'stress' })
    const res = await GET(new Request('http://localhost/api/funnels/catalog/stress'), { params })

    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBeTruthy()

    const json = (await res.json()) as { success: boolean }
    expect(json.success).toBe(true)
  })

  it('returns 401 when unauthenticated with x-request-id', async () => {
    const { GET } = await import('../route')

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const params = Promise.resolve({ slug: 'stress' })
    const res = await GET(new Request('http://localhost/api/funnels/catalog/stress'), { params })

    expect(res.status).toBe(401)
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('returns 503 SCHEMA_NOT_READY when funnels_catalog relation missing', async () => {
    const { GET } = await import('../route')

    const funnelBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42P01', message: 'relation "funnels_catalog" does not exist' },
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelBuilder
        throw new Error(`Should not query table after error: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const params = Promise.resolve({ slug: 'stress' })
    const res = await GET(new Request('http://localhost/api/funnels/catalog/stress'), { params })

    expect(res.status).toBe(503)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('SCHEMA_NOT_READY')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('returns 403 FORBIDDEN when RLS denies access to funnels_catalog', async () => {
    const { GET } = await import('../route')

    const funnelBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42501', message: 'permission denied for relation funnels_catalog' },
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelBuilder
        throw new Error(`Should not query table after error: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const params = Promise.resolve({ slug: 'stress' })
    const res = await GET(new Request('http://localhost/api/funnels/catalog/stress'), { params })

    expect(res.status).toBe(403)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('returns 404 when funnel not found', async () => {
    const { GET } = await import('../route')

    const funnelBuilder = makeThenableBuilder({
      data: null,
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelBuilder
        throw new Error(`Should not query table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const params = Promise.resolve({ slug: 'nonexistent' })
    const res = await GET(new Request('http://localhost/api/funnels/catalog/nonexistent'), { params })

    expect(res.status).toBe(404)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('returns 503 SCHEMA_NOT_READY when funnel_versions relation missing', async () => {
    const { GET } = await import('../route')

    const funnelBuilder = makeThenableBuilder({
      data: {
        id: 'f1',
        slug: 'stress',
        title: 'Stress',
        description: null,
        pillar_id: null,
        est_duration_min: 10,
        outcomes: [],
        is_active: true,
        default_version_id: null,
      },
      error: null,
    })

    const versionsBuilder = makeThenableBuilder({
      data: null,
      error: { code: '42P01', message: 'relation "funnel_versions" does not exist' },
    })

    const mockClient: MockSupabaseClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelBuilder
        if (table === 'funnel_versions') return versionsBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const params = Promise.resolve({ slug: 'stress' })
    const res = await GET(new Request('http://localhost/api/funnels/catalog/stress'), { params })

    expect(res.status).toBe(503)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('SCHEMA_NOT_READY')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })
})
