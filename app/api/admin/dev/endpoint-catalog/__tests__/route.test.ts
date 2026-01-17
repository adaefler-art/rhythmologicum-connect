import { NextRequest } from 'next/server'

jest.mock('@/lib/db/supabase.server', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/logging/logger', () => ({
  logUnauthorized: jest.fn(),
  logForbidden: jest.fn(),
  logError: jest.fn(),
}))

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}))

import { GET } from '../route'
import { getCurrentUser } from '@/lib/db/supabase.server'
import fs from 'fs/promises'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockReadFile = fs.readFile as unknown as jest.MockedFunction<typeof fs.readFile>

describe('GET /api/admin/dev/endpoint-catalog', () => {
  const originalFlag = process.env.DEV_ENDPOINT_CATALOG

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DEV_ENDPOINT_CATALOG = originalFlag
  })

  afterAll(() => {
    process.env.DEV_ENDPOINT_CATALOG = originalFlag
  })

  it('returns 200 with enabled:false when DEV_ENDPOINT_CATALOG is not enabled', async () => {
    process.env.DEV_ENDPOINT_CATALOG = '0'

    const request = new NextRequest('http://localhost/api/admin/dev/endpoint-catalog')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.enabled).toBe(false)
    expect(body.reason).toContain('DEV_ENDPOINT_CATALOG')
    expect(mockGetCurrentUser).not.toHaveBeenCalled()
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  it('returns 200 with enabled:false when DEV_ENDPOINT_CATALOG is undefined', async () => {
    delete process.env.DEV_ENDPOINT_CATALOG

    const request = new NextRequest('http://localhost/api/admin/dev/endpoint-catalog')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.enabled).toBe(false)
    expect(mockGetCurrentUser).not.toHaveBeenCalled()
  })

  it('returns 401 when unauthenticated (auth gate before filesystem)', async () => {
    process.env.DEV_ENDPOINT_CATALOG = '1'
    mockGetCurrentUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/admin/dev/endpoint-catalog')
    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  it('returns 403 when user is not admin', async () => {
    process.env.DEV_ENDPOINT_CATALOG = '1'
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      app_metadata: { role: 'patient' },
      user_metadata: {},
    } as never)

    const request = new NextRequest('http://localhost/api/admin/dev/endpoint-catalog')
    const response = await GET(request)

    expect(response.status).toBe(403)
    expect(mockReadFile).not.toHaveBeenCalled()
  })

  it('returns 200 with enabled:true and catalog data when enabled and admin', async () => {
    process.env.DEV_ENDPOINT_CATALOG = '1'
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-123',
      app_metadata: { role: 'admin' },
      user_metadata: {},
    } as never)
    
    const mockCatalog = {
      version: '1.0.0',
      endpoints: [{ path: '/api/test', methods: ['GET'] }],
    }
    mockReadFile.mockResolvedValue(JSON.stringify(mockCatalog))

    const request = new NextRequest('http://localhost/api/admin/dev/endpoint-catalog')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.enabled).toBe(true)
    expect(body.version).toBe('1.0.0')
    expect(body.endpoints).toHaveLength(1)
  })
})
