/** @jest-environment node */

import { GET } from '../route'
import { getLandingForRole } from '@/lib/utils/roleLanding'

jest.mock('@/lib/db/supabase.server', () => {
  return {
    createServerSupabaseClient: jest.fn(),
  }
})

describe('GET /api/auth/resolve-role', () => {
  it('resolves patient role from membership and lands on /patient', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } } }),
      },
      rpc: async (_fn: string, args: { check_role: string }) => {
        if (args.check_role === 'patient') return { data: true, error: null }
        return { data: false, error: null }
      },
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({ success: true, data: { role: 'patient' } })
    expect(getLandingForRole('patient')).toBe('/patient')
  })
})
