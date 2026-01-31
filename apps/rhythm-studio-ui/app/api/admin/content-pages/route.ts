import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { Database } from '@/lib/types/supabase'

/**
 * F1 API Endpoint: List all content pages for admin management
 * GET /api/admin/content-pages
 *
 * Returns all content pages with funnel metadata for the admin dashboard
 */
export async function GET() {
	try {
		// Check authentication and authorization
		const supabase = await createServerSupabaseClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const role = user.app_metadata?.role || user.user_metadata?.role
		// Allow access for clinician and admin roles
		const hasAccess = role === 'clinician' || role === 'admin'
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		// Fetch all content pages with funnel data using the authenticated client
		const { data: contentPages, error: contentPagesError } = await supabase
			.from('content_pages')
			.select(
				`
				id,
				slug,
				title,
				status,
				layout,
				category,
				priority,
				funnel_id,
				updated_at,
				created_at,
				deleted_at,
				funnels (
					id,
					title,
					slug
				)
			`,
			)
			.is('deleted_at', null)
			.order('updated_at', { ascending: false })

		if (contentPagesError) {
			if (contentPagesError.code === '42703') {
				console.warn('deleted_at column missing, retrying without soft-delete filter')
				const { data: fallbackPages, error: fallbackError } = await supabase
					.from('content_pages')
					.select(
						`
						id,
						slug,
						title,
						status,
						layout,
						category,
						priority,
						funnel_id,
						updated_at,
						created_at,
						funnels (
							id,
							title,
							slug
						)
					`,
					)
					.order('updated_at', { ascending: false })

				if (fallbackError) {
					console.error('Error fetching content pages (fallback):', fallbackError)
					return NextResponse.json({ error: 'Failed to fetch content pages' }, { status: 500 })
				}

				return NextResponse.json({ contentPages: fallbackPages || [] })
			}

			console.error('Error fetching content pages:', contentPagesError)
			return NextResponse.json({ error: 'Failed to fetch content pages' }, { status: 500 })
		}

		return NextResponse.json({ contentPages: contentPages || [] })
	} catch (error) {
		console.error('Error in GET /api/admin/content-pages:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * F2 API Endpoint: Create new content page
 * POST /api/admin/content-pages
 *
 * Creates a new content page with the provided data
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()

		// Check authentication and authorization
		const supabase = await createServerSupabaseClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const role = user.app_metadata?.role || user.user_metadata?.role
		// Allow access for clinician and admin roles
		const hasAccess = role === 'clinician' || role === 'admin'
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		// Validate required fields
		const { title, slug, body_markdown, status } = body

		if (!title || !slug || !body_markdown || !status) {
			return NextResponse.json(
				{ error: 'Missing required fields: title, slug, body_markdown, status' },
				{ status: 400 },
			)
		}

		// Validate status value
		const validStatuses = ['draft', 'published', 'archived']
		if (!validStatuses.includes(status)) {
			return NextResponse.json(
				{ error: 'Invalid status. Must be one of: draft, published, archived' },
				{ status: 400 },
			)
		}

		// Validate slug format (lowercase, alphanumeric, hyphens only)
		const slugRegex = /^[a-z0-9-]+$/
		if (!slugRegex.test(slug)) {
			return NextResponse.json(
				{ error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
				{ status: 400 },
			)
		}

		// Check if slug is already used
		const { data: existingPage, error: existingPageError } = await supabase
			.from('content_pages')
			.select('id')
			.eq('slug', slug)
			.single()

		if (existingPageError && existingPageError.code !== 'PGRST116') {
			console.error('Error checking existing slug:', existingPageError)
			return NextResponse.json({ error: 'Failed to validate slug' }, { status: 500 })
		}

		if (existingPage) {
			return NextResponse.json({ error: 'Slug is already in use' }, { status: 409 })
		}

		// Prepare insert data
		type ContentPageInsert = Database['public']['Tables']['content_pages']['Insert']
		const insertData: ContentPageInsert = {
			title,
			slug,
			body_markdown,
			status,
		}

		// Add optional fields if provided
		if (body.excerpt !== undefined) insertData.excerpt = body.excerpt || null
		if (body.category !== undefined) insertData.category = body.category || null
		if (body.priority !== undefined) insertData.priority = body.priority
		if (body.funnel_id !== undefined) insertData.funnel_id = body.funnel_id || null
		if (body.flow_step !== undefined) insertData.flow_step = body.flow_step || null
		if (body.order_index !== undefined) insertData.order_index = body.order_index
		if (body.layout !== undefined) insertData.layout = body.layout || null

		// Create content page
		const { data: newPage, error: insertError } = await supabase
			.from('content_pages')
			.insert(insertData)
			.select()
			.single()

		if (insertError) {
			console.error('Error creating content page:', insertError)
			return NextResponse.json({ error: 'Failed to create content page' }, { status: 500 })
		}

		return NextResponse.json({ contentPage: newPage }, { status: 201 })
	} catch (error) {
		console.error('Error in POST /api/admin/content-pages:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
