import { GET } from '../route'

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')

describe('GET /api/patient/content-slider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn(async () => ({
          data: { user: null },
          error: null,
        })),
      },
    }

    createServerSupabaseClient.mockResolvedValue(supabase)

    const response = await GET()
    expect(response.status).toBe(401)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('UNAUTHORIZED')
  })

  it('uses fallback query when teaser image column is missing (42703)', async () => {
    const withTeaserSelect = {
      eq: jest.fn(function eq() {
        return this
      }),
      is: jest.fn(function is() {
        return this
      }),
      ilike: jest.fn(function ilike() {
        return this
      }),
      order: jest.fn(function order() {
        return this
      }),
      limit: jest.fn(async () => ({
        data: null,
        error: { code: '42703', message: 'column teaser_image_url does not exist' },
      })),
    }

    const fallbackSelect = {
      eq: jest.fn(function eq() {
        return this
      }),
      is: jest.fn(function is() {
        return this
      }),
      ilike: jest.fn(function ilike() {
        return this
      }),
      order: jest.fn(function order() {
        return this
      }),
      limit: jest.fn(async () => ({
        data: [
          {
            id: 'page-1',
            slug: 'was-ist-stress',
            title: 'Was ist Stress?',
            excerpt: 'Kurz erklärt',
            priority: 5,
            created_at: '2026-02-22T10:00:00.000Z',
          },
        ],
        error: null,
      })),
    }

    const fromBuilder = {
      select: jest
        .fn()
        .mockImplementationOnce(() => withTeaserSelect)
        .mockImplementationOnce(() => fallbackSelect),
    }

    const supabase = {
      auth: {
        getUser: jest.fn(async () => ({
          data: { user: { id: 'user-1' } },
          error: null,
        })),
      },
      from: jest.fn(() => fromBuilder),
    }

    createServerSupabaseClient.mockResolvedValue(supabase)

    const response = await GET()
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data?.tag).toBe('start-slider')
    expect(json.data?.items).toHaveLength(1)
    expect(json.data?.items[0]).toEqual({
      id: 'page-1',
      title: 'Was ist Stress?',
      excerpt: 'Kurz erklärt',
      teaserImageUrl: null,
      actionTarget: '/patient/content/was-ist-stress?id=page-1',
      priority: 5,
    })
  })
})
