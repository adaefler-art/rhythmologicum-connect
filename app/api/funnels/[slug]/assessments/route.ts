import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'

/**
 * B5: Start a new assessment for a funnel
 * 
 * POST /api/funnels/[slug]/assessments
 * 
 * Creates a new assessment for the authenticated patient and returns
 * the assessment ID and first step information.
 * 
 * Response:
 * {
 *   assessmentId: string,
 *   status: 'in_progress',
 *   currentStep: { stepId, title, type, ... }
 * }
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params

    // Validate slug parameter
    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Funnel-Slug fehlt.',
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

    // Load funnel by slug and verify it's active
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, title, is_active')
      .eq('slug', slug)
      .single()

    if (funnelError || !funnel) {
      console.error('Funnel lookup error:', funnelError)
      return NextResponse.json(
        {
          success: false,
          error: 'Funnel nicht gefunden.',
        },
        { status: 404 },
      )
    }

    if (!funnel.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dieser Funnel ist nicht aktiv.',
        },
        { status: 400 },
      )
    }

    // Create new assessment with status = in_progress
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        patient_id: patientProfile.id,
        funnel: slug,
        funnel_id: funnel.id,
        status: 'in_progress',
      })
      .select()
      .single()

    if (assessmentError || !assessment) {
      console.error('Assessment creation error:', assessmentError)
      return NextResponse.json(
        {
          success: false,
          error: 'Fehler beim Erstellen des Assessments.',
        },
        { status: 500 },
      )
    }

    // Determine first step using B3 navigation logic
    const currentStep = await getCurrentStep(supabase, assessment.id, funnel.id)

    if (!currentStep) {
      console.error('Failed to determine first step for assessment:', assessment.id)
      return NextResponse.json(
        {
          success: false,
          error: 'Fehler beim Ermitteln des ersten Schritts.',
        },
        { status: 500 },
      )
    }

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
          orderIndex: currentStep.orderIndex,
          stepIndex: currentStep.stepIndex,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Unexpected error in create assessment API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten.',
      },
      { status: 500 },
    )
  }
}
