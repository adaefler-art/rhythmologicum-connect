import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { validateAllRequiredQuestions } from '@/lib/validation/requiredQuestions'
import {
  versionedSuccessResponse,
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
  logAssessmentCompleted,
} from '@/lib/logging/logger'
import { trackAssessmentCompleted, calculateDurationSeconds } from '@/lib/monitoring/kpi'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type CompleteAssessmentResponseData,
} from '@/lib/api/contracts/patient'
import { withIdempotency } from '@/lib/api/idempotency'
import { performWorkupCheck, getRulesetVersion } from '@/lib/workup'
import { createEvidencePack } from '@/lib/workup/helpers'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitFunnelCompleted } from '@/lib/telemetry/events'
import { loadFunnelVersionWithClient } from '@/lib/funnels/loadFunnelVersion'
import {
  safeValidatePatientState,
  createEmptyPatientState,
  type PatientStateV01,
} from '@/lib/api/contracts/patient/state'

/**
 * B5/B8: Complete an assessment
 *
 * POST /api/funnels/[slug]/assessments/[assessmentId]/complete
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  const { slug, assessmentId } = await context.params

  return withIdempotency(
    request,
    {
      endpointPath: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
      checkPayloadConflict: false,
    },
    async () => {
      return handleCompleteAssessment(request, slug, assessmentId)
    },
  )
}

async function handleCompleteAssessment(
  request: NextRequest,
  slug: string,
  assessmentId: string,
) {
  try {
    const correlationId = getCorrelationId(request)

    if (!slug || !assessmentId) {
      return missingFieldsResponse('Funnel-Slug oder Assessment-ID fehlt.', undefined, correlationId)
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        assessmentId,
      })
      return unauthorizedResponse(undefined, correlationId)
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status, started_at')
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
      return notFoundResponse('Assessment', undefined, correlationId)
    }

    if (assessment.patient_id !== patientProfile.id) {
      logForbidden(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment abzuschließen.', correlationId)
    }

    if (assessment.status === 'completed') {
      const responseData: CompleteAssessmentResponseData = {
        assessmentId: assessment.id,
        status: 'completed',
        message: 'Assessment wurde bereits abgeschlossen.',
      }
      return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION, 200, correlationId)
    }

    const isV05CatalogFunnel = assessment.funnel_id === null

    let validationResult: {
      isValid: boolean
      missingQuestions: Array<{ questionId: string; questionKey: string; questionLabel: string; orderIndex: number }>
    }

    if (isV05CatalogFunnel) {
      validationResult = await validateV05AllRequiredQuestions(supabase, slug, assessmentId)
    } else {
      validationResult = await validateAllRequiredQuestions(assessmentId, assessment.funnel_id!)
    }

    if (!validationResult.isValid) {
      logValidationFailure(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        },
        validationResult.missingQuestions,
      )

      return validationErrorResponse(
        'Nicht alle Pflichtfragen wurden beantwortet.',
        {
          missingQuestions: validationResult.missingQuestions,
        },
        correlationId,
      )
    }

    const completedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        status: 'completed',
        completed_at: completedAt,
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
      return internalErrorResponse('Fehler beim Abschließen des Assessments.', correlationId)
    }

    logAssessmentCompleted({
      userId: user.id,
      assessmentId,
      endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
      funnel: slug,
    })

    await emitFunnelCompleted({
      correlationId,
      assessmentId,
      funnelSlug: slug,
      patientId: patientProfile.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit FUNNEL_COMPLETED event', err)
    })

    let durationSeconds: number | undefined
    if (assessment.started_at) {
      durationSeconds = calculateDurationSeconds(assessment.started_at, completedAt)
      if (durationSeconds === 0) {
        console.warn('[complete] Invalid duration calculated', {
          started_at: assessment.started_at,
          completedAt,
        })
        durationSeconds = undefined
      }
    }

    await trackAssessmentCompleted({
      actor_user_id: user.id,
      assessment_id: assessmentId,
      funnel_slug: slug,
      funnel_id: assessment.funnel_id ?? undefined,
      started_at: assessment.started_at,
      completed_at: completedAt,
      duration_seconds: durationSeconds,
    }).catch((err) => {
      console.error('[complete] Failed to track KPI event', err)
    })

    await updatePatientStateOnAssessmentComplete(
      supabase,
      user.id,
      assessmentId,
      slug,
      completedAt,
    ).catch((err) => {
      console.error('[complete] Failed to update patient state', err)
    })

    performWorkupCheckAsync(assessmentId, slug, correlationId).catch((err) => {
      console.error('[complete] Failed to trigger workup check', err)
    })

    const responseData: CompleteAssessmentResponseData = {
      assessmentId: assessment.id,
      status: 'completed',
    }

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION, 200, correlationId)
  } catch (error) {
    logDatabaseError(
      {
        endpoint: 'POST /api/funnels/[slug]/assessments/[assessmentId]/complete',
      },
      error,
    )
    return internalErrorResponse(undefined, getCorrelationId(request))
  }
}

async function performWorkupCheckAsync(assessmentId: string, funnelSlug: string, correlationId: string) {
  try {
    const evidencePack = await createEvidencePack(assessmentId, funnelSlug)
    const workupResult = performWorkupCheck(evidencePack)
    const rulesetVersion = getRulesetVersion(funnelSlug) ?? 'default'

    const supabase = await createServerSupabaseClient()
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        workup_status: workupResult.isSufficient ? 'ready_for_review' : 'needs_more_data',
        missing_data_fields: workupResult.missingDataFields,
      })
      .eq('id', assessmentId)

    if (updateError) {
      console.error('[workup] Failed to update assessment with workup results:', updateError)
      throw updateError
    }

    console.log('[workup] Workup completed', {
      assessmentId,
      funnel: funnelSlug,
      workupStatus: workupResult.isSufficient ? 'ready_for_review' : 'needs_more_data',
      missingFieldsCount: workupResult.missingDataFields.length,
      rulesetVersion,
    })
  } catch (error) {
    console.error('[workup] Error in async workup check:', error)
    throw error
  }
}

async function validateV05AllRequiredQuestions(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  slug: string,
  assessmentId: string,
): Promise<{
  isValid: boolean
  missingQuestions: Array<{ questionId: string; questionKey: string; questionLabel: string; orderIndex: number }>
}> {
  console.log('[complete] V0.5 catalog funnel detected, using manifest-based validation', {
    slug,
    assessmentId,
  })

  let manifest
  try {
    const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
    manifest = loadedVersion.manifest.questionnaire_config
  } catch (err) {
    console.error('[complete] Failed to load manifest:', err)
    throw new Error('Funnel-Manifest konnte nicht geladen werden.')
  }

  const { data: answeredQuestions, error: answersError } = await supabase
    .from('assessment_answers')
    .select('question_id')
    .eq('assessment_id', assessmentId)

  if (answersError) {
    console.error('[complete] Error fetching answers:', answersError)
    throw new Error('Antworten konnten nicht geladen werden.')
  }

  const answeredIds = new Set(answeredQuestions?.map((a) => a.question_id) || [])

  const missingQuestions: Array<{
    questionId: string
    questionKey: string
    questionLabel: string
    orderIndex: number
  }> = []

  let globalQuestionIndex = 0
  for (const step of manifest.steps) {
    for (const q of step.questions) {
      if (q.required && !answeredIds.has(q.id)) {
        missingQuestions.push({
          questionId: q.id,
          questionKey: q.key,
          questionLabel: q.label,
          orderIndex: globalQuestionIndex,
        })
      }
      globalQuestionIndex++
    }
  }

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  }
}

async function updatePatientStateOnAssessmentComplete(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  assessmentId: string,
  funnelSlug: string,
  completedAt: string,
): Promise<void> {
  try {
    const { data, error: fetchError } = await supabase
      .from('patient_state')
      .select('state_data')
      .eq('user_id', userId)
      .single()

    let stateData: PatientStateV01
    let isNewState = false

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        isNewState = true
        stateData = createEmptyPatientState()
      } else {
        throw fetchError
      }
    } else {
      const validatedState = safeValidatePatientState(data.state_data)
      stateData = validatedState || createEmptyPatientState()
    }

    const newActivity = {
      type: 'assessment_completed' as const,
      label: `Completed ${funnelSlug} Assessment`,
      timestamp: completedAt,
      metadata: {
        assessmentId,
        funnelSlug,
      },
    }

    const recentActivity = [newActivity, ...(stateData.activity?.recentActivity || [])].slice(0, 10)

    stateData.assessment = {
      lastAssessmentId: assessmentId,
      status: 'completed',
      progress: 1.0,
      completedAt,
      lastAssessment: {
        status: 'completed',
        funnelSlug,
        updatedAt: completedAt,
        answersCount: stateData.assessment.lastAssessment?.answersCount ?? 0,
        reportId: stateData.assessment.lastAssessment?.reportId ?? null,
      },
    }

    stateData.activity = {
      recentActivity,
    }

    stateData.updatedAt = new Date().toISOString()

    if (isNewState) {
      const { error: insertError } = await supabase
        .from('patient_state')
        .insert({
          user_id: userId,
          patient_state_version: '0.1',
          state_data: stateData as any,
        })

      if (insertError) {
        throw insertError
      }
    } else {
      const { error: updateError } = await supabase
        .from('patient_state')
        .update({ state_data: stateData as any })
        .eq('user_id', userId)

      if (updateError) {
        throw updateError
      }
    }
  } catch (error) {
    console.error('[patient_state] Error updating patient state:', error)
    throw error
  }
}