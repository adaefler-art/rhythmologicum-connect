import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'

/**
 * B5: Get assessment status and current step
 * 
 * GET /api/funnels/[slug]/assessments/[assessmentId]
 * 
 * Returns the current status of an assessment including:
 * - Assessment status (in_progress, completed)
 * - Current step information
 * - Number of completed steps
 * - Total steps in funnel
 * 
 * Response:
 * {
 *   success: true,
 *   assessmentId: string,
 *   status: 'in_progress' | 'completed',
 *   currentStep: { stepId, title, type, stepIndex, orderIndex },
 *   completedSteps: number,
 *   totalSteps: number
 * }
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  try {
    const { slug, assessmentId } = await params

    // Validate parameters
    if (!slug || !assessmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Funnel-Slug oder Assessment-ID fehlt.',
        },
        { status: 400 },
      )
    }

    // Create Supabase server client
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

    // Get patient profile
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

    // Load assessment and verify ownership
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status, started_at, completed_at')
      .eq('id', assessmentId)
      .eq('funnel', slug)
      .single()

    if (assessmentError || !assessment) {
      console.error('Assessment lookup error:', assessmentError)
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment nicht gefunden.',
        },
        { status: 404 },
      )
    }

    // Verify ownership
    if (assessment.patient_id !== patientProfile.id) {
      console.warn(
        `Unauthorized assessment access attempt by user ${user.id} for assessment ${assessmentId}`,
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Sie haben keine Berechtigung, dieses Assessment anzusehen.',
        },
        { status: 403 },
      )
    }

    // Get funnel info
    if (!assessment.funnel_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Funnel-ID fehlt im Assessment.',
        },
        { status: 500 },
      )
    }

    // Get total steps count
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, order_index')
      .eq('funnel_id', assessment.funnel_id)
      .order('order_index', { ascending: true })

    if (stepsError || !steps) {
      console.error('Steps lookup error:', stepsError)
      return NextResponse.json(
        {
          success: false,
          error: 'Fehler beim Laden der Schritte.',
        },
        { status: 500 },
      )
    }

    const totalSteps = steps.length

    // Determine current step using B3 navigation logic
    const currentStep = await getCurrentStep(supabase, assessmentId, assessment.funnel_id)

    if (!currentStep) {
      console.error('Failed to determine current step for assessment:', assessmentId)
      return NextResponse.json(
        {
          success: false,
          error: 'Fehler beim Ermitteln des aktuellen Schritts.',
        },
        { status: 500 },
      )
    }

    // Count completed steps (steps before current step where all required questions are answered)
    const completedSteps = currentStep.stepIndex

    // Return success response
    return NextResponse.json(
      {
        success: true,
        assessmentId: assessment.id,
        status: assessment.status,
        currentStep: {
          stepId: currentStep.stepId,
          title: currentStep.title,
          type: currentStep.type,
          stepIndex: currentStep.stepIndex,
          orderIndex: currentStep.orderIndex,
        },
        completedSteps,
        totalSteps,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Unexpected error in get assessment status API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten.',
      },
      { status: 500 },
    )
  }
}
