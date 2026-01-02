import { env } from '@/lib/env'
import {
  successResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { getRequestId, withRequestId, isBlank } from '@/lib/db/errors'
import { NextResponse } from 'next/server'
import { ErrorCode } from '@/lib/api/responseTypes'

/**
 * B7 API Endpoint: List all funnels for admin/clinician management
 * GET /api/admin/funnels
 * 
 * Returns all funnels with basic metadata for overview page
 */

function getSupabaseErrorFields(error: unknown): {
  code?: unknown
  message?: unknown
  details?: unknown
  hint?: unknown
} {
  if (!error || typeof error !== 'object') return {}
  const record = error as Record<string, unknown>
  return {
    code: record.code,
    message: record.message,
    details: record.details,
    hint: record.hint,
  }
}

function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  requestId: string,
) {
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

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const publicSupabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const publicSupabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isBlank(publicSupabaseUrl) || isBlank(publicSupabaseAnonKey)) {
      console.error('[DB_ERROR]', {
        requestId,
        operation: 'env_check',
        error: {
          code: 'CONFIG',
          message: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
          details: null,
          hint: null,
        },
      })

      return jsonError(
        500,
        ErrorCode.INTERNAL_ERROR,
        'Failed to load admin funnels.',
        requestId,
      )
    }

    const authClient = await createServerSupabaseClient()

    // Auth gate (must run before any DB calls)
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return jsonError(
        401,
        ErrorCode.UNAUTHORIZED,
        'Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.',
        requestId,
      )
    }

    // Authorization gate (reuse canonical clinician/admin check)
    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      return jsonError(
        403,
        ErrorCode.FORBIDDEN,
        'Sie haben keine Berechtigung für diese Aktion.',
        requestId,
      )
    }

    // Use admin client for cross-user query (metadata tables only)
    // Justification: Clinicians need to view/manage all funnels, not just their own
    // Try to use admin client if service key is available, otherwise fall back to auth client
    let readClient
    try {
      readClient = createAdminSupabaseClient()
    } catch (err) {
      // Service key not configured, fall back to auth client
      console.warn({ requestId, message: 'Service key not configured, using auth client for admin funnels' })
      readClient = authClient
    }

    const { data: pillars, error: pillarsError } = await readClient
      .from('pillars')
      .select('id,key,title,description,sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (pillarsError) {
      console.error('[DB_ERROR]', {
        requestId,
        operation: 'fetch_pillars',
        userId: user.id,
        error: getSupabaseErrorFields(pillarsError),
      })

      return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to load admin funnels.', requestId)
    }

    const { data: funnels, error: funnelsError } = await readClient
      .from('funnels_catalog')
      .select(
        'id,slug,title,description,pillar_id,est_duration_min,outcomes,is_active,default_version_id,created_at,updated_at',
      )
      .order('title', { ascending: true })
      .order('slug', { ascending: true })

    if (funnelsError) {
      console.error('[DB_ERROR]', {
        requestId,
        operation: 'fetch_funnels_catalog',
        userId: user.id,
        error: getSupabaseErrorFields(funnelsError),
      })

      return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to load admin funnels.', requestId)
    }

    const funnelIds = (funnels ?? []).map((f) => f.id)

    const defaultVersionLookup = new Map<string, string>()
    if (funnelIds.length > 0) {
      const { data: versions, error: versionsError } = await readClient
        .from('funnel_versions')
        .select('id,version,funnel_id')
        .in('funnel_id', funnelIds)
        .order('id', { ascending: true })

      if (versionsError) {
        console.error('[DB_ERROR]', {
          requestId,
          operation: 'fetch_funnel_versions',
          userId: user.id,
          error: getSupabaseErrorFields(versionsError),
        })

        return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to load admin funnels.', requestId)
      }

      ;(versions ?? []).forEach((v) => {
        defaultVersionLookup.set(v.id, v.version)
      })
    }

    const funnelsWithVersions = (funnels ?? []).map((f) => ({
      ...f,
      subtitle: null,
      outcomes: Array.isArray(f.outcomes) ? f.outcomes : [],
      default_version: f.default_version_id
        ? (defaultVersionLookup.get(f.default_version_id) ?? null)
        : null,
    }))

    const pillarById = new Map(
      (pillars ?? []).map((p) => [
        p.id,
        {
          pillar: p,
          funnels: [] as typeof funnelsWithVersions,
        },
      ]),
    )

    const uncategorized: typeof funnelsWithVersions = []
    for (const funnel of funnelsWithVersions) {
      if (!funnel.pillar_id) {
        uncategorized.push(funnel)
        continue
      }
      const bucket = pillarById.get(funnel.pillar_id)
      if (!bucket) {
        uncategorized.push(funnel)
        continue
      }
      bucket.funnels.push(funnel)
    }

    const pillarGroups = Array.from(pillarById.values())

    return withRequestId(
      successResponse({
        pillars: pillarGroups,
        uncategorized_funnels: uncategorized,
      }),
      requestId,
    )
  } catch (error) {
    console.error('[DB_ERROR]', {
      requestId,
      operation: 'get_admin_funnels',
      error: getSupabaseErrorFields(error),
    })

    return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to load admin funnels.', requestId)
  }
}
