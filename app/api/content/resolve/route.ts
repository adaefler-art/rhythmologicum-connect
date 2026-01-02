import { NextRequest, NextResponse } from 'next/server'
import { getContentPage } from '@/lib/utils/contentResolver'
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper'

/**
 * F6 API Endpoint: Content Resolver
 * 
 * Resolves content pages dynamically based on funnel, category, and optional slug.
 * Uses the Content Resolver utility to implement intelligent fallback logic.
 * 
 * Query Parameters:
 * - funnel (required): Funnel slug or UUID
 * - category (optional): Page category (e.g., 'intro', 'info', 'result')
 * - slug (optional): Specific page slug
 * - includeDrafts (optional): Whether to include draft pages (default: false)
 * 
 * Example:
 * GET /api/content/resolve?funnel=stress&category=intro
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const funnel = searchParams.get('funnel')
    const category = searchParams.get('category') || undefined
    const slug = searchParams.get('slug') || undefined
    const includeDrafts = searchParams.get('includeDrafts') === 'true'

    // Validate required parameters
    if (!funnel) {
      const response = NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'MISSING_PARAMETER', 
            message: 'Funnel parameter is required' 
          } 
        },
        { status: 400 },
      )
      trackUsage('GET /api/content/resolve', response)
      return response
    }

    // Call content resolver
    const result = await getContentPage({
      funnel,
      category,
      slug,
      includeDrafts,
    })

    // Return result based on resolution strategy
    if (result.page) {
      const response = NextResponse.json({
        success: true,
        page: result.page,
        strategy: result.strategy,
      })
      trackUsage('GET /api/content/resolve', response)
      return response
    }

    // No page found
    const notFoundResponse = NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: result.error || 'No matching content page found',
        },
        strategy: result.strategy,
      },
      { status: 404 },
    )
    trackUsage('GET /api/content/resolve', notFoundResponse)
    return notFoundResponse
  } catch (error) {
    console.error('Error in content resolver API:', error)
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 },
    )
    trackUsage('GET /api/content/resolve', errorResponse)
    return errorResponse
  }
}
