/**
 * V05-I05.2: Process Risk Stage
 * 
 * POST /api/processing/risk
 * 
 * Triggers risk calculation for a processing job.
 * Idempotent: returns existing bundle if already calculated.
 * 
 * Auth: Requires clinician or admin role (system operation)
 * 
 * Request body:
 * {
 *   jobId: string (UUID)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     bundleId: string,
 *     isNewBundle: boolean
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
import { processRiskStage } from '@/lib/processing/riskStageProcessor'
import { z } from 'zod'

// ============================================================
// Request Schema
// ============================================================

const ProcessRiskRequestSchema = z.object({
  jobId: z.string().uuid(),
})

// ============================================================
// POST - Process Risk Stage
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
        endpoint: '/api/processing/risk',
      })
      return unauthorizedResponse()
    }

    // Check authorization - only clinicians/admins can trigger processing
    const userRole = user.app_metadata?.role || 'patient'
    if (userRole !== 'clinician' && userRole !== 'admin') {
      logForbidden(
        {
          userId: user.id,
          endpoint: '/api/processing/risk',
        },
        'Only clinicians and admins can trigger risk processing',
      )
      return forbiddenResponse('Only clinicians and admins can trigger risk processing')
    }

    // Parse request body
    const body = await request.json()
    const parseResult = ProcessRiskRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return validationErrorResponse('Invalid request data', {
        errors: parseResult.error.issues,
      })
    }

    const { jobId } = parseResult.data

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

    // Process risk stage
    const result = await processRiskStage(adminClient, jobId, job.assessment_id)

    if (!result.success) {
      return internalErrorResponse(result.error || 'Risk calculation failed')
    }

    return successResponse({
      bundleId: result.bundleId,
      isNewBundle: true, // TODO: Track this in processor
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return internalErrorResponse(`Unexpected error: ${message}`)
  }
}
