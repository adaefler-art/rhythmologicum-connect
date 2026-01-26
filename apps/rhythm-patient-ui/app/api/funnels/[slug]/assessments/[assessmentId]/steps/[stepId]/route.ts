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
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string; stepId: string }> },
) {
  const { slug, assessmentId, stepId } = await context.params

  return withIdempotency(
    request,
    {
      endpointPath: `/api/funnels/${slug}/assessments/${assessmentId}/steps/${stepId}/validate`,
      checkPayloadConflict: false,
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
    if (!slug || !assessmentId || !stepId) {
      return missingFieldsResponse('Fehlende Parameter.')
    }

    const supabase = await createServerSupabaseClient()

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

    const isV05CatalogFunnel = assessment.funnel_id === null

    if (isV05CatalogFunnel) {
      return handleV05StepValidation(supabase, slug, assessmentId, stepId, user.id)
    }

    const funnelId = assessment.funnel_id!

    const stepBelongsValidation = await ensureStepBelongsToFunnel(supabase, stepId, funnelId)

    if (!stepBelongsValidation.valid) {
      if (stepBelongsValidation.error!.code === 'STEP_NOT_FOUND') {
        return notFoundResponse('Schritt', stepBelongsValidation.error!.message)
      }
      if (stepBelongsValidation.error!.code === 'STEP_NOT_IN_FUNNEL') {
        return notFoundResponse('Schritt', stepBelongsValidation.error!.message)
      }
      return forbiddenResponse(stepBelongsValidation.error!.message)
    }

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

    const validationResult = await validateRequiredQuestions(assessmentId, stepId)

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

    const navigationStep = await getCurrentStep(supabase, assessmentId, funnelId)

    let nextStep = null

    if (navigationStep && navigationStep.stepId !== stepId) {
      nextStep = {
        stepId: navigationStep.stepId,
        title: navigationStep.title,
        type: navigationStep.type,
        orderIndex: navigationStep.orderIndex,
      }
    } else if (navigationStep) {
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

    const stepToSave = nextStep ? nextStep.stepId : stepId
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ current_step_id: stepToSave })
      .eq('id', assessmentId)
      .eq('patient_id', patientProfile.id)

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
    }

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

async function handleV05StepValidation(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  slug: string,
  assessmentId: string,
  stepId: string,
  userId: string,
) {
  try {
    console.log('[steps/validate] V0.5 catalog funnel detected', {
      slug,
      assessmentId,
      stepId,
    })

    let manifest
    try {
      const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
      manifest = loadedVersion.manifest.questionnaire_config
    } catch (err) {
      console.error('[steps/validate] Failed to load manifest:', err)
      return internalErrorResponse('Funnel-Manifest konnte nicht geladen werden.')
    }

    const stepIndex = manifest.steps.findIndex((s: { id: string }) => s.id === stepId)
    if (stepIndex === -1) {
      return notFoundResponse('Schritt', `Step ${stepId} nicht im Manifest gefunden.`)
    }

    const currentStep = manifest.steps[stepIndex]

    const { data: answeredQuestions, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      console.error('[steps/validate] Error fetching answers:', answersError)
      return internalErrorResponse('Antworten konnten nicht geladen werden.')
    }

    const answeredIds = new Set(answeredQuestions?.map((a) => a.question_id) || [])

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

    return successResponse({
      isValid: true,
      missingQuestions: [],
      nextStep,
    })
  } catch (error) {
    logDatabaseError(
      {
        endpoint: 'POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] (V0.5)',
      },
      error,
    )
    return internalErrorResponse()
  }
}