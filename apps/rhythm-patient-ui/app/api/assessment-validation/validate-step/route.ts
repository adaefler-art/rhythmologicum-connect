import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  validateRequiredQuestions,
  validateRequiredQuestionsExtended,
} from '@/lib/validation/requiredQuestions'

/**
 * API Route: Validate Step Required Questions
 *
 * POST /api/assessment-validation/validate-step
 */

type RequestBody = {
  assessmentId: string
  stepId: string
  extended?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { assessmentId, stepId, extended = false } = body

    if (!assessmentId || !stepId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fehlende Pflichtfelder. Bitte geben Sie assessmentId und stepId an.',
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

    let validationResult

    if (extended) {
      validationResult = await validateRequiredQuestionsExtended(assessmentId, stepId)
    } else {
      const legacyResult = await validateRequiredQuestions(assessmentId, stepId)
      validationResult = {
        isValid: legacyResult.isValid,
        missingQuestions: legacyResult.missingQuestions.map((q) => ({
          ...q,
          reason: 'required' as const,
        })),
      }
    }

    return NextResponse.json(
      {
        success: true,
        isValid: validationResult.isValid,
        missingQuestions: validationResult.missingQuestions,
      },
      { status: 200 },
    )
  } catch (error) {
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