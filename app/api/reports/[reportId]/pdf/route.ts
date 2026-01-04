import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/supabase.server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { generateSignedUrl, verifyPdfAccess } from '@/lib/pdf/storage'
import { logUnauthorized, logForbidden } from '@/lib/logging/logger'
import { randomUUID } from 'crypto'
import type { SignedUrlResponse } from '@/lib/contracts/pdfGeneration'

/**
 * API Route: Get PDF Signed URL
 * 
 * GET /api/reports/[reportId]/pdf
 * 
 * Generates a signed URL for downloading the PDF report.
 * Enforces RBAC: patients can only access their own reports, clinicians can access all.
 * 
 * Query Parameters:
 * - expiresIn: number (optional, default: 3600, max: 86400) - URL expiry in seconds
 * 
 * Response (B8 standardized):
 * {
 *   success: boolean,
 *   data?: SignedUrlResponse,
 *   error?: { code: string, message: string }
 * }
 * 
 * Security:
 * - Requires authentication (401 if not authenticated)
 * - Validates ownership (patient) or role (clinician/admin) - 403 if unauthorized
 * - PDF must exist - 404 if not found
 * - Signed URLs are time-limited (default: 1 hour)
 */

interface RouteContext {
  params: Promise<{ reportId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = randomUUID()
  const { reportId } = await context.params

  try {
    // ============================================================================
    // STEP 1: Authentication Check
    // ============================================================================
    const user = await getCurrentUser()
    if (!user) {
      logUnauthorized({
        endpoint: '/api/reports/[reportId]/pdf',
        requestId,
      })
      return unauthorizedResponse('Authentifizierung erforderlich.')
    }

    // ============================================================================
    // STEP 2: Validate reportId format
    // ============================================================================
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(reportId)) {
      return notFoundResponse('Report', 'Ungültiger Report-Identifikator.')
    }

    // ============================================================================
    // STEP 3: Get assessment ID from report (or processing job)
    // ============================================================================
    // Note: We're using reportId which could be either a report ID or job ID
    // For now, we'll treat it as a job ID and fetch assessment_id from there
    const supabase = await createServerSupabaseClient()

    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .select('id, assessment_id, pdf_path, pdf_metadata, pdf_generated_at')
      .eq('id', reportId)
      .single()

    if (jobError || !job) {
      return notFoundResponse('Report', 'Report nicht gefunden.')
    }

    // Type assertion for new columns (until types are regenerated)
    const jobWithPdf = job as typeof job & {
      assessment_id: string
      pdf_path?: string | null
      pdf_metadata?: Record<string, any> | null
      pdf_generated_at?: string | null
    }

    // Check if PDF has been generated
    if (!jobWithPdf.pdf_path || !jobWithPdf.pdf_metadata) {
      return notFoundResponse('PDF', 'PDF wurde noch nicht generiert.')
    }

    // ============================================================================
    // STEP 4: Authorization Check (verify access)
    // ============================================================================
    const accessCheck = await verifyPdfAccess(jobWithPdf.assessment_id, user.id)

    if (!accessCheck.authorized) {
      logForbidden(
        {
          endpoint: '/api/reports/[reportId]/pdf',
          userId: user.id,
          resource: `report:${reportId}`,
          requestId,
        },
        accessCheck.error || 'PDF access denied',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, auf dieses PDF zuzugreifen.')
    }

    // ============================================================================
    // STEP 5: Parse query parameters
    // ============================================================================
    const searchParams = request.nextUrl.searchParams
    const expiresInParam = searchParams.get('expiresIn')
    let expiresIn = 3600 // Default: 1 hour

    if (expiresInParam) {
      const parsed = parseInt(expiresInParam, 10)
      if (!isNaN(parsed) && parsed >= 60 && parsed <= 86400) {
        expiresIn = parsed
      }
    }

    // ============================================================================
    // STEP 6: Generate signed URL
    // ============================================================================
    const urlResult = await generateSignedUrl(jobWithPdf.pdf_path!, expiresIn)

    if (!urlResult.success || !urlResult.url || !urlResult.expiresAt) {
      console.error('[SIGNED_URL_GENERATION_FAILED]', {
        requestId,
        reportId,
        userId: user.id,
        error: urlResult.error,
      })
      return internalErrorResponse('Fehler beim Generieren der Download-URL.')
    }

    // ============================================================================
    // STEP 7: Build and return response
    // ============================================================================
    const metadata = jobWithPdf.pdf_metadata as any
    const response: SignedUrlResponse = {
      url: urlResult.url,
      expiresAt: urlResult.expiresAt,
      metadata: {
        fileSizeBytes: metadata.fileSizeBytes,
        pageCount: metadata.pageCount,
        generatedAt: metadata.generatedAt,
      },
    }

    return successResponse(response, 200)
  } catch (error) {
    console.error('[PDF_SIGNED_URL_UNEXPECTED_ERROR]', {
      requestId,
      reportId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.')
  }
}
