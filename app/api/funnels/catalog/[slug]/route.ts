import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { getRequestId, withRequestId, logError } from '@/lib/db/errors'
import type { FunnelDetailResponse, CatalogFunnel, FunnelVersion } from '@/lib/types/catalog'
import { getCanonicalFunnelSlug } from '@/lib/contracts/registry'

type Params = {
  params: Promise<{
    slug: string
  }>
}

/**
 * GET /api/funnels/catalog/[slug]
 * 
 * Returns detailed information about a specific funnel including versions.
 * Requires authentication but no special role.
 * 
 * Response structure:
 * {
 *   success: true,
 *   data: {
 *     funnel: {...},
 *     versions: [...],
 *     active_version: {...},
 *     default_version: {...}
 *   }
 * }
 */
export async function GET(request: Request, { params }: Params) {
  const requestId = getRequestId(request)

  try {
    const { slug } = await params
    const canonicalSlug = getCanonicalFunnelSlug(slug)

    // Create Supabase server client (canonical)
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    // Fetch funnel with pillar information
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels_catalog')
      .select(`
        id,
        slug,
        title,
        description,
        pillar_id,
        est_duration_min,
        outcomes,
        is_active,
        default_version_id
      `)
      .eq('slug', canonicalSlug)
      .single()

    if (funnelError || !funnel) {
      logError({
        requestId,
        operation: 'fetch_funnel_detail',
        error: funnelError,
        userId: user.id,
        context: { slug: canonicalSlug },
      })
      return withRequestId(
        notFoundResponse('Funnel', `Funnel with slug "${slug}" not found`),
        requestId,
      )
    }

    // Fetch pillar information if funnel has a pillar_id
    let pillarKey = null
    let pillarTitle = null
    if (funnel.pillar_id) {
      const { data: pillar } = await supabase
        .from('pillars')
        .select('key, title')
        .eq('id', funnel.pillar_id)
        .single()

      if (pillar) {
        pillarKey = pillar.key
        pillarTitle = pillar.title
      }
    }

    // Transform funnel data
    const catalogFunnel: CatalogFunnel = {
      id: funnel.id,
      slug: funnel.slug,
      title: funnel.title,
      subtitle: null, // funnels_catalog doesn't have subtitle
      description: funnel.description,
      pillar_id: funnel.pillar_id,
      pillar_key: pillarKey,
      pillar_title: pillarTitle,
      est_duration_min: funnel.est_duration_min,
      outcomes: Array.isArray(funnel.outcomes) ? funnel.outcomes : [],
      is_active: funnel.is_active,
      default_version_id: funnel.default_version_id,
    }

    // Fetch all versions for this funnel (with deterministic ordering)
    const { data: versions, error: versionsError } = await supabase
      .from('funnel_versions')
      .select('id, funnel_id, version, is_default, is_active')
      .eq('funnel_id', funnel.id)
      .order('version', { ascending: false })
      .order('id', { ascending: true })

    if (versionsError) {
      logError({
        requestId,
        operation: 'fetch_funnel_versions',
        error: versionsError,
        userId: user.id,
        context: { funnelId: funnel.id },
      })
      return withRequestId(
        internalErrorResponse('Failed to fetch funnel versions'),
        requestId,
      )
    }

    // Find active and default versions
    const activeVersion =
      (versions || []).find((v: FunnelVersion) => v.is_active && v.is_default) || null
    const defaultVersion =
      (versions || []).find((v: FunnelVersion) => v.is_default) || null

    // Add default version string to funnel
    if (defaultVersion) {
      catalogFunnel.default_version = defaultVersion.version
    }

    const detailData: FunnelDetailResponse = {
      funnel: catalogFunnel,
      versions: versions || [],
      active_version: activeVersion,
      default_version: defaultVersion,
    }

    return withRequestId(successResponse(detailData), requestId)
  } catch (error) {
    logError({
      requestId,
      operation: 'get_funnel_catalog_detail',
      error,
    })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
