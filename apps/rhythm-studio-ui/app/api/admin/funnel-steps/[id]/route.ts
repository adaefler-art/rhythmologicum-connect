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
 * B7 API Endpoint: Update step order_index or content fields
 * PATCH /api/admin/funnel-steps/[id]
 * 
 * Body: { order_index?: number, title?: string, description?: string }
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

		// Build update object with only provided fields
		const updateData: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		}

		if (typeof body.order_index === 'number') {
			if (body.order_index < 0) {
				return withRequestId(
					validationErrorResponse('Order index must be non-negative'),
					requestId,
				)
			}
			updateData.order_index = body.order_index
		}
		if (typeof body.title === 'string') {
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
			updateData.title = trimmedTitle
		}
		if (typeof body.description === 'string') {
			const trimmedDescription = body.description.trim()
			if (trimmedDescription.length > 2000) {
				return withRequestId(
					validationErrorResponse('Description too long (max 2000 characters)'),
					requestId,
				)
			}
			updateData.description = trimmedDescription || null
		}

		// Use admin client for cross-user operations (metadata tables only)
		// Justification: Clinicians need to update steps for all funnels
		const adminClient = createAdminSupabaseClient()

		if (body.content_page_id !== undefined) {
			// Allow null to clear the content page
			if (body.content_page_id === null) {
				updateData.content_page_id = null
			} else if (typeof body.content_page_id === 'string') {
				// Validate that content page exists
				const { data: contentPage, error: contentPageError } = await adminClient
					.from('content_pages')
					.select('id')
					.eq('id', body.content_page_id)
					.single()

				if (contentPageError) {
					const safeErr = sanitizeSupabaseError(contentPageError)
          
					// PGRST116 means no rows found
					if (safeErr.code === 'PGRST116') {
						return withRequestId(
							validationErrorResponse('Content page not found'),
							requestId,
						)
					}

					console.error({ requestId, operation: 'verify_content_page', supabaseError: safeErr })
					return withRequestId(internalErrorResponse('Failed to verify content page.'), requestId)
				}

				if (!contentPage) {
					return withRequestId(
						validationErrorResponse('Content page not found'),
						requestId,
					)
				}

				updateData.content_page_id = body.content_page_id
			} else {
				// Reject invalid types
				return withRequestId(
					validationErrorResponse('content_page_id must be a string or null'),
					requestId,
				)
			}
		}

		// Update step
		const { data, error } = await adminClient
			.from('funnel_steps')
			.update(updateData)
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
				return withRequestId(notFoundResponse('Funnel step'), requestId)
			}

			console.error({ requestId, operation: 'update_step', supabaseError: safeErr })
			return withRequestId(internalErrorResponse('Failed to update step.'), requestId)
		}

		return withRequestId(successResponse({ step: data }), requestId)
	} catch (error) {
		const safeErr = sanitizeSupabaseError(error)
		console.error({ requestId, operation: 'PATCH /api/admin/funnel-steps/[id]', error: safeErr })
		return withRequestId(internalErrorResponse(), requestId)
	}
}
