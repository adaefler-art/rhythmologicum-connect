import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
  notFoundResponse,
} from '@/lib/api/responses'
import { processDeliveryStage } from '@/lib/processing/deliveryStageProcessor'
import { logUnauthorized, logError } from '@/lib/logging/logger'
import { randomUUID } from 'crypto'

/**
 * API Route: Process Delivery Stage
 * 
 * POST /api/processing/delivery
 * 
 * Processes the delivery stage for a processing job.
 * Creates notifications and marks job as delivered.
 * 
 * Request Body:
 * {
 *   jobId: string (UUID)
 * }
 * 
 * Response (B8 standardized):
 * {
 *   success: boolean,
 *   data?: {
 *     jobId: string,
 *     notificationIds: string[]
 *   },
 *   error?: { code: string, message: string }
 * }
 * 
 * Security:
 * - Requires authentication (service role or authorized user)
 * - Currently service-role only for pipeline orchestration
 */

export async function POST(request: NextRequest) {
  const requestId = randomUUID()

  // ============================================================================
  // STEP 1: Authentication Check (BEFORE parsing body - DoS prevention)
  // ============================================================================
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({
      endpoint: '/api/processing/delivery',
      requestId,
    })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  // Get user role for RBAC (use app_metadata only, no fallback)
  const userRole = user.app_metadata?.role
  
  // Only clinicians and admins can trigger delivery manually
  // Service role operations handled separately
  if (userRole !== 'clinician' && userRole !== 'admin') {
    logUnauthorized({
      endpoint: '/api/processing/delivery',
      userId: user.id,
      role: userRole,
      requestId,
    })
    // Return 404 to avoid existence disclosure
    return notFoundResponse('Resource nicht gefunden.')
  }

  try {
    // ============================================================================
    // STEP 2: Parse and validate request
    // ============================================================================
    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return validationErrorResponse('jobId ist erforderlich.', {
        field: 'jobId',
        message: 'Missing jobId',
        requestId,
      })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(jobId)) {
      return validationErrorResponse('Ungültige jobId.', {
        field: 'jobId',
        message: 'jobId must be a valid UUID',
        requestId,
      })
    }

    // ============================================================================
    // STEP 3: Process delivery stage
    // ============================================================================
    const result = await processDeliveryStage(jobId)

    if (!result.success) {
      const statusCode = result.retryable ? 500 : 400
      const errorCode = result.retryable ? 'DELIVERY_ERROR' : 'DELIVERY_INELIGIBLE'
      
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: errorCode,
            message: result.error,
          },
        }),
        {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // ============================================================================
    // STEP 4: Return success response
    // ============================================================================
    return successResponse({
      jobId: result.jobId,
      notificationIds: result.notificationIds,
    })
  } catch (err) {
    // Do NOT log the full error as it may contain PHI
    logError('Error in POST /api/processing/delivery', { requestId }, err)
    return internalErrorResponse('Fehler bei der Zustellung.')
  }
}
