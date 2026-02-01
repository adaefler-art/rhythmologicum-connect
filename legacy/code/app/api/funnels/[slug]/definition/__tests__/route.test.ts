export {}

import {
  createMinimalContentManifest,
  createMinimalQuestionnaireConfig,
} from '@/lib/fixtures/funnelManifestFixtures'

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

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

async function importRoute() {
  jest.resetModules()

  jest.doMock('@/lib/env', () => ({
    env: {
      NODE_ENV: 'test',
    },
  }))

  const mod = await import('../route')
  return mod as {
    GET: (
      request: Request,
      ctx: { params: Promise<{ slug: string }> },
    ) => Promise<Response>
  }
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

describe('GET /api/funnels/[slug]/definition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 and steps_len>0 for a catalog funnel with questionnaire steps', async () => {
    const { GET } = await importRoute()
    setupCookieStore()

    const funnelCatalogBuilder = makeThenableBuilder({
      data: {
        id: 'funnel-1',
        slug: 'cardiovascular-age',
        title: 'Cardiovascular Age',
        pillar_id: null,
        description: 'Test',
        is_active: true,
        default_version_id: 'version-1',
      },
      error: null,
    })

    const funnelVersionsBuilder = makeThenableBuilder({
      data: {
        id: 'version-1',
        funnel_id: 'funnel-1',
        version: '1.0.0',
        questionnaire_config: createMinimalQuestionnaireConfig({
          steps: [
            {
              id: 'step-1',
              title: 'Step 1',
              description: 'Desc',
              questions: [
                {
                  id: 'q1',
                  key: 'q1_key',
                  type: 'slider',
                  label: 'Question 1',
                  required: true,
                  minValue: 0,
                  maxValue: 10,
                },
              ],
            },
          ],
        }),
        content_manifest: createMinimalContentManifest({
          pages: [
            {
              slug: 'intro',
              title: 'Willkommen',
              sections: [
                {
                  key: 'hero',
                  type: 'hero',
                  content: {
                    title: 'Cardiovascular Age',
                  },
                },
              ],
            },
          ],
          assets: [],
        }),
        algorithm_bundle_version: 'v1.0.0',
        prompt_version: '1.0',
        is_default: true,
        rollout_percent: 100,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: null,
      },
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelCatalogBuilder
        if (table === 'funnel_versions') return funnelVersionsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/cardiovascular-age/definition'), {
      params: Promise.resolve({ slug: 'cardiovascular-age' }),
    })

    expect(res.status).toBe(200)

    const json: any = await res.json()
    expect(Array.isArray(json.steps)).toBe(true)
    expect(json.steps.length).toBeGreaterThan(0)
  })

  it('returns 404 when funnel slug does not exist in catalog or legacy', async () => {
    const { GET } = await importRoute()
    setupCookieStore()

    const funnelCatalogBuilder = makeThenableBuilder({ data: null, error: { code: 'PGRST116' } })
    const legacyFunnelsBuilder = makeThenableBuilder({ data: null, error: { code: 'PGRST116' } })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnels_catalog') return funnelCatalogBuilder
        if (table === 'funnels') return legacyFunnelsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const { createServerSupabaseClient } = getMocks()
    createServerSupabaseClient.mockResolvedValue(mockClient)

    const res = await GET(new Request('http://localhost/api/funnels/nope/definition'), {
      params: Promise.resolve({ slug: 'nope' }),
    })

    expect(res.status).toBe(404)
  })
})
