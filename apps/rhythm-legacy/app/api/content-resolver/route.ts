import { NextRequest, NextResponse } from 'next/server'
import { getContentPages } from '@/lib/utils/contentResolver'

/**
 * F8: Content Resolver API endpoint
 * 
 * Returns content pages based on funnel, category, and optional slug.
 * Uses the contentResolver utility to fetch pages from the database.
 * 
 * Query parameters:
 * - funnel: Required. Funnel slug or UUID (e.g., 'stress-assessment')
 * - category: Optional. Category filter (e.g., 'result', 'intro', 'info')
 * - slug: Optional. Specific page slug
 * - includeDrafts: Optional. Include draft pages (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const funnel = searchParams.get('funnel')
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')
    const includeDrafts = searchParams.get('includeDrafts') === 'true'

    if (!funnel) {
      return NextResponse.json(
        { error: 'Missing required parameter: funnel' },
        { status: 400 },
      )
    }

    // Use getContentPages to fetch all matching pages
    const pages = await getContentPages({
      funnel,
      category: category || undefined,
      slug: slug || undefined,
      includeDrafts,
    })

    return NextResponse.json(pages, { status: 200 })
  } catch (error) {
    console.error('Content resolver API error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve content pages' },
      { status: 500 },
    )
  }
}
