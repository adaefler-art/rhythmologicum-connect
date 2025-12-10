import { NextResponse } from 'next/server'
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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

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

    // Fetch all content pages with funnel data
    const { data: contentPages, error: contentPagesError } = await adminClient
      .from('content_pages')
      .select(`
        id,
        slug,
        title,
        status,
        layout,
        funnel_id,
        updated_at,
        created_at,
        funnels (
          id,
          title,
          slug
        )
      `)
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
