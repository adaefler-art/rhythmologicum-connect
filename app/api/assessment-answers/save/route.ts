import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API Route: Save Assessment Answer (Save-on-Tap)
 * 
 * POST /api/assessment-answers/save
 * 
 * Saves or updates a single answer for a question in an assessment.
 * Uses UPSERT logic to prevent duplicate answers for the same question.
 * 
 * Request Body:
 * {
 *   assessmentId: string (UUID of the assessment),
 *   questionId: string (question.key from questions table, e.g., "stress_frequency"),
 *   answerValue: number (integer value of the answer)
 * }
 * 
 * Note: questionId should be the question.key (semantic identifier), not question.id (UUID)
 * This maps to the assessment_answers.question_id column which is of type text.
 * 
 * Response:
 * {
 *   success: boolean,
 *   data?: { id: string, assessment_id: string, question_id: string, answer_value: number },
 *   error?: string
 * }
 */

type RequestBody = {
  assessmentId: string
  questionId: string
  answerValue: number
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RequestBody = await request.json()
    const { assessmentId, questionId, answerValue } = body

    // Validate required fields
    if (!assessmentId || !questionId || answerValue === undefined || answerValue === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fehlende Pflichtfelder. Bitte geben Sie assessmentId, questionId und answerValue an.',
        },
        { status: 400 },
      )
    }

    // Validate answerValue is an integer
    if (!Number.isInteger(answerValue)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Der Wert answerValue muss eine ganze Zahl sein.',
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
    // First get the patient_profile for this user
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
          error: 'Sie haben keine Berechtigung, dieses Assessment zu bearbeiten.',
        },
        { status: 403 },
      )
    }

    // Perform upsert operation
    // Using ON CONFLICT clause to update if the answer already exists
    const { data, error: upsertError } = await supabase
      .from('assessment_answers')
      .upsert(
        {
          assessment_id: assessmentId,
          question_id: questionId,
          answer_value: answerValue,
        },
        {
          onConflict: 'assessment_id,question_id',
          ignoreDuplicates: false, // Update existing records
        },
      )
      .select()
      .single()

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Fehler beim Speichern der Antwort. Bitte versuchen Sie es erneut.',
        },
        { status: 500 },
      )
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.id,
          assessment_id: data.assessment_id,
          question_id: data.question_id,
          answer_value: data.answer_value,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    // Catch-all error handler
    console.error('Unexpected error in save assessment answer API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    )
  }
}
