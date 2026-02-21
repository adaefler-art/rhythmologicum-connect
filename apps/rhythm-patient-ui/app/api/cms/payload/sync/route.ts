import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { syncPayloadContentPages } from '@/lib/cms/payload/sync'

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

function isAuthorizedSyncRequest(request: NextRequest): boolean {
  const expectedSecret = process.env.CMS_PAYLOAD_SYNC_SECRET
  if (!expectedSecret) {
    return false
  }

  const provided = request.headers.get('x-cms-sync-secret')
  return !!provided && provided === expectedSecret
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedSyncRequest(request)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid sync secret' },
      } satisfies ApiResponse<never>,
      { status: 401 },
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

    return NextResponse.json(
      {
        success: result.success,
        data: result,
      } satisfies ApiResponse<typeof result>,
      { status: result.success ? 200 : 207 },
    )
  } catch (error) {
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
