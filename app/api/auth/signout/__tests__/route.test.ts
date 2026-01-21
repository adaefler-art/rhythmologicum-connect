/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock the supabase server module
jest.mock('@/lib/db/supabase.server', () => ({
  createRouteSupabaseClient: jest.fn((req: NextRequest) => ({
    supabase: {
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    },
    applyCookies: jest.fn((response) => response),
  })),
}))

describe('POST /api/auth/signout', () => {
  it('returns success JSON and expires auth cookies', async () => {
    const req = new NextRequest('http://localhost/api/auth/signout', { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    
    const json = await res.json()
    expect(json).toEqual({ success: true })

    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toContain('sb-access-token=')
    expect(setCookie).toContain('Max-Age=0')
  })
})