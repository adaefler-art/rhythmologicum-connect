import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { successResponse } from '@/lib/api/responses'
import { getRequestId, withRequestId, logError } from '@/lib/db/errors'

/**
 * E74.3 Studio API: Publish draft (atomic)
 * POST /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish
 * 
 * Body:
 * {
 *   setAsDefault?: boolean  // Default: true
 *   changeSummary?: string  // Optional summary of changes
 * }
 * 
 * Atomically publishes draft:
 * 1. Validates draft has no validation errors
 * 2. Updates status to 'published'
 * 3. Sets as default version (if setAsDefault=true)
 * 4. Creates audit log entry with diff
 * 5. Updates funnels_catalog.default_version_id
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
  { params }: { params: Promise<{ slug: string; draftId: string }> },
) {
  const requestId = getRequestId(request)
  const { slug, draftId } = await params

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

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { setAsDefault = true, changeSummary = null } = body

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

    // Call database function to publish draft atomically
    const { data: publishResult, error: publishError } = await adminClient.rpc(
      'publish_draft_version',
      {
        p_draft_id: draftId,
        p_user_id: user.id,
        p_set_as_default: setAsDefault,
        p_change_summary: changeSummary,
      },
    )

    if (publishError) {
      logError({
        requestId,
        operation: 'publish_draft_version',
        userId: user.id,
        error: publishError,
      })

      // Check if error is due to validation errors
      if (
        publishError.message &&
        publishError.message.includes('validation errors')
      ) {
        return jsonError(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Cannot publish draft with validation errors. Run validation first.',
          requestId,
        )
      }

      return jsonError(
        500,
        ErrorCode.DATABASE_ERROR,
        'Failed to publish draft',
        requestId,
      )
    }

    // Fetch the published version
    const { data: publishedVersion, error: fetchError } = await adminClient
      .from('funnel_versions')
      .select('*')
      .eq('id', draftId)
      .single()

    if (fetchError || !publishedVersion) {
      logError({
        requestId,
        operation: 'fetch_published_version',
        userId: user.id,
        error: fetchError,
      })
      return jsonError(
        500,
        ErrorCode.DATABASE_ERROR,
        'Draft published but failed to fetch',
        requestId,
      )
    }

    return withRequestId(
      successResponse({
        version: publishedVersion,
        publishResult,
        message: 'Draft published successfully',
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'publish_draft',
      error,
    })
    return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to publish draft', requestId)
  }
}
