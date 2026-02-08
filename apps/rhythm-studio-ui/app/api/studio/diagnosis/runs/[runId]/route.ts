/**
 * Studio Diagnosis Run Detail API
 *
 * GET /api/studio/diagnosis/runs/[runId]
 *
 * Returns run metadata and latest diagnosis result (if available).
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
      .select(
        'id, patient_id, clinician_id, status, created_at, updated_at, inputs_hash, started_at, completed_at, error_code, error_message, processing_time_ms, mcp_run_id',
      )
      .eq('id', runId)
      .maybeSingle()

    if (runError) {
      console.error('[studio/diagnosis/runs/[runId] GET] Run query error:', runError)
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
            code: ErrorCode.NOT_FOUND,
            message: 'Diagnosis run not found',
          },
        },
        { status: 404 },
      )
    }

    const { data: artifact, error: artifactError } = await supabase
      .from('diagnosis_artifacts')
      .select(
        'id, artifact_data, created_at, risk_level, confidence_score, primary_findings, recommendations_count',
      )
      .eq('run_id', runId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (artifactError) {
      console.error('[studio/diagnosis/runs/[runId] GET] Artifact query error:', artifactError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch diagnosis result',
          },
        },
        { status: 503 },
      )
    }

    const resultPayload = artifact?.artifact_data
    const diagnosisResult =
      resultPayload && typeof resultPayload === 'object'
        ? (resultPayload as { diagnosis_result?: Record<string, unknown> }).diagnosis_result ??
          resultPayload
        : null

    return NextResponse.json({
      success: true,
      data: {
        run,
        result: diagnosisResult ?? null,
        artifact: artifact
          ? {
              id: artifact.id,
              created_at: artifact.created_at,
              artifact_data: artifact.artifact_data,
              risk_level: artifact.risk_level,
              confidence_score: artifact.confidence_score,
              primary_findings: artifact.primary_findings,
              recommendations_count: artifact.recommendations_count,
            }
          : null,
      },
    })
  } catch (err) {
    console.error('[studio/diagnosis/runs/[runId] GET] Unexpected error:', err)
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
