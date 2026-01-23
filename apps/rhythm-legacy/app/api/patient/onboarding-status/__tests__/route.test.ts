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
    order: () => createQueryResult(result),
    limit: async () => result,
  }
}

function createTrackedQueryResult<T>(result: { data: T; error: unknown }) {
  const calls: Array<{ column: string; ascending: boolean }> = []

  const builder = {
    select: () => builder,
    eq: () => builder,
    order: (column: string, opts: { ascending: boolean }) => {
      calls.push({ column, ascending: opts.ascending })
      return builder
    },
    limit: async () => result,
  }

  return { builder, calls }
}

describe('GET /api/patient/onboarding-status', () => {
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

    expect(res.headers.get('Cache-Control')).toContain('no-store')

    const json = await res.json()
    expect(json).toEqual({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    })
  })

  it('returns completed=true when consent + profile are present', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'user_consents') {
          return createQueryResult({ data: [{ id: 'c1' }], error: null })
        }
        if (table === 'patient_profiles') {
          return createQueryResult({
            data: [{ id: 'p1', full_name: 'Jane Doe' }],
            error: null,
          })
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    expect(res.headers.get('Cache-Control')).toContain('no-store')

    const json = await res.json()
    expect(json).toEqual({
      success: true,
      data: { needsConsent: false, needsProfile: false, completed: true },
    })
  })

  it('returns needsConsent=true when consent is missing', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'user_consents') {
          return createQueryResult({ data: [], error: null })
        }
        if (table === 'patient_profiles') {
          return createQueryResult({
            data: [{ id: 'p1', full_name: 'Jane Doe' }],
            error: null,
          })
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    expect(res.headers.get('Cache-Control')).toContain('no-store')

    const json = await res.json()
    expect(json).toEqual({
      success: true,
      data: { needsConsent: true, needsProfile: false, completed: false },
    })
  })

  it('returns needsProfile=true when profile is missing', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'user_consents') {
          return createQueryResult({ data: [{ id: 'c1' }], error: null })
        }
        if (table === 'patient_profiles') {
          return createQueryResult({
            data: [{ id: 'p1', full_name: null }],
            error: null,
          })
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    expect(res.headers.get('Cache-Control')).toContain('no-store')

    const json = await res.json()
    expect(json).toEqual({
      success: true,
      data: { needsConsent: false, needsProfile: true, completed: false },
    })
  })

  it('orders consent/profile queries by newest-first', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    const consent = createTrackedQueryResult({ data: [{ id: 'c1' }], error: null })
    const profile = createTrackedQueryResult({
      data: [{ id: 'p1', full_name: 'Jane Doe' }],
      error: null,
    })

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'user_consents') return consent.builder
        if (table === 'patient_profiles') return profile.builder
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    expect(consent.calls).toEqual([{ column: 'consented_at', ascending: false }])
    expect(profile.calls).toEqual([{ column: 'created_at', ascending: false }])
  })
})
