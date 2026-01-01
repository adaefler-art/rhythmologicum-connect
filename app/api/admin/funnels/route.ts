import { env } from '@/lib/env'
import {
  configurationErrorResponse,
  forbiddenResponse,
  internalErrorResponse,
  schemaNotReadyResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { classifySupabaseError, sanitizeSupabaseError, getRequestId, withRequestId, isBlank } from '@/lib/db/errors'

/**
 * B7 API Endpoint: List all funnels for admin/clinician management
 * GET /api/admin/funnels
 * 
 * Returns all funnels with basic metadata for overview page
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const publicSupabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const publicSupabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isBlank(publicSupabaseUrl) || isBlank(publicSupabaseAnonKey)) {
      return withRequestId(
        configurationErrorResponse(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        ),
        requestId,
      )
    }

    // Check authentication and authorization using canonical helpers
    const authClient = await createServerSupabaseClient()
    
    if (!(await hasClinicianRole())) {
      const {
        data: { user },
      } = await authClient.auth.getUser()
      
      if (!user) {
        return withRequestId(unauthorizedResponse(), requestId)
      }
      
      return withRequestId(forbiddenResponse(), requestId)
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
      const safeErr = sanitizeSupabaseError(pillarsError)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      if (classified.kind === 'AUTH_OR_RLS') {
        console.warn({ requestId, supabaseError: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      console.error({ requestId, supabaseError: safeErr })
      return withRequestId(internalErrorResponse('Failed to fetch pillars.'), requestId)
    }

    const { data: funnels, error: funnelsError } = await readClient
      .from('funnels_catalog')
      .select(
        'id,slug,title,description,pillar_id,est_duration_min,outcomes,is_active,default_version_id,created_at,updated_at',
      )
      .order('title', { ascending: true })
      .order('slug', { ascending: true })

    if (funnelsError) {
      const safeErr = sanitizeSupabaseError(funnelsError)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      if (classified.kind === 'AUTH_OR_RLS') {
        console.warn({ requestId, supabaseError: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      console.error({ requestId, supabaseError: safeErr })
      return withRequestId(internalErrorResponse('Failed to fetch funnels.'), requestId)
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
        const safeErr = sanitizeSupabaseError(versionsError)
        const classified = classifySupabaseError(safeErr)

        if (classified.kind === 'SCHEMA_NOT_READY') {
          console.error({ requestId, supabaseError: safeErr })
          return withRequestId(schemaNotReadyResponse(), requestId)
        }

        if (classified.kind === 'AUTH_OR_RLS') {
          console.warn({ requestId, supabaseError: safeErr })
          return withRequestId(forbiddenResponse(), requestId)
        }

        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(internalErrorResponse('Failed to fetch funnel versions.'), requestId)
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
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, supabaseError: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
