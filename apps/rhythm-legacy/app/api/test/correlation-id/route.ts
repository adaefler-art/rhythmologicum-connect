/**
 * E6.2.8: Test endpoint for correlation ID verification
 * GET /api/test/correlation-id
 * 
 * Returns the correlation ID from the request to verify the middleware works correctly.
 * This endpoint is for testing purposes only.
 */

import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api/responses'
import { getRequestId, withRequestId } from '@/lib/db/errors'

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)

  const response = successResponse(
    {
      message: 'Correlation ID test endpoint',
      receivedRequestId: requestId,
      timestamp: new Date().toISOString(),
    },
    200,
    requestId,
  )

  // Add correlation ID to response header
  return withRequestId(response, requestId)
}
