 /**
 * Clinician Clinical Intake API - Latest
 *
 * GET /api/clinician/patient/[patientId]/clinical-intake/latest
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

const getUserRole = (user: { app_metadata?: { role?: string }; user_metadata?: { role?: string } }) =>
  user.app_metadata?.role || user.user_metadata?.role || null

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
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
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const role = getUserRole(user)
    const isAdmin = role === 'admin'
    const isClinician = role === 'clinician' || isAdmin

    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Clinician or admin role required' },
        },
        { status: 403 },
      )
    }

    const resolution = await resolvePatientIds(admin, patientId)

    if (!resolution.patientProfileId || !resolution.patientUserId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Patient not found' },
        },
        { status: 404 },
      )
    }

    if (!isAdmin) {
      const { data: assignment, error: assignmentError } = await supabase
        .from('clinician_patient_assignments')
        .select('id')
        .eq('clinician_user_id', user.id)
        .eq('patient_user_id', resolution.patientUserId)
        .maybeSingle()

      if (assignmentError || !assignment) {
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.FORBIDDEN, message: 'You do not have access to this patient' },
          },
          { status: 403 },
        )
      }
    }

    const { data: intake, error: intakeError } = await supabase
      .from('clinical_intakes')
      .select(
        `
        id,
        status,
        version_number,
        clinical_summary,
        structured_data,
        trigger_reason,
        last_updated_from_messages,
        created_at,
        updated_at
      `,
      )
      .eq('patient_id', resolution.patientProfileId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (intakeError) {
      console.error('[clinician/patient/clinical-intake/latest] Intake error:', intakeError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake' },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      intake: intake ?? null,
    })
  } catch (err) {
    console.error('[clinician/patient/clinical-intake/latest] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
