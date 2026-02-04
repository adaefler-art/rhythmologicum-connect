/**
 * E76.6: Patient Diagnosis Runs API Route
 * 
 * Allows patients to view their own diagnosis runs.
 * Feature-gated behind NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED.
 * 
 * @endpoint-intent diagnosis:patient:list List diagnosis runs for authenticated patient
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isFeatureEnabled } from '@/lib/featureFlags'

/**
 * GET /api/patient/diagnosis/runs
 * 
 * Retrieves all diagnosis runs for the authenticated patient.
 * 
 * Query Parameters:
 * - status (optional): Filter by run status (queued, running, completed, failed)
 * - limit (optional): Max results to return (default: 50, max: 100)
 * 
 * Response:
 * - success: boolean
 * - data: Array of diagnosis runs with basic metadata
 */
export async function GET(request: NextRequest) {
  try {
    const allowedStatuses = ['queued', 'running', 'completed', 'failed'] as const
    type DiagnosisRunStatus = (typeof allowedStatuses)[number]

    // Feature flag check
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

    // Check authentication
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50

    // Build query
    let query = supabase
      .from('diagnosis_runs')
      .select('id, status, created_at, updated_at, started_at, completed_at, error_code, error_message')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply status filter if provided
    if (status && allowedStatuses.includes(status as DiagnosisRunStatus)) {
      query = query.eq('status', status as DiagnosisRunStatus)
    }

    const { data: runs, error } = await query

    if (error) {
      console.error('[API] GET /api/patient/diagnosis/runs - Database error:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch diagnosis runs',
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: runs || [],
    })
  } catch (error) {
    console.error('[API] GET /api/patient/diagnosis/runs - Unexpected error:', error)

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
