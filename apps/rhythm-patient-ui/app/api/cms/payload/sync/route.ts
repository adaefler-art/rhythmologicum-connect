import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { syncPayloadContentPages } from '@/lib/cms/payload/sync'
import { resolveCmsAccess } from '@/lib/cms/payload/access'
import { CMS_AUDIT_ACTION, CMS_AUDIT_ENTITY, logCmsPayloadAudit } from '@/lib/cms/payload/audit'
import { observeCmsPayloadEvent } from '@/lib/cms/payload/monitoring'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

type SyncRequestBody = {
  dryRun?: boolean
  slug?: string
  publishedOnly?: boolean
}

export async function POST(request: NextRequest) {
  const access = await resolveCmsAccess(request, {
    headerName: 'x-cms-sync-secret',
    secretValue: process.env.CMS_PAYLOAD_SYNC_SECRET,
    allowRoleAccess: true,
  })

  if (!access.authorized) {
    const status = access.errorCode === 'FORBIDDEN' ? 403 : 401
    await observeCmsPayloadEvent({
      routeKey: 'POST /api/cms/payload/sync',
      statusCode: status,
      phase: 'auth',
      errorCode: access.errorCode,
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: access.errorCode ?? 'UNAUTHORIZED',
          message: access.errorMessage ?? 'Unauthorized',
        },
      } satisfies ApiResponse<never>,
      { status },
    )
  }

  let body: SyncRequestBody = {}
  try {
    body = (await request.json()) as SyncRequestBody
  } catch {
    body = {}
  }

  try {
    const result = await syncPayloadContentPages({
      dryRun: body.dryRun,
      slug: body.slug,
      publishedOnly: body.publishedOnly,
    })

    if (!result.dryRun) {
      revalidatePath('/patient/start')
      if (body.slug) {
        revalidatePath(`/patient/content/${encodeURIComponent(body.slug)}`)
      }
    }

    await logCmsPayloadAudit({
      actorUserId: access.actorUserId,
      actorRole: access.actorRole,
      action: CMS_AUDIT_ACTION.SYNC,
      entityId: CMS_AUDIT_ENTITY.SYNC,
      reason: result.success ? 'sync_completed' : 'sync_partial',
      funnelSlug: body.slug,
      isActive: !result.dryRun,
    })

    await observeCmsPayloadEvent({
      routeKey: 'POST /api/cms/payload/sync',
      statusCode: result.success ? 200 : 207,
      phase: 'sync',
      errorCode: result.success ? undefined : 'SYNC_PARTIAL',
    })

    return NextResponse.json(
      {
        success: result.success,
        data: result,
      } satisfies ApiResponse<typeof result>,
      { status: result.success ? 200 : 207 },
    )
  } catch (error) {
    await logCmsPayloadAudit({
      actorUserId: access.actorUserId,
      actorRole: access.actorRole,
      action: CMS_AUDIT_ACTION.SYNC,
      entityId: CMS_AUDIT_ENTITY.SYNC,
      reason: 'sync_failed',
      funnelSlug: body.slug,
      isActive: false,
    })

    await observeCmsPayloadEvent({
      routeKey: 'POST /api/cms/payload/sync',
      statusCode: 500,
      phase: 'sync',
      errorCode: 'SYNC_FAILED',
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: error instanceof Error ? error.message : 'Payload sync failed',
        },
      } satisfies ApiResponse<never>,
      { status: 500 },
    )
  }
}
