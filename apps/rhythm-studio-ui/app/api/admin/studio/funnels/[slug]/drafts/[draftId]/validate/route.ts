import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { successResponse } from '@/lib/api/responses'
import { getRequestId, withRequestId, logError } from '@/lib/db/errors'
import {
  validateFunnelVersion,
  formatValidationErrors,
  type ValidationError,
} from '@/lib/validators/funnelDefinition'
import type { Json } from '@/lib/types/supabase'

/**
 * E74.3 Studio API: Validate draft
 * POST /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate
 * 
 * Validates draft against E74.1 canonical schema and updates validation_errors field
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

    // Fetch draft
    const { data: draft, error: draftError } = await adminClient
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

    // Validate using E74.1 validators
    const validationResult = validateFunnelVersion({
      questionnaire_config: draft.questionnaire_config,
      content_manifest: draft.content_manifest,
    })

    const serializedErrors: Json = validationResult.errors.map((error: ValidationError) => ({
      code: error.code,
      message: error.message,
      path: error.path ?? null,
      details: (error.details ?? null) as Json | null,
    }))

    // Update draft with validation results
    const { data: updatedDraft, error: updateError } = await adminClient
      .from('funnel_versions')
      .update({
        validation_errors: serializedErrors,
        last_validated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .select('*')
      .single()

    if (updateError) {
      logError({
        requestId,
        operation: 'update_validation_results',
        userId: user.id,
        error: updateError,
      })
      return jsonError(
        500,
        ErrorCode.DATABASE_ERROR,
        'Validation succeeded but failed to save results',
        requestId,
      )
    }

    return withRequestId(
      successResponse({
        draft: updatedDraft,
        validation: {
          valid: validationResult.valid,
          errorCount: validationResult.errors.length,
          errors: validationResult.errors,
          formattedErrors: formatValidationErrors(validationResult.errors),
        },
        message: validationResult.valid
          ? 'Draft is valid and ready to publish'
          : 'Draft has validation errors',
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'validate_draft',
      error,
    })
    return jsonError(500, ErrorCode.INTERNAL_ERROR, 'Failed to validate draft', requestId)
  }
}
