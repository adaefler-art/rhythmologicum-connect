/**
 * E76.6: Patient Diagnosis Artifact By Run API Route
 * 
 * Allows patients to fetch the latest diagnosis artifact by run_id.
 * Feature-gated behind NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED.
 * 
 * @endpoint-intent diagnosis:patient:artifact_by_run Get latest artifact for a run
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isFeatureEnabled } from '@/lib/featureFlags'

type RouteContext = {
  params: Promise<{ runId: string }>
}

/**
 * GET /api/patient/diagnosis/runs/[runId]/artifact
 * 
 * Retrieves the latest diagnosis artifact for a given run_id.
 * 
 * Path Parameters:
 * - runId: UUID of the diagnosis run
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const diagnosisPatientEnabled = isFeatureEnabled('DIAGNOSIS_PATIENT_ENABLED')
    if (!diagnosisPatientEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Patient diagnosis viewing feature is not enabled',
          },
        },
        { status: 503 },
      )
    }

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

    const params = await context.params
    const { runId } = params

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(runId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid run ID format',
          },
        },
        { status: 400 },
      )
    }

    const { data: artifact, error } = await supabase
      .from('diagnosis_artifacts')
      .select('*')
      .eq('run_id', runId)
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[API] GET /api/patient/diagnosis/runs/[runId]/artifact - Database error:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch diagnosis artifact',
          },
        },
        { status: 500 },
      )
    }

    if (!artifact) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artifact not found for run',
          },
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: artifact,
    })
  } catch (error) {
    console.error('[API] GET /api/patient/diagnosis/runs/[runId]/artifact - Unexpected error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
