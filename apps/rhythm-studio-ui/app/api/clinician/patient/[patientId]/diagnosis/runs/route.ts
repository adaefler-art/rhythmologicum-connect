/**
 * Clinician Diagnosis Runs API - List Patient Runs
 *
 * GET /api/clinician/patient/[patientId]/diagnosis/runs
 */

import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

const RUNS_LIMIT = 20

export async function GET(_request: Request, context: RouteContext) {
  const traceId = crypto.randomUUID()
  try {
    const { patientId } = await context.params
    const endpoint = `/api/clinician/patient/${patientId}/diagnosis/runs`
    const supabase = await createServerSupabaseClient()
    const admin = createAdminSupabaseClient()

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
        { status: 401, headers: { 'x-trace-id': traceId } },
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
        { status: 403, headers: { 'x-trace-id': traceId } },
      )
    }

    const resolution = await resolvePatientIds(admin, patientId)
    const diagHeaders = { 'x-diag-patient-id-source': resolution.source, 'x-trace-id': traceId }

    if (!resolution.patientProfileId || !resolution.patientUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DIAG_PATIENT_NOT_FOUND',
            message: 'Patient not found for provided identifier',
            patientIdParam: patientId,
          },
        },
        { status: 404, headers: diagHeaders },
      )
    }

    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('id', resolution.patientProfileId)
      .maybeSingle()

    if (patientError || !patient) {
      const { data: adminPatient, error: adminError } = await admin
        .from('patient_profiles')
        .select('id')
        .eq('id', resolution.patientProfileId)
        .maybeSingle()

      if (adminError) {
        console.error('DIAG_RUNS_FETCH_FAILED', {
          patient_id: resolution.patientUserId,
          trace_id: traceId,
          where: 'patient_admin_check',
          error: adminError,
        })
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to verify patient' },
          },
          { status: 500, headers: diagHeaders },
        )
      }

      if (adminPatient) {
        return NextResponse.json(
          { error: 'FORBIDDEN', endpoint, patientId },
          { status: 403, headers: diagHeaders },
        )
      }

      return NextResponse.json(
        { error: 'NOT_FOUND', endpoint, patientId },
        { status: 404, headers: diagHeaders },
      )
    }

    const { data: runs, error: runsError } = await admin
      .from('diagnosis_runs')
      .select(
        'id, status, created_at, updated_at, inputs_hash, started_at, completed_at, error_code, error_message, processing_time_ms, mcp_run_id',
      )
      .eq('patient_id', resolution.patientUserId)
      .order('created_at', { ascending: false })
      .limit(RUNS_LIMIT)

    if (runsError) {
      console.error('DIAG_RUNS_FETCH_FAILED', {
        patient_id: resolution.patientUserId,
        trace_id: traceId,
        where: 'runs_query',
        error: runsError,
      })

      if (runsError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.NOT_FOUND,
              message: 'Patient not accessible or not assigned',
            },
          },
          { status: 404, headers: diagHeaders },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch diagnosis runs',
          },
        },
        { status: 500, headers: diagHeaders },
      )
    }

    const safeRuns = runs || []
    let runsWithArtifacts = safeRuns

    if (safeRuns.length > 0) {
      const runIds = safeRuns.map((run) => run.id)
      const { data: artifacts, error: artifactsError } = await admin
        .from('diagnosis_artifacts')
        .select('run_id, risk_level, confidence_score, primary_findings, artifact_data, created_at')
        .in('run_id', runIds)
        .order('created_at', { ascending: false })

      if (artifactsError) {
        console.error('DIAG_RUNS_FETCH_FAILED', {
          patient_id: resolution.patientUserId,
          trace_id: traceId,
          where: 'artifacts_query',
          error: artifactsError,
        })
      } else if (artifacts && artifacts.length > 0) {
        const artifactMap = new Map<string, (typeof artifacts)[number]>()
        for (const artifact of artifacts) {
          if (!artifactMap.has(artifact.run_id)) {
            artifactMap.set(artifact.run_id, artifact)
          }
        }

        runsWithArtifacts = safeRuns.map((run) => {
          const artifact = artifactMap.get(run.id)
          return {
            ...run,
            summary: artifact
              ? {
                  risk_level: artifact.risk_level,
                  confidence_score: artifact.confidence_score,
                  primary_findings: artifact.primary_findings,
                  result_json: artifact.artifact_data,
                }
              : null,
          }
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          runs: runsWithArtifacts,
        },
      },
      { headers: diagHeaders },
    )
  } catch (err) {
    console.error('DIAG_RUNS_FETCH_FAILED', {
      trace_id: traceId,
      where: 'unexpected',
      error: err,
    })
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500, headers: { 'x-trace-id': traceId } },
    )
  }
}
