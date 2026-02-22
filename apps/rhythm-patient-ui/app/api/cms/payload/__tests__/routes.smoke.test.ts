import { NextRequest } from 'next/server'
import { POST as syncPost } from '../sync/route'
import { POST as webhookPost } from '../webhook/route'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/cms/payload/sync', () => ({
  syncPayloadContentPages: jest.fn(),
}))

jest.mock('@/lib/cms/payload/access', () => ({
  resolveCmsAccess: jest.fn(),
}))

jest.mock('@/lib/cms/payload/audit', () => ({
  logCmsPayloadAudit: jest.fn(),
  CMS_AUDIT_ACTION: {
    SYNC: 'update',
    WEBHOOK: 'update',
  },
  CMS_AUDIT_ENTITY: {
    SYNC: 'cms-payload-sync',
    WEBHOOK: 'cms-payload-webhook',
  },
}))

jest.mock('@/lib/cms/payload/monitoring', () => ({
  observeCmsPayloadEvent: jest.fn(),
}))

const { syncPayloadContentPages } = require('@/lib/cms/payload/sync')
const { resolveCmsAccess } = require('@/lib/cms/payload/access')

describe('CMS payload routes smoke', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CMS_PAYLOAD_WEBHOOK_SECRET = 'webhook-secret'
  })

  describe('POST /api/cms/payload/sync', () => {
    it('returns 401 when access is denied', async () => {
      resolveCmsAccess.mockResolvedValue({
        authorized: false,
        authMode: 'none',
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Missing or invalid secret',
      })

      const req = new NextRequest('http://localhost/api/cms/payload/sync', {
        method: 'POST',
      })

      const response = await syncPost(req)
      expect(response.status).toBe(401)
    })

    it('returns 200 for successful sync request', async () => {
      resolveCmsAccess.mockResolvedValue({
        authorized: true,
        authMode: 'secret',
      })
      syncPayloadContentPages.mockResolvedValue({
        success: true,
        dryRun: false,
        sourceCount: 1,
        processedCount: 1,
        upsertedCount: 1,
        skippedCount: 0,
        errors: [],
      })

      const req = new NextRequest('http://localhost/api/cms/payload/sync', {
        method: 'POST',
        body: JSON.stringify({ dryRun: false, slug: 'stress-verstehen' }),
      })

      const response = await syncPost(req)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.upsertedCount).toBe(1)
    })
  })

  describe('POST /api/cms/payload/webhook', () => {
    it('returns 401 when webhook secret is missing/invalid', async () => {
      const req = new NextRequest('http://localhost/api/cms/payload/webhook', {
        method: 'POST',
        body: JSON.stringify({ event: 'afterChange' }),
      })

      const response = await webhookPost(req)
      expect(response.status).toBe(401)
    })

    it('returns 200 for valid webhook payload', async () => {
      syncPayloadContentPages.mockResolvedValue({
        success: true,
        dryRun: false,
        sourceCount: 1,
        processedCount: 1,
        upsertedCount: 1,
        skippedCount: 0,
        errors: [],
      })

      const req = new NextRequest('http://localhost/api/cms/payload/webhook', {
        method: 'POST',
        headers: {
          'x-cms-webhook-secret': 'webhook-secret',
        },
        body: JSON.stringify({
          event: 'afterChange',
          doc: {
            slug: 'stress-verstehen',
            status: 'published',
          },
        }),
      })

      const response = await webhookPost(req)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.slug).toBe('stress-verstehen')
    })
  })
})
