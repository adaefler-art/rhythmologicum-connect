import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminRole } from '@/lib/db/supabase.server'
import { schemaManager } from '@/lib/db/schemaReadiness.server'
import { getRequestId } from '@/lib/db/errors'

/**
 * POST /api/meta/schema/rebuild
 *
 * Triggers a schema rebuild (admin only). Always returns 200 with current status.
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthenticated' }, requestId },
      { status: 401 },
    )
  }

  if (!(await hasAdminRole())) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' }, requestId },
      { status: 403 },
    )
  }

  schemaManager.invalidate('manual_rebuild')
  void schemaManager.ensureReady({ reason: 'manual_rebuild', requestId, nonBlocking: true })

  const status = schemaManager.getStatus()

  return NextResponse.json({
    success: true,
    data: {
      ready: status.ready,
      stage: status.stage,
      build_id: status.buildId ?? null,
      retry_after_ms: status.retryAfterMs ?? null,
      last_error_code: status.lastErrorCode ?? null,
      last_error_message: status.lastErrorMessage ?? null,
    },
    requestId,
  })
}
