import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

type InProgressAssessment = {
  id: string
  funnel: string
  funnel_id: string | null
  started_at: string
  completed_at: string | null
}

/**
 * E6.4.2: Get In-Progress Assessment
 *
 * Returns the most recent in-progress assessment for the authenticated user.
 */
export async function GET() {
  const supabase = (await createServerSupabaseClient()) as any

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
      } satisfies ApiResponse<never>,
      { status: 401 },
    )
  }

  const { data: profileData, error: profileError } = await (supabase as any)
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profileData) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Patient profile not found' },
      } satisfies ApiResponse<never>,
      { status: 404 },
    )
  }

  const { data: assessmentData, error: assessmentError } = await (supabase as any)
    .from('assessments')
    .select('id, funnel, funnel_id, started_at, completed_at')
    .eq('patient_id', profileData.id)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (assessmentError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'ASSESSMENT_FETCH_FAILED', message: 'Failed to fetch assessments' },
      } satisfies ApiResponse<never>,
      { status: 500 },
    )
  }

  if (!assessmentData) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NO_IN_PROGRESS', message: 'No in-progress assessments found' },
      } satisfies ApiResponse<never>,
      { status: 404 },
    )
  }

  return NextResponse.json({
    success: true,
    data: assessmentData as InProgressAssessment,
  } satisfies ApiResponse<InProgressAssessment>)
}