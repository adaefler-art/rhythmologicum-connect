import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'
import {
  buildClinicalIntakeExportPayload,
  fetchIntakeAndReviewAudit,
} from '@/lib/clinicalIntake/exportPayload'
import { renderClinicalIntakeSummaryPdf } from '@/lib/clinicalIntake/exportPdf'

export const runtime = 'nodejs'

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

export async function GET(_request: Request, context: RouteContext) {
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

    const loadResult = await fetchIntakeAndReviewAudit({ admin, intakeId })

    if (loadResult.error) {
      console.error('[clinical-intake/export/pdf] Intake lookup error:', loadResult.error)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load intake export data' },
        },
        { status: 500 },
      )
    }

    if (!loadResult.intake) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Intake not found' },
        },
        { status: 404 },
      )
    }

    const intake = loadResult.intake

    if (intake.user_id !== resolution.patientUserId && intake.patient_id !== resolution.patientProfileId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Intake does not belong to patient' },
        },
        { status: 403 },
      )
    }

    const payload = buildClinicalIntakeExportPayload({
      intake,
      reviewAudit: loadResult.reviewAudit,
    })

    const pdfBuffer = await renderClinicalIntakeSummaryPdf(payload)
    const filename = `intake-summary-${payload.metadata.patient_ref}-v${payload.metadata.intake_version}.pdf`

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[clinical-intake/export/pdf] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
