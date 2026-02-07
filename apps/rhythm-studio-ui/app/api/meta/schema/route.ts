import { NextResponse } from 'next/server'
import { schemaManager } from '@/lib/db/schemaReadiness.server'
import { getRequestId } from '@/lib/db/errors'

/**
 * GET /api/meta/schema
 *
 * Always returns 200 with schema readiness diagnostics.
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const status = schemaManager.getStatus()

  if (!status.ready && status.stage !== 'building') {
    void schemaManager.ensureReady({ reason: 'diagnostics', requestId, nonBlocking: true })
  }

  const readiness = schemaManager.getStatus()
  const stageSinceMs = (() => {
    const since = new Date(readiness.stageSince).getTime()
    return Number.isNaN(since) ? null : Date.now() - since
  })()
  const deps = {
    db:
      readiness.dbMigrationStatus?.status === 'error'
        ? 'fail'
        : readiness.dbMigrationStatus?.status === 'unknown'
          ? 'unknown'
          : 'ok',
    migrations:
      readiness.dbMigrationStatus?.status === 'missing'
        ? 'missing'
        : readiness.dbMigrationStatus?.status === 'ok'
          ? 'ok'
          : 'unknown',
  }

  return NextResponse.json({
    ready: readiness.ready,
    stage: readiness.stage,
    since_ms: stageSinceMs,
    build_id: readiness.buildId ?? null,
    retryAfterMs: readiness.retryAfterMs ?? null,
    last_error: readiness.lastErrorCode
      ? {
          code: readiness.lastErrorCode,
          message: readiness.lastErrorMessage ?? null,
          at: readiness.lastErrorAt ?? null,
          details_sanitized: readiness.lastErrorDetails ?? null,
        }
      : null,
    stages: readiness.stages ?? null,
    build: {
      build_id: readiness.buildId ?? null,
      attempts: readiness.buildAttempts,
      last_build_ms: readiness.lastBuildMs ?? null,
    },
    deps,
    last_error_code: readiness.lastErrorCode ?? null,
    last_error_message: readiness.lastErrorMessage ?? null,
    last_error_details: readiness.lastErrorDetails ?? null,
    db_migration_status: readiness.dbMigrationStatus ?? null,
    schema_version: readiness.schemaVersion ?? null,
    checked_at: readiness.checkedAt,
    stage_since: readiness.stageSince,
    attempts: readiness.attempts,
    retry_after_ms: readiness.retryAfterMs ?? null,
    requestId,
  })
}
