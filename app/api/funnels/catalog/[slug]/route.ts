import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import type { FunnelDetailResponse, CatalogFunnel, FunnelVersion } from '@/lib/types/catalog'
import { getCanonicalFunnelSlug } from '@/lib/contracts/registry'
import { env } from '@/lib/env'

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
  try {
    const { slug } = await params
    const canonicalSlug = getCanonicalFunnelSlug(slug)

    // Create Supabase server client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return unauthorizedResponse()
    }

    // Fetch funnel with pillar information
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select(`
        id,
        slug,
        title,
        subtitle,
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
      console.error('[catalog] Error fetching funnel:', funnelError)
      return notFoundResponse('Funnel', `Funnel with slug "${slug}" not found`)
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
      subtitle: funnel.subtitle,
      description: funnel.description,
      pillar_id: funnel.pillar_id,
      pillar_key: pillarKey,
      pillar_title: pillarTitle,
      est_duration_min: funnel.est_duration_min,
      outcomes: Array.isArray(funnel.outcomes) ? funnel.outcomes : [],
      is_active: funnel.is_active,
      default_version_id: funnel.default_version_id,
    }

    // Fetch all versions for this funnel
    const { data: versions, error: versionsError } = await supabase
      .from('funnel_versions')
      .select('id, funnel_id, version, is_default, is_active')
      .eq('funnel_id', funnel.id)
      .order('version', { ascending: false })

    if (versionsError) {
      console.error('[catalog] Error fetching versions:', versionsError)
      return internalErrorResponse('Failed to fetch funnel versions')
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

    return successResponse(detailData)
  } catch (error) {
    console.error('[catalog] Error in GET /api/funnels/catalog/[slug]:', error)
    return internalErrorResponse()
  }
}
