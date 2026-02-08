/**
 * E76.8: Diagnosis Run Queue API Route
 * 
 * Queues a new diagnosis run with inputs_meta persistence.
 * Feature-gated behind NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED.
 * 
 * @endpoint-intent diagnosis:queue Queue a new diagnosis run
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { buildPatientContextPack } from '@/lib/mcp/contextPackBuilder'
import { executeDiagnosisRun } from '@/lib/diagnosis/worker'
import { extractInputsMeta } from '@/lib/diagnosis/dedupe'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { DIAGNOSIS_RUN_STATUS } from '@/lib/contracts/diagnosis'
import { env } from '@/lib/env'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'
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
 * Implements inputs_meta persistence and optional parallel-run guard.
 * 
 * Body:
 * - patient_id: UUID of patient to diagnose
 * - force (optional): bypass active run guard
 * - block_parallel (optional): enable active run guard for this request
 * 
 * Response:
 * - success: boolean
 * - data: { run_id, status, created_at }
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
    const diagnosisEnabled = isFeatureEnabled('DIAGNOSIS_V1_ENABLED')
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
    const { patient_id: patientIdParam, force, block_parallel: blockParallel } = body

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

    const adminClient = createAdminSupabaseClient()

    // Validate input
    if (!patientIdParam || typeof patientIdParam !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DIAG_PATIENT_ID_REQUIRED',
            message: 'patient_id is required',
          },
        },
        { status: 422 },
      )
    }

    const resolution = await resolvePatientIds(adminClient, patientIdParam)
    const diagHeaders = { 'x-diag-patient-id-source': resolution.source }

    if (!resolution.patientProfileId || !resolution.patientUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DIAG_PATIENT_NOT_FOUND',
            message: 'Patient not found for provided identifier',
            patientIdParam,
          },
        },
        { status: 404, headers: diagHeaders },
      )
    }

    const patientProfileId = resolution.patientProfileId
    const patientUserId = resolution.patientUserId

    // Build context pack to get inputs_hash and inputs_meta
    let contextPack
    try {
      contextPack = await buildPatientContextPack(adminClient, patientProfileId)
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
          { status: 503, headers: diagHeaders },
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
        { status: 503, headers: diagHeaders },
      )
    }

    const inputs_hash = contextPack.metadata.inputs_hash
    const inputs_meta = extractInputsMeta(contextPack) as Json

    const shouldForce = typeof force === 'boolean' ? force : false
    const shouldBlockParallel = blockParallel === true
    if (shouldBlockParallel && !shouldForce) {
      const { data: activeRun, error: activeRunError } = await adminClient
        .from('diagnosis_runs')
        .select('id, status, created_at')
        .eq('patient_id', patientUserId)
        .eq('inputs_hash', inputs_hash)
        .in('status', [DIAGNOSIS_RUN_STATUS.QUEUED, DIAGNOSIS_RUN_STATUS.RUNNING])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeRunError) {
        console.error('Failed to check active diagnosis runs:', activeRunError)
      }

      if (activeRun) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ACTIVE_RUN_EXISTS',
              message: 'An active diagnosis run already exists for this patient/context',
              existing_run_id: activeRun.id,
              existing_status: activeRun.status,
            },
          },
          { status: 409, headers: diagHeaders },
        )
      }
    }

    // Create new diagnosis run
    const { data: newRun, error: insertError } = await adminClient
      .from('diagnosis_runs')
      .insert({
        patient_id: patientUserId,
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
          { status: 503, headers: diagHeaders },
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
        { status: 503, headers: diagHeaders },
      )
    }

    void executeDiagnosisRun(adminClient, newRun.id).catch((executionError) => {
      console.error('Background diagnosis execution failed:', executionError)
    })

    return NextResponse.json({
      success: true,
      data: {
        runId: newRun.id,
        status: 'QUEUED',
        run_id: newRun.id,
        status_raw: DIAGNOSIS_RUN_STATUS.QUEUED,
        created_at: newRun.created_at,
        is_duplicate: false,
      },
    }, { headers: diagHeaders })
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
      { status: 503 },
    )
  }
}
