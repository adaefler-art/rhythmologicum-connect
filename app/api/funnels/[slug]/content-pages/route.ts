import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import type { ContentPage } from '@/lib/types/content'
import { FUNNEL_SLUG_ALIASES, getCanonicalFunnelSlug } from '@/lib/contracts/registry'

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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Funnel slug is required',
          },
        },
        { status: 422 },
      )
    }

    // Use admin client for published content pages (RLS bypass for public metadata)
    const supabase = createAdminSupabaseClient()

    // 1. Fetch funnel by slug to get funnel_id
    // V0.5: canonical slugs may be backed by legacy funnel rows. We treat missing content pages
    // as optional and only 404 for truly unknown slugs.
    const legacySlugs = Object.entries(FUNNEL_SLUG_ALIASES)
      .filter(([, canonical]) => canonical === effectiveSlug)
      .map(([legacy]) => legacy)

    const candidateSlugs = Array.from(new Set([effectiveSlug, ...legacySlugs]))
    let funnelId: string | null = null

    for (const candidate of candidateSlugs) {
      const { data: funnel } = await supabase
        .from('funnels')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle()

      if (funnel?.id) {
        funnelId = funnel.id
        break
      }
    }

    if (!funnelId) {
      // Not found in funnels table - try funnels_catalog
      const { data: catalogFunnel, error: catalogError } = await supabase
        .from('funnels_catalog')
        .select('id')
        .eq('slug', effectiveSlug)
        .maybeSingle()

      if (catalogError) {
        // Avoid dumping details; no secrets/PHI.
        console.error('[CONTENT_PAGES_CATALOG_LOOKUP_FAILED]')
        return NextResponse.json({ error: 'Error loading content pages' }, { status: 500 })
      }

      if (catalogFunnel?.id) {
        // Funnel exists in catalog but not fully defined yet
        // Return empty array instead of 404.
        return NextResponse.json([])
      }

      // Not found in either table
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // 2. Fetch published content pages for this funnel (excluding soft-deleted)
    const { data: contentPages, error: pagesError } = await supabase
      .from('content_pages')
      .select('*')
      .eq('funnel_id', funnelId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (pagesError) {
      if (pagesError.code === '42703') {
        console.warn('deleted_at column missing, retrying funnel content pages without soft-delete filter')
        const { data: fallbackPages, error: fallbackError } = await supabase
          .from('content_pages')
          .select('*')
          .eq('funnel_id', funnelId)
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

    return NextResponse.json((contentPages ?? []) as ContentPage[])
  } catch (error) {
    // Avoid dumping raw errors; no secrets/PHI.
    console.error('[CONTENT_PAGES_UNEXPECTED_ERROR]')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
