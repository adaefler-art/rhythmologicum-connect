import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * E6.2.8: Correlation ID Middleware
 * 
 * Ensures every API request has a unique correlation ID (X-Request-Id).
 * - If client provides X-Request-Id header, it's preserved
 * - Otherwise, a new UUID is generated
 * - The correlation ID is added to response headers for traceability
 * 
 * This enables end-to-end request tracing from mobile clients through
 * backend services and logs.
 */

export function middleware(request: NextRequest) {
  // Get or generate correlation ID
  const existingRequestId = request.headers.get('x-request-id')
  const requestId = existingRequestId || crypto.randomUUID()

  // Continue with the request
  const response = NextResponse.next()

  // Add correlation ID to response headers
  response.headers.set('x-request-id', requestId)

  return response
}

/**
 * Apply middleware to all API routes
 * This ensures correlation IDs are present on all API responses
 */
export const config = {
  matcher: '/api/:path*',
}
