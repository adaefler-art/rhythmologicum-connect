import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * F1 API Endpoint: List all content pages for admin management
 * GET /api/admin/content-pages
 *
 * Returns all content pages with funnel metadata for the admin dashboard
 */
export async function GET() {
  try {
    // Check authentication and authorization
    const cookieStore = await cookies()
    const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!publicSupabaseUrl || !publicSupabaseAnonKey) {
      console.error('Supabase URL or anon key not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createServerClient(publicSupabaseUrl, publicSupabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = user.app_metadata?.role || user.user_metadata?.role
    if (role !== 'clinician') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Fetch all content pages with funnel data (excluding soft-deleted)
    const { data: contentPages, error: contentPagesError } = await adminClient
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
    const cookieStore = await cookies()
    const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!publicSupabaseUrl || !publicSupabaseAnonKey) {
      console.error('Supabase URL or anon key not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createServerClient(publicSupabaseUrl, publicSupabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = user.app_metadata?.role || user.user_metadata?.role
    if (role !== 'clinician') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

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
    const { data: existingPage } = await adminClient
      .from('content_pages')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingPage) {
      return NextResponse.json({ error: 'Slug is already in use' }, { status: 409 })
    }

    // Prepare insert data
    const insertData: Record<string, unknown> = {
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
    if (body.layout !== undefined) insertData.layout = body.layout || null

    // Create content page
    const { data: newPage, error: insertError } = await adminClient
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
