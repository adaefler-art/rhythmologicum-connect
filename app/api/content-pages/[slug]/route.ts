import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ContentPageWithFunnelAndSections } from '@/lib/types/content'

/**
 * D1 API Endpoint: Get Content Page by Slug
 * 
 * Fetches a single published content page by its slug.
 * Only pages with status='published' are returned.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Page slug is required' }, { status: 400 })
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

    // Fetch content page by slug, only if published
    const { data: contentPage, error: pageError } = await supabase
      .from('content_pages')
      .select(`
        *,
        funnel:funnels (
          id,
          slug,
          title
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (pageError || !contentPage) {
      console.error('Error fetching content page:', pageError)
      return NextResponse.json({ error: 'Content page not found' }, { status: 404 })
    }

    // Fetch sections for this content page
    const { data: sections } = await supabase
      .from('content_page_sections')
      .select('*')
      .eq('content_page_id', contentPage.id)
      .order('order_index', { ascending: true })

    return NextResponse.json({ ...contentPage, sections: sections || [] } as ContentPageWithFunnelAndSections)
  } catch (error) {
    console.error('Error loading content page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
