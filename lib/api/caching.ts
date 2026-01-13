/**
 * HTTP Caching and Pagination Utilities
 * 
 * E6.2.7: Mobile-friendly caching and pagination support
 * 
 * Provides utilities for:
 * - ETag generation and validation
 * - Last-Modified header handling
 * - Cache-Control header generation
 * - Cursor-based pagination encoding/decoding
 */

import { NextResponse } from 'next/server'

/**
 * Generate an ETag for a resource
 * Format: "resource:version:timestamp"
 * 
 * @param resource - Resource identifier (e.g., 'funnels', 'funnel:slug')
 * @param version - Schema or data version
 * @param timestamp - Last modification timestamp (ISO string or Date)
 * @returns ETag string with quotes
 */
export function generateETag(
  resource: string,
  version: string,
  timestamp: string | Date,
): string {
  const isoTimestamp = typeof timestamp === 'string' ? timestamp : timestamp.toISOString()
  return `"${resource}:v${version}:${isoTimestamp}"`
}

/**
 * Generate Last-Modified header value from timestamp
 * Format: HTTP date format (RFC 7231)
 * 
 * @param timestamp - ISO timestamp or Date object
 * @returns HTTP date string
 */
export function generateLastModified(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toUTCString()
}

/**
 * Generate Cache-Control header value
 * 
 * @param maxAge - Cache duration in seconds
 * @param isPublic - Whether response is public (vs private)
 * @param mustRevalidate - Whether cache must revalidate when stale
 * @returns Cache-Control header value
 */
export function generateCacheControl(
  maxAge: number,
  isPublic = true,
  mustRevalidate = true,
): string {
  const directives = [isPublic ? 'public' : 'private', `max-age=${maxAge}`]

  if (mustRevalidate) {
    directives.push('must-revalidate')
  }

  return directives.join(', ')
}

/**
 * Check if request has If-None-Match header matching ETag
 * Returns true if client cache is still valid
 * 
 * @param request - HTTP request
 * @param etag - Current ETag
 * @returns True if client has matching ETag (304 should be returned)
 */
export function checkETagMatch(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match')
  return ifNoneMatch === etag
}

/**
 * Check if request has If-Modified-Since matching Last-Modified
 * Returns true if client cache is still valid
 * 
 * @param request - HTTP request
 * @param lastModified - Last-Modified timestamp
 * @returns True if resource not modified since client's timestamp
 */
export function checkNotModifiedSince(request: Request, lastModified: Date): boolean {
  const ifModifiedSince = request.headers.get('If-Modified-Since')
  if (!ifModifiedSince) return false

  try {
    const clientTimestamp = new Date(ifModifiedSince)
    // Compare timestamps (ignore milliseconds)
    return Math.floor(lastModified.getTime() / 1000) <= Math.floor(clientTimestamp.getTime() / 1000)
  } catch {
    return false
  }
}

/**
 * Create 304 Not Modified response with cache headers
 * 
 * @param etag - ETag value
 * @param cacheControl - Cache-Control value
 * @returns NextResponse with 304 status and cache headers
 */
export function notModifiedResponse(etag: string, cacheControl: string): NextResponse {
  return new NextResponse(null, {
    status: 304,
    headers: {
      ETag: etag,
      'Cache-Control': cacheControl,
    },
  })
}

/**
 * Add cache headers to an existing NextResponse
 * 
 * @param response - NextResponse to augment
 * @param etag - ETag value
 * @param lastModified - Last-Modified timestamp
 * @param cacheControl - Cache-Control value
 * @returns Response with cache headers added
 */
export function addCacheHeaders(
  response: NextResponse,
  etag: string,
  lastModified: string,
  cacheControl: string,
): NextResponse {
  response.headers.set('ETag', etag)
  response.headers.set('Last-Modified', lastModified)
  response.headers.set('Cache-Control', cacheControl)
  return response
}

/**
 * Pagination cursor for catalog endpoints
 */
export type PaginationCursor = {
  title: string
  slug: string
}

/**
 * Encode pagination cursor to base64 string
 * 
 * @param cursor - Cursor object with title and slug
 * @returns Base64 encoded cursor string
 */
export function encodeCursor(cursor: PaginationCursor): string {
  const json = JSON.stringify(cursor)
  return Buffer.from(json, 'utf-8').toString('base64')
}

/**
 * Decode pagination cursor from base64 string
 * 
 * @param cursorString - Base64 encoded cursor
 * @returns Decoded cursor object or null if invalid
 */
export function decodeCursor(cursorString: string): PaginationCursor | null {
  try {
    const json = Buffer.from(cursorString, 'base64').toString('utf-8')
    const parsed = JSON.parse(json) as unknown

    // Validate cursor shape
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'title' in parsed &&
      'slug' in parsed &&
      typeof parsed.title === 'string' &&
      typeof parsed.slug === 'string'
    ) {
      return parsed as PaginationCursor
    }

    return null
  } catch {
    return null
  }
}

/**
 * Pagination metadata for response
 */
export type PaginationMetadata = {
  limit: number
  hasMore: boolean
  nextCursor: string | null
}

/**
 * Create pagination metadata for response
 * 
 * @param items - Array of items in current page
 * @param limit - Items per page
 * @param totalFetched - Total items fetched (may be limit + 1 to check hasMore)
 * @param getLastItem - Function to extract last item for cursor
 * @returns Pagination metadata object
 */
export function createPaginationMetadata<T>(
  items: T[],
  limit: number,
  totalFetched: number,
  getLastItem: (item: T) => PaginationCursor,
): PaginationMetadata {
  const hasMore = totalFetched > limit
  const lastItem = items.length > 0 ? items[items.length - 1] : null

  return {
    limit,
    hasMore,
    nextCursor: hasMore && lastItem ? encodeCursor(getLastItem(lastItem)) : null,
  }
}

/**
 * Find the most recent timestamp from a list of ISO strings or Dates
 * 
 * @param timestamps - Array of ISO timestamp strings or Date objects
 * @returns Most recent Date object, or current date if array empty
 */
export function findMostRecentTimestamp(timestamps: Array<string | Date | null>): Date {
  const validTimestamps = timestamps
    .filter((t): t is string | Date => t !== null)
    .map((t) => (typeof t === 'string' ? new Date(t) : t))
    .filter((d) => !isNaN(d.getTime()))

  if (validTimestamps.length === 0) {
    return new Date()
  }

  return new Date(Math.max(...validTimestamps.map((d) => d.getTime())))
}
