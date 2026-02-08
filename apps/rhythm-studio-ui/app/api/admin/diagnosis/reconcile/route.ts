/**
 * Admin Diagnosis Reconcile API
 *
 * POST /api/admin/diagnosis/reconcile
 *
 * Reconciles diagnosis runs that are missing persisted artifacts or error metadata.
 */

import { NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { getCurrentUser, hasClinicianRole } from '@/lib/db/supabase.server'
import { executeDiagnosisRun } from '@/lib/diagnosis/worker'
import {
  databaseErrorResponse,
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'
import {
  ARTIFACT_TYPE,
  DIAGNOSIS_ERROR_CODE,
  DIAGNOSIS_RUN_STATUS,
} from '@/lib/contracts/diagnosis'
import { logError, logForbidden, logInfo, logUnauthorized } from '@/lib/logging/logger'

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 500
const DEFAULT_BACKOFF_MS = 750
const DEFAULT_MAX_IDS = 50

const COMPLETED_NO_RESULT_MESSAGE =
  'Diagnosis run completed without persisted result. Marked failed by reconcile.'

const FAILED_WITHOUT_ERROR_MESSAGE =
  'Diagnosis run failed without error details. Reconciled by admin.'

type ReconcileBody = {
  dry_run?: boolean
  limit?: number
  retry?: boolean
  include_failed_without_error?: boolean
  backoff_ms?: number
  max_ids?: number
}

type RunRecord = {
  id: string
  status: string
  retry_count: number
  max_retries: number
  error_code: string | null
  error_message: string | null
  completed_at: string | null
  started_at: string | null
  mcp_run_id: string | null
}

type ArtifactRecord = {
  id: string
  run_id: string
  metadata: Record<string, unknown> | null
}

type ReconcileSummary = {
  dry_run: boolean
  totals: {
    scanned: number
    completed_missing_artifact: number
    failed_missing_error: number
  }
  actions: {
    retried: number
    marked_failed: number
    fixed_error_code: number
    skipped: number
    failed: number
  }
  run_ids: {
    retried: string[]
    marked_failed: string[]
    fixed_error_code: string[]
    failed: string[]
    skipped: string[]
  }
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
  }
  return fallback
}

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function pushCapped(target: string[], value: string, cap: number) {
  if (target.length >= cap) return
  target.push(value)
}

function logReconcileEvent(payload: {
  run_id: string
  action: string
  reason: string
  trace_id?: string | null
  mcp_run_id?: string | null
}) {
  logInfo('DIAG_RUN_RECONCILE', {
    ...payload,
    type: 'diagnosis_reconcile',
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: '/api/admin/diagnosis/reconcile' })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  const isAuthorized = await hasClinicianRole()
  if (!isAuthorized) {
    logForbidden(
      { endpoint: '/api/admin/diagnosis/reconcile', userId: user.id },
      'Not admin or clinician',
    )
    return forbiddenResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  let body: ReconcileBody = {}
  try {
    body = (await request.json()) as ReconcileBody
  } catch {
    body = {}
  }

  const dryRun = parseBoolean(body.dry_run, true)
  const allowRetry = parseBoolean(body.retry, true)
  const includeFailedWithoutError = parseBoolean(body.include_failed_without_error, true)
  const limit = Math.min(parseNumber(body.limit, DEFAULT_LIMIT), MAX_LIMIT)
  const backoffMs = parseNumber(body.backoff_ms, DEFAULT_BACKOFF_MS)
  const maxIds = Math.min(parseNumber(body.max_ids, DEFAULT_MAX_IDS), 200)

  const summary: ReconcileSummary = {
    dry_run: dryRun,
    totals: {
      scanned: 0,
      completed_missing_artifact: 0,
      failed_missing_error: 0,
    },
    actions: {
      retried: 0,
      marked_failed: 0,
      fixed_error_code: 0,
      skipped: 0,
      failed: 0,
    },
    run_ids: {
      retried: [],
      marked_failed: [],
      fixed_error_code: [],
      failed: [],
      skipped: [],
    },
  }

  try {
    const admin = createAdminSupabaseClient()

    const { data: runs, error: runsError } = await admin
      .from('diagnosis_runs')
      .select(
        'id, status, retry_count, max_retries, error_code, error_message, completed_at, started_at, mcp_run_id',
      )
      .in('status', [DIAGNOSIS_RUN_STATUS.COMPLETED, DIAGNOSIS_RUN_STATUS.FAILED])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (runsError) {
      logError('Diagnosis reconcile: failed to load runs', { userId: user.id }, runsError)
      return databaseErrorResponse('Fehler beim Laden der Diagnose-Runs.')
    }

    const typedRuns = (runs ?? []) as RunRecord[]
    summary.totals.scanned = typedRuns.length

    const completedRuns = typedRuns.filter((run) => run.status === DIAGNOSIS_RUN_STATUS.COMPLETED)
    const completedIds = completedRuns.map((run) => run.id)

    let artifactsByRunId = new Map<string, ArtifactRecord>()

    if (completedIds.length > 0) {
      const { data: artifacts, error: artifactsError } = await admin
        .from('diagnosis_artifacts')
        .select('id, run_id, metadata')
        .in('run_id', completedIds)
        .eq('artifact_type', ARTIFACT_TYPE.DIAGNOSIS_JSON)

      if (artifactsError) {
        logError('Diagnosis reconcile: failed to load artifacts', { userId: user.id }, artifactsError)
        return databaseErrorResponse('Fehler beim Laden der Diagnose-Ergebnisse.')
      }

      artifactsByRunId = new Map(
        (artifacts ?? []).map((artifact) => [artifact.run_id, artifact as ArtifactRecord]),
      )
    }

    for (const run of typedRuns) {
      if (run.status === DIAGNOSIS_RUN_STATUS.COMPLETED) {
        const artifact = artifactsByRunId.get(run.id)

        if (artifact) {
          summary.actions.skipped += 1
          pushCapped(summary.run_ids.skipped, run.id, maxIds)
          logReconcileEvent({
            run_id: run.id,
            action: 'skip',
            reason: 'artifact_present',
            trace_id: (artifact.metadata as { trace_id?: string } | null)?.trace_id ?? null,
            mcp_run_id: run.mcp_run_id ?? null,
          })
          continue
        }

        summary.totals.completed_missing_artifact += 1

        const retryEligible =
          allowRetry &&
          Number.isFinite(run.retry_count) &&
          Number.isFinite(run.max_retries) &&
          run.retry_count < run.max_retries

        if (retryEligible) {
          summary.actions.retried += 1
          pushCapped(summary.run_ids.retried, run.id, maxIds)

          logReconcileEvent({
            run_id: run.id,
            action: dryRun ? 'retry_dry_run' : 'retry',
            reason: 'missing_artifact',
            trace_id: null,
            mcp_run_id: run.mcp_run_id ?? null,
          })

          if (!dryRun) {
            const { error: updateError } = await admin
              .from('diagnosis_runs')
              .update({
                status: DIAGNOSIS_RUN_STATUS.QUEUED,
                retry_count: run.retry_count + 1,
                started_at: null,
                completed_at: null,
                error_code: null,
                error_message: null,
                error_details: null,
              })
              .eq('id', run.id)

            if (updateError) {
              summary.actions.failed += 1
              pushCapped(summary.run_ids.failed, run.id, maxIds)
              logError(
                'Diagnosis reconcile: failed to queue run for retry',
                { runId: run.id, userId: user.id },
                updateError,
              )
              continue
            }

            if (backoffMs > 0) {
              await sleep(backoffMs)
            }

            const result = await executeDiagnosisRun(admin, run.id)
            if (!result.success) {
              summary.actions.failed += 1
              pushCapped(summary.run_ids.failed, run.id, maxIds)
              logReconcileEvent({
                run_id: run.id,
                action: 'retry_failed',
                reason: result.error?.code || DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
                trace_id: null,
                mcp_run_id: run.mcp_run_id ?? null,
              })
            }
          }

          continue
        }

        if (run.error_code === DIAGNOSIS_ERROR_CODE.COMPLETED_NO_RESULT) {
          summary.actions.skipped += 1
          pushCapped(summary.run_ids.skipped, run.id, maxIds)
          logReconcileEvent({
            run_id: run.id,
            action: 'skip',
            reason: 'already_classified_no_result',
            trace_id: null,
            mcp_run_id: run.mcp_run_id ?? null,
          })
          continue
        }

        summary.actions.marked_failed += 1
        pushCapped(summary.run_ids.marked_failed, run.id, maxIds)

        logReconcileEvent({
          run_id: run.id,
          action: dryRun ? 'mark_failed_dry_run' : 'mark_failed',
          reason: 'missing_artifact',
          trace_id: null,
          mcp_run_id: run.mcp_run_id ?? null,
        })

        if (!dryRun) {
          const { error: updateError } = await admin
            .from('diagnosis_runs')
            .update({
              status: DIAGNOSIS_RUN_STATUS.FAILED,
              error_code: DIAGNOSIS_ERROR_CODE.COMPLETED_NO_RESULT,
              error_message: COMPLETED_NO_RESULT_MESSAGE,
              completed_at: run.completed_at ?? new Date().toISOString(),
            })
            .eq('id', run.id)

          if (updateError) {
            summary.actions.failed += 1
            pushCapped(summary.run_ids.failed, run.id, maxIds)
            logError(
              'Diagnosis reconcile: failed to mark run without result',
              { runId: run.id, userId: user.id },
              updateError,
            )
          }
        }

        continue
      }

      if (includeFailedWithoutError && run.status === DIAGNOSIS_RUN_STATUS.FAILED) {
        const errorCode = run.error_code?.trim()

        if (!errorCode) {
          summary.totals.failed_missing_error += 1
          summary.actions.fixed_error_code += 1
          pushCapped(summary.run_ids.fixed_error_code, run.id, maxIds)

          logReconcileEvent({
            run_id: run.id,
            action: dryRun ? 'fix_error_code_dry_run' : 'fix_error_code',
            reason: 'missing_error_code',
            trace_id: null,
            mcp_run_id: run.mcp_run_id ?? null,
          })

          if (!dryRun) {
            const { error: updateError } = await admin
              .from('diagnosis_runs')
              .update({
                error_code: DIAGNOSIS_ERROR_CODE.UNKNOWN_ERROR,
                error_message: run.error_message || FAILED_WITHOUT_ERROR_MESSAGE,
                completed_at: run.completed_at ?? new Date().toISOString(),
              })
              .eq('id', run.id)

            if (updateError) {
              summary.actions.failed += 1
              pushCapped(summary.run_ids.failed, run.id, maxIds)
              logError(
                'Diagnosis reconcile: failed to fix missing error code',
                { runId: run.id, userId: user.id },
                updateError,
              )
            }
          }
        } else {
          summary.actions.skipped += 1
          pushCapped(summary.run_ids.skipped, run.id, maxIds)
        }
      }
    }

    return successResponse(summary)
  } catch (error) {
    logError('Diagnosis reconcile: unexpected error', { userId: user.id }, error)
    return internalErrorResponse()
  }
}
