import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateRequiredQuestions } from '@/lib/validation/requiredQuestions'
import { getNextStepId, getCurrentStep } from '@/lib/navigation/assessmentNavigation'

/**
 * B5: Validate a step and determine next step
 * 
 * POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate
 * 
 * Validates that all required questions in the given step have been answered.
 * If validation passes, returns the next step ID.
 * Prevents step-skipping by ensuring current step is complete before navigating forward.
 * 
 * Response (success):
 * {
 *   success: true,
 *   ok: true,
 *   missingQuestions: [],
 *   nextStep: { stepId, title, ... } | null
 * }
 * 
 * Response (validation failed):
 * {
 *   success: true,
 *   ok: false,
 *   missingQuestions: [{ questionId, questionKey, questionLabel, orderIndex }]
 * }
 */

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; assessmentId: string; stepId: string }> },
) {
  try {
    const { slug, assessmentId, stepId } = await params

    // Validate parameters
    if (!slug || !assessmentId || !stepId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fehlende Parameter.',
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
      .select('id, patient_id, funnel, funnel_id, status')
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
          error: 'Sie haben keine Berechtigung, dieses Assessment zu validieren.',
        },
        { status: 403 },
      )
    }

    // Verify step belongs to funnel
    if (!assessment.funnel_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Funnel-ID fehlt im Assessment.',
        },
        { status: 500 },
      )
    }

    const { data: step, error: stepError } = await supabase
      .from('funnel_steps')
      .select('id, funnel_id, order_index, title, type')
      .eq('id', stepId)
      .single()

    if (stepError || !step) {
      console.error('Step lookup error:', stepError)
      return NextResponse.json(
        {
          success: false,
          error: 'Schritt nicht gefunden.',
        },
        { status: 404 },
      )
    }

    if (step.funnel_id !== assessment.funnel_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dieser Schritt gehört nicht zum Funnel des Assessments.',
        },
        { status: 400 },
      )
    }

    // Prevent step-skipping: verify this step is the current or a previous step
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

    // Allow validation of current step or previous steps (for going back)
    // But don't allow skipping ahead
    if (step.order_index > currentStep.orderIndex) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sie können nicht zu einem zukünftigen Schritt springen.',
        },
        { status: 403 },
      )
    }

    // Validate required questions using B2 logic
    const validationResult = await validateRequiredQuestions(assessmentId, stepId)

    // If validation failed, return missing questions
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: true,
          ok: false,
          missingQuestions: validationResult.missingQuestions,
        },
        { status: 200 },
      )
    }

    // Validation passed - determine next step using B3 navigation
    const nextStepId = await getNextStepId(supabase, assessmentId, currentStep)

    let nextStep = null
    if (nextStepId) {
      const { data: nextStepData } = await supabase
        .from('funnel_steps')
        .select('id, order_index, title, type')
        .eq('id', nextStepId)
        .single()

      if (nextStepData) {
        nextStep = {
          stepId: nextStepData.id,
          title: nextStepData.title,
          type: nextStepData.type,
          orderIndex: nextStepData.order_index,
        }
      }
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        ok: true,
        missingQuestions: [],
        nextStep,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Unexpected error in validate step API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten.',
      },
      { status: 500 },
    )
  }
}
