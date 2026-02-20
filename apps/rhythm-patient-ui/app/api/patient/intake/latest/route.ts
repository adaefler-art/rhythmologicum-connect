import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { buildVisitPreparationSummary } from '@/lib/clinicalIntake/visitPreparation'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

type IntakeRecord = {
  id: string
  status: string
  version_number: number
  clinical_summary: string | null
  structured_data: Record<string, unknown>
  trigger_reason: string | null
  created_at: string
  updated_at: string
}

type IntakeReviewState = {
  status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
  review_notes: string | null
  requested_items: string[] | null
  updated_at: string
}

const toStructuredIntakeData = (value: Record<string, unknown>): StructuredIntakeData => {
  const withUnknownCast = value as unknown as Partial<StructuredIntakeData>

  if (withUnknownCast && withUnknownCast.status === 'draft') {
    return withUnknownCast as StructuredIntakeData
  }

  return {
    status: 'draft',
    ...withUnknownCast,
  } as StructuredIntakeData
}

const mapIntake = (intake: IntakeRecord | null) =>
  intake
    ? {
        uuid: intake.id,
        id: intake.id,
        status: intake.status,
        version_number: intake.version_number,
        clinical_summary: intake.clinical_summary,
        structured_data: intake.structured_data,
        visit_preparation: buildVisitPreparationSummary(
          toStructuredIntakeData(intake.structured_data),
        ),
        program_readiness:
          toStructuredIntakeData(intake.structured_data).followup?.program_readiness ?? null,
        trigger_reason: intake.trigger_reason,
        review_state: null as IntakeReviewState | null,
        created_at: intake.created_at,
        updated_at: intake.updated_at,
      }
    : null

export async function GET() {
  try {
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

    const { data, error } = (await supabase
      .from('clinical_intakes' as any)
      .select(
        'id, status, version_number, clinical_summary, structured_data, trigger_reason, created_at, updated_at',
      )
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()) as unknown as { data: IntakeRecord | null; error: { message: string } | null }

    if (error) {
      console.error('[patient/intake/latest] Query error', error)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch intake' },
        },
        { status: 500 },
      )
    }

    const intake = (data ?? null) as IntakeRecord | null
    const mapped = mapIntake(intake)

    if (intake?.id && mapped) {
      const { data: reviewData, error: reviewError } = (await supabase
        .from('clinical_intake_reviews' as any)
        .select('status, review_notes, requested_items, updated_at')
        .eq('intake_id', intake.id)
        .eq('is_current', true)
        .maybeSingle()) as {
        data: {
          status: IntakeReviewState['status']
          review_notes: string | null
          requested_items: string[] | null
          updated_at: string
        } | null
        error: { message: string } | null
      }

      if (reviewError) {
        console.error('[patient/intake/latest] Review query error', reviewError)
      } else if (reviewData) {
        mapped.review_state = {
          status: reviewData.status,
          review_notes: reviewData.review_notes,
          requested_items: Array.isArray(reviewData.requested_items)
            ? reviewData.requested_items
            : null,
          updated_at: reviewData.updated_at,
        }
      }
    }

    return NextResponse.json({
      success: true,
      intake: mapped,
    })
  } catch (err) {
    console.error('[patient/intake/latest] Unexpected error', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
