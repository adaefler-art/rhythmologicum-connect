import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { successResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api/responses'
import type { FunnelCatalogResponse, PillarWithFunnels, CatalogFunnel } from '@/lib/types/catalog'
import { env } from '@/lib/env'

/**
 * GET /api/funnels/catalog
 * 
 * Returns all active funnels organized by pillar for the catalog view.
 * Requires authentication but no special role.
 * 
 * Response structure:
 * {
 *   success: true,
 *   data: {
 *     pillars: [{ pillar: {...}, funnels: [...] }],
 *     uncategorized_funnels: [...]
 *   }
 * }
 */
export async function GET() {
  try {
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

    // Fetch all pillars ordered by sort_order
    const { data: pillars, error: pillarsError } = await supabase
      .from('pillars')
      .select('id, key, title, description, sort_order')
      .order('sort_order', { ascending: true })

    if (pillarsError) {
      console.error('[catalog] Error fetching pillars:', pillarsError)
      return internalErrorResponse('Failed to fetch catalog pillars')
    }

    // Fetch all active funnels with their pillar information
    const { data: funnels, error: funnelsError } = await supabase
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
      .eq('is_active', true)
      .order('title', { ascending: true })

    if (funnelsError) {
      console.error('[catalog] Error fetching funnels:', funnelsError)
      return internalErrorResponse('Failed to fetch catalog funnels')
    }

    // Fetch default versions for funnels
    const funnelIds = (funnels || []).map((f) => f.id)
    const { data: versions, error: versionsError } = await supabase
      .from('funnel_versions')
      .select('id, funnel_id, version, is_default')
      .in('funnel_id', funnelIds)
      .eq('is_default', true)

    if (versionsError) {
      console.error('[catalog] Error fetching versions:', versionsError)
      // Non-critical, continue without version info
    }

    // Create version lookup map
    const versionMap = new Map<string, string>()
    if (versions) {
      versions.forEach((v) => {
        versionMap.set(v.funnel_id, v.version)
      })
    }

    // Organize funnels by pillar
    const pillarMap = new Map<string, PillarWithFunnels>()
    const uncategorizedFunnels: CatalogFunnel[] = []

    // Initialize pillar map
    if (pillars) {
      pillars.forEach((pillar) => {
        pillarMap.set(pillar.id, {
          pillar,
          funnels: [],
        })
      })
    }

    // Distribute funnels to pillars or uncategorized
    if (funnels) {
      funnels.forEach((funnel) => {
        const catalogFunnel: CatalogFunnel = {
          ...funnel,
          outcomes: Array.isArray(funnel.outcomes) ? funnel.outcomes : [],
          default_version: funnel.default_version_id
            ? versionMap.get(funnel.id) || null
            : null,
        }

        if (funnel.pillar_id && pillarMap.has(funnel.pillar_id)) {
          pillarMap.get(funnel.pillar_id)!.funnels.push(catalogFunnel)
        } else {
          uncategorizedFunnels.push(catalogFunnel)
        }
      })
    }

    // Convert map to array, preserving sort order
    const catalogData: FunnelCatalogResponse = {
      pillars: Array.from(pillarMap.values()),
      uncategorized_funnels: uncategorizedFunnels,
    }

    return successResponse(catalogData)
  } catch (error) {
    console.error('[catalog] Error in GET /api/funnels/catalog:', error)
    return internalErrorResponse()
  }
}
