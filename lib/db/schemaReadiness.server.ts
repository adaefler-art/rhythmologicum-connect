import 'server-only'

import { ErrorCode } from '@/lib/api/responseTypes'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { sanitizeSupabaseError } from '@/lib/db/errors'
import { env } from '@/lib/env'

export type SchemaStage = 'boot' | 'building' | 'ready' | 'error'

export type SchemaReadiness = {
  ready: boolean
  stage: SchemaStage
  stageSince: string
  stages?: SchemaStageResult[]
  lastErrorCode?: string
  lastErrorMessage?: string
  lastErrorDetails?: Record<string, unknown>
  lastErrorAt?: string
  dbMigrationStatus?: {
    status: 'unknown' | 'ok' | 'missing' | 'error'
    latestVersion?: string
    appliedCount?: number
  }
  schemaVersion?: string
  checkedAt: string
  attempts: number
  buildId?: string
  buildAttempts: number
  lastBuildMs?: number
  lastBuildReason?: string
  lastInvalidatedAt?: string
  lastInvalidationReason?: string
  retryAfterMs?: number
  requestId?: string
}

type RelationCheck = {
  name: string
  select: string
}

type SchemaStageName =
  | 'connect_db'
  | 'check_migrations'
  | 'introspect'
  | 'compile_rules'
  | 'warm_queries'

type SchemaStageResult = {
  name: SchemaStageName
  startedAt: string
  elapsedMs: number
  status: 'ok' | 'fail'
  errorCode?: string
  errorMessage?: string
}

const REQUIRED_RELATIONS: RelationCheck[] = [
  { name: 'funnels_catalog', select: 'id' },
  { name: 'funnel_versions', select: 'id' },
  { name: 'triage_cases_v1', select: '*' },
]

const MAX_ATTEMPTS = 3
const ATTEMPT_TIMEOUT_MS = 15000
const STAGE_TIMEOUT_MS = 7000
const CACHE_TTL_MS = 30000
const RETRY_DELAYS_MS = [1000, 2000, 4000]
const THRASH_WINDOW_MS = 60000
const THRASH_LIMIT = 3

let readinessState: SchemaReadiness = {
  ready: false,
  stage: 'boot',
  stageSince: new Date(0).toISOString(),
  checkedAt: new Date(0).toISOString(),
  attempts: 0,
  buildAttempts: 0,
}

let inFlight: Promise<SchemaReadiness> | null = null
let pendingRebuildReason: string | null = null
let invalidationHistory: number[] = []

function nowIso(): string {
  return new Date().toISOString()
}

function getCommitSha(): string {
  return env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || env.COMMIT_SHA || 'unknown'
}

function getRetryDelayMs(attempt: number): number {
  const index = Math.max(0, Math.min(RETRY_DELAYS_MS.length - 1, attempt - 1))
  return RETRY_DELAYS_MS[index]
}

function applyStage(nextStage: SchemaStage) {
  if (readinessState.stage !== nextStage) {
    readinessState = {
      ...readinessState,
      stage: nextStage,
      stageSince: nowIso(),
    }
  }
}

function isStale(lastCheckedAt: string): boolean {
  const lastTime = new Date(lastCheckedAt).getTime()
  return Number.isNaN(lastTime) || Date.now() - lastTime > CACHE_TTL_MS
}

function extractRelationDetails(message: string): { relation?: string; column?: string } {
  const relationMatch = message.match(/relation\s+"([^"]+)"/i)
  const columnMatch = message.match(/column\s+"([^"]+)"/i)

  return {
    relation: relationMatch ? relationMatch[1] : undefined,
    column: columnMatch ? columnMatch[1] : undefined,
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorCode: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const error = new Error('Schema readiness check timed out')
      ;(error as { code?: string }).code = errorCode
      reject(error)
    }, timeoutMs)

    promise
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

async function runStage<T>(
  stages: SchemaStageResult[],
  name: SchemaStageName,
  fn: () => Promise<T>,
  errorCode: ErrorCode,
): Promise<T> {
  const startedAt = nowIso()
  const startedMs = Date.now()

  try {
    const result = await withTimeout(fn(), STAGE_TIMEOUT_MS, errorCode)
    stages.push({
      name,
      startedAt,
      elapsedMs: Date.now() - startedMs,
      status: 'ok',
    })
    return result
  } catch (error) {
    const safeError = sanitizeSupabaseError(error)
    if (!(error as { code?: string }).code) {
      ;(error as { code?: string }).code = errorCode
    }
    stages.push({
      name,
      startedAt,
      elapsedMs: Date.now() - startedMs,
      status: 'fail',
      errorCode: (error as { code?: string }).code ?? errorCode,
      errorMessage: safeError.message,
    })
    throw error
  }
}

