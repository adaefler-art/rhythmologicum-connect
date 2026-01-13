import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * E6.2.8: Correlation ID Middleware
 * 
 * Ensures every API request has a unique correlation ID (X-Request-Id).
 * - If client provides X-Request-Id header, it's preserved
 * - Otherwise, a new UUID is generated
 * - The correlation ID is added to the request for use by route handlers
 * 
 * This enables end-to-end request tracing from mobile clients through
 * backend services and logs.
 * 
 * Note: The middleware adds X-Request-Id to the request. API route handlers
 * should use getRequestId(request) to extract it and include it in their
 * responses using the response helper functions.
 */

export function middleware(request: NextRequest) {
  // Get or generate correlation ID
  const existingRequestId = request.headers.get('x-request-id')
  
  // If no correlation ID provided, generate one and add to request headers
  if (!existingRequestId) {
    const requestId = crypto.randomUUID()
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-request-id', requestId)
    
    // Create new request with correlation ID header
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // If correlation ID exists, just pass through
  return NextResponse.next()
}

/**
 * Apply middleware to all API routes
 * This ensures correlation IDs are present on all API requests
 */
export const config = {
  matcher: '/api/:path*',
}
