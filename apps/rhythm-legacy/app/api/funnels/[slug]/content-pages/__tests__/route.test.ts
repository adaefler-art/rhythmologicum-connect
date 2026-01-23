export {}

import { NextRequest } from 'next/server'

type SupabaseQueryResult<T> = { data: T | null; error: { code?: string; message?: string } | null }

type ThenableBuilder<T> = {
  select: jest.Mock
  eq: jest.Mock
  maybeSingle: jest.Mock
  is: jest.Mock
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
  builder.maybeSingle = jest.fn(() => builder)
  builder.is = jest.fn(() => builder)
  builder.order = jest.fn(() => builder)

  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)
  builder.catch = (onRejected) => Promise.resolve(result).catch(onRejected)
  builder.finally = (onFinally) => Promise.resolve(result).finally(onFinally)

  return builder
}

type MockSupabaseClient = {
  from: jest.Mock
}

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

describe('GET /api/funnels/[slug]/content-pages', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('returns 200 [] when funnel exists in funnels_catalog only (no content pages yet)', async () => {
    const { createAdminSupabaseClient } = jest.requireMock('@/lib/db/supabase.admin') as {
      createAdminSupabaseClient: jest.Mock
    }

    const funnelsNotFound = makeThenableBuilder({ data: null, error: null })

    const catalogFound = makeThenableBuilder({ data: { id: 'cat-1' }, error: null })

    const client: MockSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'funnels') return funnelsNotFound
        if (table === 'funnels_catalog') return catalogFound
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createAdminSupabaseClient.mockReturnValue(client)

    const { GET } = await import('../route')

    const request = new NextRequest('http://localhost/api/funnels/stress-assessment/content-pages')
    const response = await GET(request, { params: Promise.resolve({ slug: 'stress-assessment' }) })

    expect(response.status).toBe(200)
    const json = (await response.json()) as unknown
    expect(json).toEqual([])
  })

  // V0.5 P0: Known funnel in registry but not in DB should return 200 []
  it('returns 200 [] when funnel is known in registry but not in database', async () => {
    const { createAdminSupabaseClient } = jest.requireMock('@/lib/db/supabase.admin') as {
      createAdminSupabaseClient: jest.Mock
    }

    const funnelsNotFound = makeThenableBuilder({ data: null, error: null })

    const client: MockSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'funnels') return funnelsNotFound
        // Don't query catalog - should return before that based on registry check
        throw new Error(`Unexpected table query: ${table}`)
      }),
    }

    createAdminSupabaseClient.mockReturnValue(client)

    const { GET } = await import('../route')

    const request = new NextRequest('http://localhost/api/funnels/stress-assessment/content-pages')
    const response = await GET(request, { params: Promise.resolve({ slug: 'stress-assessment' }) })

    expect(response.status).toBe(200)
    const json = (await response.json()) as unknown
    expect(json).toEqual([])
  })

  // V0.5 P0: Unknown funnel should return 404
  it('returns 404 when funnel is unknown (not in registry or database)', async () => {
    const { createAdminSupabaseClient } = jest.requireMock('@/lib/db/supabase.admin') as {
      createAdminSupabaseClient: jest.Mock
    }

    const funnelsNotFound = makeThenableBuilder({ data: null, error: null })
    const catalogNotFound = makeThenableBuilder({ data: null, error: null })

    const client: MockSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'funnels') return funnelsNotFound
        if (table === 'funnels_catalog') return catalogNotFound
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createAdminSupabaseClient.mockReturnValue(client)

    const { GET } = await import('../route')

    const request = new NextRequest('http://localhost/api/funnels/unknown-funnel/content-pages')
    const response = await GET(request, { params: Promise.resolve({ slug: 'unknown-funnel' }) })

    expect(response.status).toBe(404)
    const json = (await response.json()) as { error: string }
    expect(json.error).toBe('Funnel not found')
  })
})
