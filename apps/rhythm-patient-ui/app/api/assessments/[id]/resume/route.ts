import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCurrentStep, getNavigationState } from '@/lib/navigation/assessmentNavigation'

/**
 * API Route: Resume Assessment
 *
 * GET /api/assessments/[id]/resume
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: assessmentId } = await params

    if (!assessmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment ID ist erforderlich.',
        },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        {
          success: false,
          error: 'Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.',
        },
        { status: 401 },
      )
    }

    const { data: patientProfile, error: profileError } = await (supabase as any)
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      console.error('Patient profile lookup error:', profileError)
      return NextResponse.json(
        {
          success: false,
          error: 'Benutzerprofil nicht gefunden.',
        },
        { status: 404 },
      )
    }

    const { data: assessment, error: assessmentError } = await (supabase as any)
      .from('assessments')
      .select('id, patient_id, funnel_id')
      .eq('id', assessmentId)
      .single()

    if (assessmentError) {
      console.error('Assessment lookup error:', assessmentError)
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment nicht gefunden.',
        },
        { status: 404 },
      )
    }

    if (assessment.patient_id !== patientProfile.id) {
      console.warn(
        `Unauthorized assessment access attempt by user ${user.id} for assessment ${assessmentId}`,
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Sie haben keine Berechtigung, auf dieses Assessment zuzugreifen.',
        },
        { status: 403 },
      )
    }

    if (!assessment.funnel_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment hat keine zugewiesene Funnel-ID.',
        },
        { status: 400 },
      )
    }

    const startTime = Date.now()

    const [currentStep, navState, answers] = await Promise.all([
      getCurrentStep(supabase, assessmentId),
      getNavigationState(supabase, assessmentId),
      (supabase as any)
        .from('assessment_answers')
        .select('question_id, answer_value')
        .eq('assessment_id', assessmentId),
    ])

    const duration = Date.now() - startTime

    if (duration > 200) {
      console.warn(`Resume query took ${duration}ms for assessment ${assessmentId}`)
    }

    if (!currentStep || !navState) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resume-Daten konnten nicht geladen werden.',
        },
        { status: 500 },
      )
    }

    const previousAnswers: Record<string, number> = {}
    if (answers.data) {
      answers.data.forEach((answer) => {
        previousAnswers[answer.question_id] = answer.answer_value
      })
    }

    return NextResponse.json(
      {
        success: true,
        resume: {
          assessmentId: assessment.id,
          funnelId: assessment.funnel_id,
          currentStep,
          navigation: navState,
          previousAnswers,
        },
        performanceMs: duration,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Unexpected error in resume API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    )
  }
}