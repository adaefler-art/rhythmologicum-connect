import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ContentPage } from '@/lib/types/content'

/**
 * D1 API Endpoint: List Content Pages for a Funnel
 * 
 * Fetches all published content pages associated with a funnel.
 * Only pages with status='published' are returned.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Funnel slug is required' }, { status: 400 })
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // 1. Fetch funnel by slug to get funnel_id
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id')
      .eq('slug', slug)
      .single()

    if (funnelError || !funnel) {
      console.error('Error fetching funnel:', funnelError)
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // 2. Fetch published content pages for this funnel
    const { data: contentPages, error: pagesError } = await supabase
      .from('content_pages')
      .select('*')
      .eq('funnel_id', funnel.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (pagesError) {
      console.error('Error fetching content pages:', pagesError)
      return NextResponse.json(
        { error: 'Error loading content pages' },
        { status: 500 },
      )
    }

    return NextResponse.json(contentPages as ContentPage[])
  } catch (error) {
    console.error('Error loading content pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
