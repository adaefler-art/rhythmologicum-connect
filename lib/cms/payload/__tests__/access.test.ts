import { NextRequest } from 'next/server'
import { resolveCmsAccess } from '@/lib/cms/payload/access'

jest.mock('@/lib/db/supabase.server', () => ({
  getCurrentUser: jest.fn(),
  getUserRole: jest.fn(),
  hasAdminOrClinicianRole: jest.fn(),
}))

const {
  getCurrentUser,
  getUserRole,
  hasAdminOrClinicianRole,
} = require('@/lib/db/supabase.server')

describe('resolveCmsAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('authorizes when valid secret header is provided', async () => {
    const req = new NextRequest('http://localhost/api/cms/payload/sync', {
      headers: {
        'x-cms-sync-secret': 'secret-123',
      },
    })

    const result = await resolveCmsAccess(req, {
      headerName: 'x-cms-sync-secret',
      secretValue: 'secret-123',
      allowRoleAccess: true,
    })

    expect(result.authorized).toBe(true)
    expect(result.authMode).toBe('secret')
  })

  it('authorizes clinician/admin role when role access is enabled', async () => {
    hasAdminOrClinicianRole.mockResolvedValue(true)
    getCurrentUser.mockResolvedValue({ id: 'user-1' })
    getUserRole.mockResolvedValue('clinician')

    const req = new NextRequest('http://localhost/api/cms/payload/sync')

    const result = await resolveCmsAccess(req, {
      headerName: 'x-cms-sync-secret',
      secretValue: 'secret-123',
      allowRoleAccess: true,
    })

    expect(result.authorized).toBe(true)
    expect(result.authMode).toBe('role')
    expect(result.actorUserId).toBe('user-1')
    expect(result.actorRole).toBe('clinician')
  })

  it('returns forbidden when role access fails', async () => {
    hasAdminOrClinicianRole.mockResolvedValue(false)

    const req = new NextRequest('http://localhost/api/cms/payload/sync')

    const result = await resolveCmsAccess(req, {
      headerName: 'x-cms-sync-secret',
      secretValue: 'secret-123',
      allowRoleAccess: true,
    })

    expect(result.authorized).toBe(false)
    expect(result.errorCode).toBe('FORBIDDEN')
  })
})
