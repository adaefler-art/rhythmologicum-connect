import { NextRequest, NextResponse } from 'next/server'
import {
  successResponse,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
  databaseErrorResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { getRequestId, withRequestId, sanitizeSupabaseError, logError } from '@/lib/db/errors'

/**
 * E76.3 API Endpoint: Get a single diagnosis run
 * GET /api/studio/diagnosis-runs/{runId}
 * 
 * Returns a single diagnosis run by ID.
 * Only accessible by clinicians/admins assigned to the patient.
 * 
 * Returns: { run: DiagnosisRun }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  const requestId = getRequestId(request)

  try {
    const { runId } = await context.params

    // Validate runId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(runId)) {
      return withRequestId(
        validationErrorResponse('Invalid run ID format', undefined, requestId),
        requestId
      )
    }

    // Auth gate
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(undefined, requestId), requestId)
    }

    // Authorization gate (clinician/admin only)
    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(undefined, requestId), requestId)
    }

    // Fetch diagnosis run (RLS will automatically filter to only accessible runs)
    const { data: run, error: fetchError } = await supabase
      .from('diagnosis_runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (fetchError) {
      const safeErr = sanitizeSupabaseError(fetchError)
      if (safeErr.code === 'PGRST116') {
        return withRequestId(
          notFoundResponse('DiagnosisRun', `Diagnosis run not found: ${runId}`, requestId),
          requestId
        )
      }
      logError({ requestId, operation: 'fetch_diagnosis_run', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    if (!run) {
      return withRequestId(
        notFoundResponse('DiagnosisRun', `Diagnosis run not found: ${runId}`, requestId),
        requestId
      )
    }

    return withRequestId(successResponse({ run }, 200, requestId), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    logError({ requestId, operation: 'GET /api/studio/diagnosis-runs/[runId]', error: safeErr })
    return withRequestId(internalErrorResponse(undefined, requestId), requestId)
  }
}

/**
 * E76.3 API Endpoint: Update a diagnosis run (state transitions)
 * PATCH /api/studio/diagnosis-runs/{runId}
 * 
 * Updates a diagnosis run (typically for state transitions).
 * Only accessible by clinicians/admins who created the run.
 * 
 * Body: { status?: 'running'|'succeeded'|'failed', output_data?: object, error_info?: object }
 * Returns: { run: DiagnosisRun }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  const requestId = getRequestId(request)

  try {
    const { runId } = await context.params

    // Validate runId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(runId)) {
      return withRequestId(
        validationErrorResponse('Invalid run ID format', undefined, requestId),
        requestId
      )
    }

    // Auth gate
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(undefined, requestId), requestId)
    }

    // Authorization gate (clinician/admin only)
    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(undefined, requestId), requestId)
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return withRequestId(
        validationErrorResponse('Invalid JSON body', undefined, requestId),
        requestId
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    // Validate and apply status transition
    if (body.status) {
      const validStatuses = ['running', 'succeeded', 'failed']
      if (!validStatuses.includes(body.status)) {
        return withRequestId(
          validationErrorResponse(
            `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            undefined,
            requestId
          ),
          requestId
        )
      }
      updateData.status = body.status

      // Auto-set timestamps based on status
      if (body.status === 'running' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString()
      }
      if ((body.status === 'succeeded' || body.status === 'failed') && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }
    }

    // Allow explicit timestamp overrides
    if (body.started_at) {
      updateData.started_at = body.started_at
    }
    if (body.completed_at) {
      updateData.completed_at = body.completed_at
    }

    // Apply output_data (only for succeeded)
    if (body.output_data !== undefined) {
      if (typeof body.output_data !== 'object' || Array.isArray(body.output_data)) {
        return withRequestId(
          validationErrorResponse('output_data must be an object', undefined, requestId),
          requestId
        )
      }
      updateData.output_data = body.output_data
    }

    // Apply error_info (only for failed)
    if (body.error_info !== undefined) {
      if (typeof body.error_info !== 'object' || Array.isArray(body.error_info)) {
        return withRequestId(
          validationErrorResponse('error_info must be an object', undefined, requestId),
          requestId
        )
      }
      updateData.error_info = body.error_info
    }

    // Perform update (RLS will verify user owns the run)
    const { data: run, error: updateError } = await supabase
      .from('diagnosis_runs')
      .update(updateData)
      .eq('id', runId)
      .select()
      .single()

    if (updateError) {
      const safeErr = sanitizeSupabaseError(updateError)
      if (safeErr.code === 'PGRST116') {
        return withRequestId(
          notFoundResponse('DiagnosisRun', `Diagnosis run not found or access denied: ${runId}`, requestId),
          requestId
        )
      }
      logError({ requestId, operation: 'update_diagnosis_run', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    if (!run) {
      return withRequestId(
        notFoundResponse('DiagnosisRun', `Diagnosis run not found or access denied: ${runId}`, requestId),
        requestId
      )
    }

    return withRequestId(successResponse({ run }, 200, requestId), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    logError({ requestId, operation: 'PATCH /api/studio/diagnosis-runs/[runId]', error: safeErr })
    return withRequestId(internalErrorResponse(undefined, requestId), requestId)
  }
}
