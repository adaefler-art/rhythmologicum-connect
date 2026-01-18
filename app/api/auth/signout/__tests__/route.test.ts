/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '../route'

describe('POST /api/auth/signout', () => {
  it('redirects and expires auth cookies', async () => {
    const req = new NextRequest('http://localhost/api/auth/signout', { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('http://localhost/')

    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toContain('sb-access-token=')
    expect(setCookie).toContain('Max-Age=0')
  })
})