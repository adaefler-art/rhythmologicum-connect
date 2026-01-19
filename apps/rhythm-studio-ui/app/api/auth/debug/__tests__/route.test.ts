import { NextRequest } from 'next/server'

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({ data: { user: null } })),
    },
  })),
}))

import { GET } from '../route'

describe('GET /api/auth/debug', () => {
  it('returns host and cookie info', async () => {
    const request = new NextRequest('https://rhythm-studio.vercel.app/api/auth/debug')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json).toHaveProperty('host')
    expect(json).toHaveProperty('hasCookieHeader')
    expect(json).toHaveProperty('cookieNames')
  })
})
