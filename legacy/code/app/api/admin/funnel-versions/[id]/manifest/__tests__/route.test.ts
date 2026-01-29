/**
 * Route-level tests for GET /api/admin/funnel-versions/[id]/manifest
 */

import { NextRequest } from 'next/server'

type SupabaseQueryResult<T> = { data: T | null; error: any }

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

  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)
  builder.catch = (onRejected) => Promise.resolve(result).catch(onRejected)
  builder.finally = (onFinally) => Promise.resolve(result).finally(onFinally)

  return builder
}

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

function getMocks() {
  const { createServerSupabaseClient } = jest.requireMock('@/lib/db/supabase.server') as {
    createServerSupabaseClient: jest.Mock
  }
  return { createServerSupabaseClient }
}

describe('GET /api/admin/funnel-versions/[id]/manifest', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns 404 for non-existent version id (valid UUID)', async () => {
    const { GET } = await import('../route')

    const versionsBuilder = makeThenableBuilder({
      data: null,
      error: { code: 'PGRST116', message: '0 rows' },
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnel_versions') return versionsBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new NextRequest('http://localhost/api/admin/funnel-versions/x/manifest'), {
      params: Promise.resolve({ id: '47b4bcb0-d947-4262-804d-182b0c07ac98' }),
    })

    expect(res.status).toBe(404)
    const json = (await res.json()) as { success: boolean; error?: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('NOT_FOUND')
  })

  it('returns 422 for invalid manifest structure (schema validation)', async () => {
    const { GET } = await import('../route')

    const versionsBuilder = makeThenableBuilder({
      data: {
        id: '474bbcd0-d947-4262-804d-182b0507ac98',
        funnel_id: 'de0547ef-0000-4000-8000-000000000000',
        version: '1.0',
        // invalid shape on purpose
        content_manifest: { not: 'a-manifest' },
      },
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnel_versions') return versionsBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new NextRequest('http://localhost/api/admin/funnel-versions/x/manifest'), {
      params: Promise.resolve({ id: '474bbcd0-d947-4262-804d-182b0507ac98' }),
    })

    expect(res.status).toBe(422)
    const json = (await res.json()) as { success: boolean; error?: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('VALIDATION_FAILED')
  })
})

export {}
