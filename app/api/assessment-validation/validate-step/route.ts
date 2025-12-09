import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateRequiredQuestions } from '@/lib/validation/requiredQuestions'

/**
 * API Route: Validate Step Required Questions
 *
 * POST /api/assessment-validation/validate-step
 *
 * Validates that all required questions for a specific funnel step
 * have been answered in the assessment.
 *
 * Request Body:
 * {
 *   assessmentId: string (UUID of the assessment),
 *   stepId: string (UUID of the funnel step to validate)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   isValid: boolean,
 *   missingQuestions?: Array<{
 *     questionId: string,
 *     questionKey: string,
 *     questionLabel: string,
 *     orderIndex: number
 *   }>,
 *   error?: string
 * }
 */

type RequestBody = {
  assessmentId: string
  stepId: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RequestBody = await request.json()
    const { assessmentId, stepId } = body

    // Validate required fields
    if (!assessmentId || !stepId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fehlende Pflichtfelder. Bitte geben Sie assessmentId und stepId an.',
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
          error: 'Sie haben keine Berechtigung, dieses Assessment zu validieren.',
        },
        { status: 403 },
      )
    }

    // Perform validation
    const validationResult = await validateRequiredQuestions(assessmentId, stepId)

    // Success response
    return NextResponse.json(
      {
        success: true,
        isValid: validationResult.isValid,
        missingQuestions: validationResult.missingQuestions,
      },
      { status: 200 },
    )
  } catch (error) {
    // Catch-all error handler
    console.error('Unexpected error in validate step API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    )
  }
}
