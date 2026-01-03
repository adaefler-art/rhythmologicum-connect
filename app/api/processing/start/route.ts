import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
  errorResponse,
} from '@/lib/api/responses'
import { ErrorCode } from '@/lib/api/responseTypes'
import { logUnauthorized, logForbidden, logDatabaseError } from '@/lib/logging/logger'
import {
  CreateProcessingJobInputSchema,
  generateCorrelationId,
  PROCESSING_STAGE,
  PROCESSING_STATUS,
  type ProcessingJobV1,
} from '@/lib/contracts/processingJob'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * V05-I05.1: Start Processing Job
 * 
 * POST /api/processing/start
 * 
 * Creates a new processing job for a completed assessment.
 * Idempotent: same assessmentId + correlationId returns existing job.
 * 
 * Auth: Patient can only process their own assessments, clinicians can process any.
 * 
 * Request body:
 * {
 *   assessmentId: string (UUID)
 *   correlationId?: string (optional, auto-generated if not provided)
 * }
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
 *     createdAt: string,
 *     isNewJob: boolean
 *   }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication FIRST (before any parsing/validation)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: '/api/processing/start',
      })
      return unauthorizedResponse()
    }

    // Parse and validate request body AFTER auth check
    const body = await request.json()
    const parseResult = CreateProcessingJobInputSchema.safeParse(body)

    if (!parseResult.success) {
      return validationErrorResponse('Ungültige Eingabedaten.', {
        errors: parseResult.error.issues,
      })
    }

    const { assessmentId, correlationId: inputCorrelationId } = parseResult.data

    // Generate correlation ID if not provided
    const correlationId = inputCorrelationId || generateCorrelationId(assessmentId)

    // Get user role for RBAC
    const userRole = user.app_metadata?.role || 'patient'

    // Load assessment to verify ownership and status
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, status, funnel')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: '/api/processing/start',
        },
        assessmentError,
      )
      // 404 for no existence disclosure
      return notFoundResponse('Assessment')
    }

    // Verify assessment is completed
    if (assessment.status !== 'completed') {
      return errorResponse(
        ErrorCode.INVALID_INPUT,
        'Assessment muss abgeschlossen sein, um verarbeitet zu werden.',
        422,
        { assessmentStatus: assessment.status },
      )
    }

    // Verify ownership/access for all users
    if (userRole === 'patient') {
      // Patients: verify they own the assessment
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientProfile || assessment.patient_id !== patientProfile.id) {
        logForbidden(
          {
            userId: user.id,
            assessmentId,
            endpoint: '/api/processing/start',
          },
          'Patient does not own assessment',
        )
        // Return 404 instead of 403 to avoid existence disclosure
        return notFoundResponse('Assessment')
      }
    } else if (userRole === 'clinician') {
      // Clinicians: verify they are assigned to this patient
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
            assessmentId,
            endpoint: '/api/processing/start',
          },
          'Clinician not assigned to patient',
        )
        // Return 404 to avoid existence disclosure
        return notFoundResponse('Assessment')
      }
    }
    // Admins can access any assessment (no additional check needed)

    // Use service role client for job creation (bypasses RLS)
    const serviceClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '',
      env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || '',
      {
        auth: { persistSession: false },
      },
    )

    // Check for existing job (idempotency - by assessment_id, correlation_id, schema_version)
    const { data: existingJobs, error: existingError } = await serviceClient
      .from('processing_jobs')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('correlation_id', correlationId)
      .eq('schema_version', 'v1')
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: '/api/processing/start',
        },
        existingError,
      )
      return internalErrorResponse('Fehler beim Prüfen bestehender Jobs.')
    }

    // If job already exists, return it (idempotent)
    if (existingJobs && existingJobs.length > 0) {
      const existingJob = existingJobs[0]
      return successResponse(
        {
          jobId: existingJob.id,
          assessmentId: existingJob.assessment_id,
          correlationId: existingJob.correlation_id,
          status: existingJob.status,
          stage: existingJob.stage,
          createdAt: existingJob.created_at,
          isNewJob: false,
        },
        200,
      )
    }

    // Create new processing job
    const now = new Date().toISOString()
    const newJob = {
      assessment_id: assessmentId,
      correlation_id: correlationId,
      status: PROCESSING_STATUS.QUEUED,
      stage: PROCESSING_STAGE.PENDING,
      attempt: 1,
      max_attempts: 3,
      created_at: now,
      updated_at: now,
      errors: [],
      schema_version: 'v1',
    }

    const { data: createdJob, error: createError } = await serviceClient
      .from('processing_jobs')
      .insert(newJob)
      .select()
      .single()

    if (createError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: '/api/processing/start',
        },
        createError,
      )
      return internalErrorResponse('Fehler beim Erstellen des Processing Jobs.')
    }

    return successResponse(
      {
        jobId: createdJob.id,
        assessmentId: createdJob.assessment_id,
        correlationId: createdJob.correlation_id,
        status: createdJob.status,
        stage: createdJob.stage,
        createdAt: createdJob.created_at,
        isNewJob: true,
      },
      201,
    )
  } catch (error) {
    logDatabaseError(
      {
        endpoint: 'POST /api/processing/start',
      },
      error,
    )
    return internalErrorResponse()
  }
}
