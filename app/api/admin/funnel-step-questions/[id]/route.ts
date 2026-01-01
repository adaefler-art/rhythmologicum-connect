import { NextRequest } from 'next/server'
import {
  configurationErrorResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  schemaNotReadyResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { classifySupabaseError, sanitizeSupabaseError, getRequestId, withRequestId, isBlank } from '@/lib/db/errors'
import { env } from '@/lib/env'

/**
 * B7 API Endpoint: Update question is_required flag
 * PATCH /api/admin/funnel-step-questions/[id]
 * 
 * Body: { is_required: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request)
  
  try {
    const { id } = await params
    const body = await request.json()

    // Check Supabase configuration
    if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return withRequestId(
        configurationErrorResponse(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        ),
        requestId,
      )
    }

    // Check authentication and authorization using canonical helpers
    if (!(await hasClinicianRole())) {
      const authClient = await createServerSupabaseClient()
      const {
        data: { user },
      } = await authClient.auth.getUser()
      
      if (!user) {
        return withRequestId(unauthorizedResponse(), requestId)
      }
      
      return withRequestId(forbiddenResponse(), requestId)
    }

    // Validate request body
    if (typeof body.is_required !== 'boolean') {
      return withRequestId(
        validationErrorResponse('is_required must be a boolean'),
        requestId,
      )
    }

    // Use admin client for cross-user operations (metadata tables only)
    // Justification: Clinicians need to update questions for all funnels
    const adminClient = createAdminSupabaseClient()

    // Update question is_required
    const { data, error } = await adminClient
      .from('funnel_step_questions')
      .update({ 
        is_required: body.is_required,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      const safeErr = sanitizeSupabaseError(error)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      // PGRST116 means no rows found
      if (safeErr.code === 'PGRST116') {
        return withRequestId(notFoundResponse('Funnel step question'), requestId)
      }

      console.error({ requestId, operation: 'update_question', supabaseError: safeErr })
      return withRequestId(internalErrorResponse('Failed to update question.'), requestId)
    }

    return withRequestId(successResponse({ question: data }), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, operation: 'PATCH /api/admin/funnel-step-questions/[id]', error: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
