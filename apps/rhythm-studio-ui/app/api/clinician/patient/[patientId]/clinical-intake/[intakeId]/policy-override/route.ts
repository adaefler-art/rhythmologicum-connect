import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'
import { setPolicyOverride } from '@/lib/cre/safety/overridePersistence'

type RouteContext = {
  params: Promise<{ patientId: string; intakeId: string }>
}

const getUserRole = (user: {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}) => {
  const appRole = user.app_metadata?.role
  if (typeof appRole === 'string') return appRole
  const userRole = user.user_metadata?.role
  if (typeof userRole === 'string') return userRole
  return null
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { patientId, intakeId } = await context.params
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

    const body = await request.json()
    const overrideLevel = body?.override_level ?? null
    const overrideActionRaw = body?.override_action ?? null
    const overrideAction = overrideActionRaw === 'none' ? null : overrideActionRaw
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''

    const { data: intakeRecord, error: intakeError } = await supabase
      .from('clinical_intakes')
      .select('id, user_id, patient_id, organization_id, structured_data')
      .eq('id', intakeId)
      .maybeSingle()

    if (intakeError) {
      console.error('[clinical-intake/policy-override] Intake fetch error:', intakeError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake' },
        },
        { status: 500 },
      )
    }

    if (!intakeRecord) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Intake not found' },
        },
        { status: 404 },
      )
    }

    if (
      intakeRecord.user_id !== resolution.patientUserId &&
      intakeRecord.patient_id !== resolution.patientProfileId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Intake does not belong to patient' },
        },
        { status: 403 },
      )
    }

    const structuredData = (intakeRecord.structured_data ?? {}) as Record<string, unknown>
    const overrideResult = await setPolicyOverride({
      supabase,
      intakeId: intakeRecord.id,
      organizationId: intakeRecord.organization_id ?? null,
      structuredData,
      overrideLevel,
      overrideAction,
      reason,
      updatedBy: { id: user.id, email: user.email ?? null },
    })

    if (!overrideResult.ok) {
      const isValidation = overrideResult.error === 'Invalid override values' ||
        overrideResult.error === 'Override reason is required'
      return NextResponse.json(
        {
          success: false,
          error: {
            code: isValidation ? ErrorCode.INVALID_INPUT : ErrorCode.DATABASE_ERROR,
            message: overrideResult.error,
          },
        },
        { status: isValidation ? 400 : 500 },
      )
    }

    return NextResponse.json({
      success: true,
      intake: overrideResult.data?.updated ?? null,
    })
  } catch (err) {
    console.error('[clinical-intake/policy-override] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
