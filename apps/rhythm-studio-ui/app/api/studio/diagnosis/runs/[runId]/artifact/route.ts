/**
 * Studio Diagnosis Artifact API - Latest Artifact by Run
 * 
 * GET /api/studio/diagnosis/runs/[runId]/artifact
 * 
 * Returns latest diagnosis artifact for a run.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { isValidUUID } from '@/lib/validators/uuid'

type RouteContext = {
  params: Promise<{ runId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { runId } = await context.params
    const supabase = await createServerSupabaseClient()

    if (!isValidUUID(runId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INVALID_INPUT,
            message: 'runId must be a valid UUID',
          },
        },
        { status: 400 },
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    const isClinician = await hasClinicianRole()
    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'Clinician or admin role required',
          },
        },
        { status: 403 },
      )
    }

    const { data: run, error: runError } = await supabase
      .from('diagnosis_runs')
      .select('id')
      .eq('id', runId)
      .maybeSingle()

    if (runError) {
      console.error('[studio/diagnosis/runs/[runId]/artifact GET] Run query error:', runError)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch diagnosis run',
          },
        },
        { status: 503 },
      )
    }

    if (!run) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.RUN_NOT_FOUND,
            message: 'Diagnosis run not found',
          },
        },
        { status: 404 },
      )
    }

    const { data: diagnosisArtifact, error: diagnosisArtifactError } = await supabase
      .from('diagnosis_artifacts')
      .select('*')
      .eq('run_id', runId)
      .eq('artifact_type', 'diagnosis_json')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (diagnosisArtifactError) {
      console.error(
        '[studio/diagnosis/runs/[runId]/artifact GET] Artifact query error:',
        diagnosisArtifactError,
      )

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch diagnosis artifact',
          },
        },
        { status: 503 },
      )
    }

    let artifact = diagnosisArtifact
    if (!artifact) {
      const { data: latestArtifact, error: latestArtifactError } = await supabase
        .from('diagnosis_artifacts')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestArtifactError) {
        console.error(
          '[studio/diagnosis/runs/[runId]/artifact GET] Artifact query error:',
          latestArtifactError,
        )

        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.DATABASE_ERROR,
              message: 'Failed to fetch diagnosis artifact',
            },
          },
          { status: 503 },
        )
      }

      artifact = latestArtifact
    }

    if (!artifact) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.ARTIFACT_NOT_FOUND,
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
  } catch (err) {
    console.error('[studio/diagnosis/runs/[runId]/artifact GET] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 503 },
    )
  }
}
