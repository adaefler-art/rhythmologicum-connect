import { NextResponse } from 'next/server'
import { schemaManager } from '@/lib/db/schemaReadiness.server'
import { getRequestId } from '@/lib/db/errors'

/**
 * GET /api/_meta/health
 *
 * Always returns 200 with minimal health diagnostics.
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const status = schemaManager.getStatus()

  return NextResponse.json({
    ok: true,
    schema: {
      ready: status.ready,
      stage: status.stage,
      last_error_code: status.lastErrorCode ?? null,
      last_error_message: status.lastErrorMessage ?? null,
    },
    requestId,
  })
}
