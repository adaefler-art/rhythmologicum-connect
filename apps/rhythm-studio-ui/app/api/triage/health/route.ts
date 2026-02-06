import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { env } from '@/lib/env'

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
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'User must be authenticated',
          },
        },
        { status: 401 },
      )
    }

    const adminClient = createAdminSupabaseClient()

    const { count: assessmentsTotal, error: assessmentsError } = await adminClient
      .from('assessments')
      .select('id', { count: 'exact', head: true })

    if (assessmentsError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_FAILED',
            message: assessmentsError.message || 'Failed to count assessments',
          },
        },
        { status: 500 },
      )
    }

    const { data: latestAssessment, error: latestError } = await adminClient
      .from('assessments')
      .select('id')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_FAILED',
            message: latestError.message || 'Failed to fetch latest assessment',
          },
        },
        { status: 500 },
      )
    }

    let membershipStatus: 'ok' | 'needs_fix' | 'skipped' = 'skipped'
    let membershipError: { code?: string; message?: string } | null = null

    if (latestAssessment?.id) {
      const { data: rlsAssessment, error: rlsError } = await supabase
        .from('assessments')
        .select('id')
        .eq('id', latestAssessment.id)
        .maybeSingle()

      if (rlsError) {
        membershipStatus = 'needs_fix'
        membershipError = {
          code: rlsError.code || 'RLS_BLOCKED',
          message: rlsError.message || 'Assessment nicht sichtbar (RLS)',
        }
      } else if (!rlsAssessment) {
        membershipStatus = 'needs_fix'
        membershipError = {
          code: 'ASSESSMENT_NOT_VISIBLE',
          message: 'Assessment nicht sichtbar fuer Nutzer',
        }
      } else {
        membershipStatus = 'ok'
      }
    }

    return NextResponse.json(
      {
        success: true,
        assessmentsTotal: assessmentsTotal ?? 0,
        latestAssessmentId: latestAssessment?.id ?? null,
        projectUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? null,
        membershipStatus,
        membershipError,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal error',
        },
      },
      { status: 500 },
    )
  }
}
