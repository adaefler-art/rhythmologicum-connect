import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'

/**
 * API Route: Get Current Step for Assessment
 * 
 * GET /api/assessments/[id]/current-step
 * 
 * Determines which step the user should see when opening or resuming an assessment.
 * Based on answered questions and funnel step configuration.
 * 
 * Response:
 * {
 *   success: boolean,
 *   step?: {
 *     stepId: string,
 *     stepIndex: number,
 *     orderIndex: number,
 *     title: string,
 *     type: string,
 *     hasQuestions: boolean,
 *     requiredQuestions: string[],
 *     answeredQuestions: string[]
 *   },
 *   error?: string
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

    // Get current step using navigation helper
    const startTime = Date.now()
    const currentStep = await getCurrentStep(supabase, assessmentId)
    const duration = Date.now() - startTime

    // Log performance for monitoring
    if (duration > 200) {
      console.warn(`getCurrentStep took ${duration}ms for assessment ${assessmentId}`)
    }

    if (!currentStep) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aktueller Schritt konnte nicht ermittelt werden.',
        },
        { status: 500 },
      )
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        step: currentStep,
        performanceMs: duration,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Unexpected error in current-step API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    )
  }
}
