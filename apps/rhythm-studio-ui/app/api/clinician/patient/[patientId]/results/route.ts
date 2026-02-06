/**
 * Clinician Patient Results API
 *
 * GET /api/clinician/patient/[patientId]/results
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

type LatestRisk = {
  reportId: string
  riskLevel: string | null
  createdAt: string
} | null

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const endpoint = `/api/clinician/patient/${patientId}/results`
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const isClinician = await hasClinicianRole()
    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Clinician or admin role required' },
        },
        { status: 403 },
      )
    }

    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('id', patientId)
      .maybeSingle()

    if (patientError || !patient) {
      const admin = createAdminSupabaseClient()
      const { data: adminPatient, error: adminError } = await admin
        .from('patient_profiles')
        .select('id')
        .eq('id', patientId)
        .maybeSingle()

      if (adminError) {
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to verify patient' },
          },
          { status: 500 },
        )
      }

      if (adminPatient) {
        return NextResponse.json(
          { error: 'FORBIDDEN', endpoint, patientId },
          { status: 403 },
        )
      }

      return NextResponse.json(
        { error: 'NOT_FOUND', endpoint, patientId },
        { status: 404 },
      )
    }

    const admin = createAdminSupabaseClient()

    const { data: assessments, error: assessmentsError } = await admin
      .from('assessments')
      .select('id')
      .eq('patient_id', patientId)
      .order('started_at', { ascending: false })
      .limit(50)

    if (assessmentsError) {
      console.error('[clinician/patient/results GET] Assessments error:', assessmentsError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch assessments' },
        },
        { status: 500 },
      )
    }

    const assessmentIds = assessments?.map((item) => item.id) ?? []
    if (assessmentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          reports: [],
          calculatedResults: [],
          processingJobs: [],
          latestRisk: null,
          priorityRankings: [],
          reviewRecords: [],
        },
      })
    }

    const { data: reports } = await admin
      .from('reports')
      .select(
        'id, assessment_id, risk_level, created_at, report_text_short, safety_score, safety_findings, score_numeric, sleep_score',
      )
      .in('assessment_id', assessmentIds)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: calculatedResults } = await admin
      .from('calculated_results')
      .select('id, assessment_id, scores, risk_models, algorithm_version, computed_at')
      .in('assessment_id', assessmentIds)
      .order('computed_at', { ascending: false })
      .limit(10)

    const { data: processingJobs } = await admin
      .from('processing_jobs')
      .select('id, assessment_id, status, created_at')
      .in('assessment_id', assessmentIds)
      .order('created_at', { ascending: false })
      .limit(10)

    const jobIds = processingJobs?.map((job) => job.id) ?? []

    const { data: priorityRankings } = jobIds.length
      ? await admin
          .from('priority_rankings')
          .select('id, job_id, ranking_data, created_at')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(5)
      : { data: [] }

    const { data: reviewRecords } = jobIds.length
      ? await admin
          .from('review_records')
          .select('id, job_id, created_at')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
      : { data: [] }

    const latestReport = reports?.[0]
    const latestRisk: LatestRisk = latestReport
      ? {
          reportId: latestReport.id,
          riskLevel: latestReport.risk_level ?? null,
          createdAt: latestReport.created_at ?? new Date().toISOString(),
        }
      : null

    return NextResponse.json({
      success: true,
      data: {
        reports: reports ?? [],
        calculatedResults: calculatedResults ?? [],
        processingJobs: processingJobs ?? [],
        latestRisk,
        priorityRankings: priorityRankings ?? [],
        reviewRecords: reviewRecords ?? [],
      },
    })
  } catch (err) {
    console.error('[clinician/patient/results GET] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
