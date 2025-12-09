import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateAllRequiredQuestions } from '@/lib/validation/requiredQuestions'
import {
  successResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import {
  logUnauthorized,
  logForbidden,
  logValidationFailure,
  logDatabaseError,
} from '@/lib/logging/logger'

/**
 * B5/B8: Complete an assessment
 * 
 * POST /api/funnels/[slug]/assessments/[assessmentId]/complete
 * 
 * Performs full validation across all steps in the funnel.
 * If all required questions are answered, sets assessment status to 'completed'
 * and records the completion timestamp.
 * 
 * Response (B8 standardized):
 * Success:
 * {
 *   success: true,
 *   data: {
 *     assessmentId: string,
 *     status: 'completed'
 *   }
 * }
 * 
 * Validation failed:
 * {
 *   success: false,
 *   error: {
 *     code: 'VALIDATION_FAILED',
 *     message: 'Nicht alle Pflichtfragen wurden beantwortet.',
 *     details: {
 *       missingQuestions: [{ questionId, questionKey, questionLabel, orderIndex }]
 *     }
 *   }
 * }
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  let slug: string | undefined
  let assessmentId: string | undefined

  try {
    const paramsResolved = await params
    slug = paramsResolved.slug
    assessmentId = paramsResolved.assessmentId

    // Validate parameters
    if (!slug || !assessmentId) {
      return missingFieldsResponse('Funnel-Slug oder Assessment-ID fehlt.')
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
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        assessmentId,
      })
      return unauthorizedResponse()
    }

    // Get patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      logDatabaseError(
        {
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil')
    }

    // Load assessment and verify ownership
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status')
      .eq('id', assessmentId)
      .eq('funnel', slug)
      .single()

    if (assessmentError || !assessment) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        assessmentError,
      )
      return notFoundResponse('Assessment')
    }

    // Verify ownership
    if (assessment.patient_id !== patientProfile.id) {
      logForbidden(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment abzuschließen.')
    }

    // Check if already completed
    if (assessment.status === 'completed') {
      return successResponse({
        assessmentId: assessment.id,
        status: 'completed',
        message: 'Assessment wurde bereits abgeschlossen.',
      })
    }

    // Verify funnel_id exists
    if (!assessment.funnel_id) {
      return internalErrorResponse('Funnel-ID fehlt im Assessment.')
    }

    // Perform full validation across all funnel steps
    const validationResult = await validateAllRequiredQuestions(assessmentId, assessment.funnel_id)

    // If validation failed, return missing questions
    if (!validationResult.isValid) {
      logValidationFailure(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        validationResult.missingQuestions,
      )

      return validationErrorResponse('Nicht alle Pflichtfragen wurden beantwortet.', {
        missingQuestions: validationResult.missingQuestions,
      })
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
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        updateError,
      )
      return internalErrorResponse('Fehler beim Abschließen des Assessments.')
    }

    // Success response
    return successResponse({
      assessmentId: assessment.id,
      status: 'completed',
    })
  } catch (error) {
    logDatabaseError(
      {
        assessmentId,
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
      },
      error,
    )
    return internalErrorResponse()
  }
}
