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
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

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

    const supabase = await createServerSupabaseClient()

    // Check authentication FIRST (before any other operations)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: `/api/processing/jobs/${jobId}`,
      })
      return unauthorizedResponse()
    }

    if (!jobId) {
      return notFoundResponse('Job ID fehlt.')
    }

    // Get user role for RBAC
    const userRole = user.app_metadata?.role || 'patient'

    // Use service role client to read job (bypasses RLS for initial fetch)
    const serviceClient = createAdminSupabaseClient()

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
      // 404 for no existence disclosure
      return notFoundResponse('Processing Job')
    }

    // Verify ownership/access for all users
    if (userRole === 'patient') {
      // Patients: verify they own the assessment
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
        // Return 404 to avoid existence disclosure
        return notFoundResponse('Processing Job')
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
        // Return 404 to avoid existence disclosure
        return notFoundResponse('Processing Job')
      }
    } else if (userRole === 'clinician') {
      // Clinicians: verify they are assigned to the patient
      const { data: assessment } = await supabase
        .from('assessments')
        .select('patient_id')
        .eq('id', job.assessment_id)
        .single()

      if (!assessment) {
        // Return 404 to avoid existence disclosure
        return notFoundResponse('Processing Job')
      }

      const { data: assignment } = await supabase
        .from('clinician_patient_assignments')
        .select('id')
        .eq('clinician_user_id', user.id)
        .eq('patient_id', assessment.patient_id)
        .single()

      if (!assignment) {
        logForbidden(
          {
            userId: user.id,
            jobId,
            endpoint: `/api/processing/jobs/${jobId}`,
          },
          'Clinician not assigned to patient',
        )
        // Return 404 to avoid existence disclosure
        return notFoundResponse('Processing Job')
      }
    }
    // Admins can access any job (no additional check needed)

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
