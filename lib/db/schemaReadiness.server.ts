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

const REQUIRED_RELATIONS: RelationCheck[] = [
  { name: 'funnels_catalog', select: 'id' },
  { name: 'funnel_versions', select: 'id' },
  { name: 'triage_cases_v1', select: '*' },
]

const MAX_ATTEMPTS = 3
const CHECK_TIMEOUT_MS = 10000
const CACHE_TTL_MS = 30000
const RETRY_DELAYS_MS = [1000, 2000, 4000]

let readinessState: SchemaReadiness = {
  ready: false,
  stage: 'boot',
  stageSince: new Date(0).toISOString(),
  checkedAt: new Date(0).toISOString(),
  attempts: 0,
  buildAttempts: 0,
}

let inFlight: Promise<SchemaReadiness> | null = null

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const error = new Error('Schema readiness check timed out')
      ;(error as { code?: string }).code = 'SCHEMA_BUILD_TIMEOUT'
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

async function getMigrationStatus(client: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  try {
    const adminQuery = client as unknown as {
      from: (relation: string) => {
        select: (columns: string) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (count: number) => Promise<{ data: { version: string }[] | null; error: unknown }>
          }
        }
      }
    }

    const { data, error } = await adminQuery
      .from('supabase_migrations.schema_migrations')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)

    if (error) {
      return { status: 'error' as const }
    }

    if (!data || data.length === 0) {
      return { status: 'missing' as const }
    }

    return { status: 'ok' as const, latestVersion: data[0].version, appliedCount: data.length }
  } catch {
    return { status: 'unknown' as const }
  }
}

async function runSchemaCheck(requestId?: string): Promise<SchemaReadiness> {
  let client: Awaited<ReturnType<typeof createServerSupabaseClient>>
  let usingAdminClient = false

  try {
    client = createAdminSupabaseClient()
    usingAdminClient = true
  } catch {
    client = await createServerSupabaseClient()
  }

  const dbMigrationStatus = await getMigrationStatus(client)
  const relationQuery = client as unknown as {
    from: (relation: string) => {
      select: (columns: string) => {
        limit: (count: number) => Promise<{ error: unknown }>
      }
    }
  }

  for (const relation of REQUIRED_RELATIONS) {
    const { error } = await relationQuery.from(relation.name).select(relation.select).limit(1)

    if (!error) {
      continue
    }

    const safeError = sanitizeSupabaseError(error)
    const errorMessage = safeError.message || 'Schema check failed'
    const relationDetails = extractRelationDetails(errorMessage)
    const errorCode = safeError.code

    if (errorCode === '42P01' || errorCode === '42703' || errorMessage.includes('does not exist')) {
      return {
        ready: false,
        stage: 'error',
        stageSince: readinessState.stageSince,
        lastErrorCode: ErrorCode.SCHEMA_BLOCKED_BY_MIGRATIONS,
        lastErrorMessage: errorMessage,
        lastErrorDetails: {
          relation: relationDetails.relation ?? relation.name,
          column: relationDetails.column,
          usingAdminClient,
        },
        lastErrorAt: nowIso(),
        dbMigrationStatus,
        schemaVersion: dbMigrationStatus.latestVersion,
        checkedAt: nowIso(),
        attempts: readinessState.attempts,
        buildAttempts: readinessState.buildAttempts,
        requestId,
      }
    }

    if (errorCode === 'PGRST205' || errorMessage.toLowerCase().includes('schema cache')) {
      return {
        ready: false,
        stage: 'error',
        stageSince: readinessState.stageSince,
        lastErrorCode: ErrorCode.SCHEMA_CACHE_CORRUPT,
        lastErrorMessage: errorMessage,
        lastErrorDetails: {
          relation: relationDetails.relation ?? relation.name,
          usingAdminClient,
        },
        lastErrorAt: nowIso(),
        dbMigrationStatus,
        schemaVersion: dbMigrationStatus.latestVersion,
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
      lastErrorCode: ErrorCode.SCHEMA_INTROSPECTION_FAILED,
      lastErrorMessage: errorMessage,
      lastErrorDetails: {
        relation: relationDetails.relation ?? relation.name,
        usingAdminClient,
      },
      lastErrorAt: nowIso(),
      dbMigrationStatus,
      schemaVersion: dbMigrationStatus.latestVersion,
      checkedAt: nowIso(),
      attempts: readinessState.attempts,
      buildAttempts: readinessState.buildAttempts,
      requestId,
    }
  }

  return {
    ready: true,
    stage: 'ready',
    stageSince: readinessState.stageSince,
    lastErrorCode: undefined,
    lastErrorMessage: undefined,
    lastErrorDetails: undefined,
    lastErrorAt: undefined,
    dbMigrationStatus,
    schemaVersion: dbMigrationStatus.latestVersion,
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
    retryAfterMs: undefined,
    requestId,
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      readinessState = {
        ...readinessState,
        attempts: readinessState.attempts + 1,
        buildAttempts: attempt,
        checkedAt: nowIso(),
        requestId,
      }

      const result = await withTimeout(runSchemaCheck(requestId), CHECK_TIMEOUT_MS)
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
        lastErrorDetails: {},
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
        stageSince: readinessState.stageSince,
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
  })

  return options?.nonBlocking ? readinessState : inFlight
}

function getStatus(): SchemaReadiness {
  return readinessState
}

function invalidate(reason?: string): SchemaReadiness {
  readinessState = {
    ...readinessState,
    ready: false,
    stage: 'boot',
    stageSince: nowIso(),
    checkedAt: nowIso(),
    lastErrorCode: undefined,
    lastErrorMessage: undefined,
    lastErrorDetails: undefined,
    lastErrorAt: undefined,
    retryAfterMs: undefined,
    lastInvalidatedAt: nowIso(),
    lastInvalidationReason: reason,
  }

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