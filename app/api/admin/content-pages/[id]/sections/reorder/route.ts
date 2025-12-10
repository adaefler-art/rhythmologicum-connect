import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * F3 API Endpoint: Reorder sections
 * POST /api/admin/content-pages/[id]/sections/reorder
 * 
 * Body: { sectionId: string, direction: 'up' | 'down' }
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
    const { sectionId, direction } = body

    if (!sectionId || !direction) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionId, direction' },
        { status: 400 },
      )
    }

    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json({ error: 'Direction must be "up" or "down"' }, { status: 400 })
    }

    // Get the current section
    const { data: currentSection, error: currentError } = await adminClient
      .from('content_page_sections')
      .select('id, content_page_id, order_index')
      .eq('id', sectionId)
      .eq('content_page_id', id)
      .single()

    if (currentError || !currentSection) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    const currentOrderIndex = currentSection.order_index
    const targetOrderIndex = direction === 'up' ? currentOrderIndex - 1 : currentOrderIndex + 1

    // Check if we can move in the desired direction
    if (targetOrderIndex < 0) {
      return NextResponse.json({ error: 'Section is already at the top' }, { status: 400 })
    }

    // Get the section to swap with
    const { data: targetSection, error: targetError } = await adminClient
      .from('content_page_sections')
      .select('id, order_index')
      .eq('content_page_id', id)
      .eq('order_index', targetOrderIndex)
      .single()

    if (targetError || !targetSection) {
      return NextResponse.json({ error: 'Cannot move section in this direction' }, { status: 400 })
    }

    // Swap order_index values using a temporary value to avoid unique constraint violation
    const tempOrderIndex = -1

    // Step 1: Set current section to temp value
    await adminClient
      .from('content_page_sections')
      .update({ order_index: tempOrderIndex })
      .eq('id', currentSection.id)

    // Step 2: Set target section to current's old index
    await adminClient
      .from('content_page_sections')
      .update({ order_index: currentOrderIndex })
      .eq('id', targetSection.id)

    // Step 3: Set current section to target index
    const { error: finalError } = await adminClient
      .from('content_page_sections')
      .update({ order_index: targetOrderIndex })
      .eq('id', currentSection.id)

    if (finalError) {
      console.error('Error reordering sections:', finalError)
      return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 })
    }

    // Return updated sections in order
    const { data: sections } = await adminClient
      .from('content_page_sections')
      .select('*')
      .eq('content_page_id', id)
      .order('order_index', { ascending: true })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error in POST /api/admin/content-pages/[id]/sections/reorder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
