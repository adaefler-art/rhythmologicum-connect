import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'

type LatestIntake = {
  id: string
}

type IntakeReviewStatus = {
  status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
  requested_items: string[] | null
  updated_at: string
}

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

    const { data: latestIntake, error: intakeError } = (await supabase
      .from('clinical_intakes' as any)
      .select('id')
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()) as unknown as {
      data: LatestIntake | null
      error: { message: string } | null
    }

    if (intakeError) {
      console.error('[patient/review/status] Intake query error', intakeError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch latest intake' },
        },
        { status: 500 },
      )
    }

    if (!latestIntake) {
      return NextResponse.json({ success: true, review: null })
    }

    const { data: reviewData, error: reviewError } = (await supabase
      .from('clinical_intake_reviews' as any)
      .select('status, requested_items, updated_at')
      .eq('intake_id', latestIntake.id)
      .eq('is_current', true)
      .maybeSingle()) as unknown as {
      data: IntakeReviewStatus | null
      error: { message: string } | null
    }

    if (reviewError) {
      console.error('[patient/review/status] Review query error', reviewError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch review status' },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      review: reviewData
        ? {
            status: reviewData.status,
            requested_items: Array.isArray(reviewData.requested_items)
              ? reviewData.requested_items
              : [],
            updated_at: reviewData.updated_at,
          }
        : null,
    })
  } catch (err) {
    console.error('[patient/review/status] Unexpected error', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
