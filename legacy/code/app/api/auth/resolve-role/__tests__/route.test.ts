/** @jest-environment node */

import { GET } from '../route'

jest.mock('@/lib/db/supabase.server', () => {
  return {
    createServerSupabaseClient: jest.fn(),
  }
})

describe('GET /api/auth/resolve-role', () => {
  it('returns 401 with AUTH_REQUIRED when not authenticated', async () => {
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

  it('returns 401 with SESSION_EXPIRED when JWT has expired', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    const expiredError = new Error('JWT expired')
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: expiredError }),
      },
    })

    const res = await GET()
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json).toEqual({
      success: false,
      error: { code: 'SESSION_EXPIRED', message: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.' },
    })
  })

  it('returns 401 with SESSION_EXPIRED when refresh token is invalid', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    const expiredError = new Error('Invalid refresh token')
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: expiredError }),
      },
    })

    const res = await GET()
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json).toEqual({
      success: false,
      error: { code: 'SESSION_EXPIRED', message: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.' },
    })
  })

  it('returns 200 clinician when role=clinician is present (metadata)', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } },
          error: null,
        }),
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({
      success: true,
      data: { role: 'clinician', requiresOnboarding: false },
    })
  })

  it('defaults to patient + requiresOnboarding=true when role is missing', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'u1', app_metadata: {} } },
          error: null,
        }),
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({
      success: true,
      data: { role: 'patient', requiresOnboarding: true, reason: 'DEFAULT_PATIENT_ROLE' },
    })
  })
})