async function runSchemaCheck(requestId?: string): Promise<SchemaReadiness> {
  const stages: SchemaStageResult[] = []
  let client: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null
  let usingAdminClient = false
  let dbMigrationStatus: SchemaReadiness['dbMigrationStatus'] = { status: 'unknown' }

  try {
    await runStage(
      stages,
      'connect_db',
      async () => {
        try {
          client = createAdminSupabaseClient()
          usingAdminClient = true
        } catch {
          client = await createServerSupabaseClient()
        }
      },
      ErrorCode.SCHEMA_INTROSPECTION_FAILED,
    )
  } catch (error) {
    const safeError = sanitizeSupabaseError(error)
    return {
      ready: false,
      stage: 'error',
      stageSince: readinessState.stageSince,
      stages,
      lastErrorCode: ErrorCode.SCHEMA_INTROSPECTION_FAILED,
      lastErrorMessage: safeError.message,
      lastErrorDetails: { stage: 'connect_db' },
      lastErrorAt: nowIso(),
      dbMigrationStatus,
      schemaVersion: dbMigrationStatus?.latestVersion,
      checkedAt: nowIso(),
      attempts: readinessState.attempts,
      buildAttempts: readinessState.buildAttempts,
      requestId,
    }
  }

  if (!client) {
    return {
      ready: false,
      stage: 'error',
      stageSince: readinessState.stageSince,
      stages,
      lastErrorCode: ErrorCode.SCHEMA_INTROSPECTION_FAILED,
      lastErrorMessage: 'No database client available',
      lastErrorDetails: { stage: 'connect_db' },
      lastErrorAt: nowIso(),
      dbMigrationStatus,
      schemaVersion: dbMigrationStatus?.latestVersion,
      checkedAt: nowIso(),
      attempts: readinessState.attempts,
      buildAttempts: readinessState.buildAttempts,
      requestId,
    }
  }

  const relationQuery = client as unknown as {
    from: (relation: string) => {
      select: (columns: string) => {
        limit: (count: number) => Promise<{ error: unknown }>
      }
    }
  }

  let migrationMissing = false
  try {
    migrationMissing = await runStage(
      stages,
      'check_migrations',
      async () => {
        for (const relation of REQUIRED_RELATIONS) {
          const { error } = await relationQuery.from(relation.name).select('id').limit(1)
          if (!error) {
            continue
          }
          const safeError = sanitizeSupabaseError(error)
          const message = safeError.message || 'Schema check failed'
          const code = safeError.code
          if (code === '42P01' || code === '42703' || message.includes('does not exist')) {
            return true
          }
        }
        return false
      },
      ErrorCode.SCHEMA_BUILD_TIMEOUT,
    )
  } catch (error) {
    const safeError = sanitizeSupabaseError(error)
    return {
      ready: false,
      stage: 'error',
      stageSince: readinessState.stageSince,
      stages,
      lastErrorCode: (error as { code?: string }).code || ErrorCode.SCHEMA_BUILD_TIMEOUT,
      lastErrorMessage: safeError.message,
      lastErrorDetails: { stage: 'check_migrations' },
      lastErrorAt: nowIso(),
      dbMigrationStatus,
      schemaVersion: dbMigrationStatus?.latestVersion,
      checkedAt: nowIso(),
      attempts: readinessState.attempts,
      buildAttempts: readinessState.buildAttempts,
      requestId,
    }
  }

  if (migrationMissing) {
    dbMigrationStatus = { status: 'missing' }
    return {
      ready: false,
      stage: 'error',
      stageSince: readinessState.stageSince,
      stages,
      lastErrorCode: ErrorCode.SCHEMA_BLOCKED_BY_MIGRATIONS,
      lastErrorMessage: 'Required relations missing',
      lastErrorDetails: { stage: 'check_migrations' },
      lastErrorAt: nowIso(),
      dbMigrationStatus,
      schemaVersion: dbMigrationStatus?.latestVersion,
      checkedAt: nowIso(),
      attempts: readinessState.attempts,
      buildAttempts: readinessState.buildAttempts,
      requestId,
    }
  }

  dbMigrationStatus = { status: 'ok' }

  try {
    await runStage(
      stages,
      'introspect',
      async () => {
        for (const relation of REQUIRED_RELATIONS) {
          const { error } = await relationQuery.from(relation.name).select(relation.select).limit(1)
          if (error) {
            ;(error as { relationName?: string }).relationName = relation.name
            throw error
          }
        }
      },
      ErrorCode.SCHEMA_INTROSPECTION_FAILED,
    )
  } catch (error) {
    const safeError = sanitizeSupabaseError(error)
    const errorMessage = safeError.message || 'Schema check failed'
    const relationDetails = extractRelationDetails(errorMessage)
    const relationName = (error as { relationName?: string }).relationName
    const errorCode = safeError.code

    if (errorCode === 'PGRST205' || errorMessage.toLowerCase().includes('schema cache')) {
      return {
        ready: false,
        stage: 'error',
        stageSince: readinessState.stageSince,
        stages,
        lastErrorCode: ErrorCode.SCHEMA_CACHE_CORRUPT,
        lastErrorMessage: errorMessage,
        lastErrorDetails: {
          stage: 'introspect',
          relation: relationDetails.relation ?? relationName,
          usingAdminClient,
        },
        lastErrorAt: nowIso(),
        dbMigrationStatus,
        schemaVersion: dbMigrationStatus?.latestVersion,
        checkedAt: nowIso(),
        attempts: readinessState.attempts,
        buildAttempts: readinessState.buildAttempts,
        requestId,
      }
    }

    return {
      ready: false,
      stage: 'error',
      stageSince: readinessState.stageSince,
      stages,
      lastErrorCode: ErrorCode.SCHEMA_INTROSPECTION_FAILED,
      lastErrorMessage: errorMessage,
      lastErrorDetails: {
        stage: 'introspect',
        relation: relationDetails.relation ?? relationName,
        usingAdminClient,
      },
      lastErrorAt: nowIso(),
      dbMigrationStatus,
      schemaVersion: dbMigrationStatus?.latestVersion,
      checkedAt: nowIso(),
      attempts: readinessState.attempts,
      buildAttempts: readinessState.buildAttempts,
      requestId,
    }
  }

  await runStage(
    stages,
    'compile_rules',
    async () => {
      return
    },
    ErrorCode.SCHEMA_INTROSPECTION_FAILED,
  )

  await runStage(
    stages,
    'warm_queries',
    async () => {
      return
    },
    ErrorCode.SCHEMA_BUILD_TIMEOUT,
  )

  return {
    ready: true,
    stage: 'ready',
    stageSince: readinessState.stageSince,
    stages,
    lastErrorCode: undefined,
    lastErrorMessage: undefined,
    lastErrorDetails: undefined,
    lastErrorAt: undefined,
    dbMigrationStatus,
    schemaVersion: dbMigrationStatus?.latestVersion,
    checkedAt: nowIso(),
    attempts: readinessState.attempts,
    buildAttempts: readinessState.buildAttempts,
    requestId,
  }
}

