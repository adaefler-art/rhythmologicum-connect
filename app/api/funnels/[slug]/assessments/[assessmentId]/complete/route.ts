import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateAllRequiredQuestions } from '@/lib/validation/requiredQuestions'

/**
 * B5: Complete an assessment
 * 
 * POST /api/funnels/[slug]/assessments/[assessmentId]/complete
 * 
 * Performs full validation across all steps in the funnel.
 * If all required questions are answered, sets assessment status to 'completed'
 * and records the completion timestamp.
 * 
 * Response (success):
 * {
 *   success: true,
 *   ok: true,
 *   assessmentId: string,
 *   status: 'completed'
 * }
 * 
 * Response (incomplete):
 * {
 *   success: true,
 *   ok: false,
 *   missingQuestions: [{ questionId, questionKey, questionLabel, orderIndex }],
 *   error: 'Nicht alle Pflichtfragen wurden beantwortet.'
 * }
 */

export async function POST(
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
          error: 'Sie haben keine Berechtigung, dieses Assessment abzuschließen.',
        },
        { status: 403 },
      )
    }

    // Check if already completed
    if (assessment.status === 'completed') {
      return NextResponse.json(
        {
          success: true,
          ok: true,
          assessmentId: assessment.id,
          status: 'completed',
          message: 'Assessment wurde bereits abgeschlossen.',
        },
        { status: 200 },
      )
    }

    // Verify funnel_id exists
    if (!assessment.funnel_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Funnel-ID fehlt im Assessment.',
        },
        { status: 500 },
      )
    }

    // Perform full validation across all funnel steps
    const validationResult = await validateAllRequiredQuestions(assessmentId, assessment.funnel_id)

    // If validation failed, return missing questions with 400 status
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: true,
          ok: false,
          missingQuestions: validationResult.missingQuestions,
          error: 'Nicht alle Pflichtfragen wurden beantwortet.',
        },
        { status: 400 },
      )
    }

    // All questions answered - mark assessment as completed
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', assessmentId)

    if (updateError) {
      console.error('Error updating assessment status:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Fehler beim Abschließen des Assessments.',
        },
        { status: 500 },
      )
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        ok: true,
        assessmentId: assessment.id,
        status: 'completed',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Unexpected error in complete assessment API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten.',
      },
      { status: 500 },
    )
  }
}
