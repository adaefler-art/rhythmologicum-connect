import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { successResponse } from '@/lib/api/responses'
import { ErrorCode } from '@/lib/api/responseTypes'
import { REQUIRED_FUNNEL_SLUGS } from '@/lib/config/requiredFunnelDefinitions'
import { classifySupabaseError, getRequestId, logError, withRequestId } from '@/lib/db/errors'

/**
 * Guardrail: Required funnel definitions must exist in prod.
 * GET /api/admin/diagnostics/required-funnel-definitions
 */

type FunnelCatalogRow = {
  id: string
  slug: string
  is_active: boolean
  default_version_id: string | null
}

type FunnelVersionRow = {
  id: string
  funnel_id: string
  version: string
  status: string
}

type DiagnosticsStatus = 'GREEN' | 'YELLOW' | 'RED'

type GuardrailResponse = {
  diagnosticsVersion: string
  status: DiagnosticsStatus
  requiredSlugs: string[]
  foundSlugs: string[]
  missingSlugs: string[]
  inactiveSlugs: string[]
  missingDefaultVersions: string[]
  missingVersionRows: string[]
  syncAvailable: boolean
  usingAdminClient: boolean
  generatedAt: string
  requestId: string
}

function jsonError(status: number, code: ErrorCode, message: string, requestId: string) {
  return withRequestId(
    NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
          requestId,
        },
      },
      { status },
    ),
    requestId,
  )
}

function resolveStatus(args: {
  missingSlugs: string[]
  missingDefaultVersions: string[]
  missingVersionRows: string[]
  inactiveSlugs: string[]
}): DiagnosticsStatus {
  if (args.missingSlugs.length > 0 || args.missingDefaultVersions.length > 0 || args.missingVersionRows.length > 0) {
    return 'RED'
  }

  if (args.inactiveSlugs.length > 0) {
    return 'YELLOW'
  }

  return 'GREEN'
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  const authClient = await createServerSupabaseClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return jsonError(401, ErrorCode.UNAUTHORIZED, 'Nicht authentifiziert', requestId)
  }

  const hasPermission = await hasAdminOrClinicianRole()
  if (!hasPermission) {
    return jsonError(403, ErrorCode.FORBIDDEN, 'Keine Berechtigung fuer diese Aktion', requestId)
  }

  let readClient
  let usingAdminClient = false

  try {
    readClient = createAdminSupabaseClient()
    usingAdminClient = true
  } catch (error) {
    logError({
      requestId,
      operation: 'create_admin_client',
      userId: user.id,
      error,
    })
    readClient = authClient
  }

  const { data: catalogRows, error: catalogError } = await readClient
    .from('funnels_catalog')
    .select('id, slug, is_active, default_version_id')
    .in('slug', REQUIRED_FUNNEL_SLUGS)

  if (catalogError) {
    const classified = classifySupabaseError(catalogError)
    logError({
      requestId,
      operation: 'fetch_required_funnels',
      error: catalogError,
      userId: user.id,
    })

    if (classified.kind === 'SCHEMA_NOT_READY') {
      return jsonError(
        503,
        ErrorCode.SCHEMA_NOT_READY,
        'Server-Schema ist noch nicht bereit.',
        requestId,
      )
    }

    if (classified.kind === 'AUTH_OR_RLS') {
      return jsonError(403, ErrorCode.FORBIDDEN, 'Keine Berechtigung fuer diese Aktion', requestId)
    }

    return jsonError(500, ErrorCode.DATABASE_ERROR, 'Fehler beim Laden der Funnel-Definitionen', requestId)
  }

  const catalog = (catalogRows ?? []) as FunnelCatalogRow[]
  const foundSlugs = catalog.map((row) => row.slug)
  const missingSlugs = REQUIRED_FUNNEL_SLUGS.filter((slug) => !foundSlugs.includes(slug))
  const inactiveSlugs = catalog.filter((row) => !row.is_active).map((row) => row.slug)
  const missingDefaultVersions = catalog
    .filter((row) => !row.default_version_id)
    .map((row) => row.slug)

  const defaultVersionIds = catalog
    .map((row) => row.default_version_id)
    .filter((id): id is string => Boolean(id))

  let missingVersionRows: string[] = []

  if (defaultVersionIds.length > 0) {
    const { data: versionRows, error: versionError } = await readClient
      .from('funnel_versions')
      .select('id, funnel_id, version, status')
      .in('id', defaultVersionIds)

    if (versionError) {
      const classified = classifySupabaseError(versionError)
      logError({
        requestId,
        operation: 'fetch_required_funnel_versions',
        error: versionError,
        userId: user.id,
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return jsonError(
          503,
          ErrorCode.SCHEMA_NOT_READY,
          'Server-Schema ist noch nicht bereit.',
          requestId,
        )
      }

      return jsonError(500, ErrorCode.DATABASE_ERROR, 'Fehler beim Laden der Funnel-Versionen', requestId)
    }

    const versions = (versionRows ?? []) as FunnelVersionRow[]
    const versionIds = new Set(versions.map((row) => row.id))

    missingVersionRows = catalog
      .filter((row) => row.default_version_id && !versionIds.has(row.default_version_id))
      .map((row) => row.slug)
  }

  const status = resolveStatus({
    missingSlugs,
    missingDefaultVersions,
    missingVersionRows,
    inactiveSlugs,
  })

  const payload: GuardrailResponse = {
    diagnosticsVersion: '1.0.0',
    status,
    requiredSlugs: [...REQUIRED_FUNNEL_SLUGS],
    foundSlugs,
    missingSlugs,
    inactiveSlugs,
    missingDefaultVersions,
    missingVersionRows,
    syncAvailable: false,
    usingAdminClient,
    generatedAt: new Date().toISOString(),
    requestId,
  }

  return successResponse(payload, 200, requestId)
}
