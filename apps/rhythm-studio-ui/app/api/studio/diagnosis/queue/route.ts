/**
 * E76.8: Diagnosis Run Queue API Route
 * 
 * Queues a new diagnosis run with deduplication and inputs_meta persistence.
 * Feature-gated behind NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED.
 * 
 * @endpoint-intent diagnosis:queue Queue a new diagnosis run with dedupe check
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { buildPatientContextPack } from '@/lib/mcp/contextPackBuilder'
import { checkDuplicateRun, extractInputsMeta } from '@/lib/diagnosis/dedupe'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { isValidUUID } from '@/lib/validators/uuid'
import { DIAGNOSIS_RUN_STATUS } from '@/lib/contracts/diagnosis'

/**
 * Admin client usage - DOCUMENTED JUSTIFICATION
 * Purpose: Queue diagnosis run with RLS bypass for context pack building
 * Scope: diagnosis_runs, context pack access
 * Mitigation: Server-side auth gate; clinician/admin only; API route only
 */

/**
 * POST /api/studio/diagnosis/queue
 * 
 * Queue a new diagnosis run for a patient.
 * Implements E76.8 deduplication policy and inputs_meta persistence.
 * 
 * Body:
 * - patient_id: UUID of patient to diagnose
 * 
 * Response:
 * - success: boolean
 * - data: { run_id, status, is_duplicate?, existing_run_id? }
 */
export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    const diagnosisEnabled = isFeatureEnabled('DIAGNOSIS_ENABLED')
    if (!diagnosisEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Diagnosis feature is not enabled',
          },
        },
        { status: 503 },
      )
    }

    // Parse request body
    const body = await request.json()
    const { patient_id } = body

    // Validate input
    if (!patient_id || typeof patient_id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'patient_id is required and must be a string',
          },
        },
        { status: 400 },
      )
    }

    if (!isValidUUID(patient_id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_UUID',
            message: 'patient_id must be a valid UUID',
          },
        },
        { status: 400 },
      )
    }

    // Check authentication and authorization
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    // Check if user is clinician or admin
    const userRole = user.app_metadata?.role
    const isAuthorized = userRole === 'clinician' || userRole === 'admin'

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only clinicians and admins can queue diagnosis runs',
          },
        },
        { status: 403 },
      )
    }

    // Build context pack to get inputs_hash and inputs_meta
    const adminClient = createAdminSupabaseClient()
    let contextPack
    try {
      contextPack = await buildPatientContextPack(adminClient, patient_id)
    } catch (contextPackError) {
      console.error('Failed to build context pack:', contextPackError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTEXT_PACK_ERROR',
            message: 'Failed to build patient context pack',
            details: String(contextPackError),
          },
        },
        { status: 500 },
      )
    }

    const inputs_hash = contextPack.metadata.inputs_hash
    const inputs_meta = extractInputsMeta(contextPack)

    // E76.8: Check for duplicate runs (Policy B: time-window-based)
    const dedupeResult = await checkDuplicateRun(adminClient, inputs_hash, patient_id)

    if (dedupeResult.isDuplicate && dedupeResult.existingRunId) {
      // Return existing run information with warning
      return NextResponse.json({
        success: true,
        data: {
          run_id: dedupeResult.existingRunId,
          status: 'duplicate',
          is_duplicate: true,
          message: dedupeResult.message,
          time_window_hours: dedupeResult.timeWindowHours,
        },
      })
    }

    // Create new diagnosis run
    const { data: newRun, error: insertError } = await adminClient
      .from('diagnosis_runs')
      .insert({
        patient_id,
        clinician_id: user.id,
        status: DIAGNOSIS_RUN_STATUS.QUEUED,
        inputs_hash,
        inputs_meta,
      })
      .select('id, status, created_at')
      .single()

    if (insertError || !newRun) {
      console.error('Failed to create diagnosis run:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create diagnosis run',
            details: insertError?.message,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        run_id: newRun.id,
        status: newRun.status,
        created_at: newRun.created_at,
        is_duplicate: false,
        inputs_hash: inputs_hash.substring(0, 12) + '...', // Truncated for response
      },
    })
  } catch (error) {
    console.error('Diagnosis queue error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: String(error),
        },
      },
      { status: 500 },
    )
  }
}
