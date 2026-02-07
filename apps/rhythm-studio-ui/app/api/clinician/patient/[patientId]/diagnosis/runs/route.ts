/**
 * Clinician Diagnosis Runs API - List Patient Runs
 *
 * GET /api/clinician/patient/[patientId]/diagnosis/runs
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
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

    const resolution = await resolvePatientIds(admin, patientId)
    const diagHeaders = { 'x-diag-patient-id-source': resolution.source }

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
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to verify patient' },
          },
          { status: 503, headers: diagHeaders },
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

    const { data: runs, error: runsError } = await supabase
      .from('diagnosis_runs')
      .select('id, status, created_at, inputs_hash, started_at, completed_at, error_code, error_message')
      .eq('patient_id', resolution.patientUserId)
      .order('created_at', { ascending: false })

    if (runsError) {
      console.error('[clinician/patient/diagnosis/runs GET] Query error:', runsError)

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
        { status: 503, headers: diagHeaders },
      )
    }

    return NextResponse.json({
      success: true,
      data: runs || [],
    }, { headers: diagHeaders })
  } catch (err) {
    console.error('[clinician/patient/diagnosis/runs GET] Unexpected error:', err)
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
