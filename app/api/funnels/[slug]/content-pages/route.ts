import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import type { ContentPage } from '@/lib/types/content'
import { getCanonicalFunnelSlug } from '@/lib/contracts/registry'

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
    
    // Use canonical funnel slug from registry
    const effectiveSlug = getCanonicalFunnelSlug(slug)

    if (!effectiveSlug) {
      return NextResponse.json({ error: 'Funnel slug is required' }, { status: 400 })
    }

    // Use admin client for published content pages (RLS bypass for public metadata)
    const supabase = createAdminSupabaseClient()

    // 1. Fetch funnel by slug to get funnel_id
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id')
      .eq('slug', effectiveSlug)
      .single()

    if (funnelError || !funnel) {
      console.error('Error fetching funnel:', funnelError)
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // 2. Fetch published content pages for this funnel (excluding soft-deleted)
    const { data: contentPages, error: pagesError } = await supabase
      .from('content_pages')
      .select('*')
      .eq('funnel_id', funnel.id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (pagesError) {
      if (pagesError.code === '42703') {
        console.warn('deleted_at column missing, retrying funnel content pages without soft-delete filter')
        const { data: fallbackPages, error: fallbackError } = await supabase
          .from('content_pages')
          .select('*')
          .eq('funnel_id', funnel.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        if (fallbackError) {
          console.error('Error fetching content pages (fallback):', fallbackError)
          return NextResponse.json(
            { error: 'Error loading content pages' },
            { status: 500 },
          )
        }

        return NextResponse.json(fallbackPages as ContentPage[])
      }

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
