import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'
import {
  isAllowedClinicalIntakeReviewTransition,
  validateClinicalIntakeReviewInput,
} from '@/lib/clinicalIntake/reviewWorkflow'
import { mergeClinicianRequestedItemsIntoFollowup } from '@/lib/cre/followup/generator'
import { trackEvent } from '@/lib/telemetry/trackEvent.server'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'
import type { Json } from '@/lib/types/supabase'

type RouteContext = {
  params: Promise<{ patientId: string; intakeId: string }>
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

type IntakeRecord = {
  id: string
  user_id: string
  patient_id: string | null
  structured_data: Json | null
}

type CurrentReviewRow = {
  status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
}

type DbError = { message: string } | null

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

const hasUploadKeyword = (items: string[] | null | undefined) => {
  if (!Array.isArray(items) || items.length === 0) return false
  return items.some((item) => {
    const normalized = item.toLowerCase()
    return (
      normalized.includes('upload') ||
      normalized.includes('hochlad') ||
      normalized.includes('arztbrief')
    )
  })
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

    const { data: intake, error: intakeError } = (await admin
      .from('clinical_intakes')
      .select('id, user_id, patient_id, structured_data')
      .eq('id', intakeId)
      .maybeSingle()) as { data: IntakeRecord | null; error: DbError }

    if (intakeError) {
      console.error('[clinical-intake/review] Intake lookup error:', intakeError)
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

    const { data: currentReviewRow, error: currentReviewError } = (await admin
      .from('clinical_intake_reviews')
      .select('status')
      .eq('intake_id', intakeId)
      .eq('is_current', true)
      .maybeSingle()) as { data: CurrentReviewRow | null; error: DbError }

    if (currentReviewError) {
      console.error('[clinical-intake/review] Current review lookup error:', currentReviewError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load review state' },
        },
        { status: 500 },
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

    const body = await request.json()
    const validation = validateClinicalIntakeReviewInput(body)

    if (!validation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: validation.message,
            details: validation.issues,
          },
        },
        { status: 400 },
      )
    }

    const transitionAllowed = isAllowedClinicalIntakeReviewTransition({
      fromStatus: currentReviewRow?.status ?? null,
      toStatus: validation.data.status,
    })

    if (!transitionAllowed) {
      const requestIdHeader = request.headers.get('x-request-id')
      await trackEvent({
        patientId: intake.patient_id,
        intakeId,
        eventType: 'review_transition_denied',
        requestId: requestIdHeader ? `${requestIdHeader}:review_transition_denied` : null,
        payload: {
          from_status: currentReviewRow?.status ?? null,
          to_status: validation.data.status,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: `Invalid review transition from ${currentReviewRow?.status ?? 'none'} to ${validation.data.status}.`,
          },
        },
        { status: 409 },
      )
    }

    if (validation.data.status === 'needs_more_info' && validation.data.requested_items?.length) {
      const structuredData =
        intake.structured_data &&
        typeof intake.structured_data === 'object' &&
        !Array.isArray(intake.structured_data)
          ? (intake.structured_data as unknown as StructuredIntakeData)
          : ({ status: 'draft' } as StructuredIntakeData)

      const mergedStructuredData = mergeClinicianRequestedItemsIntoFollowup({
        structuredData,
        requestedItems: validation.data.requested_items,
      })

      const { error: intakeUpdateError } = (await admin
        .from('clinical_intakes')
        .update({
          structured_data: mergedStructuredData as unknown as Json,
          updated_by: user.id,
        })
        .eq('id', intakeId)) as { error: DbError }

      if (intakeUpdateError) {
        console.error('[clinical-intake/review] Failed to update intake followup:', intakeUpdateError)
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.DATABASE_ERROR,
              message: 'Failed to persist clinician followup requests',
            },
          },
          { status: 500 },
        )
      }
    }

    const { error: clearCurrentError } = (await admin
      .from('clinical_intake_reviews')
      .update({ is_current: false })
      .eq('intake_id', intakeId)
      .eq('is_current', true)) as { error: DbError }

    if (clearCurrentError) {
      console.error('[clinical-intake/review] Failed to clear current review:', clearCurrentError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to update review state' },
        },
        { status: 500 },
      )
    }

    const { data: insertedReview, error: insertError } = (await admin
      .from('clinical_intake_reviews')
      .insert({
        intake_id: intakeId,
        status: validation.data.status,
        review_notes: validation.data.review_notes,
        requested_items: validation.data.requested_items,
        reviewed_by: user.id,
        is_current: true,
      })
      .select('id, intake_id, status, review_notes, requested_items, reviewed_by, is_current, created_at, updated_at')
      .single()) as { data: ReviewRecord | null; error: DbError }

    if (insertError || !insertedReview) {
      console.error('[clinical-intake/review] Insert error:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to save review state' },
        },
        { status: 500 },
      )
    }

    const { data: auditRows, error: auditError } = (await admin
      .from('clinical_intake_reviews')
      .select('id, intake_id, status, review_notes, requested_items, reviewed_by, is_current, created_at, updated_at')
      .eq('intake_id', intakeId)
      .order('created_at', { ascending: false })
      .limit(20)) as { data: ReviewRecord[] | null; error: DbError }

    if (auditError) {
      console.error('[clinical-intake/review] Audit lookup error:', auditError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load review audit' },
        },
        { status: 500 },
      )
    }

    const requestIdHeader = request.headers.get('x-request-id')
    const eventPromises: Array<Promise<string | null>> = [
      trackEvent({
        patientId: intake.patient_id,
        intakeId,
        eventType: 'review_created',
        requestId: requestIdHeader ? `${requestIdHeader}:review_created` : null,
        payload: {
          status: validation.data.status,
        },
      }),
    ]

    if (validation.data.status === 'needs_more_info' && hasUploadKeyword(validation.data.requested_items)) {
      eventPromises.push(
        trackEvent({
          patientId: intake.patient_id,
          intakeId,
          eventType: 'upload_requested',
          requestId: requestIdHeader ? `${requestIdHeader}:upload_requested` : null,
          payload: {
            source: 'review_requested_items',
          },
        }),
      )
    }

    if (validation.data.status === 'approved' || validation.data.status === 'rejected') {
      eventPromises.push(
        trackEvent({
          patientId: intake.patient_id,
          intakeId,
          eventType: 'session_end',
          requestId: requestIdHeader ? `${requestIdHeader}:session_end` : null,
          payload: {
            review_status: validation.data.status,
          },
        }),
      )
    }

    await Promise.allSettled(eventPromises)

    return NextResponse.json({
      success: true,
      review_state: normalizeReview(insertedReview),
      audit: (auditRows ?? []).map((row) => normalizeReview(row)),
    })
  } catch (err) {
    console.error('[clinical-intake/review] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
