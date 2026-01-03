import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logForbidden, logDatabaseError } from '@/lib/logging/logger'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * V05-I05.1: Get Processing Job Status
 * 
 * GET /api/processing/jobs/[jobId]
 * 
 * Retrieves the current status and details of a processing job.
 * 
 * Auth: Patient can only view jobs for their own assessments, clinicians can view any.
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     jobId: string,
 *     assessmentId: string,
 *     correlationId: string,
 *     status: string,
 *     stage: string,
 *     attempt: number,
 *     maxAttempts: number,
 *     createdAt: string,
 *     updatedAt: string,
 *     startedAt: string | null,
 *     completedAt: string | null,
 *     errors: array
 *   }
 * }
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await context.params

    if (!jobId) {
      return notFoundResponse('Job ID fehlt.')
    }

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: `/api/processing/jobs/${jobId}`,
        jobId,
      })
      return unauthorizedResponse()
    }

    // Get user role for RBAC
    const userRole = user.app_metadata?.role || 'patient'

    // Use service role client to read job (bypasses RLS for initial fetch)
    const serviceClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '',
      env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || '',
      {
        auth: { persistSession: false },
      },
    )

    // Load job
    const { data: job, error: jobError } = await serviceClient
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      logDatabaseError(
        {
          userId: user.id,
          jobId,
          endpoint: `/api/processing/jobs/${jobId}`,
        },
        jobError,
      )
      return notFoundResponse('Processing Job')
    }

    // Verify ownership for patients
    if (userRole === 'patient') {
      // Get patient profile
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientProfile) {
        logForbidden(
          {
            userId: user.id,
            jobId,
            endpoint: `/api/processing/jobs/${jobId}`,
          },
          'Patient profile not found',
        )
        return forbiddenResponse('Sie haben keine Berechtigung, diesen Job anzuzeigen.')
      }

      // Load assessment to verify ownership
      const { data: assessment } = await supabase
        .from('assessments')
        .select('patient_id')
        .eq('id', job.assessment_id)
        .single()

      if (!assessment || assessment.patient_id !== patientProfile.id) {
        logForbidden(
          {
            userId: user.id,
            jobId,
            endpoint: `/api/processing/jobs/${jobId}`,
          },
          'Patient does not own assessment',
        )
        return forbiddenResponse('Sie haben keine Berechtigung, diesen Job anzuzeigen.')
      }
    }

    // Return job details
    return successResponse({
      jobId: job.id,
      assessmentId: job.assessment_id,
      correlationId: job.correlation_id,
      status: job.status,
      stage: job.stage,
      attempt: job.attempt,
      maxAttempts: job.max_attempts,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      startedAt: job.started_at || null,
      completedAt: job.completed_at || null,
      errors: job.errors || [],
    })
  } catch (error) {
    logDatabaseError(
      {
        endpoint: 'GET /api/processing/jobs/[jobId]',
      },
      error,
    )
    return internalErrorResponse()
  }
}
