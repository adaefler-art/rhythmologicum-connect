import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { processPdfStage } from '@/lib/processing/pdfStageProcessor'
import { logUnauthorized } from '@/lib/logging/logger'
import { randomUUID } from 'crypto'

/**
 * API Route: Process PDF Stage
 * 
 * POST /api/processing/pdf
 * 
 * Processes the PDF generation stage for a processing job.
 * Generates PDF from approved report sections and stores in secure storage.
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
 *     pdfPath: string,
 *     metadata: PdfMetadata,
 *     generationTimeMs: number
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

  try {
    // ============================================================================
    // STEP 1: Authentication Check
    // ============================================================================
    const user = await getCurrentUser()
    if (!user) {
      logUnauthorized({
        endpoint: '/api/processing/pdf',
        requestId,
      })
      return unauthorizedResponse('Authentifizierung erforderlich.')
    }

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
    // STEP 3: Process PDF stage
    // ============================================================================
    const result = await processPdfStage(jobId)

    if (!result.success) {
      console.error('[PDF_STAGE_FAILED]', {
        requestId,
        jobId,
        error: result.error,
      })

      return internalErrorResponse(
        result.error?.message || 'PDF-Generierung fehlgeschlagen.',
      )
    }

    // ============================================================================
    // STEP 4: Return success
    // ============================================================================
    return successResponse(result.data, 200)
  } catch (error) {
    console.error('[PDF_STAGE_UNEXPECTED_ERROR]', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.')
  }
}
