import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import type { ContentPage } from '@/lib/types/content'
import { FUNNEL_SLUG_ALIASES, getCanonicalFunnelSlug, isKnownFunnelSlug } from '@/lib/contracts/registry'
import { randomUUID } from 'crypto'

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
  const requestId = randomUUID()
  try {
    const { slug } = await params
    
    // Structured logging for deployment verification (no PHI)
    console.log('[Funnel Content Pages Request]', {
      requestId,
      requestedSlug: slug,
      timestamp: new Date().toISOString(),
    })
    
    // Use canonical funnel slug from registry
    effectiveSlug = getCanonicalFunnelSlug(slug)
    isKnownSlug = Object.values(FUNNEL_SLUG).includes(effectiveSlug)

    if (!effectiveSlug) {
      console.warn('[Funnel Content Pages Validation Failed]', {
        requestId,
        requestedSlug: slug,
        reason: 'Missing or invalid slug',
      })
      const validationResponse = NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Funnel slug is required',
          },
        },
        { status: 422 },
      )
      validationResponse.headers.set('X-Request-Id', requestId)
      return validationResponse
    }

    // Structured logging for slug resolution (no PHI)
    console.log('[Funnel Content Pages Slug Resolution]', {
      requestId,
      requestedSlug: slug,
      effectiveSlug,
    })

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
      // V0.5 P0 Fix: Check if funnel is known in registry before querying catalog
      // Known funnels that aren't in DB yet should return 200 [] not 500
      const isKnownFunnel = isKnownFunnelSlug(effectiveSlug)
      
      if (isKnownFunnel) {
        // Funnel is registered but not yet in DB - return empty pages
        console.log('[Funnel Content Pages Registry Known]', {
          requestId,
          effectiveSlug,
          pageCount: 0,
        })
        const registryResponse = NextResponse.json([])
        registryResponse.headers.set('X-Request-Id', requestId)
        return registryResponse
      }

      // Not found in funnels table - try funnels_catalog
      console.log('[Funnel Content Pages Trying Catalog]', {
        requestId,
        effectiveSlug,
        attemptedSlugs: candidateSlugs,
      })
      const { data: catalogFunnel, error: catalogError } = await supabase
        .from('funnels_catalog')
        .select('id')
        .eq('slug', effectiveSlug)
        .maybeSingle()

      if (catalogError) {
        // V0.5 P0 Fix: Log error details but distinguish between query error and "no pages"
        // Only 500 for true DB errors (permission/RLS/etc), not for missing data
        console.error('[Funnel Content Pages Catalog Lookup Failed]', {
          requestId,
          effectiveSlug,
          errorCode: catalogError.code,
          errorMessage: catalogError.message,
        })
        const errorResponse = NextResponse.json({ error: 'Error loading content pages' }, { status: 500 })
        errorResponse.headers.set('X-Request-Id', requestId)
        return errorResponse
      }

      if (catalogFunnel?.id) {
        // Funnel exists in catalog but not fully defined yet
        // Return empty array instead of 404.
        console.log('[Funnel Content Pages Catalog Found]', {
          requestId,
          effectiveSlug,
          funnelId: catalogFunnel.id,
          pageCount: 0,
        })
        const catalogResponse = NextResponse.json([])
        catalogResponse.headers.set('X-Request-Id', requestId)
        return catalogResponse
      }

      // Not found in either table
      console.warn('[Funnel Content Pages Not Found]', {
        requestId,
        requestedSlug: slug,
        effectiveSlug,
        attemptedSlugs: candidateSlugs,
      })
      const notFoundResponse = NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
      notFoundResponse.headers.set('X-Request-Id', requestId)
      return notFoundResponse
    }

    // Structured logging for funnel resolution (no PHI)
    console.log('[Funnel Content Pages Funnel Resolved]', {
      requestId,
      effectiveSlug,
      funnelId,
    })

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
        console.warn('[Funnel Content Pages Schema Mismatch]', {
          requestId,
          funnelId,
          reason: 'deleted_at column missing, using fallback query',
        })
        const { data: fallbackPages, error: fallbackError } = await supabase
          .from('content_pages')
          .select('*')
          .eq('funnel_id', funnelId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        if (fallbackError) {
          console.error('[Funnel Content Pages Fallback Error]', {
            requestId,
            funnelId,
            errorCode: fallbackError.code,
          })
          const fallbackErrorResponse = NextResponse.json(
            { error: 'Error loading content pages' },
            { status: 500 },
          )
          fallbackErrorResponse.headers.set('X-Request-Id', requestId)
          return fallbackErrorResponse
        }

        console.log('[Funnel Content Pages Success (Fallback)]', {
          requestId,
          funnelId,
          pageCount: fallbackPages?.length ?? 0,
        })
        const fallbackSuccessResponse = NextResponse.json(fallbackPages as ContentPage[])
        fallbackSuccessResponse.headers.set('X-Request-Id', requestId)
        return fallbackSuccessResponse
      }

      console.error('[Funnel Content Pages Query Error]', {
        requestId,
        funnelId,
        errorCode: pagesError.code,
      })
      const queryErrorResponse = NextResponse.json(
        { error: 'Error loading content pages' },
        { status: 500 },
      )
      queryErrorResponse.headers.set('X-Request-Id', requestId)
      return queryErrorResponse
    }

    console.log('[Funnel Content Pages Success]', {
      requestId,
      funnelId,
      effectiveSlug,
      pageCount: contentPages?.length ?? 0,
    })
    const successResponse = NextResponse.json((contentPages ?? []) as ContentPage[])
    successResponse.headers.set('X-Request-Id', requestId)
    return successResponse
  } catch (error) {
    // Structured logging for unexpected errors (no PHI, minimal error details)
    console.error('[Funnel Content Pages Unexpected Error]', {
      requestId,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
    const unexpectedErrorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
    unexpectedErrorResponse.headers.set('X-Request-Id', requestId)
    return unexpectedErrorResponse
  }
}
