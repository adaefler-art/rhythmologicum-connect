/**
 * E73.7: Content API Client
 * 
 * Client-side utility for fetching published content via runtime API.
 * Used when CONTENT_API_ENABLED feature flag is enabled.
 * 
 * Strategy A Compliance:
 * - Contains literal callsite: fetch('/api/content/${slug}')
 * - Runtime fetch (no build-time content)
 * - Deterministic 404 handling
 */

import { type ContentBlock } from '@/lib/contracts/contentBlocks'

export type ContentPageData = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body_markdown: string
  status: string
  layout: string
  category: string | null
  priority: number
  funnel_id: string | null
  flow_step: string | null
  order_index: number | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
  blocks?: ContentBlock[] | null
}

export type ContentApiResponse = {
  success: boolean
  data?: ContentPageData
  error?: string
}

/**
 * Fetch published content by slug
 * 
 * E73.7 Strategy A Requirement:
 * This function contains the literal callsite for the new API endpoint.
 * 
 * @param slug - Content page slug
 * @returns Promise with content data or null if not found
 */
export async function fetchContentBySlug(slug: string): Promise<ContentPageData | null> {
  try {
    // E73.7 LITERAL CALLSITE - Required by Strategy A
    const response = await fetch(`/api/content/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    // Deterministic 404 handling - no fallback
    if (response.status === 404) {
      console.log('[E73.7] Content not found (404):', { slug })
      return null
    }

    if (!response.ok) {
      console.error('[E73.7] Content fetch failed:', {
        slug,
        status: response.status,
        statusText: response.statusText,
      })
      return null
    }

    const result: ContentApiResponse = await response.json()

    if (!result.success || !result.data) {
      console.error('[E73.7] Invalid API response:', { slug, result })
      return null
    }

    console.log('[E73.7] Content fetched successfully:', {
      slug,
      title: result.data.title,
      status: result.data.status,
    })

    return result.data
  } catch (error) {
    console.error('[E73.7] Content fetch error:', {
      slug,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Prefetch content by slug (for optimization)
 * Uses the same endpoint but with different cache strategy
 */
export function prefetchContent(slug: string): void {
  // E73.7 LITERAL CALLSITE - Prefetch variant
  fetch(`/api/content/${slug}`, {
    method: 'GET',
    priority: 'low',
  }).catch((error) => {
    console.warn('[E73.7] Prefetch failed:', { slug, error })
  })
}
