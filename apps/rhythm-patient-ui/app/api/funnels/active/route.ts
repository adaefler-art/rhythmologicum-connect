import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

/**
 * GET /api/funnels/active
 *
 * Returns all active funnels for patient selection screen.
 * Requires authentication but no special role.
 */
export async function GET() {
  try {
    const supabase = (await createServerSupabaseClient()) as any

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: funnels, error: funnelsError } = await supabase
      .from('funnels')
      .select('id, slug, title, subtitle, description, default_theme')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (funnelsError) {
      console.error('Error fetching active funnels:', funnelsError)
      return NextResponse.json({ error: 'Failed to fetch funnels' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: funnels || [],
    })
  } catch (error) {
    console.error('Error in GET /api/funnels/active:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}