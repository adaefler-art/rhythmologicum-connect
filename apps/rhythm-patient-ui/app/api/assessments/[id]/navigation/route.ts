import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCurrentStep, getNavigationState, getNextStepId, getPreviousStepId } from '@/lib/navigation/assessmentNavigation'

/**
 * API Route: Get Navigation State for Assessment
 *
 * GET /api/assessments/[id]/navigation
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
      .select('id, patient_id')
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

    const startTime = Date.now()

    const currentStep = await getCurrentStep(supabase, assessmentId)

    if (!currentStep) {
      return NextResponse.json(
        {
          success: false,
          error: 'Navigationsstatus konnte nicht ermittelt werden.',
        },
        { status: 500 },
      )
    }

    const [navState, nextStepId, prevStepId] = await Promise.all([
      getNavigationState(supabase, assessmentId),
      getNextStepId(supabase, assessmentId, currentStep),
      getPreviousStepId(supabase, assessmentId, currentStep),
    ])

    const duration = Date.now() - startTime

    if (duration > 200) {
      console.warn(`Navigation state query took ${duration}ms for assessment ${assessmentId}`)
    }

    if (!navState) {
      return NextResponse.json(
        {
          success: false,
          error: 'Navigationsstatus konnte nicht ermittelt werden.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        navigation: {
          ...navState,
          nextStepId,
          previousStepId: prevStepId,
        },
        performanceMs: duration,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Unexpected error in navigation API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    )
  }
}