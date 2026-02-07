import 'server-only'

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { sanitizeSupabaseError } from '@/lib/db/errors'

export type SchemaStage = 'boot' | 'migrations' | 'introspection' | 'cache' | 'ready' | 'error'

export type SchemaReadiness = {
  ready: boolean
  stage: SchemaStage
  lastErrorCode?: string
  lastErrorMessage?: string
  lastErrorDetails?: Record<string, unknown>
  dbMigrationStatus?: {
    status: 'unknown' | 'ok' | 'missing' | 'error'
    latestVersion?: string
    appliedCount?: number
  }
  schemaVersion?: string
  checkedAt: string
  attempts: number
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
const CHECK_TIMEOUT_MS = 2500
const CACHE_TTL_MS = 30000

let readinessState: SchemaReadiness = {
  ready: false,
  stage: 'boot',
  checkedAt: new Date(0).toISOString(),
  attempts: 0,
}

let inFlight: Promise<SchemaReadiness> | null = null

function nowIso(): string {
  return new Date().toISOString()
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
    const { data, error } = await client
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

  for (const relation of REQUIRED_RELATIONS) {
    const { error } = await client.from(relation.name).select(relation.select).limit(1)

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
        stage: 'migrations',
        lastErrorCode: 'SCHEMA_BLOCKED_BY_MIGRATIONS',
        lastErrorMessage: errorMessage,
        lastErrorDetails: {
          relation: relationDetails.relation ?? relation.name,
          column: relationDetails.column,
          usingAdminClient,
        },
        dbMigrationStatus,
        schemaVersion: dbMigrationStatus.latestVersion,
        checkedAt: nowIso(),
        attempts: readinessState.attempts + 1,
        requestId,
      }
    }

    if (errorCode === 'PGRST205' || errorMessage.toLowerCase().includes('schema cache')) {
      return {
        ready: false,
        stage: 'cache',
        lastErrorCode: 'SCHEMA_BUILD_FAILED',
        lastErrorMessage: errorMessage,
        lastErrorDetails: {
          relation: relationDetails.relation ?? relation.name,
          usingAdminClient,
        },
        dbMigrationStatus,
        schemaVersion: dbMigrationStatus.latestVersion,
        checkedAt: nowIso(),
        attempts: readinessState.attempts + 1,
        requestId,
      }
    }

    return {
      ready: false,
      stage: 'error',
      lastErrorCode: 'SCHEMA_BUILD_FAILED',
      lastErrorMessage: errorMessage,
      lastErrorDetails: {
        relation: relationDetails.relation ?? relation.name,
        usingAdminClient,
      },
      dbMigrationStatus,
      schemaVersion: dbMigrationStatus.latestVersion,
      checkedAt: nowIso(),
      attempts: readinessState.attempts + 1,
      requestId,
    }
  }

  return {
    ready: true,
    stage: 'ready',
    lastErrorCode: undefined,
    lastErrorMessage: undefined,
    lastErrorDetails: undefined,
    dbMigrationStatus,
    schemaVersion: dbMigrationStatus.latestVersion,
    checkedAt: nowIso(),
    attempts: readinessState.attempts + 1,
    requestId,
  }
}

async function performCheckWithRetries(requestId?: string): Promise<SchemaReadiness> {
  let lastError: SchemaReadiness | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      readinessState = {
        ...readinessState,
        stage: attempt === 1 ? 'introspection' : readinessState.stage,
        attempts: readinessState.attempts + 1,
        checkedAt: nowIso(),
        requestId,
      }

      const result = await withTimeout(runSchemaCheck(requestId), CHECK_TIMEOUT_MS)

      readinessState = result
      return result
    } catch (error) {
      const safeError = sanitizeSupabaseError(error)
      lastError = {
        ready: false,
        stage: 'error',
        lastErrorCode: (error as { code?: string }).code || 'SCHEMA_BUILD_TIMEOUT',
        lastErrorMessage: safeError.message,
        lastErrorDetails: {},
        dbMigrationStatus: readinessState.dbMigrationStatus,
        schemaVersion: readinessState.schemaVersion,
        checkedAt: nowIso(),
        attempts: readinessState.attempts + 1,
        requestId,
      }

      readinessState = lastError

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }
  }

  return lastError ?? readinessState
}

export async function ensureSchemaReadiness(requestId?: string): Promise<SchemaReadiness> {
  if (readinessState.ready && !isStale(readinessState.checkedAt)) {
    return readinessState
  }

  if (inFlight) {
    return inFlight
  }

  inFlight = performCheckWithRetries(requestId).finally(() => {
    inFlight = null
  })

  return inFlight
}

export function getSchemaReadinessSnapshot(): SchemaReadiness {
  return readinessState
}