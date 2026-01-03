import { NextRequest, NextResponse } from 'next/server'
import { getContentPage } from '@/lib/utils/contentResolver'
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper'
import { randomUUID } from 'crypto'

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
  const requestId = randomUUID()
  try {
    const searchParams = request.nextUrl.searchParams
    const funnel = searchParams.get('funnel')
    const category = searchParams.get('category') || undefined
    const slug = searchParams.get('slug') || undefined
    const includeDrafts = searchParams.get('includeDrafts') === 'true'

    const allowedCategories = ['intro', 'info', 'result']

    // Validate required parameters
    if (!funnel) {
      const response = NextResponse.json(
        { 
          success: false,
          requestId,
          error: { 
            code: 'MISSING_PARAMETER', 
            message: 'Funnel parameter is required',
            allowedValues: {
              category: allowedCategories,
              includeDrafts: ['true', 'false'],
            },
          },
        },
        { status: 422 },
      )
      trackUsage('GET /api/content/resolve', response)
      return response
    }

    if (category && !allowedCategories.includes(category)) {
      const response = NextResponse.json(
        {
          success: false,
          requestId,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid category value',
            field: 'category',
            allowedValues: allowedCategories,
          },
        },
        { status: 422 },
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
        version: 'v1',
        requestId,
        status: 'ok',
        content: result.page,
        page: result.page,
        strategy: result.strategy,
      })
      trackUsage('GET /api/content/resolve', response)
      return response
    }

    // No page found.
    // Contract: missing content is optional => return 200 with a versioned response.
    // Keep 404 only for truly unknown funnels.
    const isUnknownFunnel = result.error === 'FUNNEL_NOT_FOUND'

    if (isUnknownFunnel) {
      const notFoundResponse = NextResponse.json(
        {
          success: false,
          requestId,
          error: {
            code: 'FUNNEL_NOT_FOUND',
            message: 'Funnel not found',
          },
        },
        { status: 404 },
      )
      trackUsage('GET /api/content/resolve', notFoundResponse)
      return notFoundResponse
    }

    const missingResponse = NextResponse.json(
      {
        success: true,
        version: 'v1',
        requestId,
        status: 'missing_content',
        content: null,
        page: null,
        strategy: result.strategy,
      },
      { status: 200 },
    )
    trackUsage('GET /api/content/resolve', missingResponse)
    return missingResponse
  } catch (error) {
    console.error('[CONTENT_RESOLVE_API_ERROR]', { requestId })
    const errorResponse = NextResponse.json(
      {
        success: false,
        requestId,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 },
    )
    trackUsage('GET /api/content/resolve', errorResponse)
    return errorResponse
  }
}
