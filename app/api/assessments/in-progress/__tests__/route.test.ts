/** @jest-environment node */

import { GET } from '../route'

jest.mock('@/lib/db/supabase.server', () => {
  return {
    createServerSupabaseClient: jest.fn(),
  }
})

function createQueryResult<T>(result: { data: T; error: unknown }) {
  return {
    select: () => createQueryResult(result),
    eq: () => createQueryResult(result),
    is: () => createQueryResult(result),
    order: () => createQueryResult(result),
    limit: () => createQueryResult(result),
    single: async () => result,
    maybeSingle: async () => result,
  }
}

describe('GET /api/assessments/in-progress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    })

    const res = await GET()
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json).toEqual({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    })
  })

  it('returns 404 when patient profile not found', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'patient_profiles') {
          return createQueryResult({ data: null, error: { message: 'Not found' } })
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await GET()
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json).toEqual({
      success: false,
      error: { code: 'PROFILE_NOT_FOUND', message: 'Patient profile not found' },
    })
  })

  it('returns 404 when no in-progress assessments found', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'patient_profiles') {
          return createQueryResult({ data: { id: 'p1' }, error: null })
        }
        if (table === 'assessments') {
          return createQueryResult({ data: null, error: null })
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await GET()
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json).toEqual({
      success: false,
      error: { code: 'NO_IN_PROGRESS', message: 'No in-progress assessments found' },
    })
  })

  it('returns in-progress assessment when found', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    const mockAssessment = {
      id: 'a1',
      funnel: 'stress-assessment',
      funnel_id: 'f1',
      started_at: '2026-01-14T10:00:00Z',
      completed_at: null,
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'patient_profiles') {
          return createQueryResult({ data: { id: 'p1' }, error: null })
        }
        if (table === 'assessments') {
          return createQueryResult({ data: mockAssessment, error: null })
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({
      success: true,
      data: mockAssessment,
    })
  })

  it('returns 500 when assessment fetch fails', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'patient_profiles') {
          return createQueryResult({ data: { id: 'p1' }, error: null })
        }
        if (table === 'assessments') {
          return createQueryResult({ data: null, error: { message: 'Database error' } })
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await GET()
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json).toEqual({
      success: false,
      error: { code: 'ASSESSMENT_FETCH_FAILED', message: 'Failed to fetch assessments' },
    })
  })
})
