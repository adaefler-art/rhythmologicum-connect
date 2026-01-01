import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

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

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.body_markdown !== undefined) updateData.body_markdown = body.body_markdown
    if (body.order_index !== undefined) updateData.order_index = body.order_index

    // Update section
    const { data: updatedSection, error: updateError } = await supabase
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

    // Delete section
    const { error: deleteError } = await supabase
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
