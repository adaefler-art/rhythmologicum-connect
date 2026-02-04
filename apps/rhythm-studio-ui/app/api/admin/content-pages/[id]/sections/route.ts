import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * F3 API Endpoint: Get all sections for a content page
 * GET /api/admin/content-pages/[id]/sections
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params

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

		// Fetch sections ordered by order_index
		const { data: sections, error: sectionsError } = await supabase
			.from('content_page_sections')
			.select('id, title, body_markdown, order_index, created_at, updated_at')
			.eq('content_page_id', id)
			.order('order_index', { ascending: true })

		if (sectionsError) {
			console.error('Error fetching sections:', sectionsError)
			return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
		}

		return NextResponse.json({ sections: sections || [] })
	} catch (error) {
		console.error('Error in GET /api/admin/content-pages/[id]/sections:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * F3 API Endpoint: Create new section for a content page
 * POST /api/admin/content-pages/[id]/sections
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

		// Validate page ID (UUID format)
		if (!id || !UUID_REGEX.test(id)) {
			console.error('Invalid page ID:', id)
			return NextResponse.json({ error: 'Invalid page ID format' }, { status: 400 })
		}

		// Verify page exists
		const { data: page, error: pageError } = await supabase
			.from('content_pages')
			.select('id')
			.eq('id', id)
			.maybeSingle()

		if (pageError) {
			console.error('Error checking page existence:', pageError)
			return NextResponse.json({ error: 'Failed to verify page' }, { status: 500 })
		}

		if (!page) {
			console.error('Page not found:', id)
			return NextResponse.json({ error: 'Content page not found' }, { status: 404 })
		}

		// Validate required fields
		const { title, body_markdown } = body

		if (!title || !body_markdown) {
			console.error('Missing required fields:', { title: !!title, body_markdown: !!body_markdown })
			return NextResponse.json(
				{ error: 'Missing required fields: title, body_markdown' },
				{ status: 400 },
			)
		}

		if (typeof title !== 'string' || typeof body_markdown !== 'string') {
			console.error('Invalid field types:', { title: typeof title, body_markdown: typeof body_markdown })
			return NextResponse.json(
				{ error: 'Invalid field types: title and body_markdown must be strings' },
				{ status: 400 },
			)
		}

		// Get max order_index to append new section at the end
		const { data: maxOrderData, error: orderError } = (await supabase
			.from('content_page_sections')
			.select('order_index')
			.eq('content_page_id', id)
			.order('order_index', { ascending: false })
			.limit(1)
			.maybeSingle()) as { data: { order_index: number } | null; error: Error | null }

		if (orderError) {
			console.error('Error fetching section order index:', orderError)
			return NextResponse.json({ error: 'Failed to determine section order' }, { status: 500 })
		}

		const nextOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0

		// Create section
		const { data: newSection, error: insertError } = await supabase
			.from('content_page_sections')
			.insert({
				content_page_id: id,
				title,
				body_markdown,
				order_index: nextOrderIndex,
			})
			.select()
			.single()

		if (insertError) {
			console.error('Error creating section:', {
				error: insertError,
				code: insertError.code,
				message: insertError.message,
				details: insertError.details,
				hint: insertError.hint,
			})
			return NextResponse.json(
				{ 
					error: 'Failed to create section',
					// Only expose generic error message to client
				},
				{ status: 500 }
			)
		}

		return NextResponse.json({ section: newSection }, { status: 201 })
	} catch (error) {
		console.error('Error in POST /api/admin/content-pages/[id]/sections:', {
			error,
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ 
				error: 'Internal server error',
				// Error details logged server-side only
			},
			{ status: 500 }
		)
	}
}
