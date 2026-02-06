/**
 * Clinician Diagnosis Runs API - List Patient Runs
 *
 * GET /api/clinician/patient/[patientId]/diagnosis/runs
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
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

    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('id', patientId)
      .maybeSingle()

    if (patientError || !patient) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const { data: runs, error: runsError } = await supabase
      .from('diagnosis_runs')
      .select('id, status, created_at, inputs_hash, started_at, completed_at, error_code, error_message')
      .eq('patient_id', patientId)
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
          { status: 404 },
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
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: runs || [],
    })
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
      { status: 500 },
    )
  }
}
