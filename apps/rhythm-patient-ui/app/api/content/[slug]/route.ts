import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

/**
 * E73.7: Patient Content API - Published Content Only
 * 
 * GET /api/content/{slug}
 * 
 * Returns published content pages only. Deterministic 404 for:
 * - Unpublished content (draft/archived)
 * - Deleted content (soft-delete)
 * - Non-existent slugs
 * 
 * No fallback logic - strict published-only policy.
 * 
 * Strategy A Compliance:
 * - Literal callsite exists in /patient/(mobile)/content/[slug]/page.tsx (feature-flagged)
 * - Returns 404 for any non-published content
 * - Runtime fetch (no build-time content)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Invalid slug parameter' },
        { status: 400 },
      )
    }

    // Create authenticated Supabase client (respects RLS)
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    // Fetch content page - ONLY if published and not deleted
    // Deterministic 404: no fallback to draft/archived
    const { data: contentPage, error: pageError } = await (supabase as any)
      .from('content_pages')
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        body_markdown,
        status,
        layout,
        category,
        priority,
        funnel_id,
        flow_step,
        order_index,
        seo_title,
        seo_description,
        created_at,
        updated_at
      `,
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .is('deleted_at', null)
      .single()

    // Deterministic 404 - no fallback logic
    if (pageError || !contentPage) {
      // Log for debugging but return clean 404
      if (pageError && pageError.code !== 'PGRST116') {
        console.error('[E73.7] Content fetch error:', {
          slug,
          userId: user.id,
          error: pageError.message,
          code: pageError.code,
        })
      } else {
        console.log('[E73.7] Content not found (deterministic 404):', {
          slug,
          userId: user.id,
          reason: 'not_published_or_missing',
        })
      }

      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 },
      )
    }

    // Success: return published content
    console.log('[E73.7] Content served:', {
      slug,
      userId: user.id,
      contentId: contentPage.id,
      status: contentPage.status,
    })

    return NextResponse.json(
      {
        success: true,
        data: contentPage,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      },
    )
  } catch (error) {
    console.error('[E73.7] Unexpected error in GET /api/content/{slug}:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
