import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'
import {
  versionedSuccessResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  sessionExpiredResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { isSessionExpired } from '@/lib/api/authHelpers'
import {
  logUnauthorized,
  logForbidden,
  logDatabaseError,
  logInfo,
  logWarn,
  logNotFound,
} from '@/lib/logging/logger'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type ResumeAssessmentResponseData,
} from '@/lib/api/contracts/patient'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitFunnelResumed } from '@/lib/telemetry/events'

/**
 * B5/B8: Get assessment status and current step
 *
 * GET /api/funnels/[slug]/assessments/[assessmentId]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  try {
    const { slug, assessmentId } = await context.params
    const correlationId = getCorrelationId(request)

    if (!slug || !assessmentId) {
      return missingFieldsResponse('Funnel-Slug oder Assessment-ID fehlt.', undefined, correlationId)
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      if (isSessionExpired(authError)) {
        return sessionExpiredResponse(undefined, correlationId)
      }
      logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`, assessmentId })
      return unauthorizedResponse(undefined, correlationId)
    }

    if (!user) {
      logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`, assessmentId })
      return unauthorizedResponse(undefined, correlationId)
    }

    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      if (profileError.code !== 'PGRST116') {
        logDatabaseError(
          { userId: user.id, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
          profileError,
        )
      }
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    if (!patientProfile) {
      logWarn('Patient profile not found', { userId: user.id, assessmentId, slug })
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    console.log('[getAssessment] Lookup parameters:', {
      correlationId,
      assessmentId,
      slug,
      userId: user.id,
      patientProfileId: patientProfile.id,
    })

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status, started_at, completed_at, current_step_id')
      .eq('id', assessmentId)
      .maybeSingle()

    console.log('[getAssessment] Query result:', {
      correlationId,
      found: !!assessment,
      errorCode: assessmentError?.code,
      errorMessage: assessmentError?.message,
    })

    if (assessmentError) {
      if (assessmentError.code === 'PGRST116') {
        logNotFound('Assessment', { userId: user.id, assessmentId, slug })
        return notFoundResponse('Assessment', 'Assessment nicht gefunden.', correlationId)
      }
      logDatabaseError(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
        assessmentError,
      )
      return internalErrorResponse('Fehler beim Laden des Assessments.', correlationId)
    }

    if (!assessment) {
      logNotFound('Assessment', { userId: user.id, assessmentId, slug })
      return notFoundResponse('Assessment', 'Assessment nicht gefunden.', correlationId)
    }

    if (assessment.patient_id !== patientProfile.id) {
      logForbidden(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment anzusehen.', correlationId)
    }

    if (!assessment.funnel_id) {
      const { data: catalogFunnel } = await supabase
        .from('funnels_catalog')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (catalogFunnel?.id) {
        logInfo('V0.5 catalog funnel detected, proceeding without funnel_id backfill', {
          assessmentId,
          slug,
          catalogFunnelId: catalogFunnel.id,
        })
      } else {
        logInfo('Legacy assessment detected (missing funnel_id), attempting backfill', {
          assessmentId,
          slug,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`,
        })

        const { data: funnelRow, error: funnelLookupError } = await supabase
          .from('funnels')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()

        if (funnelLookupError) {
          if (funnelLookupError.code !== 'PGRST116') {
            logDatabaseError(
              {
                userId: user.id,
                assessmentId,
                slug,
                endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`,
              },
              funnelLookupError,
            )
          }
        }

        if (!funnelRow?.id) {
          logNotFound('Funnel (legacy lookup)', { userId: user.id, assessmentId, slug })
          return notFoundResponse(
            'Funnel',
            `Der Funnel '${slug}' konnte nicht gefunden werden. Möglicherweise wurde er gelöscht oder umbenannt.`,
            correlationId,
          )
        }

        const { error: repairError } = await supabase
          .from('assessments')
          .update({ funnel_id: funnelRow.id })
          .eq('id', assessment.id)

        if (repairError) {
          logDatabaseError(
            {
              userId: user.id,
              assessmentId,
              slug,
              endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`,
            },
            repairError,
          )
          logWarn('Failed to backfill funnel_id for legacy assessment, proceeding with in-memory value', {
            assessmentId,
            slug,
            funnelId: funnelRow.id,
          })
        } else {
          logInfo('Successfully backfilled funnel_id for legacy assessment', {
            assessmentId,
            slug,
            funnelId: funnelRow.id,
          })
        }

        assessment.funnel_id = funnelRow.id
      }
    }

    let totalSteps = 0
    let currentStep: Awaited<ReturnType<typeof getCurrentStep>> = null
    let answeredQuestionKeysCurrentStep: string[] = []

    if (assessment.funnel_id) {
      const { data: steps, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('id, order_index')
        .eq('funnel_id', assessment.funnel_id)
        .order('order_index', { ascending: true })

      if (stepsError || !steps) {
        logDatabaseError(
          { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
          stepsError,
        )
        return internalErrorResponse('Fehler beim Laden der Schritte.', correlationId)
      }

      totalSteps = steps.length
      currentStep = await getCurrentStep(supabase, assessmentId, assessment.funnel_id)
    } else {
      const { loadFunnelVersionWithClient } = await import('@/lib/funnels/loadFunnelVersion')

      try {
        const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
        const steps = loadedVersion.manifest.questionnaire_config?.steps || []
        totalSteps = steps.length

        if (steps.length > 0) {
          const { data: answeredRows, error: answeredError } = await supabase
            .from('assessment_answers')
            .select('question_id')
            .eq('assessment_id', assessmentId)

          if (answeredError) {
            logDatabaseError(
              { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
              answeredError,
            )
            return internalErrorResponse('Fehler beim Laden der Antworten.', correlationId)
          }

          const answeredIds = new Set(answeredRows?.map((row) => row.question_id) || [])

          let resolvedIndex = steps.length - 1
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i]
            const requiredQuestions = step.questions?.filter(
              (q: { required?: boolean; is_required?: boolean }) =>
                (q.required ?? q.is_required) === true,
            )

            const hasMissing = requiredQuestions?.some(
              (q: { id: string }) => !answeredIds.has(q.id),
            )

            if (hasMissing) {
              resolvedIndex = i
              break
            }
          }

          const resolvedStep = steps[resolvedIndex]

          currentStep = {
            stepId: resolvedStep.id,
            title: resolvedStep.title,
            type: 'question_step',
            orderIndex: resolvedIndex,
            stepIndex: resolvedIndex,
            hasQuestions: true,
            requiredQuestions: [],
            answeredQuestions: [],
          }
        }
      } catch (err) {
        logDatabaseError(
          { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
          err,
        )
        return internalErrorResponse('Fehler beim Laden der Funnel-Konfiguration.', correlationId)
      }
    }

    if (!currentStep) {
      logDatabaseError(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
        new Error('Failed to determine current step'),
      )
      return internalErrorResponse('Fehler beim Ermitteln des aktuellen Schritts.', correlationId)
    }

    const { data: answeredRows, error: answeredRowsError } = await supabase
      .from('assessment_answers')
      .select('question_id')
      .eq('assessment_id', assessmentId)

    if (answeredRowsError) {
      logDatabaseError(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
        answeredRowsError,
      )
      return internalErrorResponse('Fehler beim Laden der beantworteten Fragen.', correlationId)
    }

    const answeredQuestionIds = new Set(
      (answeredRows ?? [])
        .map((row) => (typeof row.question_id === 'string' ? row.question_id : null))
        .filter((value): value is string => Boolean(value && value.trim())),
    )

    if (assessment.funnel_id && currentStep.stepId) {
      const { data: currentStepQuestions, error: currentStepQuestionsError } = await supabase
        .from('funnel_step_questions')
        .select('question_id, questions(key)')
        .eq('funnel_step_id', currentStep.stepId)
        .order('order_index', { ascending: true })

      if (currentStepQuestionsError) {
        logDatabaseError(
          { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` },
          currentStepQuestionsError,
        )
        return internalErrorResponse('Fehler beim Laden der Step-Fragen.', correlationId)
      }

      answeredQuestionKeysCurrentStep = (currentStepQuestions ?? [])
        .map((question) => {
          const questionKey = Array.isArray(question.questions)
            ? question.questions?.[0]?.key
            : question.questions?.key

          if (typeof questionKey === 'string' && questionKey.trim()) {
            return {
              responseKey: questionKey,
              matchKeys: [questionKey, question.question_id],
            }
          }

          return {
            responseKey: question.question_id,
            matchKeys: [question.question_id],
          }
        })
        .filter((entry) => entry.responseKey)
        .filter((entry) => entry.matchKeys.some((key) => answeredQuestionIds.has(key)))
        .map((entry) => entry.responseKey)
    }

    const completedSteps = currentStep.stepIndex

    await emitFunnelResumed({
      correlationId,
      assessmentId: assessment.id,
      funnelSlug: slug,
      patientId: patientProfile.id,
      stepId: currentStep.stepId,
      stepIndex: currentStep.stepIndex,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit FUNNEL_RESUMED event', err)
    })

    const responseData: ResumeAssessmentResponseData = {
      assessmentId: assessment.id,
      status: assessment.status,
      currentStep: {
        stepId: currentStep.stepId,
        title: currentStep.title,
        type: currentStep.type,
        stepIndex: currentStep.stepIndex,
        orderIndex: currentStep.orderIndex,
      },
      completedSteps,
      totalSteps,
      answeredQuestionKeysCurrentStep,
    }

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION, 200, correlationId)
  } catch (error) {
    logDatabaseError({ endpoint: 'GET /api/funnels/[slug]/assessments/[assessmentId]' }, error)
    return internalErrorResponse(undefined, getCorrelationId(request))
  }
}