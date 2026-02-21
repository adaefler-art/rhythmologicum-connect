import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isAuthorizedPreviewSecret(secret: string | null): boolean {
  const expectedSecret = process.env.CMS_PREVIEW_SECRET
  if (!expectedSecret) {
    return false
  }

  return secret === expectedSecret
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  if (!isAuthorizedPreviewSecret(secret)) {
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

  const redirectUrl = new URL(`/patient/content/${encodeURIComponent(slug)}`, request.url)
  redirectUrl.searchParams.set('preview', '1')

  return NextResponse.redirect(redirectUrl)
}
