import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
  schemaNotReadyResponse,
  forbiddenResponse,
} from '@/lib/api/responses'
import { getRequestId, withRequestId, logError, classifySupabaseError } from '@/lib/db/errors'
import type { FunnelDetailResponse, CatalogFunnel } from '@/lib/types/catalog'
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
 */
export async function GET(request: Request, { params }: Params) {
  const requestId = getRequestId(request)

  try {
    const { slug } = await params
    const canonicalSlug = getCanonicalFunnelSlug(slug)

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    const { data: funnel, error: funnelError } = await supabase
      .from('funnels_catalog')
      .select(
        `
        id,
        slug,
        title,
        description,
        pillar_id,
        est_duration_min,
        outcomes,
        is_active,
        default_version_id
      `,
      )
      .eq('slug', canonicalSlug)
      .single()

    if (funnelError || !funnel) {
      if (funnelError) {
        const classified = classifySupabaseError(funnelError)
        logError({
          requestId,
          operation: 'fetch_funnel_detail',
          error: funnelError,
          userId: user.id,
          context: { slug: canonicalSlug },
        })

        if (classified.kind === 'SCHEMA_NOT_READY') {
          return withRequestId(schemaNotReadyResponse(), requestId)
        }
        if (classified.kind === 'AUTH_OR_RLS') {
          return withRequestId(forbiddenResponse(), requestId)
        }
      }

      return withRequestId(
        notFoundResponse('Funnel', `Funnel with slug "${slug}" not found`),
        requestId,
      )
    }

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

    const catalogFunnel: CatalogFunnel = {
      id: funnel.id,
      slug: funnel.slug,
      title: funnel.title,
      subtitle: null,
      description: funnel.description,
      pillar_id: funnel.pillar_id,
      pillar_key: pillarKey,
      pillar_title: pillarTitle,
      est_duration_min: funnel.est_duration_min,
      outcomes: Array.isArray(funnel.outcomes) ? (funnel.outcomes as string[]) : [],
      is_active: funnel.is_active,
      default_version_id: funnel.default_version_id,
    }

    const { data: versions, error: versionsError } = await supabase
      .from('funnel_versions')
      .select('id, funnel_id, version, is_default')
      .eq('funnel_id', funnel.id)
      .order('version', { ascending: false })
      .order('id', { ascending: true })

    if (versionsError) {
      const classified = classifySupabaseError(versionsError)
      logError({
        requestId,
        operation: 'fetch_funnel_versions',
        error: versionsError,
        userId: user.id,
        context: { funnelId: funnel.id },
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return withRequestId(schemaNotReadyResponse(), requestId)
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        return withRequestId(forbiddenResponse(), requestId)
      }

      return withRequestId(internalErrorResponse('Failed to fetch funnel versions'), requestId)
    }

    const defaultVersion =
      (versions || []).find((v) => v.id === funnel.default_version_id) || null

    let activeVersion = defaultVersion
    try {
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (patientProfile) {
        const { data: patientFunnel, error: patientFunnelError } = await supabase
          .from('patient_funnels')
          .select('active_version_id')
          .eq('patient_id', patientProfile.id)
          .eq('funnel_id', funnel.id)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!patientFunnelError && patientFunnel?.active_version_id) {
          activeVersion =
            (versions || []).find((v) => v.id === patientFunnel.active_version_id) ||
            activeVersion
        }
      }
    } catch {
      // Non-critical: ignore patient override failures
    }

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