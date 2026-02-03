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
 * E76.3 API Endpoint: Create a new diagnosis run
 * POST /api/studio/patients/{patientId}/diagnosis-runs
 * 
 * Creates a new diagnosis run in 'queued' state for the specified patient.
 * Only accessible by clinicians/admins assigned to the patient.
 * 
 * Body: { input_config: Record<string, unknown> }
 * Returns: { run: DiagnosisRun }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ patientId: string }> }
) {
  const requestId = getRequestId(request)

  try {
    const { patientId } = await context.params

    // Validate patientId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(patientId)) {
      return withRequestId(
        validationErrorResponse('Invalid patient ID format', undefined, requestId),
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

    const inputConfig = body.input_config || {}

    // Validate inputConfig is an object
    if (typeof inputConfig !== 'object' || Array.isArray(inputConfig)) {
      return withRequestId(
        validationErrorResponse('input_config must be an object', undefined, requestId),
        requestId
      )
    }

    // Verify patient exists and get organization_id
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id, organization_id')
      .eq('id', patientId)
      .single()

    if (patientError) {
      const safeErr = sanitizeSupabaseError(patientError)
      if (safeErr.code === 'PGRST116') {
        return withRequestId(
          notFoundResponse('Patient', `Patient not found: ${patientId}`, requestId),
          requestId
        )
      }
      logError({ requestId, operation: 'fetch_patient', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    if (!patient) {
      return withRequestId(
        notFoundResponse('Patient', `Patient not found: ${patientId}`, requestId),
        requestId
      )
    }

    // Verify clinician is assigned to patient (RLS will also check this, but explicit check for better errors)
    const { data: assignment, error: assignmentError } = await supabase
      .from('clinician_patient_assignments')
      .select('id')
      .eq('clinician_user_id', user.id)
      .eq('patient_user_id', patient.id)
      .eq('organization_id', patient.organization_id)
      .single()

    if (assignmentError || !assignment) {
      logError({
        requestId,
        operation: 'verify_assignment',
        userId: user.id,
        error: { message: 'Clinician not assigned to patient' },
      })
      return withRequestId(
        forbiddenResponse('Sie sind diesem Patienten nicht zugewiesen.', requestId),
        requestId
      )
    }

    // Create diagnosis run in 'queued' state
    const { data: run, error: createError } = await supabase
      .from('diagnosis_runs')
      .insert({
        patient_id: patientId,
        organization_id: patient.organization_id,
        clinician_user_id: user.id,
        status: 'queued',
        input_config: inputConfig,
      })
      .select()
      .single()

    if (createError) {
      const safeErr = sanitizeSupabaseError(createError)
      logError({ requestId, operation: 'create_diagnosis_run', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    return withRequestId(successResponse({ run }, 201, requestId), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    logError({ requestId, operation: 'POST /api/studio/patients/[patientId]/diagnosis-runs', error: safeErr })
    return withRequestId(internalErrorResponse(undefined, requestId), requestId)
  }
}

/**
 * E76.3 API Endpoint: List diagnosis runs for a patient
 * GET /api/studio/patients/{patientId}/diagnosis-runs
 * 
 * Returns all diagnosis runs for the specified patient.
 * Only accessible by clinicians/admins assigned to the patient.
 * 
 * Query params: ?status=queued (optional filter by status)
 * Returns: { runs: DiagnosisRun[] }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ patientId: string }> }
) {
  const requestId = getRequestId(request)

  try {
    const { patientId } = await context.params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // Validate patientId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(patientId)) {
      return withRequestId(
        validationErrorResponse('Invalid patient ID format', undefined, requestId),
        requestId
      )
    }

    // Validate status filter if provided
    const validStatuses = ['queued', 'running', 'succeeded', 'failed']
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return withRequestId(
        validationErrorResponse(
          `Invalid status filter. Must be one of: ${validStatuses.join(', ')}`,
          undefined,
          requestId
        ),
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

    // Build query
    let query = supabase
      .from('diagnosis_runs')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: runs, error: fetchError } = await query

    if (fetchError) {
      const safeErr = sanitizeSupabaseError(fetchError)
      logError({ requestId, operation: 'fetch_diagnosis_runs', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    // RLS will filter to only runs the user can access
    // If no runs returned, could be because patient doesn't exist or user not assigned
    return withRequestId(successResponse({ runs: runs || [] }, 200, requestId), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    logError({ requestId, operation: 'GET /api/studio/patients/[patientId]/diagnosis-runs', error: safeErr })
    return withRequestId(internalErrorResponse(undefined, requestId), requestId)
  }
}
