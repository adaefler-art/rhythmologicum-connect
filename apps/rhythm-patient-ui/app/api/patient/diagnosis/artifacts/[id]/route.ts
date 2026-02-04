/**
 * E76.6: Patient Diagnosis Artifact API Route
 * 
 * Allows patients to view a specific diagnosis artifact by ID.
 * Feature-gated behind NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED.
 * 
 * @endpoint-intent diagnosis:patient:artifact Get diagnosis artifact by ID for authenticated patient
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { logDiagnosisArtifactViewed } from '@/lib/audit/diagnosisAudit'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/patient/diagnosis/artifacts/[id]
 * 
 * Retrieves a specific diagnosis artifact for the authenticated patient.
 * 
 * Path Parameters:
 * - id: UUID of the artifact
 * 
 * Response:
 * - success: boolean
 * - data: Complete artifact with JSON data
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
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

    // Get artifact ID from params
    const params = await context.params
    const { id } = params

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid artifact ID format',
          },
        },
        { status: 400 },
      )
    }

    // Fetch artifact (RLS will automatically ensure patient owns it)
    const { data: artifact, error } = await supabase
      .from('diagnosis_artifacts')
      .select('*')
      .eq('id', id)
      .eq('patient_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - artifact not found or not owned by user
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Artifact not found',
            },
          },
          { status: 404 },
        )
      }

      console.error('[API] GET /api/patient/diagnosis/artifacts/[id] - Database error:', error)
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

    // E76.7: Log artifact viewed event (audit trail)
    await logDiagnosisArtifactViewed(artifact.id, user.id, 'patient')

    return NextResponse.json({
      success: true,
      data: artifact,
    })
  } catch (error) {
    console.error('[API] GET /api/patient/diagnosis/artifacts/[id] - Unexpected error:', error)

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