async function performCheckWithRetries(requestId?: string, reason?: string): Promise<SchemaReadiness> {
  let lastError: SchemaReadiness | null = null
  const buildStartedAt = Date.now()

  applyStage('building')
  readinessState = {
    ...readinessState,
    buildId: `${getCommitSha()}-${Date.now()}`,
    buildAttempts: 0,
    lastBuildMs: undefined,
    lastBuildReason: reason,
    retryAfterMs: getRetryDelayMs(1),
    requestId,
  }
  const activeBuildId = readinessState.buildId

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      readinessState = {
        ...readinessState,
        attempts: readinessState.attempts + 1,
        buildAttempts: attempt,
        checkedAt: nowIso(),
        requestId,
      }

      const result = await withTimeout(
        runSchemaCheck(requestId),
        ATTEMPT_TIMEOUT_MS,
        ErrorCode.SCHEMA_BUILD_TIMEOUT,
      )
      const shouldRetry =
        !result.ready && result.lastErrorCode !== ErrorCode.SCHEMA_BLOCKED_BY_MIGRATIONS

      if (!result.ready && shouldRetry && attempt < MAX_ATTEMPTS) {
        readinessState = {
          ...readinessState,
          lastErrorCode: result.lastErrorCode,
          lastErrorMessage: result.lastErrorMessage,
          lastErrorDetails: result.lastErrorDetails,
          lastErrorAt: result.lastErrorAt,
          dbMigrationStatus: result.dbMigrationStatus,
          schemaVersion: result.schemaVersion,
          checkedAt: nowIso(),
          retryAfterMs: getRetryDelayMs(attempt),
        }

        await new Promise((resolve) => setTimeout(resolve, getRetryDelayMs(attempt)))
        continue
      }

      if (readinessState.buildId !== activeBuildId) {
        return readinessState
      }

      readinessState = {
        ...readinessState,
        ...result,
        lastBuildMs: Date.now() - buildStartedAt,
        retryAfterMs: undefined,
      }

      applyStage(result.stage)
      return readinessState
    } catch (error) {
      const safeError = sanitizeSupabaseError(error)
      const errorCode =
        (error as { code?: string }).code || ErrorCode.SCHEMA_BUILD_TIMEOUT
      lastError = {
        ready: false,
        stage: 'error',
        stageSince: readinessState.stageSince,
        lastErrorCode: errorCode,
        lastErrorMessage: safeError.message,
        lastErrorDetails: {
          reason: errorCode === ErrorCode.SCHEMA_BUILD_TIMEOUT ? 'attempt_timeout' : 'attempt_error',
        },
        lastErrorAt: nowIso(),
        dbMigrationStatus: readinessState.dbMigrationStatus,
        schemaVersion: readinessState.schemaVersion,
        checkedAt: nowIso(),
        attempts: readinessState.attempts,
        buildAttempts: readinessState.buildAttempts,
        requestId,
        buildId: readinessState.buildId,
        lastBuildMs: Date.now() - buildStartedAt,
        lastBuildReason: readinessState.lastBuildReason,
        retryAfterMs: attempt < MAX_ATTEMPTS ? getRetryDelayMs(attempt) : undefined,
      }

      if (readinessState.buildId !== activeBuildId) {
        return readinessState
      }

      readinessState = {
        ...readinessState,
        ...lastError,
      }

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, getRetryDelayMs(attempt)))
        continue
      }

      applyStage('error')
      return readinessState
    }
  }

  return lastError ?? readinessState
}

