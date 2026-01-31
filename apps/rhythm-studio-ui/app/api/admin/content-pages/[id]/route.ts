import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'

/**
 * F2 API Endpoint: Get single content page by ID for editing
 * GET /api/admin/content-pages/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: key } = await params

		const isUuid =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
				key,
			)

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

		// Use admin client for content pages management (RLS bypass for cross-user access)
		const adminClient = createAdminSupabaseClient()

		// Fetch the page itself WITHOUT embedded joins. This prevents accidental 404s
		// when related tables (e.g. sections/funnel) are missing or empty.
		const baseSelect = `
			id,
			slug,
			title,
			excerpt,
			body_markdown,
			status,
			layout,
			category,
			priority,
			funnel_id,
			flow_step,
			order_index,
			updated_at,
			created_at,
			deleted_at
		`

		const contentPageQuery = adminClient
			.from('content_pages')
			.select(baseSelect)
			.eq(isUuid ? 'id' : 'slug', key)
		let contentPage: any
		let pageError: any

		;({ data: contentPage, error: pageError } = await contentPageQuery.maybeSingle())

		if (pageError && pageError.code === '42703') {
			// deleted_at column missing, retry without it
			const fallbackSelect = `
				id,
				slug,
				title,
				excerpt,
				body_markdown,
				status,
				layout,
				category,
				priority,
				funnel_id,
				flow_step,
				order_index,
				updated_at,
				created_at
			`
			;({ data: contentPage, error: pageError } = await adminClient
				.from('content_pages')
				.select(fallbackSelect)
				.eq(isUuid ? 'id' : 'slug', key)
				.maybeSingle())
		}

		if (pageError) {
			console.error('Error fetching content page:', { code: pageError.code, message: pageError.message })
			return NextResponse.json({ error: 'Failed to fetch content page' }, { status: 500 })
		}

		if (!contentPage) {
			return NextResponse.json(
				{ error: 'Content page not found', message: 'Content page not found' },
				{ status: 404 },
			)
		}

		// Fetch sections separately; empty array is a valid state.
		const { data: sections, error: sectionsError } = await adminClient
			.from('content_page_sections')
			.select('id, title, body_markdown, order_index, created_at, updated_at')
			.eq('content_page_id', contentPage.id)
			.order('order_index', { ascending: true })
			.order('id', { ascending: true })

		if (sectionsError) {
			console.error('Error fetching content page sections:', {
				code: sectionsError.code,
				message: sectionsError.message,
			})
			return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
		}

		// Fetch funnel metadata separately to preserve the previous response shape.
		let funnel: any = null
		if (contentPage.funnel_id) {
			const { data: funnelData, error: funnelError } = await adminClient
				.from('funnels')
				.select('id, title, slug')
				.eq('id', contentPage.funnel_id)
				.maybeSingle()

			if (!funnelError && funnelData) {
				funnel = funnelData
			}
		}

		return NextResponse.json({
			contentPage: {
				...contentPage,
				funnels: funnel,
			},
			sections: sections || [],
		})
	} catch (error) {
		console.error('Error in GET /api/admin/content-pages/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * F2 API Endpoint: Update content page
 * PATCH /api/admin/content-pages/[id]
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params
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

		// Use admin client for content pages management (RLS bypass for cross-user access)
		const adminClient = createAdminSupabaseClient()

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

		// Check if slug is already used by another page
		const { data: existingPage } = await adminClient
			.from('content_pages')
			.select('id')
			.eq('slug', slug)
			.neq('id', id)
			.single()

		if (existingPage) {
			return NextResponse.json({ error: 'Slug is already in use by another page' }, { status: 409 })
		}

		// Prepare update data
		const updateData: Record<string, unknown> = {
			title,
			slug,
			body_markdown,
			status,
			updated_at: new Date().toISOString(),
		}

		// Add optional fields if provided
		if (body.excerpt !== undefined) updateData.excerpt = body.excerpt || null
		if (body.category !== undefined) updateData.category = body.category || null
		if (body.priority !== undefined) updateData.priority = body.priority
		if (body.funnel_id !== undefined) updateData.funnel_id = body.funnel_id || null
		if (body.flow_step !== undefined) updateData.flow_step = body.flow_step || null
		if (body.order_index !== undefined) updateData.order_index = body.order_index
		if (body.layout !== undefined) updateData.layout = body.layout || null

		// Update content page
		const { data: updatedPage, error: updateError } = await adminClient
			.from('content_pages')
			.update(updateData)
			.eq('id', id)
			.select()
			.single()

		if (updateError) {
			console.error('Error updating content page:', updateError)
			return NextResponse.json({ error: 'Failed to update content page' }, { status: 500 })
		}

		return NextResponse.json({ contentPage: updatedPage })
	} catch (error) {
		console.error('Error in PATCH /api/admin/content-pages/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * F10 API Endpoint: Delete content page
 * DELETE /api/admin/content-pages/[id]
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params

		// Check authentication and authorization using reusable helper
		const { error: authError } = await requireAdminOrClinicianRole()
		if (authError) return authError

		// Use admin client for content pages management (RLS bypass for cross-user access)
		const adminClient = createAdminSupabaseClient()

		// Delete content page (cascades to sections due to FK constraint)
		const { error: deleteError } = await adminClient
			.from('content_pages')
			.delete()
			.eq('id', id)

		if (deleteError) {
			console.error('Error deleting content page:', deleteError)
			return NextResponse.json({ error: 'Failed to delete content page' }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error in DELETE /api/admin/content-pages/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
