import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateRequiredQuestions } from '@/lib/validation/requiredQuestions'
import { getNextStepId, getCurrentStep } from '@/lib/navigation/assessmentNavigation'
import {
  successResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import {
  ensureStepIsCurrent,
  ensureStepBelongsToFunnel,
} from '@/lib/validation/stepValidation'
import {
  logUnauthorized,
  logForbidden,
  logValidationFailure,
  logDatabaseError,
} from '@/lib/logging/logger'

/**
 * B5/B8: Validate a step and determine next step
 * 
 * POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate
 * 
 * Validates that all required questions in the given step have been answered.
 * If validation passes, returns the next step ID.
 * Prevents step-skipping by ensuring current step is complete before navigating forward.
 * 
 * Response (B8 standardized):
 * Success with validation passed:
 * {
 *   success: true,
 *   data: {
 *     isValid: true,
 *     missingQuestions: [],
 *     nextStep: { stepId, title, ... } | null
 *   }
 * }
 * 
 * Success with validation failed:
 * {
 *   success: true,
 *   data: {
 *     isValid: false,
 *     missingQuestions: [{ questionId, questionKey, questionLabel, orderIndex }]
 *   }
 * }
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string; stepId: string }> },
) {
  try {
    const { slug, assessmentId, stepId } = await context.params

    // Validate parameters
    if (!slug || !assessmentId || !stepId) {
      return missingFieldsResponse('Fehlende Parameter.')
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
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}/validate`,
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}/validate`,
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}/validate`,
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}/validate`,
        },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment zu validieren.')
    }

    // Verify step belongs to funnel
    if (!assessment.funnel_id) {
      return internalErrorResponse('Funnel-ID fehlt im Assessment.')
    }

    // Use centralized step-funnel validation
    const stepBelongsValidation = await ensureStepBelongsToFunnel(
      supabase,
      stepId,
      assessment.funnel_id,
    )

    if (!stepBelongsValidation.valid) {
      return forbiddenResponse(stepBelongsValidation.error!.message)
    }

    // Use centralized step-skipping prevention
    const stepValidation = await ensureStepIsCurrent(
      supabase,
      assessmentId,
      stepId,
      assessment.funnel_id,
      user.id,
    )

    if (!stepValidation.valid) {
      console.warn('ensureStepIsCurrent failed', {
        assessmentId,
        requestedStepId: stepId,
        error: stepValidation.error,
      })
      if (stepValidation.error!.code === 'STEP_SKIPPING_PREVENTED') {
        return forbiddenResponse(stepValidation.error!.message)
      }
      return internalErrorResponse(stepValidation.error!.message)
    }

    // Validate required questions using B2 logic
    const validationResult = await validateRequiredQuestions(assessmentId, stepId)

    // If validation failed, return missing questions
    if (!validationResult.isValid) {
      logValidationFailure(
        {
          userId: user.id,
          assessmentId,
          stepId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}/validate`,
        },
        validationResult.missingQuestions,
      )

      return successResponse({
        isValid: false,
        missingQuestions: validationResult.missingQuestions,
      })
    }

    // Validation passed - determine next step using B3 navigation
    // First, recalculate the current step (after this validation the runtime
    // may have advanced to the next unanswered step already).
    const navigationStep = await getCurrentStep(supabase, assessmentId, assessment.funnel_id)

    let nextStep = null

    if (navigationStep && navigationStep.stepId !== stepId) {
      // The runtime already moved to the next unanswered step; return it directly
      nextStep = {
        stepId: navigationStep.stepId,
        title: navigationStep.title,
        type: navigationStep.type,
        orderIndex: navigationStep.orderIndex,
      }
    } else if (navigationStep) {
      // Fall back to explicit next-step lookup (e.g., optional steps or summary)
      const nextStepId = await getNextStepId(supabase, assessmentId, navigationStep)

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
    }

    // Success response with standardized format
    return successResponse({
      isValid: true,
      missingQuestions: [],
      nextStep,
    })
  } catch (error) {
    logDatabaseError(
      {
        endpoint: 'POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]',
      },
      error,
    )
    return internalErrorResponse()
  }
}
