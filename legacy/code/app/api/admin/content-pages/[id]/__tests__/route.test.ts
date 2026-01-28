export {}

import { NextRequest } from 'next/server'

type SupabaseQueryResult<T> = { data: T | null; error: any }

type ThenableBuilder<T> = {
  select: jest.Mock
  eq: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
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
  builder.maybeSingle = jest.fn(() => builder)
  builder.order = jest.fn(() => builder)

  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)
  builder.catch = (onRejected) => Promise.resolve(result).catch(onRejected)
  builder.finally = (onFinally) => Promise.resolve(result).finally(onFinally)

  return builder
}

type MockServerSupabaseClient = {
  auth: {
    getUser: jest.Mock
  }
}

type MockAdminSupabaseClient = {
  from: jest.Mock
}

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

function getMocks() {
  const { createServerSupabaseClient } = jest.requireMock('@/lib/db/supabase.server') as {
    createServerSupabaseClient: jest.Mock
  }
  const { createAdminSupabaseClient } = jest.requireMock('@/lib/db/supabase.admin') as {
    createAdminSupabaseClient: jest.Mock
  }
  return { createServerSupabaseClient, createAdminSupabaseClient }
}

describe('GET /api/admin/content-pages/[id]', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns 200 with sections: [] when page exists but has zero sections', async () => {
    const pageId = '11111111-1111-4111-8111-111111111111'

    const serverClient: MockServerSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'admin' } } } }),
      },
    }

    const contentPagesBuilder = makeThenableBuilder({
      data: {
        id: pageId,
        slug: 'test',
        title: 'Test',
        excerpt: null,
        body_markdown: 'x',
        status: 'draft',
        layout: null,
        category: null,
        priority: 0,
        funnel_id: null,
        flow_step: null,
        order_index: 0,
        updated_at: '2026-01-01T00:00:00Z',
        created_at: '2026-01-01T00:00:00Z',
        deleted_at: null,
      },
      error: null,
    })

    const sectionsBuilder = makeThenableBuilder({ data: [], error: null })

    const adminClient: MockAdminSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'content_pages') return contentPagesBuilder
        if (table === 'content_page_sections') return sectionsBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient, createAdminSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(serverClient)
    createAdminSupabaseClient.mockReturnValue(adminClient)

    const { GET } = await import('../route')

    const request = new NextRequest(`http://localhost/api/admin/content-pages/${pageId}`)
    const res = await GET(request, { params: Promise.resolve({ id: pageId }) })

    expect(res.status).toBe(200)
    const json = (await res.json()) as any

    expect(json.contentPage?.id).toBe(pageId)
    expect(Array.isArray(json.sections)).toBe(true)
    expect(json.sections).toEqual([])
  })

  it('returns 404 when page does not exist', async () => {
    const pageId = '22222222-2222-4222-8222-222222222222'

    const serverClient: MockServerSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } } }),
      },
    }

    const contentPagesBuilder = makeThenableBuilder({ data: null, error: null })

    const adminClient: MockAdminSupabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'content_pages') return contentPagesBuilder
        if (table === 'content_page_sections') {
          throw new Error('should not query sections when page is missing')
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient, createAdminSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(serverClient)
    createAdminSupabaseClient.mockReturnValue(adminClient)

    const { GET } = await import('../route')

    const request = new NextRequest(`http://localhost/api/admin/content-pages/${pageId}`)
    const res = await GET(request, { params: Promise.resolve({ id: pageId }) })

    expect(res.status).toBe(404)
    const json = (await res.json()) as any
    expect(json.error).toBe('Content page not found')
  })
})
