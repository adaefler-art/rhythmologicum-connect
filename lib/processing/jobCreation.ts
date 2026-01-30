/**
 * Processing Job Creation - E73.2
 *
 * Idempotent job creation when assessment is completed.
 * Uses unique constraint on (assessment_id, correlation_id, schema_version)
 * to prevent duplicate job creation.
 *
 * @module lib/processing/jobCreation
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { logAuditEvent } from '@/lib/audit/log'
import {
  generateCorrelationId,
  PROCESSING_STATUS,
  PROCESSING_STAGE,
  type ProcessingJobV1,
} from '@/lib/contracts/processingJob'

/**
 * Result of creating a processing job
 */
export type CreateJobResult = {
  success: boolean
  jobId?: string
  status?: string
  stage?: string
  isNewJob?: boolean
  error?: string
}

/**
 * Input for creating a processing job
 */
export type CreateJobInput = {
  assessmentId: string
  correlationId?: string
  userId?: string
  userRole?: string
  supabase?: SupabaseClient
}

/**
 * Creates a processing job for a completed assessment (idempotent)
 *
 * This function:
 * - First checks if a job already exists (select-then-insert pattern)
 * - Generates a correlation ID if not provided
 * - Creates a new job if none exists
 * - Handles race conditions via unique constraint violations (23505)
 * - Logs audit event for job creation
 * - Returns job_id and status in response
 *
 * The unique constraint on (assessment_id, correlation_id, schema_version)
 * ensures that duplicate calls with the same assessment+correlation create
 * only one job.
 *
 * @param input - Job creation parameters
 * @returns Result with job_id and status
 *
 * @example
 * ```typescript
 * const result = await createProcessingJobIdempotent({
 *   assessmentId: 'abc-123',
 *   correlationId: 'request-xyz',
 *   userId: 'user-456',
 *   userRole: 'patient',
 * })
 * 
 * if (result.success) {
 *   console.log('Job created:', result.jobId, result.status)
 * }
 * ```
 */
export async function createProcessingJobIdempotent(
  input: CreateJobInput,
): Promise<CreateJobResult> {
  const startTime = Date.now()

  try {
    const { assessmentId, userId, userRole, supabase: providedSupabase } = input

    // Generate correlation ID if not provided
    // Note: This uses a timestamp-based format (assessment-{id}-{timestamp})
    // which differs from the UUID-based request correlation IDs.
    // Both formats are acceptable as they serve different purposes:
    // - Request correlation IDs: for tracing requests across services
    // - Job correlation IDs: for preventing duplicate job creation
    const correlationId = input.correlationId || generateCorrelationId(assessmentId)
    const schemaVersion = 'v1'

    const supabase = providedSupabase ?? (await createServerSupabaseClient())

    // Try to insert the job, but on conflict (duplicate), just select the existing one
    // This implements idempotency via the unique constraint
    const { data: existingJob, error: selectError } = await supabase
      .from('processing_jobs')
      .select('id, status, stage, correlation_id')
      .eq('assessment_id', assessmentId)
      .eq('correlation_id', correlationId)
      .eq('schema_version', schemaVersion)
      .maybeSingle()

    if (selectError) {
      console.error('[jobCreation] Error checking for existing job:', selectError)
      return {
        success: false,
        error: selectError.message,
      }
    }

    // If job already exists, return it
    if (existingJob) {
      console.log('[jobCreation] Job already exists (idempotent)', {
        jobId: existingJob.id,
        assessmentId,
        correlationId,
        status: existingJob.status,
        stage: existingJob.stage,
      })

      return {
        success: true,
        jobId: existingJob.id,
        status: existingJob.status,
        stage: existingJob.stage,
        isNewJob: false,
      }
    }

    // Create new job
    const now = new Date().toISOString()
    const { data: newJob, error: insertError } = await supabase
      .from('processing_jobs')
      .insert({
        assessment_id: assessmentId,
        correlation_id: correlationId,
        schema_version: schemaVersion,
        status: PROCESSING_STATUS.QUEUED,
        stage: PROCESSING_STAGE.PENDING,
        attempt: 1,
        max_attempts: 3,
        created_at: now,
        updated_at: now,
        errors: [],
      })
      .select('id, status, stage, correlation_id')
      .single()

    if (insertError) {
      // Check if this is a duplicate conflict (race condition)
      if (insertError.code === '23505') {
        // Unique constraint violation - try to fetch the existing job again
        const { data: racedJob, error: raceSelectError } = await supabase
          .from('processing_jobs')
          .select('id, status, stage, correlation_id')
          .eq('assessment_id', assessmentId)
          .eq('correlation_id', correlationId)
          .eq('schema_version', schemaVersion)
          .single()

        if (raceSelectError || !racedJob) {
          console.error('[jobCreation] Race condition handling failed:', raceSelectError)
          return {
            success: false,
            error: 'Failed to create or retrieve job',
          }
        }

        console.log('[jobCreation] Job created by concurrent request (race handled)', {
          jobId: racedJob.id,
          assessmentId,
          correlationId,
        })

        return {
          success: true,
          jobId: racedJob.id,
          status: racedJob.status,
          stage: racedJob.stage,
          isNewJob: false,
        }
      }

      console.error('[jobCreation] Error creating job:', insertError)
      return {
        success: false,
        error: insertError.message,
      }
    }

    const duration = Date.now() - startTime

    console.log('[jobCreation] Processing job created successfully', {
      jobId: newJob.id,
      assessmentId,
      correlationId,
      status: newJob.status,
      stage: newJob.stage,
      duration_ms: duration,
    })

    // Log audit event for job creation
    // Fire-and-forget - don't block on audit logging
    // Note: userRole may not match exact UserRole type, audit system is permissive
    logAuditEvent({
      actor_user_id: userId,
      actor_role: (userRole === 'patient' || userRole === 'clinician' || userRole === 'admin' || userRole === 'nurse')
        ? userRole as any
        : undefined,
      source: 'api',
      entity_type: 'processing_job',
      entity_id: newJob.id,
      action: 'create',
      metadata: {
        assessment_id: assessmentId,
        correlation_id: correlationId,
        job_id: newJob.id,
        status_to: newJob.status,
      },
    }).catch((err) => {
      console.warn('[jobCreation] Failed to log audit event', err)
    })

    return {
      success: true,
      jobId: newJob.id,
      status: newJob.status,
      stage: newJob.stage,
      isNewJob: true,
    }
  } catch (error) {
    console.error('[jobCreation] Unexpected error creating processing job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
