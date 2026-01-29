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
 * V0.4-E3 API Endpoint: Create new funnel step
 * POST /api/admin/funnel-steps
 * 
 * Body: { 
 *   funnel_id: string, 
 *   title: string, 
 *   description?: string,
 *   type: string,
 *   content_page_id?: string | null,
 *   order_index?: number
 * }
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  
  try {
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

    // Validate required fields
    if (!body.funnel_id || typeof body.funnel_id !== 'string') {
      return withRequestId(
        validationErrorResponse('funnel_id is required'),
        requestId,
      )
    }
    if (!body.title || typeof body.title !== 'string') {
      return withRequestId(
        validationErrorResponse('title is required'),
        requestId,
      )
    }
    if (!body.type || typeof body.type !== 'string') {
      return withRequestId(
        validationErrorResponse('type is required'),
        requestId,
      )
    }

    const trimmedTitle = body.title.trim()
    if (trimmedTitle.length === 0) {
      return withRequestId(
        validationErrorResponse('Title cannot be empty'),
        requestId,
      )
    }
    if (trimmedTitle.length > 255) {
      return withRequestId(
        validationErrorResponse('Title too long (max 255 characters)'),
        requestId,
      )
    }

    // Validate type-specific requirements
    if (body.type === 'content_page' && !body.content_page_id) {
      return withRequestId(
        validationErrorResponse('content_page_id is required for content_page steps'),
        requestId,
      )
    }
    if (body.type !== 'content_page' && body.content_page_id) {
      return withRequestId(
        validationErrorResponse('content_page_id can only be set for content_page steps'),
        requestId,
      )
    }

    // Use admin client for cross-user operations (metadata tables only)
    // Justification: Clinicians need to create/manage steps for all funnels
    const adminClient = createAdminSupabaseClient()

    // Verify funnel exists
    const { data: funnel, error: funnelError } = await adminClient
      .from('funnels')
      .select('id')
      .eq('id', body.funnel_id)
      .single()

    if (funnelError) {
      const safeErr = sanitizeSupabaseError(funnelError)
      
      // PGRST116 means no rows found
      if (safeErr.code === 'PGRST116') {
        return withRequestId(notFoundResponse('Funnel'), requestId)
      }

      const classified = classifySupabaseError(safeErr)
      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      console.error({ requestId, operation: 'verify_funnel', supabaseError: safeErr })
      return withRequestId(internalErrorResponse('Failed to verify funnel.'), requestId)
    }

    if (!funnel) {
      return withRequestId(notFoundResponse('Funnel'), requestId)
    }

    // If content_page_id is provided, verify it exists
    if (body.content_page_id) {
      const { data: contentPage, error: contentPageError } = await adminClient
        .from('content_pages')
        .select('id')
        .eq('id', body.content_page_id)
        .single()

      if (contentPageError) {
        const safeErr = sanitizeSupabaseError(contentPageError)
        
        // PGRST116 means no rows found
        if (safeErr.code === 'PGRST116') {
          return withRequestId(notFoundResponse('Content page'), requestId)
        }

        console.error({ requestId, operation: 'verify_content_page', supabaseError: safeErr })
        return withRequestId(internalErrorResponse('Failed to verify content page.'), requestId)
      }

      if (!contentPage) {
        return withRequestId(notFoundResponse('Content page'), requestId)
      }
    }

    // Determine order_index (default to end of list)
    let orderIndex = body.order_index
    if (typeof orderIndex !== 'number') {
      const { data: existingSteps } = (await adminClient
        .from('funnel_steps')
        .select('order_index')
        .eq('funnel_id', body.funnel_id)
        .order('order_index', { ascending: false })
        .limit(1)) as { data: { order_index: number }[] | null }

      orderIndex = existingSteps && existingSteps.length > 0 
        ? existingSteps[0].order_index + 1 
        : 0
    }

    // Create step
    const stepData = {
      funnel_id: body.funnel_id,
      title: trimmedTitle,
      type: body.type,
      order_index: orderIndex,
      description: body.description?.trim() || null,
      content_page_id: body.content_page_id || null,
    } as const

    const { data, error } = await adminClient
      .from('funnel_steps')
      .insert(stepData)
      .select()
      .single()

    if (error) {
      const safeErr = sanitizeSupabaseError(error)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      console.error({ requestId, operation: 'create_step', supabaseError: safeErr })
      return withRequestId(internalErrorResponse('Failed to create step.'), requestId)
    }

    return withRequestId(successResponse({ step: data }, 201), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, operation: 'POST /api/admin/funnel-steps', error: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
