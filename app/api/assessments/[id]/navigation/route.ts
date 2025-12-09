import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentStep, getNavigationState, getNextStepId, getPreviousStepId } from '@/lib/navigation/assessmentNavigation'

/**
 * API Route: Get Navigation State for Assessment
 * 
 * GET /api/assessments/[id]/navigation
 * 
 * Returns complete navigation state including current step, next/previous step IDs,
 * and navigation capabilities. Optimized for snappy UI responses.
 * 
 * Response:
 * {
 *   success: boolean,
 *   navigation?: {
 *     currentStepId: string | null,
 *     currentStepIndex: number,
 *     nextStepId: string | null,
 *     previousStepId: string | null,
 *     canGoNext: boolean,
 *     canGoPrevious: boolean,
 *     isComplete: boolean,
 *     totalSteps: number,
 *     answeredQuestions: number,
 *     totalQuestions: number
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

    // Create Supabase server client with cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

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

    // Verify assessment ownership
    const { data: assessment, error: assessmentError } = await supabase
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

    // Get navigation state - measure performance
    const startTime = Date.now()
    
    // Get current step first (shared computation)
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

    // Run remaining queries in parallel, passing cached currentStep
    const [navState, nextStepId, prevStepId] = await Promise.all([
      getNavigationState(supabase, assessmentId),
      getNextStepId(supabase, assessmentId, currentStep),
      getPreviousStepId(supabase, assessmentId, currentStep),
    ])
    
    const duration = Date.now() - startTime

    // Log performance warning if slow
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

    // Success response with extended navigation info
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
