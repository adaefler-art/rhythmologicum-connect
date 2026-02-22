import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'
import { resolveCmsAccess } from '@/lib/cms/payload/access'
import { CMS_AUDIT_ACTION, CMS_AUDIT_ENTITY, logCmsPayloadAudit } from '@/lib/cms/payload/audit'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  const secret = searchParams.get('secret')

  const access = await resolveCmsAccess(request, {
    headerName: 'x-cms-preview-secret',
    secretValue: process.env.CMS_PREVIEW_SECRET,
    allowRoleAccess: true,
  })

  const querySecretValid = !!process.env.CMS_PREVIEW_SECRET && secret === process.env.CMS_PREVIEW_SECRET
  const authorized = access.authorized || querySecretValid

  if (!authorized) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid preview secret' },
      },
      { status: 401 },
    )
  }

  if (!slug) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'slug is required' },
      },
      { status: 400 },
    )
  }

  const draft = await draftMode()
  draft.enable()

  await logCmsPayloadAudit({
    actorUserId: access.actorUserId,
    actorRole: access.actorRole,
    action: CMS_AUDIT_ACTION.PREVIEW_ENABLE,
    entityId: CMS_AUDIT_ENTITY.PREVIEW,
    reason: 'preview_enabled',
    funnelSlug: slug,
    isActive: true,
  })

  const redirectUrl = new URL(`/patient/content/${encodeURIComponent(slug)}`, request.url)
  redirectUrl.searchParams.set('preview', '1')

  return NextResponse.redirect(redirectUrl)
}
