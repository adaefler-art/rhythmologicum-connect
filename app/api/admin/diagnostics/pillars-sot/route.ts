import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { hasAdminOrClinicianRole, getCurrentUser } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { env } from '@/lib/env'
import { logInfo, logUnauthorized, logForbidden } from '@/lib/logging/logger'
import { FUNNEL_SLUG, PILLAR_KEY } from '@/lib/contracts/registry'
import { randomUUID } from 'crypto'

/**
 * TV05_01B: Pillar/Catalog Source-of-Truth Audit Endpoint
 * GET /api/admin/diagnostics/pillars-sot
 *
 * Returns comprehensive diagnostic information about:
 * - Supabase instance configuration
 * - Table existence and properties (pillars, funnels_catalog, funnel_versions)
 * - Row counts and seed data verification
 * - RLS and policy configuration
 *
 * Authentication:
 * - unauth → 401
 * - non-admin/clinician → 403
 *
 * Response: PHI-free, machine-readable JSON with stable schema
 */

interface TableMetadata {
  exists: boolean
  relkind?: string // 'r' = table, 'v' = view
  relrowsecurity?: boolean
  policyCount?: number
}

interface TableDiagnostics {
  metadata: TableMetadata
  rowCount?: number
}

interface DiagnosticsFinding {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  suggestion?: string
}

interface PillarsSotAuditResponse {
  diagnosticsVersion: string // Schema version for stability
  status: 'GREEN' | 'YELLOW' | 'RED' // Overall health status
  findings: DiagnosticsFinding[]
  environment: {
    supabaseUrl: string // redacted to domain only
    envName: string
    hasSupabaseServiceRoleKey: boolean
    hasSupabaseAnonKey: boolean
  }
  tables: {
    pillars: TableDiagnostics
    funnels_catalog: TableDiagnostics
    funnel_versions: TableDiagnostics
  }
  seeds: {
    stressFunnelPresent: boolean
    pillarCount: number
    expectedPillarCount: number
  }
  generatedAt: string
  requestId: string
}

type DiagnosticsPillarsSotRpcResult = {
  pillars?: {
    exists?: boolean
    relkind?: string
    relrowsecurity?: boolean
    policyCount?: number
    rowCount?: number
  }
  funnels_catalog?: {
    exists?: boolean
    relkind?: string
    relrowsecurity?: boolean
    policyCount?: number
    rowCount?: number
    stressFunnelExists?: boolean
  }
  funnel_versions?: {
    exists?: boolean
    relkind?: string
    relrowsecurity?: boolean
    policyCount?: number
    rowCount?: number
  }
}

/**
 * Redact URL to show only domain (PHI-free, no project refs or tokens)
 *
 * @param url - Full URL to redact
 * @returns string - Redacted URL showing only protocol and host
 */
function redactUrl(url: string | undefined): string {
  if (!url) return 'NOT_SET'
  try {
    const parsed = new URL(url)
    // Only return protocol + host, no paths or query params that might contain tokens
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return 'INVALID_URL'
  }
}

/**
 * Get environment name from Vercel or other indicators
 *
 * @returns string - Environment name (production, test, development)
 */
function getEnvironmentName(): string {
  const vercelEnv = env.VERCEL_ENV
  if (vercelEnv) return vercelEnv

  const nodeEnv = env.NODE_ENV
  if (nodeEnv === 'production') return 'production'
  if (nodeEnv === 'test') return 'test'
  return 'development'
}

/**
 * Calculate overall health status based on findings
 */
function calculateStatus(findings: DiagnosticsFinding[]): 'GREEN' | 'YELLOW' | 'RED' {
  const hasErrors = findings.some((f) => f.type === 'error')
  const hasWarnings = findings.some((f) => f.type === 'warning')

  if (hasErrors) return 'RED'
  if (hasWarnings) return 'YELLOW'
  return 'GREEN'
}

/**
 * Get expected pillar count from registry
 */
function getExpectedPillarCount(): number {
  return Object.keys(PILLAR_KEY).length
}

