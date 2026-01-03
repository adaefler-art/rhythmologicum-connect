export {}

import { NextRequest } from 'next/server'

jest.mock('@/lib/utils/contentResolver', () => ({
  getContentPage: jest.fn(),
}))

jest.mock('@/lib/monitoring/usageTrackingWrapper', () => ({
  trackUsage: jest.fn(),
}))

describe('GET /api/content/resolve', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('returns 200 missing_content when no matching content exists', async () => {
    const { getContentPage } = jest.requireMock('@/lib/utils/contentResolver') as {
      getContentPage: jest.Mock
    }

    getContentPage.mockResolvedValue({
      page: null,
      strategy: 'not-found',
      error: 'No matching content page found',
    })

    const { GET } = await import('../route')

    const request = new NextRequest(
      'http://localhost/api/content/resolve?funnel=stress-assessment&category=intro',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = (await response.json()) as {
      status: string
      content: unknown
      requestId: string
      version: string
    }

    expect(json.version).toBe('v1')
    expect(json.status).toBe('missing_content')
    expect(json.content).toBeNull()
    expect(typeof json.requestId).toBe('string')
    expect(json.requestId.length).toBeGreaterThan(0)
  })

  it('returns 422 when funnel param is missing', async () => {
    const { GET } = await import('../route')

    const request = new NextRequest('http://localhost/api/content/resolve?category=intro')
    const response = await GET(request)

    expect(response.status).toBe(422)
    const json = (await response.json()) as { success: boolean; error?: { code?: string } }
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('MISSING_PARAMETER')
  })
})
