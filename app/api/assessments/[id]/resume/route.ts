import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCurrentStep, getNavigationState } from '@/lib/navigation/assessmentNavigation'

/**
 * API Route: Resume Assessment
 * 
 * GET /api/assessments/[id]/resume
 * 
 * Provides all necessary data to resume an interrupted assessment.
 * Returns current step, navigation state, and previous answers.
 * 
 * Response:
 * {
 *   success: boolean,
 *   resume?: {
 *     assessmentId: string,
 *     funnelId: string,
 *     currentStep: StepInfo,
 *     navigation: NavigationState,
 *     previousAnswers: Record<string, number>
 *   },
 *   error?: string,
 *   performanceMs?: number
 * }
 */

export async function GET(
  request: NextRequest,
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

    // Check authentication
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

    // Verify the assessment belongs to this user
    const { data: patientProfile, error: profileError } = await supabase
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

    // Verify assessment ownership and get funnel_id
    const { data: assessment, error: assessmentError } = await supabase
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

    // Get resume data - measure performance
    const startTime = Date.now()

    // Fetch all data in parallel
    const [currentStep, navState, answers] = await Promise.all([
      getCurrentStep(supabase, assessmentId),
      getNavigationState(supabase, assessmentId),
      supabase
        .from('assessment_answers')
        .select('question_id, answer_value')
        .eq('assessment_id', assessmentId),
    ])

    const duration = Date.now() - startTime

    // Log performance warning if slow
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

    // Transform answers into a convenient map
    const previousAnswers: Record<string, number> = {}
    if (answers.data) {
      answers.data.forEach((answer) => {
        previousAnswers[answer.question_id] = answer.answer_value
      })
    }

    // Success response
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
