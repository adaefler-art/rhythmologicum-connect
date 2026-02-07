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
    db: readiness.dbStatus === 'fail' ? 'fail' : readiness.dbStatus === 'ok' ? 'ok' : 'unknown',
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
    sinceMs: stageSinceMs,
    buildId: readiness.buildId ?? null,
    retryAfterMs: readiness.retryAfterMs ?? null,
    lastError: readiness.lastErrorCode
      ? {
          code: readiness.lastErrorCode,
          message: readiness.lastErrorMessage ?? null,
          at: readiness.lastErrorAt ?? null,
          detailsSanitized: readiness.lastErrorDetails ?? null,
        }
      : null,
    stages: readiness.stages ?? null,
    build: {
      buildId: readiness.buildId ?? null,
      attempts: readiness.buildAttempts,
      lastBuildMs: readiness.lastBuildMs ?? null,
    },
    deps,
    dbMigrationStatus: readiness.dbMigrationStatus ?? null,
    schemaVersion: readiness.schemaVersion ?? null,
    checkedAt: readiness.checkedAt,
    stageSince: readiness.stageSince,
    attempts: readiness.attempts,
    requestId,
  })
}
