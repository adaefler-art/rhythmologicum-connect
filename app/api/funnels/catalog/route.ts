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
import {
  classifySupabaseError,
  getRequestId,
  withRequestId,
  logError,
} from '@/lib/db/errors'
import {
  successResponse,
} from '@/lib/api/responses'
import type { FunnelCatalogResponse, PillarWithFunnels, CatalogFunnel } from '@/lib/types/catalog'
import { env } from '@/lib/env'
import { NextResponse } from 'next/server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getTierContract } from '@/lib/contracts/tiers'
import { getActivePillars, getAllowedFunnels } from '@/lib/contracts/programTier'
import { isValidProgramTier } from '@/lib/contracts/registry'

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function errorResponseWithRequestId(
  code: ErrorCode,
  message: string,
  status: number,
  requestId: string,
) {
  return withRequestId(
    NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
        },
        requestId,
      },
      { status },
    ),
    requestId,
  )
}

function getSupabaseErrorLogFields(error: unknown): {
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

/**
 * GET /api/funnels/catalog
 * 
 * Returns all active funnels organized by pillar for the catalog view.
 * Requires authentication but no special role.
 * 
 * Query Parameters:
 * - tier (optional): Filter by program tier (e.g., 'tier-1-essential')
 * 
 * Response structure:
 * {
 *   success: true,
 *   data: {
 *     pillars: [{ pillar: {...}, funnels: [...] }],
 *     uncategorized_funnels: [...],
 *     tier: 'tier-1-essential' (if tier filter applied)
 *   }
 * }
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request)
  
  // Parse query parameters
  const url = new URL(request.url)
  const tierParam = url.searchParams.get('tier')

  try {
    // Early deterministic configuration guard (do not construct clients)
    if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return errorResponseWithRequestId(
        ErrorCode.CONFIGURATION_ERROR,
        'Supabase Konfiguration fehlt oder ist leer.',
        500,
        requestId,
      )
    }

    // Auth check with server client (RLS active)
    const serverClient = await createServerSupabaseClient()
    const {
      data: { user },
    } = await serverClient.auth.getUser()

    if (!user) {
      return errorResponseWithRequestId(
        ErrorCode.UNAUTHORIZED,
        'Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.',
        401,
        requestId,
      )
    }

    // IMPORTANT: Only use the authenticated cookie/JWT server client.
    // RLS remains active and auth.role() should be authenticated.
    const dataClient = serverClient

    // Check if tier filtering is requested
    let tierContract = null
    let activePillarKeys: string[] | null = null
    let allowedFunnelSlugs: string[] | null = null
    
    if (tierParam) {
      // Validate tier parameter
      if (!isValidProgramTier(tierParam)) {
        return errorResponseWithRequestId(
          ErrorCode.VALIDATION_FAILED,
          `Ungültiger Tier-Parameter: '${tierParam}'. Erlaubte Werte: tier-1-essential, tier-2-5-enhanced, tier-2-comprehensive`,
          422,
          requestId,
        )
      }
      
      tierContract = getTierContract(tierParam)
      if (tierContract) {
        activePillarKeys = getActivePillars(tierContract)
        allowedFunnelSlugs = getAllowedFunnels(tierContract)
      }
    }

    // Fetch all pillars ordered by sort_order
    const { data: pillars, error: pillarsError } = await dataClient
      .from('pillars')
      .select('id, key, title, description, sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (pillarsError) {
      const classified = classifySupabaseError(pillarsError)

      // Requirement: full server-side error logging with code/message/details/hint.
      logError({
        requestId,
        operation: 'fetch_pillars',
        error: pillarsError,
        userId: user.id,
        supabase: getSupabaseErrorLogFields(pillarsError),
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return errorResponseWithRequestId(
          ErrorCode.SCHEMA_NOT_READY,
          'Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut.',
          503,
          requestId,
        )
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        return errorResponseWithRequestId(
          ErrorCode.FORBIDDEN,
          'Sie haben keine Berechtigung für diese Aktion.',
          403,
          requestId,
        )
      }

      return errorResponseWithRequestId(
        ErrorCode.INTERNAL_ERROR,
        'Failed to fetch pillars.',
        500,
        requestId,
      )
    }

    // Fetch all active funnels with their pillar information
    const { data: funnels, error: funnelsError } = await dataClient
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
        supabase: getSupabaseErrorLogFields(funnelsError),
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return errorResponseWithRequestId(
          ErrorCode.SCHEMA_NOT_READY,
          'Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut.',
          503,
          requestId,
        )
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        return errorResponseWithRequestId(
          ErrorCode.FORBIDDEN,
          'Sie haben keine Berechtigung für diese Aktion.',
          403,
          requestId,
        )
      }

      return errorResponseWithRequestId(
        ErrorCode.INTERNAL_ERROR,
        'Failed to fetch catalog funnels',
        500,
        requestId,
      )
    }

    // V05-FIXOPT-01: Check which funnels have full definitions in the funnels table
    // This determines availability status (available vs coming_soon)
    const funnelSlugs = (funnels || []).map((f) => f.slug)
    const definedFunnelsResult =
      funnelSlugs.length > 0
        ? await dataClient
            .from('funnels')
            .select('slug')
            .in('slug', funnelSlugs)
        : { data: null, error: null }

    const definedSlugs = new Set<string>()
    if (definedFunnelsResult.data) {
      definedFunnelsResult.data.forEach((f) => {
        definedSlugs.add(f.slug)
      })
    }

    // Fetch default versions for funnels
    const funnelIds = (funnels || []).map((f) => f.id)
    const versionsResult =
      funnelIds.length > 0
        ? await dataClient
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
        supabase: getSupabaseErrorLogFields(versionsResult.error),
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return errorResponseWithRequestId(
          ErrorCode.SCHEMA_NOT_READY,
          'Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut.',
          503,
          requestId,
        )
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        return errorResponseWithRequestId(
          ErrorCode.FORBIDDEN,
          'Sie haben keine Berechtigung für diese Aktion.',
          403,
          requestId,
        )
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

    // Initialize pillar map (filter by tier if specified)
    if (!pillarsError && pillars) {
      pillars.forEach((pillar) => {
        // If tier filtering is active, only include active pillars
        if (activePillarKeys && !activePillarKeys.includes(pillar.key)) {
          return // Skip inactive pillars for this tier
        }
        
        pillarMap.set(pillar.id, {
          pillar,
          funnels: [],
        })
      })
    }

    // Distribute funnels to pillars or uncategorized
    if (funnels) {
      funnels.forEach((funnel) => {
        // If tier filtering is active, only include allowed funnels
        if (allowedFunnelSlugs && !allowedFunnelSlugs.includes(funnel.slug)) {
          return // Skip funnels not allowed in this tier
        }
        
        // V05-FIXOPT-01: Determine availability based on whether funnel has full definition
        const availability = definedSlugs.has(funnel.slug) ? 'available' : 'coming_soon'
        
        const catalogFunnel: CatalogFunnel = {
          ...funnel,
          subtitle: null, // funnels_catalog doesn't have subtitle
          outcomes: Array.isArray(funnel.outcomes) ? (funnel.outcomes as string[]) : [],
          default_version: versionMap.get(funnel.id) || null,
          availability,
        }

        if (funnel.pillar_id && pillarMap.has(funnel.pillar_id)) {
          pillarMap.get(funnel.pillar_id)!.funnels.push(catalogFunnel)
        } else {
          uncategorizedFunnels.push(catalogFunnel)
        }
      })
    }

    // Convert map to array, preserving sort order
    const catalogData: FunnelCatalogResponse & { tier?: string } = {
      pillars: Array.from(pillarMap.values()),
      uncategorized_funnels: uncategorizedFunnels,
    }
    
    // Include tier in response if filtering was applied
    if (tierParam && tierContract) {
      catalogData.tier = tierParam
    }

    return withRequestId(successResponse(catalogData), requestId)
  } catch (error) {
    logError({
      requestId,
      operation: 'get_funnel_catalog',
      error,
      supabase: getSupabaseErrorLogFields(error),
    })
    return errorResponseWithRequestId(
      ErrorCode.INTERNAL_ERROR,
      'Ein unerwarteter Fehler ist aufgetreten.',
      500,
      requestId,
    )
  }
}
