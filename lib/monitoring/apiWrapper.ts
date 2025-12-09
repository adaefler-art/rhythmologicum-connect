import { NextRequest, NextResponse } from 'next/server'
import { logInfo, logError } from '@/lib/logging/logger'
import { ErrorCode } from '@/lib/api/responseTypes'

/**
 * B8: API Monitoring Wrapper
 * 
 * Provides instrumentation for API endpoints including:
 * - Response time measurement
 * - Error classification
 * - Request/response logging
 * 
 * Prepares infrastructure for future metrics dashboards.
 */

export type ApiMetrics = {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  success: boolean
  errorCode?: ErrorCode
  timestamp: string
}

/**
 * Wraps an API handler to measure performance and log metrics
 * 
 * @param handler - The original API route handler
 * @param endpointName - Name of the endpoint for logging
 * @returns Wrapped handler with instrumentation
 */
export function withMonitoring<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  endpointName: string,
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    const startTime = Date.now()
    const method = request.method

    try {
      // Execute the handler
      const response = await handler(request, context)
      
      // Measure response time
      const responseTime = Date.now() - startTime
      const statusCode = response.status

      // Parse response to check for errors
      const responseClone = response.clone()
      let errorCode: ErrorCode | undefined
      let success = statusCode >= 200 && statusCode < 300

      try {
        const body = await responseClone.json()
        if (body.success === false && body.error?.code) {
          errorCode = body.error.code
          success = false
        } else if (body.success === true) {
          success = true
        }
      } catch {
        // Response might not be JSON, that's ok
      }

      // Log metrics
      const metrics: ApiMetrics = {
        endpoint: endpointName,
        method,
        statusCode,
        responseTime,
        success,
        errorCode,
        timestamp: new Date().toISOString(),
      }

      logInfo(`API Response: ${method} ${endpointName}`, {
        ...metrics,
        type: 'api_metrics',
      })

      // TODO: Send metrics to monitoring service (e.g., Prometheus, DataDog)
      // This is a placeholder for future integration
      // await sendMetrics(metrics)

      return response
    } catch (error) {
      // Log unexpected errors
      const responseTime = Date.now() - startTime

      logError(
        `API Error: ${method} ${endpointName}`,
        {
          endpoint: endpointName,
          method,
          responseTime,
          type: 'api_error',
        },
        error,
      )

      // Re-throw to let Next.js handle it
      throw error
    }
  }
}

/**
 * Placeholder for future metrics collection service
 * 
 * TODO: Implement actual metrics collection when ready.
 * This can be implemented later to send metrics to:
 * - Prometheus
 * - DataDog
 * - CloudWatch
 * - Custom metrics dashboard
 * 
 * @param metrics - The metrics to send
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendMetrics(metrics: ApiMetrics): Promise<void> {
  // Future implementation:
  // - Batch metrics collection
  // - Send to metrics service
  // - Update real-time dashboards
  
  // Example placeholder:
  // await fetch('https://metrics-service.example.com/api/metrics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(metrics),
  // })
}

/**
 * Helper to extract user context from request for monitoring
 */
export function extractRequestContext(request: NextRequest): Record<string, any> {
  return {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent') || 'unknown',
    // Add more context as needed
  }
}
