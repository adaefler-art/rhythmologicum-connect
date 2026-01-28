/**
 * E73.3: Process Results Stage
 * 
 * POST /api/processing/results
 * 
 * Writes calculated_results after risk/ranking stages complete.
 * Idempotent: returns existing result if already written with same inputs_hash.
 * 
 * Auth: Requires clinician or admin role (system operation)
 * 
 * Request body:
 * {
 *   jobId: string (UUID)
 *   algorithmVersion?: string (optional, defaults to v1.0.0)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     resultId: string,
 *     isNew: boolean
 *   }
 * }
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logForbidden, logDatabaseError } from '@/lib/logging/logger'
import { processResultsStage } from '@/lib/processing/resultsStageProcessor'
import { z } from 'zod'

// ============================================================
// Request Schema
// ============================================================

const ProcessResultsRequestSchema = z.object({
  jobId: z.string().uuid(),
  algorithmVersion: z.string().optional(),
})

// ============================================================
// POST - Process Results Stage
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: '/api/processing/results',
      })
      return unauthorizedResponse()
    }

    // Check authorization - only clinicians/admins can trigger processing
    const userRole = user.app_metadata?.role || 'patient'
    if (userRole !== 'clinician' && userRole !== 'admin') {
      logForbidden(
        {
          userId: user.id,
          endpoint: '/api/processing/results',
        },
        'Only clinicians and admins can trigger results processing',
      )
      return forbiddenResponse('Only clinicians and admins can trigger results processing')
    }

    // Parse request body
    const body = await request.json()
    const parseResult = ProcessResultsRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return validationErrorResponse('Invalid request data', {
        errors: parseResult.error.issues,
      })
    }

    const { jobId, algorithmVersion } = parseResult.data

    // Get admin client for processing
    const adminClient = createAdminSupabaseClient()
    if (!adminClient) {
      return internalErrorResponse('Server configuration error')
    }

    // Fetch job to get assessment ID
    const { data: job, error: jobError } = await adminClient
      .from('processing_jobs')
      .select('assessment_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      logDatabaseError(
        {
          userId: user.id,
          operation: 'fetch_processing_job',
        },
        jobError || new Error('Job not found'),
      )
      return internalErrorResponse('Job not found')
    }

    // Process results stage
    const result = await processResultsStage(
      adminClient,
      jobId,
      job.assessment_id,
      algorithmVersion,
    )

    if (!result.success) {
      return internalErrorResponse(result.error || 'Results writing failed')
    }

    return successResponse({
      resultId: result.resultId,
      isNew: result.isNew,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return internalErrorResponse(`Unexpected error: ${message}`)
  }
}