type EnsureReadyOptions = {
  reason?: string
  requestId?: string
  nonBlocking?: boolean
}

async function ensureReadyInternal(options?: EnsureReadyOptions): Promise<SchemaReadiness> {
  const reason = options?.reason
  const requestId = options?.requestId

  readinessState = {
    ...readinessState,
    lastBuildReason: reason ?? readinessState.lastBuildReason,
    requestId: requestId ?? readinessState.requestId,
  }

  if (readinessState.ready && !isStale(readinessState.checkedAt)) {
    return readinessState
  }

  if (inFlight) {
    return options?.nonBlocking ? readinessState : inFlight
  }

  inFlight = performCheckWithRetries(requestId, reason).finally(() => {
    inFlight = null
    if (pendingRebuildReason) {
      const nextReason = pendingRebuildReason
      pendingRebuildReason = null
      void ensureReadyInternal({ reason: nextReason, nonBlocking: true })
    }
  })

  return options?.nonBlocking ? readinessState : inFlight
}

function getStatus(): SchemaReadiness {
  return readinessState
}

function invalidate(reason?: string): SchemaReadiness {
  const nextReason = reason ?? 'invalidate'
  pendingRebuildReason = nextReason
  const now = Date.now()
  invalidationHistory = [...invalidationHistory, now].filter(
    (timestamp) => now - timestamp <= THRASH_WINDOW_MS,
  )
  const isThrashing = invalidationHistory.length > THRASH_LIMIT

  readinessState = {
    ...readinessState,
    ready: false,
    stage: 'boot',
    stageSince: nowIso(),
    checkedAt: nowIso(),
    lastErrorCode: isThrashing ? ErrorCode.SCHEMA_THRASHING : undefined,
    lastErrorMessage: isThrashing
      ? 'Schema wurde wiederholt invalidiert. Bitte Ursache beheben.'
      : undefined,
    lastErrorDetails: isThrashing
      ? { windowMs: THRASH_WINDOW_MS, invalidations: invalidationHistory.length }
      : undefined,
    lastErrorAt: isThrashing ? nowIso() : undefined,
    retryAfterMs: undefined,
    lastInvalidatedAt: nowIso(),
    lastInvalidationReason: nextReason,
    buildId: `${getCommitSha()}-${Date.now()}`,
  }

  if (isThrashing) {
    applyStage('error')
  }

  console.warn('[schema-manager] SCHEMA_INVALIDATED', {
    reason: nextReason,
    buildId: readinessState.buildId,
    at: readinessState.lastInvalidatedAt,
  })

  return readinessState
}

export const schemaManager = {
  ensureReady: ensureReadyInternal,
  getStatus,
  invalidate,
}

export async function ensureSchemaReadiness(requestId?: string): Promise<SchemaReadiness> {
  return schemaManager.ensureReady({ requestId })
}

export function getSchemaReadinessSnapshot(): SchemaReadiness {
  return schemaManager.getStatus()
}

void schemaManager.ensureReady({ reason: 'boot', nonBlocking: true })