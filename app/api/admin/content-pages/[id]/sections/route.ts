import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * F3 API Endpoint: Get all sections for a content page
 * GET /api/admin/content-pages/[id]/sections
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

    // Fetch sections ordered by order_index
    const { data: sections, error: sectionsError } = await adminClient
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
    const { title, body_markdown } = body

    if (!title || !body_markdown) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body_markdown' },
        { status: 400 },
      )
    }

    // Get max order_index to append new section at the end
    const { data: maxOrderData } = await adminClient
      .from('content_page_sections')
      .select('order_index')
      .eq('content_page_id', id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0

    // Create section
    const { data: newSection, error: insertError } = await adminClient
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
      console.error('Error creating section:', insertError)
      return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
    }

    return NextResponse.json({ section: newSection }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/content-pages/[id]/sections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
