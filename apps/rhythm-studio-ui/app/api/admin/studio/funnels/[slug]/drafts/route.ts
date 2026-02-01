import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { successResponse } from '@/lib/api/responses'
import { getRequestId, withRequestId, logError } from '@/lib/db/errors'

/**
 * E74.3 Studio API: Create draft from published version
 * POST /api/admin/studio/funnels/[slug]/drafts
 * 
 * Body:
 * {
 *   sourceVersionId?: string  // If not provided, uses default_version_id
 *   versionLabel?: string     // Optional custom version label
 * }
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

export async function POST(
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
      return jsonError(
        401,
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        requestId,
      )
    }

    // Authorization check
    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      return jsonError(403, ErrorCode.FORBIDDEN, 'Insufficient permissions', requestId)
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { sourceVersionId, versionLabel } = body

    // Get admin client
    const adminClient = createAdminSupabaseClient()

    // Get funnel by slug
    const { data: funnel, error: funnelError } = await adminClient
      .from('funnels_catalog')
      .select('id, slug, title, default_version_id')
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

    // Determine source version
    const versionId = sourceVersionId || funnel.default_version_id
    if (!versionId) {
      return jsonError(
        400,
        ErrorCode.VALIDATION_ERROR,
        'No source version specified and funnel has no default version',
        requestId,
      )
    }

    // Call database function to create draft
    const { data: draftId, error: createError } = await adminClient.rpc(
      'create_draft_from_version',
      {
        p_source_version_id: versionId,
        p_user_id: user.id,
        p_version_label: versionLabel || null,
      },
    )

    if (createError) {
      logError({
        requestId,
        operation: 'create_draft_from_version',
        userId: user.id,
        error: createError,
      })
      return jsonError(
        500,
        ErrorCode.DATABASE_ERROR,
        'Failed to create draft',
        requestId,
      )
    }

    // Fetch the created draft
    const { data: draft, error: fetchError } = await adminClient
      .from('funnel_versions')
      .select('*')
      .eq('id', draftId)
      .single()

    if (fetchError || !draft) {
      logError({
        requestId,
        operation: 'fetch_created_draft',
        userId: user.id,
        error: fetchError,
      })
      return jsonError(
        500,
        ErrorCode.DATABASE_ERROR,
        'Draft created but failed to fetch',
        requestId,
      )
    }

    return withRequestId(
      successResponse({
        draft,
        message: 'Draft created successfully',
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'create_draft',
      error,
    })
    return jsonError(
      500,
      ErrorCode.INTERNAL_ERROR,
      'Failed to create draft',
      requestId,
    )
  }
}

/**
 * E74.3 Studio API: List all drafts for a funnel
 * GET /api/admin/studio/funnels/[slug]/drafts
 */
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
      return jsonError(
        401,
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        requestId,
      )
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

    // Fetch all drafts for this funnel
    const { data: drafts, error: draftsError } = await adminClient
      .from('funnel_versions')
      .select('id, version, status, parent_version_id, validation_errors, last_validated_at, created_at, updated_at')
      .eq('funnel_id', funnel.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })

    if (draftsError) {
      logError({
        requestId,
        operation: 'fetch_drafts',
        userId: user.id,
        error: draftsError,
      })
      return jsonError(
        500,
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch drafts',
        requestId,
      )
    }

    return withRequestId(
      successResponse({
        funnel: {
          id: funnel.id,
          slug: funnel.slug,
          title: funnel.title,
        },
        drafts: drafts || [],
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'list_drafts',
      error,
    })
    return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to list drafts', requestId)
  }
}
