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
import { env } from '@/lib/env'
import type { Database, Json } from '@/lib/types/supabase'

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
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY
    const missingConfig = [
      !env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
      !env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
      !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
    ].filter(Boolean) as string[]

    if (missingConfig.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DIAG_SERVICE_UNCONFIGURED',
            message: 'Diagnosis service is not configured',
            missing: missingConfig,
          },
        },
        { status: 503 },
      )
    }

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

    const isServiceUnavailableError = (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      const lower = message.toLowerCase()
      return (
        lower.includes('failed to fetch') ||
        lower.includes('fetch failed') ||
        lower.includes('econnrefused') ||
        lower.includes('etimedout') ||
        lower.includes('enotfound') ||
        lower.includes('timeout') ||
        lower.includes('networkerror')
      )
    }

    // Build context pack to get inputs_hash and inputs_meta
    const adminClient = createAdminSupabaseClient()
    let contextPack
    try {
      contextPack = await buildPatientContextPack(adminClient, patient_id)
    } catch (contextPackError) {
      console.error('Failed to build context pack:', contextPackError)

      if (isServiceUnavailableError(contextPackError)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DIAG_SERVICE_UNAVAILABLE',
              message: 'Diagnosis service is unavailable',
            },
          },
          { status: 503 },
        )
      }

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
    const inputs_meta = extractInputsMeta(contextPack) as Json

    // E76.8: Check for duplicate runs (Policy B: time-window-based)
    const dedupeResult = await checkDuplicateRun(adminClient, inputs_hash, patient_id)

    if (dedupeResult.isDuplicate && dedupeResult.existingRunId) {
      // Return existing run information with warning
      return NextResponse.json({
        success: true,
        data: {
          runId: dedupeResult.existingRunId,
          status: 'DUPLICATE',
          run_id: dedupeResult.existingRunId,
          status_raw: 'duplicate',
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
      } as Database['public']['Tables']['diagnosis_runs']['Insert'])
      .select('id, status, created_at')
      .single()

    if (insertError || !newRun) {
      console.error('Failed to create diagnosis run:', insertError)

      if (isServiceUnavailableError(insertError)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DIAG_SERVICE_UNAVAILABLE',
              message: 'Diagnosis service is unavailable',
            },
          },
          { status: 503 },
        )
      }

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
        runId: newRun.id,
        status: 'QUEUED',
        run_id: newRun.id,
        status_raw: newRun.status,
        created_at: newRun.created_at,
        is_duplicate: false,
      },
    })
  } catch (error) {
    console.error('Diagnosis queue error:', error)

    if (error instanceof Error && error.message.includes('Supabase configuration missing')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DIAG_SERVICE_UNCONFIGURED',
            message: 'Diagnosis service is not configured',
          },
        },
        { status: 503 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage) {
      const lower = errorMessage.toLowerCase()
      if (
        lower.includes('failed to fetch') ||
        lower.includes('fetch failed') ||
        lower.includes('econnrefused') ||
        lower.includes('etimedout') ||
        lower.includes('enotfound') ||
        lower.includes('timeout') ||
        lower.includes('networkerror')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DIAG_SERVICE_UNAVAILABLE',
              message: 'Diagnosis service is unavailable',
            },
          },
          { status: 503 },
        )
      }
    }

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
