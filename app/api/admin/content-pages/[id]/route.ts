import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * F2 API Endpoint: Get single content page by ID for editing
 * GET /api/admin/content-pages/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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
    // Allow access for clinician and admin roles
    const hasAccess = role === 'clinician' || role === 'admin'
    if (!hasAccess) {
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

    // Fetch single content page with funnel data
    const { data: contentPage, error: pageError } = await adminClient
      .from('content_pages')
      .select(
        `
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
      .eq('id', id)
      .single()

    if (pageError) {
      if (pageError.code === '42703') {
        console.warn('deleted_at column missing, retrying content page fetch without soft-delete field')
        const { data: fallbackPage, error: fallbackError } = await adminClient
          .from('content_pages')
          .select(
            `
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
            updated_at,
            created_at,
            funnels (
              id,
              title,
              slug
            )
          `,
          )
          .eq('id', id)
          .single()

        if (fallbackError || !fallbackPage) {
          console.error('Error fetching content page (fallback):', fallbackError)
          return NextResponse.json({ error: 'Content page not found' }, { status: 404 })
        }

        return NextResponse.json({ contentPage: fallbackPage })
      }

      console.error('Error fetching content page:', pageError)
      return NextResponse.json({ error: 'Content page not found' }, { status: 404 })
    }

    return NextResponse.json({ contentPage })
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
    // Allow access for clinician and admin roles
    const hasAccess = role === 'clinician' || role === 'admin'
    if (!hasAccess) {
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
    // Allow access for clinician and admin roles
    const hasAccess = role === 'clinician' || role === 'admin'
    if (!hasAccess) {
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
