import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { successResponse } from '@/lib/api/responses'
import { getRequestId, withRequestId, logError } from '@/lib/db/errors'
import {
  validateFunnelVersion,
  formatValidationErrors,
  type ValidationResult,
} from '@/lib/validators/funnelDefinition'

/**
 * E74.3 Studio API: Get draft details
 * GET /api/admin/studio/funnels/[slug]/drafts/[draftId]
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

    // Get admin client
    const adminClient = createAdminSupabaseClient()

    // Get funnel by slug
    const { data: funnel, error: funnelError } = await (adminClient as any)
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

    // Fetch draft
    const { data: draft, error: draftError } = await (adminClient as any)
      .from('funnel_versions')
      .select('*')
      .eq('id', draftId)
      .eq('funnel_id', funnel.id)
      .eq('status', 'draft')
      .single()

    if (draftError || !draft) {
      logError({
        requestId,
        operation: 'fetch_draft',
        userId: user.id,
        error: draftError,
      })
      return jsonError(404, ErrorCode.NOT_FOUND, 'Draft not found', requestId)
    }

    return withRequestId(
      successResponse({
        draft,
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'get_draft',
      error,
    })
    return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch draft', requestId)
  }
}

/**
 * E74.3 Studio API: Update draft
 * PUT /api/admin/studio/funnels/[slug]/drafts/[draftId]
 * 
 * Body:
 * {
 *   questionnaireConfig?: object,
 *   contentManifest?: object,
 *   algorithmBundleVersion?: string,
 *   promptVersion?: string,
 *   validate?: boolean  // If true, run validation and update validation_errors
 * }
 */
export async function PUT(
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
    const {
      questionnaireConfig,
      contentManifest,
      algorithmBundleVersion,
      promptVersion,
      validate = false,
    } = body

    // Get admin client
    const adminClient = createAdminSupabaseClient()

    // Get funnel by slug
    const { data: funnel, error: funnelError } = await (adminClient as any)
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

    // Fetch current draft
    const { data: currentDraft, error: draftError } = await (adminClient as any)
      .from('funnel_versions')
      .select('*')
      .eq('id', draftId)
      .eq('funnel_id', funnel.id)
      .eq('status', 'draft')
      .single()

    if (draftError || !currentDraft) {
      logError({
        requestId,
        operation: 'fetch_draft',
        userId: user.id,
        error: draftError,
      })
      return jsonError(404, ErrorCode.NOT_FOUND, 'Draft not found', requestId)
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (questionnaireConfig !== undefined) {
      updates.questionnaire_config = questionnaireConfig
    }
    if (contentManifest !== undefined) {
      updates.content_manifest = contentManifest
    }
    if (algorithmBundleVersion !== undefined) {
      updates.algorithm_bundle_version = algorithmBundleVersion
    }
    if (promptVersion !== undefined) {
      updates.prompt_version = promptVersion
    }

    // Validate if requested
    let validationResult: ValidationResult | null = null
    if (validate) {
      const configToValidate = questionnaireConfig ?? currentDraft.questionnaire_config
      const manifestToValidate = contentManifest ?? currentDraft.content_manifest

      validationResult = validateFunnelVersion({
        questionnaire_config: configToValidate,
        content_manifest: manifestToValidate,
      })

      updates.validation_errors = validationResult.errors
      updates.last_validated_at = new Date().toISOString()
    }

    // Update draft
    const { data: updatedDraft, error: updateError } = await (adminClient as any)
      .from('funnel_versions')
      .update(updates)
      .eq('id', draftId)
      .select('*')
      .single()

    if (updateError) {
      logError({
        requestId,
        operation: 'update_draft',
        userId: user.id,
        error: updateError,
      })
      return jsonError(500, ErrorCode.DATABASE_ERROR, 'Failed to update draft', requestId)
    }

    return withRequestId(
      successResponse({
        draft: updatedDraft,
        validation: validationResult
          ? {
              valid: validationResult.valid,
              errorCount: validationResult.errors.length,
              errors: validationResult.errors,
            }
          : null,
        message: 'Draft updated successfully',
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'update_draft',
      error,
    })
    return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to update draft', requestId)
  }
}

/**
 * E74.3 Studio API: Delete draft
 * DELETE /api/admin/studio/funnels/[slug]/drafts/[draftId]
 */
export async function DELETE(
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

    // Get admin client
    const adminClient = createAdminSupabaseClient()

    // Get funnel by slug
    const { data: funnel, error: funnelError } = await (adminClient as any)
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

    // Delete draft
    const { error: deleteError } = await (adminClient as any)
      .from('funnel_versions')
      .delete()
      .eq('id', draftId)
      .eq('funnel_id', funnel.id)
      .eq('status', 'draft')

    if (deleteError) {
      logError({
        requestId,
        operation: 'delete_draft',
        userId: user.id,
        error: deleteError,
      })
      return jsonError(500, ErrorCode.DATABASE_ERROR, 'Failed to delete draft', requestId)
    }

    return withRequestId(
      successResponse({
        message: 'Draft deleted successfully',
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'delete_draft',
      error,
    })
    return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to delete draft', requestId)
  }
}
