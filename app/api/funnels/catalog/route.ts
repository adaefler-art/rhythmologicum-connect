/**
 * Funnel Catalog API
 * 
 * GET /api/funnels/catalog
 * Returns all active funnels organized by pillar for the catalog view.
 * 
 * Auth: Requires authentication (any role)
 * DB Access: Uses admin client for catalog metadata (documented justification)
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  classifySupabaseError,
  getRequestId,
  withRequestId,
  logError,
} from '@/lib/db/errors'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
  schemaNotReadyResponse,
} from '@/lib/api/responses'
import type { FunnelCatalogResponse, PillarWithFunnels, CatalogFunnel } from '@/lib/types/catalog'

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
export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    // Auth check with server client (RLS active)
    const serverClient = await createServerSupabaseClient()
    const {
      data: { user },
    } = await serverClient.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    /**
     * Admin client usage - DOCUMENTED JUSTIFICATION
     * 
     * Purpose: Fetch funnel catalog metadata
     * Justification: All authenticated users need to see available funnels
     *                regardless of ownership (public metadata)
     * Scope: funnels_catalog, pillars, funnel_versions (metadata only)
     * Mitigation: Only active funnels shown, no PHI in these tables
     */
    const admin = createAdminSupabaseClient()

    // Fetch all pillars ordered by sort_order
    const { data: pillars, error: pillarsError } = await admin
      .from('pillars')
      .select('id, key, title, description, sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (pillarsError) {
      const classified = classifySupabaseError(pillarsError)
      logError({
        requestId,
        operation: 'fetch_pillars',
        error: pillarsError,
        userId: user.id,
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return withRequestId(schemaNotReadyResponse(), requestId)
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        return withRequestId(forbiddenResponse(), requestId)
      }

      return withRequestId(internalErrorResponse('Failed to fetch pillars.'), requestId)
    }

    // Fetch all active funnels with their pillar information
    const { data: funnels, error: funnelsError } = await admin
      .from('funnels_catalog')
      .select(`
        id,
        slug,
        title,
        pillar_id,
        description,
        est_duration_min,
        outcomes,
        is_active,
        default_version_id
      `)
      .eq('is_active', true)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })

    if (funnelsError) {
      const classified = classifySupabaseError(funnelsError)
      logError({
        requestId,
        operation: 'fetch_funnels_catalog',
        error: funnelsError,
        userId: user.id,
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return withRequestId(schemaNotReadyResponse(), requestId)
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        return withRequestId(forbiddenResponse(), requestId)
      }

      return withRequestId(internalErrorResponse('Failed to fetch catalog funnels'), requestId)
    }

    // Fetch default versions for funnels
    const funnelIds = (funnels || []).map((f) => f.id)
    const versionsResult =
      funnelIds.length > 0
        ? await admin
            .from('funnel_versions')
            .select('id, funnel_id, version, is_default')
            .in('funnel_id', funnelIds)
            .eq('is_default', true)
            .order('id', { ascending: true })
        : { data: null, error: null }

    if (versionsResult.error) {
      const classified = classifySupabaseError(versionsResult.error)
      logError({
        requestId,
        operation: 'fetch_funnel_versions',
        error: versionsResult.error,
        userId: user.id,
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return withRequestId(schemaNotReadyResponse(), requestId)
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        return withRequestId(forbiddenResponse(), requestId)
      }

      // Non-critical: continue without version info
    }

    // Create version lookup map
    const versionMap = new Map<string, string>()
    if (versionsResult.data) {
      versionsResult.data.forEach((v) => {
        versionMap.set(v.funnel_id, v.version)
      })
    }

    // Organize funnels by pillar
    const pillarMap = new Map<string, PillarWithFunnels>()
    const uncategorizedFunnels: CatalogFunnel[] = []

    // Initialize pillar map
    if (!pillarsError && pillars) {
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
          subtitle: null, // funnels_catalog doesn't have subtitle
          outcomes: Array.isArray(funnel.outcomes) ? (funnel.outcomes as string[]) : [],
          default_version: versionMap.get(funnel.id) || null,
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

    return withRequestId(successResponse(catalogData), requestId)
  } catch (error) {
    logError({
      requestId,
      operation: 'get_funnel_catalog',
      error,
    })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
