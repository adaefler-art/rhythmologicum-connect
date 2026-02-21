import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const draft = await draftMode()
  draft.disable()

  const redirectUrl = new URL('/patient/start', request.url)
  return NextResponse.redirect(redirectUrl)
}
