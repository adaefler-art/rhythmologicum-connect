import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
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
import { withIdempotency } from '@/lib/api/idempotency'
import { loadFunnelVersionWithClient } from '@/lib/funnels/loadFunnelVersion'

/**
 * B5/B8: Validate a step and determine next step
 * 
 * POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate
 * 
 * Validates that all required questions in the given step have been answered.
 * If validation passes, returns the next step ID.
 * Prevents step-skipping by ensuring current step is complete before navigating forward.
 * 
 * E6.2.4: Supports idempotency via Idempotency-Key header.
 * Duplicate requests with same key return cached response.
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
  const { slug, assessmentId, stepId } = await context.params

  // E6.2.4: Wrap handler with idempotency support
  return withIdempotency(
    request,
    {
      endpointPath: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}/validate`,
      checkPayloadConflict: false, // No payload for this endpoint
    },
    async () => {
      return handleValidateStep(request, slug, assessmentId, stepId)
    },
  )
}

async function handleValidateStep(
  request: NextRequest,
  slug: string,
  assessmentId: string,
  stepId: string,
) {
  try {
    // Validate parameters
    if (!slug || !assessmentId || !stepId) {
      return missingFieldsResponse('Fehlende Parameter.')
    }

    const supabase = await createServerSupabaseClient()

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

    // Determine if this is a V0.5 catalog funnel (funnel_id is null)
    const isV05CatalogFunnel = assessment.funnel_id === null

    if (isV05CatalogFunnel) {
      // V0.5 path: Validate using manifest-based logic
      return handleV05StepValidation(supabase, slug, assessmentId, stepId, patientProfile.id, user.id)
    }

    // Legacy path: Verify step belongs to funnel via DB tables
    // TypeScript: funnel_id is guaranteed non-null here due to the if check above
    const funnelId = assessment.funnel_id!

    // Use centralized step-funnel validation
    const stepBelongsValidation = await ensureStepBelongsToFunnel(supabase, stepId, funnelId)

    if (!stepBelongsValidation.valid) {
      // V05-I03.3 Hardening: Return 404 for "not found" scenarios, 403 for authorization issues
      if (stepBelongsValidation.error!.code === 'STEP_NOT_FOUND') {
        return notFoundResponse('Schritt', stepBelongsValidation.error!.message)
      }
      if (stepBelongsValidation.error!.code === 'STEP_NOT_IN_FUNNEL') {
        return notFoundResponse('Schritt', stepBelongsValidation.error!.message)
      }
      return forbiddenResponse(stepBelongsValidation.error!.message)
    }

    // Use centralized step-skipping prevention
    const stepValidation = await ensureStepIsCurrent(
      supabase,
      assessmentId,
      stepId,
      funnelId,
      user.id,
    )

    if (!stepValidation.valid) {
      console.warn('ensureStepIsCurrent failed', {
        assessmentId,
        requestedStepId: stepId,
        error: stepValidation.error,
      })
      // V05-I03.3 Hardening: Return 404 for "not found", 403 for authorization issues
      if (stepValidation.error!.code === 'CURRENT_STEP_NOT_FOUND') {
        return notFoundResponse('Schritt', stepValidation.error!.message)
      }
      if (stepValidation.error!.code === 'STEP_NOT_FOUND') {
        return notFoundResponse('Schritt', stepValidation.error!.message)
      }
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
    const navigationStep = await getCurrentStep(supabase, assessmentId, funnelId)

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

    // V05-I03.3: Persist current_step_id for save/resume functionality
    // Update current_step_id to the next step (or keep current if no next step)
    // IMPORTANT: Only update after all validations passed (fail-closed)
    const stepToSave = nextStep ? nextStep.stepId : stepId
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ current_step_id: stepToSave })
      .eq('id', assessmentId)
      .eq('patient_id', patientProfile.id) // Double-check ownership

    if (updateError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          stepId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}`,
        },
        updateError,
      )
      // Note: Validation passed, but current_step_id update failed
      // This is non-critical - resume will still work based on getCurrentStep logic
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

/**
 * V0.5 Catalog Funnel step validation handler
 * 
 * For V0.5 funnels, step/question IDs come from the manifest (questionnaire_config),
 * not from the legacy funnel_steps/funnel_step_questions tables.
 */
async function handleV05StepValidation(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  slug: string,
  assessmentId: string,
  stepId: string,
  patientProfileId: string,
  userId: string,
) {
  try {
    console.log('[steps/validate] V0.5 catalog funnel detected', {
      slug,
      assessmentId,
      stepId,
    })

    // Load the manifest to get step/question definitions
    let manifest
    try {
      const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
      manifest = loadedVersion.manifest.questionnaire_config
    } catch (err) {
      console.error('[steps/validate] Failed to load manifest:', err)
      return internalErrorResponse('Funnel-Manifest konnte nicht geladen werden.')
    }

    // Find the requested step in the manifest
    const stepIndex = manifest.steps.findIndex((s: { id: string }) => s.id === stepId)
    if (stepIndex === -1) {
      return notFoundResponse('Schritt', `Step ${stepId} nicht im Manifest gefunden.`)
    }

    const currentStep = manifest.steps[stepIndex]

    // Get all answered questions for this assessment
    const { data: answeredQuestions, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      console.error('[steps/validate] Error fetching answers:', answersError)
      return internalErrorResponse('Antworten konnten nicht geladen werden.')
    }

    const answeredIds = new Set(answeredQuestions?.map((a) => a.question_id) || [])

    // Check required questions in this step
    const missingQuestions: Array<{
      questionId: string
      questionKey: string
      questionLabel: string
      orderIndex: number
    }> = []

    for (let i = 0; i < currentStep.questions.length; i++) {
      const q = currentStep.questions[i]
      if (q.required && !answeredIds.has(q.id)) {
        missingQuestions.push({
          questionId: q.id,
          questionKey: q.key,
          questionLabel: q.label,
          orderIndex: i,
        })
      }
    }

    // If validation failed, return missing questions
    if (missingQuestions.length > 0) {
      logValidationFailure(
        {
          userId,
          assessmentId,
          stepId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}/validate`,
        },
        missingQuestions,
      )

      return successResponse({
        isValid: false,
        missingQuestions,
      })
    }

    // Validation passed - determine next step from manifest
    let nextStep = null
    if (stepIndex + 1 < manifest.steps.length) {
      const next = manifest.steps[stepIndex + 1]
      nextStep = {
        stepId: next.id,
        title: next.title,
        type: 'question_step',
        orderIndex: stepIndex + 1,
      }
    }

    // Persist current_step_id for save/resume functionality
    const stepToSave = nextStep ? nextStep.stepId : stepId
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ current_step_id: stepToSave })
      .eq('id', assessmentId)
      .eq('patient_id', patientProfileId)

    if (updateError) {
      logDatabaseError(
        {
          userId,
          assessmentId,
          stepId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}`,
        },
        updateError,
      )
      // Non-critical - continue with success response
    }

    return successResponse({
      isValid: true,
      missingQuestions: [],
      nextStep,
    })
  } catch (error) {
    console.error('[steps/validate] V0.5 handler error:', error)
    return internalErrorResponse()
  }
}
