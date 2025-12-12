import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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
  try {
    const body = await request.json()

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
    // Allow access for clinician and admin roles
    const hasAccess = role === 'clinician' || role === 'admin'
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate required fields
    if (!body.funnel_id || typeof body.funnel_id !== 'string') {
      return NextResponse.json({ error: 'funnel_id is required' }, { status: 400 })
    }
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (!body.type || typeof body.type !== 'string') {
      return NextResponse.json({ error: 'type is required' }, { status: 400 })
    }

    const trimmedTitle = body.title.trim()
    if (trimmedTitle.length === 0) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    }
    if (trimmedTitle.length > 255) {
      return NextResponse.json({ error: 'Title too long (max 255 characters)' }, { status: 400 })
    }

    // Validate type-specific requirements
    if (body.type === 'content_page' && !body.content_page_id) {
      return NextResponse.json({ error: 'content_page_id is required for content_page steps' }, { status: 400 })
    }
    if (body.type !== 'content_page' && body.content_page_id) {
      return NextResponse.json({ error: 'content_page_id can only be set for content_page steps' }, { status: 400 })
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

    // Verify funnel exists
    const { data: funnel } = await adminClient
      .from('funnels')
      .select('id')
      .eq('id', body.funnel_id)
      .single()

    if (!funnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // If content_page_id is provided, verify it exists
    if (body.content_page_id) {
      const { data: contentPage } = await adminClient
        .from('content_pages')
        .select('id')
        .eq('id', body.content_page_id)
        .single()

      if (!contentPage) {
        return NextResponse.json({ error: 'Content page not found' }, { status: 404 })
      }
    }

    // Determine order_index (default to end of list)
    let orderIndex = body.order_index
    if (typeof orderIndex !== 'number') {
      const { data: existingSteps } = await adminClient
        .from('funnel_steps')
        .select('order_index')
        .eq('funnel_id', body.funnel_id)
        .order('order_index', { ascending: false })
        .limit(1)

      orderIndex = existingSteps && existingSteps.length > 0 
        ? existingSteps[0].order_index + 1 
        : 0
    }

    // Create step
    const stepData: Record<string, unknown> = {
      funnel_id: body.funnel_id,
      title: trimmedTitle,
      type: body.type,
      order_index: orderIndex,
      description: body.description?.trim() || null,
      content_page_id: body.content_page_id || null,
    }

    const { data, error } = await adminClient
      .from('funnel_steps')
      .insert(stepData)
      .select()
      .single()

    if (error) {
      console.error('Error creating step:', error)
      return NextResponse.json({ error: 'Failed to create step: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ step: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/funnel-steps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
