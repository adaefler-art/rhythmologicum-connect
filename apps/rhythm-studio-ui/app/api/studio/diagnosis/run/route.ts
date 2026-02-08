/**
 * Studio Diagnosis Run Detail API (compat route)
 *
 * GET /api/studio/diagnosis/run?runId=...
 *
 * Returns run metadata and latest diagnosis result (if available).
 */

import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { isValidUUID } from '@/lib/validators/uuid'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')

    if (!runId || !isValidUUID(runId)) {
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

    const admin = createAdminSupabaseClient()
    const { data: run, error: runError } = await admin
      .from('diagnosis_runs')
      .select(
        'id, patient_id, clinician_id, status, created_at, updated_at, inputs_hash, started_at, completed_at, error_code, error_message, processing_time_ms, mcp_run_id',
      )
      .eq('id', runId)
      .maybeSingle()

    if (runError) {
      console.error('[studio/diagnosis/run GET] Run query error:', runError)
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

    const { data: diagnosisArtifact, error: diagnosisArtifactError } = await admin
      .from('diagnosis_artifacts')
      .select(
        'id, artifact_type, artifact_data, created_at, risk_level, confidence_score, primary_findings, recommendations_count',
      )
      .eq('run_id', runId)
      .eq('artifact_type', 'diagnosis_json')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (diagnosisArtifactError) {
      console.error('[studio/diagnosis/run GET] Artifact query error:', diagnosisArtifactError)
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

    let artifact = diagnosisArtifact
    if (!artifact) {
      const { data: latestArtifact, error: latestArtifactError } = await admin
        .from('diagnosis_artifacts')
        .select(
          'id, artifact_type, artifact_data, created_at, risk_level, confidence_score, primary_findings, recommendations_count',
        )
        .eq('run_id', runId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestArtifactError) {
        console.error('[studio/diagnosis/run GET] Artifact query error:', latestArtifactError)
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

      artifact = latestArtifact
    }

    if (!artifact) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.ARTIFACT_NOT_FOUND,
            message: 'Diagnosis artifact not found',
          },
        },
        { status: 404 },
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
        artifact: {
          id: artifact.id,
          artifact_type: artifact.artifact_type,
          created_at: artifact.created_at,
          artifact_data: artifact.artifact_data,
          risk_level: artifact.risk_level,
          confidence_score: artifact.confidence_score,
          primary_findings: artifact.primary_findings,
          recommendations_count: artifact.recommendations_count,
        },
      },
    })
  } catch (err) {
    console.error('[studio/diagnosis/run GET] Unexpected error:', err)
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
