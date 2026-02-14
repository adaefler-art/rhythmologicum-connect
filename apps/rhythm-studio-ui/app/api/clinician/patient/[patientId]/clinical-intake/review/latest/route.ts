import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

type ReviewRecord = {
  id: string
  intake_id: string
  status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
  review_notes: string | null
  requested_items: string[] | null
  reviewed_by: string
  is_current: boolean
  created_at: string
  updated_at: string
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

const normalizeReview = (record: ReviewRecord | null) => {
  if (!record) return null

  return {
    id: record.id,
    intake_id: record.intake_id,
    status: record.status,
    review_notes: record.review_notes,
    requested_items: Array.isArray(record.requested_items) ? record.requested_items : null,
    reviewed_by: record.reviewed_by,
    is_current: record.is_current,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const { searchParams } = new URL(request.url)
    const intakeId = searchParams.get('intakeId')?.trim()

    if (!intakeId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.INVALID_INPUT, message: 'intakeId query parameter is required' },
        },
        { status: 400 },
      )
    }

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

    const { data: intake, error: intakeError } = (await admin
      .from('clinical_intakes' as any)
      .select('id, user_id, patient_id')
      .eq('id', intakeId)
      .maybeSingle()) as { data: any; error: any }

    if (intakeError) {
      console.error('[clinical-intake/review/latest] Intake lookup error:', intakeError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load intake' },
        },
        { status: 500 },
      )
    }

    if (!intake) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Intake not found' },
        },
        { status: 404 },
      )
    }

    if (intake.user_id !== resolution.patientUserId && intake.patient_id !== resolution.patientProfileId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Intake does not belong to patient' },
        },
        { status: 403 },
      )
    }

    const { data: latestReview, error: latestError } = (await admin
      .from('clinical_intake_reviews' as any)
      .select('id, intake_id, status, review_notes, requested_items, reviewed_by, is_current, created_at, updated_at')
      .eq('intake_id', intakeId)
      .eq('is_current', true)
      .maybeSingle()) as { data: ReviewRecord | null; error: any }

    if (latestError) {
      console.error('[clinical-intake/review/latest] Review lookup error:', latestError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load review state' },
        },
        { status: 500 },
      )
    }

    const { data: auditRows, error: auditError } = (await admin
      .from('clinical_intake_reviews' as any)
      .select('id, intake_id, status, review_notes, requested_items, reviewed_by, is_current, created_at, updated_at')
      .eq('intake_id', intakeId)
      .order('created_at', { ascending: false })
      .limit(20)) as { data: ReviewRecord[] | null; error: any }

    if (auditError) {
      console.error('[clinical-intake/review/latest] Audit lookup error:', auditError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load review audit' },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      review_state: normalizeReview(latestReview),
      audit: (auditRows ?? []).map((row) => normalizeReview(row)),
    })
  } catch (err) {
    console.error('[clinical-intake/review/latest] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
