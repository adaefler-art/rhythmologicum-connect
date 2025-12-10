import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * F3 API Endpoint: Update section
 * PATCH /api/admin/content-pages/[id]/sections/[sectionId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  try {
    const { sectionId } = await params
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

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.body_markdown !== undefined) updateData.body_markdown = body.body_markdown
    if (body.order_index !== undefined) updateData.order_index = body.order_index

    // Update section
    const { data: updatedSection, error: updateError } = await adminClient
      .from('content_page_sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating section:', updateError)
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
    }

    return NextResponse.json({ section: updatedSection })
  } catch (error) {
    console.error('Error in PATCH /api/admin/content-pages/[id]/sections/[sectionId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * F3 API Endpoint: Delete section
 * DELETE /api/admin/content-pages/[id]/sections/[sectionId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  try {
    const { sectionId } = await params

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

    // Delete section
    const { error: deleteError } = await adminClient
      .from('content_page_sections')
      .delete()
      .eq('id', sectionId)

    if (deleteError) {
      console.error('Error deleting section:', deleteError)
      return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/content-pages/[id]/sections/[sectionId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
