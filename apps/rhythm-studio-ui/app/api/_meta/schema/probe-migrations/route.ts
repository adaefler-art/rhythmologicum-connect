import { NextResponse } from 'next/server'
import { getRequestId } from '@/lib/db/errors'
import { runRequiredObjectsRpc } from '@/lib/db/requiredObjectsRpc.server'

const REQUIRED_OBJECTS = [
  'public.funnels_catalog',
  'public.funnel_versions',
  'public.triage_cases_v1',
]

/**
 * GET /api/_meta/schema/probe-migrations
 *
 * Runs the migration RPC probe without touching schemaManager.
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const result = await runRequiredObjectsRpc(REQUIRED_OBJECTS, 2000)

  return NextResponse.json({
    ok: result.ok,
    elapsedMs: result.elapsedMs,
    where: result.where,
    supabaseStatus: result.supabaseStatus,
    errorCode: result.errorCode ?? null,
    requestId,
  })
}
