import { NextResponse } from 'next/server'
import { ensureSchemaReadiness } from '@/lib/db/schemaReadiness'
import { getRequestId } from '@/lib/db/errors'

/**
 * GET /api/_meta/schema
 *
 * Always returns 200 with schema readiness diagnostics.
 */

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const readiness = await ensureSchemaReadiness(requestId)

  return NextResponse.json({
    ready: readiness.ready,
    stage: readiness.stage,
    last_error_code: readiness.lastErrorCode ?? null,
    last_error_message: readiness.lastErrorMessage ?? null,
    last_error_details: readiness.lastErrorDetails ?? null,
    db_migration_status: readiness.dbMigrationStatus ?? null,
    schema_version: readiness.schemaVersion ?? null,
    checked_at: readiness.checkedAt,
    attempts: readiness.attempts,
    requestId,
  })
}
