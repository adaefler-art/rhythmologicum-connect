import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { syncPayloadContentPages } from '@/lib/cms/payload/sync'
import { CMS_AUDIT_ACTION, CMS_AUDIT_ENTITY, logCmsPayloadAudit } from '@/lib/cms/payload/audit'
import { observeCmsPayloadEvent } from '@/lib/cms/payload/monitoring'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

type PayloadWebhookBody = {
  event?: string
  doc?: {
    slug?: string
    status?: string
  }
}

function isAuthorizedWebhook(request: NextRequest): boolean {
  const expectedSecret = process.env.CMS_PAYLOAD_WEBHOOK_SECRET
  if (!expectedSecret) {
    return false
  }

  const provided = request.headers.get('x-cms-webhook-secret')
  return !!provided && provided === expectedSecret
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedWebhook(request)) {
    await observeCmsPayloadEvent({
      routeKey: 'POST /api/cms/payload/webhook',
      statusCode: 401,
      phase: 'auth',
      errorCode: 'UNAUTHORIZED',
    })

    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid webhook secret' },
      } satisfies ApiResponse<never>,
      { status: 401 },
    )
  }

  let body: PayloadWebhookBody = {}
  try {
    body = (await request.json()) as PayloadWebhookBody
  } catch {
    body = {}
  }

  const slug = body.doc?.slug
  const shouldSyncPublishedOnly = body.doc?.status !== 'draft'

  try {
    const syncResult = await syncPayloadContentPages({
      dryRun: false,
      slug,
      publishedOnly: shouldSyncPublishedOnly,
    })

    await logCmsPayloadAudit({
      action: CMS_AUDIT_ACTION.WEBHOOK,
      entityId: CMS_AUDIT_ENTITY.WEBHOOK,
      reason: syncResult.success ? 'webhook_sync_completed' : 'webhook_sync_partial',
      funnelSlug: slug,
      isActive: true,
    })

    revalidatePath('/patient/start')
    if (slug) {
      revalidatePath(`/patient/content/${encodeURIComponent(slug)}`)
    }

    await observeCmsPayloadEvent({
      routeKey: 'POST /api/cms/payload/webhook',
      statusCode: syncResult.success ? 200 : 207,
      phase: 'webhook',
      errorCode: syncResult.success ? undefined : 'SYNC_PARTIAL',
    })

    return NextResponse.json({
      success: syncResult.success,
      data: {
        event: body.event ?? 'unknown',
        slug: slug ?? null,
        sync: syncResult,
      },
    } satisfies ApiResponse<{
      event: string
      slug: string | null
      sync: typeof syncResult
    }>)
  } catch (error) {
    await logCmsPayloadAudit({
      action: CMS_AUDIT_ACTION.WEBHOOK,
      entityId: CMS_AUDIT_ENTITY.WEBHOOK,
      reason: 'webhook_processing_failed',
      funnelSlug: slug,
      isActive: false,
    })

    await observeCmsPayloadEvent({
      routeKey: 'POST /api/cms/payload/webhook',
      statusCode: 500,
      phase: 'webhook',
      errorCode: 'WEBHOOK_PROCESSING_FAILED',
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: error instanceof Error ? error.message : 'Webhook processing failed',
        },
      } satisfies ApiResponse<never>,
      { status: 500 },
    )
  }
}
