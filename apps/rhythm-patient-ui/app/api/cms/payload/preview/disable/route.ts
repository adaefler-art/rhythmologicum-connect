import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'
import { resolveCmsAccess } from '@/lib/cms/payload/access'
import { CMS_AUDIT_ACTION, CMS_AUDIT_ENTITY, logCmsPayloadAudit } from '@/lib/cms/payload/audit'
import { observeCmsPayloadEvent } from '@/lib/cms/payload/monitoring'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const access = await resolveCmsAccess(request, {
    headerName: 'x-cms-preview-secret',
    secretValue: process.env.CMS_PREVIEW_SECRET,
    allowRoleAccess: true,
  })

  const querySecret = new URL(request.url).searchParams.get('secret')
  const querySecretValid = !!process.env.CMS_PREVIEW_SECRET && querySecret === process.env.CMS_PREVIEW_SECRET
  const authorized = access.authorized || querySecretValid

  if (!authorized) {
    await observeCmsPayloadEvent({
      routeKey: 'GET /api/cms/payload/preview/disable',
      statusCode: 401,
      phase: 'auth',
      errorCode: 'UNAUTHORIZED',
    })

    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid preview secret' },
      },
      { status: 401 },
    )
  }

  const draft = await draftMode()
  draft.disable()

  await logCmsPayloadAudit({
    actorUserId: access.actorUserId,
    actorRole: access.actorRole,
    action: CMS_AUDIT_ACTION.PREVIEW_DISABLE,
    entityId: CMS_AUDIT_ENTITY.PREVIEW,
    reason: 'preview_disabled',
    isActive: false,
  })

  const redirectUrl = new URL('/patient/start', request.url)

  await observeCmsPayloadEvent({
    routeKey: 'GET /api/cms/payload/preview/disable',
    statusCode: 307,
    phase: 'preview',
  })

  return NextResponse.redirect(redirectUrl)
}