export async function GET() {
  const requestId = randomUUID()

  try {
    // Auth gate: must be authenticated
    const user = await getCurrentUser()

    if (!user) {
      logUnauthorized({ endpoint: '/api/admin/diagnostics/pillars-sot', requestId })
      return unauthorizedResponse()
    }

    // Authorization gate: must be admin or clinician
    const isAuthorized = await hasAdminOrClinicianRole()

    if (!isAuthorized) {
      logForbidden(
        { endpoint: '/api/admin/diagnostics/pillars-sot', userId: user.id, requestId },
        'non-admin user',
      )
      return forbiddenResponse()
    }

    const findings: DiagnosticsFinding[] = []

    // Gather environment information
    const environment = {
      supabaseUrl: redactUrl(env.NEXT_PUBLIC_SUPABASE_URL),
      envName: getEnvironmentName(),
      hasSupabaseServiceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // Check for missing environment variables
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      findings.push({
        type: 'error',
        code: 'MISSING_SERVICE_ROLE_KEY',
        message: 'SUPABASE_SERVICE_ROLE_KEY environment variable is not set',
        suggestion: 'Set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables or .env.local',
      })
    }

    if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      findings.push({
        type: 'error',
        code: 'MISSING_ANON_KEY',
        message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set',
        suggestion: 'Set NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables or .env.local',
      })
    }

    // Query database diagnostics using RPC function
    const adminClient = createAdminSupabaseClient()
    const rpc = (adminClient as unknown as {
      rpc: (
        fn: string,
      ) => Promise<{ data: DiagnosticsPillarsSotRpcResult | null; error: { message: string } | null }>
    }).rpc

    const { data: dbDiagnostics, error: rpcError } = await rpc('diagnostics_pillars_sot')

    if (rpcError) {
      findings.push({
        type: 'error',
        code: 'RPC_FUNCTION_ERROR',
        message: `Failed to call diagnostics_pillars_sot RPC: ${rpcError.message}`,
        suggestion: 'Ensure migration 20260102140000_create_diagnostics_pillars_sot_function.sql has been applied',
      })

      // Return 200 with RED status and findings (not 500)
      return successResponse({
        diagnosticsVersion: '1.0.0',
        status: 'RED' as const,
        findings,
        environment,
        tables: {
          pillars: { metadata: { exists: false } },
          funnels_catalog: { metadata: { exists: false } },
          funnel_versions: { metadata: { exists: false } },
        },
        seeds: {
          stressFunnelPresent: false,
          pillarCount: 0,
          expectedPillarCount: getExpectedPillarCount(),
        },
        generatedAt: new Date().toISOString(),
        requestId,
      })
    }

    // Parse database diagnostics
    const diagnostics = dbDiagnostics ?? {}
    const pillarsData = diagnostics.pillars ?? {}
    const catalogData = diagnostics.funnels_catalog ?? {}
    const versionsData = diagnostics.funnel_versions ?? {}

    // Build table diagnostics
    const tables = {
      pillars: {
        metadata: {
          exists: pillarsData.exists ?? false,
          relkind: pillarsData.relkind,
          relrowsecurity: pillarsData.relrowsecurity,
          policyCount: pillarsData.policyCount,
        },
        rowCount: pillarsData.exists ? pillarsData.rowCount : undefined,
      },
      funnels_catalog: {
        metadata: {
          exists: catalogData.exists ?? false,
          relkind: catalogData.relkind,
          relrowsecurity: catalogData.relrowsecurity,
          policyCount: catalogData.policyCount,
        },
        rowCount: catalogData.exists ? catalogData.rowCount : undefined,
      },
      funnel_versions: {
        metadata: {
          exists: versionsData.exists ?? false,
          relkind: versionsData.relkind,
          relrowsecurity: versionsData.relrowsecurity,
          policyCount: versionsData.policyCount,
        },
        rowCount: versionsData.exists ? versionsData.rowCount : undefined,
      },
    }

    // Build seeds diagnostics (using canonical values from registry)
    const expectedPillarCount = getExpectedPillarCount()
    const pillarCount = pillarsData.rowCount || 0
    const stressFunnelPresent = catalogData.stressFunnelExists ?? false

    const seeds = {
      stressFunnelPresent,
      pillarCount,
      expectedPillarCount,
    }

    // Add findings for missing tables
    if (!tables.pillars.metadata.exists) {
      findings.push({
        type: 'error',
        code: 'TABLE_MISSING_PILLARS',
        message: 'Table public.pillars does not exist',
        suggestion: 'Run migration: supabase db push or apply 20251231142000_create_funnel_catalog.sql',
      })
    }

    if (!tables.funnels_catalog.metadata.exists) {
      findings.push({
        type: 'error',
        code: 'TABLE_MISSING_CATALOG',
        message: 'Table public.funnels_catalog does not exist',
        suggestion: 'Run migration: supabase db push or apply V05 core schema migrations',
      })
    }

    if (!tables.funnel_versions.metadata.exists) {
      findings.push({
        type: 'error',
        code: 'TABLE_MISSING_VERSIONS',
        message: 'Table public.funnel_versions does not exist',
        suggestion: 'Run migration: supabase db push or apply V05 core schema migrations',
      })
    }

    // Add findings for missing seed data
    if (pillarCount !== expectedPillarCount) {
      findings.push({
        type: 'warning',
        code: 'SEED_PILLAR_COUNT_MISMATCH',
        message: `Expected ${expectedPillarCount} pillars, found ${pillarCount}`,
        suggestion: 'Re-run migration 20251231142000_create_funnel_catalog.sql to seed canonical 7 pillars',
      })
    }

    if (!stressFunnelPresent && tables.funnels_catalog.metadata.exists) {
      findings.push({
        type: 'warning',
        code: 'SEED_STRESS_FUNNEL_MISSING',
        message: `Stress funnel (slug: '${FUNNEL_SLUG.STRESS_ASSESSMENT}') not found in funnels_catalog`,
        suggestion: 'Re-run migration 20251231142000_create_funnel_catalog.sql to seed stress funnel',
      })
    }

    // Add findings for missing RLS policies
    if (tables.pillars.metadata.exists && (tables.pillars.metadata.policyCount || 0) === 0) {
      findings.push({
        type: 'warning',
        code: 'RLS_POLICIES_MISSING_PILLARS',
        message: 'No RLS policies found for public.pillars',
        suggestion: 'Apply RLS policies migration or check policy configuration',
      })
    }

    const response: PillarsSotAuditResponse = {
      diagnosticsVersion: '1.0.0',
      status: calculateStatus(findings),
      findings,
      environment,
      tables,
      seeds,
      generatedAt: new Date().toISOString(),
      requestId,
    }

    logInfo('Pillars SOT audit accessed', {
      endpoint: '/api/admin/diagnostics/pillars-sot',
      userId: user.id,
      requestId,
      status: response.status,
      findingsCount: findings.length,
    })

    return successResponse(response)
  } catch (error) {
    console.error('[admin/diagnostics/pillars-sot] Error running audit (requestId: ' + requestId + '):', error)
    // Return 500 with no secrets/PHI
    return internalErrorResponse()
  }
}
