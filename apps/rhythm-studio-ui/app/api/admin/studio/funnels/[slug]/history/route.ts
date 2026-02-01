import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { successResponse } from '@/lib/api/responses'
import { getRequestId, withRequestId, logError } from '@/lib/db/errors'

/**
 * E74.3 Studio API: Get publish history for funnel
 * GET /api/admin/studio/funnels/[slug]/history
 * 
 * Returns chronological list of publish events with diffs
 */

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const requestId = getRequestId(request)
  const { slug } = await params

  try {
    // Auth check
    const authClient = await createServerSupabaseClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return jsonError(401, ErrorCode.UNAUTHORIZED, 'Authentication required', requestId)
    }

    // Authorization check
    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      return jsonError(403, ErrorCode.FORBIDDEN, 'Insufficient permissions', requestId)
    }

    // Get admin client
    const adminClient = createAdminSupabaseClient()

    // Get funnel by slug
    const { data: funnel, error: funnelError } = await adminClient
      .from('funnels_catalog')
      .select('id, slug, title')
      .eq('slug', slug)
      .single()

    if (funnelError || !funnel) {
      logError({
        requestId,
        operation: 'fetch_funnel_by_slug',
        userId: user.id,
        error: funnelError,
      })
      return jsonError(404, ErrorCode.NOT_FOUND, `Funnel not found: ${slug}`, requestId)
    }

    // Fetch publish history
    const { data: history, error: historyError } = await adminClient
      .from('funnel_publish_history')
      .select(`
        id,
        version_id,
        previous_version_id,
        published_by,
        published_at,
        diff,
        change_summary,
        metadata,
        created_at
      `)
      .eq('funnel_id', funnel.id)
      .order('published_at', { ascending: false })

    if (historyError) {
      logError({
        requestId,
        operation: 'fetch_publish_history',
        userId: user.id,
        error: historyError,
      })
      return jsonError(
        500,
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch publish history',
        requestId,
      )
    }

    // Get version details for all versions in history
    const versionIds = new Set<string>()
    ;(history || []).forEach((entry) => {
      if (entry.version_id) versionIds.add(entry.version_id)
      if (entry.previous_version_id) versionIds.add(entry.previous_version_id)
    })

    let versionDetails: Record<string, { version: string; id: string }> = {}
    if (versionIds.size > 0) {
      const { data: versions, error: versionsError } = await adminClient
        .from('funnel_versions')
        .select('id, version')
        .in('id', Array.from(versionIds))

      if (!versionsError && versions) {
        versionDetails = Object.fromEntries(
          versions.map((v) => [v.id, { version: v.version, id: v.id }]),
        )
      }
    }

    // Enrich history with version labels
    const enrichedHistory = (history || []).map((entry) => ({
      ...entry,
      version_label: versionDetails[entry.version_id]?.version || entry.version_id,
      previous_version_label: entry.previous_version_id
        ? versionDetails[entry.previous_version_id]?.version || entry.previous_version_id
        : null,
    }))

    return withRequestId(
      successResponse({
        funnel: {
          id: funnel.id,
          slug: funnel.slug,
          title: funnel.title,
        },
        history: enrichedHistory,
        totalCount: enrichedHistory.length,
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'get_publish_history',
      error,
    })
    return jsonError(
      500,
      ErrorCode.INTERNAL_ERROR,
      'Failed to fetch publish history',
      requestId,
    )
  }
}
