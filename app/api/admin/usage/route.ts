import { NextRequest } from 'next/server'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { hasAdminOrClinicianRole, getCurrentUser } from '@/lib/db/supabase.server'
import { getAggregatedUsage } from '@/lib/monitoring/usageTracker'
import { logInfo, logUnauthorized, logForbidden } from '@/lib/logging/logger'

/**
 * TV05_01: Admin Usage Telemetry Endpoint
 * GET /api/admin/usage
 * 
 * Returns aggregated usage metrics for tracked API routes.
 * 
 * Authentication:
 * - unauth → 401
 * - non-admin → 403
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "routes": [
 *       {
 *         "routeKey": "POST /api/amy/stress-report",
 *         "count": 42,
 *         "lastSeenAt": "2026-01-02T10:00:00.000Z",
 *         "statusBuckets": { "2xx": 40, "3xx": 0, "4xx": 2, "5xx": 0 },
 *         "env": "production"
 *       }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Auth gate: must be authenticated
    const user = await getCurrentUser()
    
    if (!user) {
      logUnauthorized({ endpoint: '/api/admin/usage' })
      return unauthorizedResponse()
    }

    // Authorization gate: must be admin or clinician
    const isAuthorized = await hasAdminOrClinicianRole()
    
    if (!isAuthorized) {
      logForbidden({ endpoint: '/api/admin/usage', userId: user.id }, 'non-admin user')
      return forbiddenResponse()
    }

    // Get aggregated usage data
    const routes = await getAggregatedUsage()

    logInfo('Admin usage data accessed', {
      endpoint: '/api/admin/usage',
      userId: user.id,
      routeCount: routes.length,
    })

    return successResponse({
      routes,
      generatedAt: new Date().toISOString(),
      totalRoutes: routes.length,
    })
  } catch (error) {
    console.error('[admin/usage] Error fetching usage data:', error)
    return internalErrorResponse()
  }
}
