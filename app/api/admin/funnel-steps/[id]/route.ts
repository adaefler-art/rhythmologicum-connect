import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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
  try {
    const { id } = await params
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

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.order_index === 'number') {
      if (body.order_index < 0) {
        return NextResponse.json({ error: 'Order index must be non-negative' }, { status: 400 })
      }
      updateData.order_index = body.order_index
    }
    if (typeof body.title === 'string') {
      const trimmedTitle = body.title.trim()
      if (trimmedTitle.length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      if (trimmedTitle.length > 255) {
        return NextResponse.json({ error: 'Title too long (max 255 characters)' }, { status: 400 })
      }
      updateData.title = trimmedTitle
    }
    if (typeof body.description === 'string') {
      const trimmedDescription = body.description.trim()
      if (trimmedDescription.length > 2000) {
        return NextResponse.json({ error: 'Description too long (max 2000 characters)' }, { status: 400 })
      }
      updateData.description = trimmedDescription || null
    }
    if (body.content_page_id !== undefined) {
      // Allow null to clear the content page
      if (body.content_page_id === null) {
        updateData.content_page_id = null
      } else if (typeof body.content_page_id === 'string') {
        // Validate that content page exists
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
        
        if (!supabaseUrl || !supabaseKey) {
          return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const adminClient = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        })

        const { data: contentPage } = await adminClient
          .from('content_pages')
          .select('id')
          .eq('id', body.content_page_id)
          .single()

        if (!contentPage) {
          return NextResponse.json({ error: 'Content page not found' }, { status: 400 })
        }

        updateData.content_page_id = body.content_page_id
      }
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

    // Update step
    const { data, error } = await adminClient
      .from('funnel_steps')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating step:', error)
      return NextResponse.json({ error: 'Failed to update step' }, { status: 500 })
    }

    return NextResponse.json({ step: data })
  } catch (error) {
    console.error('Error in PATCH /api/admin/funnel-steps/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
