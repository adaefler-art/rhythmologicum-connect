/**
 * TV05_01: Usage Tracking Middleware Wrapper
 * 
 * Helper to wrap API route handlers with usage tracking.
 * Automatically records route usage with minimal code changes.
 */

import { recordUsage, getStatusCodeBucket } from './usageTracker'

/**
 * Wraps an API route handler with usage tracking
 * 
 * @param routeKey - Unique route identifier (e.g., 'POST /api/amy/stress-report')
 * @param handler - Original route handler function
 * @returns Wrapped handler with usage tracking
 * 
 * @example
 * ```typescript
 * export const POST = withUsageTracking(
 *   'POST /api/amy/stress-report',
 *   async (req: Request) => {
 *     // Original handler code
 *     return NextResponse.json({ success: true })
 *   }
 * )
 * ```
 */
export function withUsageTracking<T extends (...args: unknown[]) => Promise<Response>>(
  routeKey: string,
  handler: T,
): T {
  return (async (...args: Parameters<T>) => {
    let response: Response
    
    try {
      response = await handler(...args)
    } catch (error) {
      // Handler threw an error, record as 5xx
      await recordUsage({
        routeKey,
        statusCodeBucket: '5xx',
      }).catch(() => {
        // Ignore telemetry errors
      })
      throw error
    }

    // Record usage after response is ready
    const statusCodeBucket = getStatusCodeBucket(response.status)
    
    // Fire and forget - don't await to avoid slowing down response
    recordUsage({
      routeKey,
      statusCodeBucket,
    }).catch(() => {
      // Ignore telemetry errors
    })

    return response
  }) as T
}

/**
 * Manually record usage for a route (when wrapper can't be used)
 * 
 * @param routeKey - Unique route identifier
 * @param response - Response object to extract status from
 * 
 * @example
 * ```typescript
 * const response = NextResponse.json({ success: true })
 * await trackUsage('POST /api/amy/stress-report', response)
 * return response
 * ```
 */
export async function trackUsage(routeKey: string, response: Response): Promise<void> {
  const statusCodeBucket = getStatusCodeBucket(response.status)
  
  // Fire and forget
  recordUsage({
    routeKey,
    statusCodeBucket,
  }).catch(() => {
    // Ignore telemetry errors
  })
}
