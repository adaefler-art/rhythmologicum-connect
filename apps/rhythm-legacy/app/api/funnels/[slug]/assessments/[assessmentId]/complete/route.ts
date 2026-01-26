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

/**
 * B5/B8: Complete an assessment
 *
 * POST /api/funnels/[slug]/assessments/[assessmentId]/complete
 *
 * Performs full validation across all steps in the funnel.
 * If all required questions are answered, sets assessment status to 'completed'
 * and records the completion timestamp.
 *
 * E6.2.4: Supports idempotency via Idempotency-Key header.
 * Duplicate requests with same key return cached response.
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
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  const { slug, assessmentId } = await context.params

  // E6.2.4: Wrap handler with idempotency support
  return withIdempotency(
    request,
    {
      endpointPath: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
      checkPayloadConflict: false, // No payload for this endpoint
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

    // Validate parameters
    if (!slug || !assessmentId) {
      return missingFieldsResponse('Funnel-Slug oder Assessment-ID fehlt.', undefined, correlationId)
    }

    const supabase = await createServerSupabaseClient()

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
      return unauthorizedResponse(undefined, correlationId)
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
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    // Load assessment and verify ownership
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
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment abzuschließen.', correlationId)
    }

    // Check if already completed
    if (assessment.status === 'completed') {
      const responseData: CompleteAssessmentResponseData = {
        assessmentId: assessment.id,
        status: 'completed',
        message: 'Assessment wurde bereits abgeschlossen.',
      }
      return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION, 200, correlationId)
    }

    // Determine if this is a V0.5 catalog funnel (funnel_id is null)
    const isV05CatalogFunnel = assessment.funnel_id === null

    // Perform full validation based on funnel type
    let validationResult: { isValid: boolean; missingQuestions: Array<{ questionId: string; questionKey: string; questionLabel: string; orderIndex: number }> }

    if (isV05CatalogFunnel) {
      // V0.5 path: Validate using manifest-based logic
      validationResult = await validateV05AllRequiredQuestions(supabase, slug, assessmentId)
    } else {
      // Legacy path: Validate via DB tables
      validationResult = await validateAllRequiredQuestions(assessmentId, assessment.funnel_id!)
    }

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
      }, correlationId)
    }

    // All questions answered - mark assessment as completed
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

    // Log successful assessment completion
    logAssessmentCompleted({
      userId: user.id,
      assessmentId,
      endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
      funnel: slug,
    })

    // E6.4.8: Emit FUNNEL_COMPLETED telemetry event
    await emitFunnelCompleted({
      correlationId,
      assessmentId,
      funnelSlug: slug,
      patientId: patientProfile.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit FUNNEL_COMPLETED event', err)
    })

    // V05-I10.3: Track KPI - Assessment completion
    // Calculate duration if started_at is available
    let durationSeconds: number | undefined
    if (assessment.started_at) {
      durationSeconds = calculateDurationSeconds(assessment.started_at, completedAt)
      // Only include if valid (non-zero)
      if (durationSeconds === 0) {
        console.warn('[complete] Invalid duration calculated', {
          started_at: assessment.started_at,
          completedAt,
        })
        durationSeconds = undefined
      }
    }

    // Track completion event for observability
    await trackAssessmentCompleted({
      actor_user_id: user.id,
      assessment_id: assessmentId,
      funnel_slug: slug,
      funnel_id: assessment.funnel_id ?? undefined,
      started_at: assessment.started_at,
      completed_at: completedAt,
      duration_seconds: durationSeconds,
    }).catch((err) => {
      // Don't fail the request if KPI tracking fails
      console.error('[complete] Failed to track KPI event', err)
    })

    // I2.4: Update patient state with assessment completion
    await updatePatientStateOnAssessmentComplete(
      supabase,
      user.id,
      assessmentId,
      slug,
      completedAt,
    ).catch((err) => {
      // Don't fail the completion if state update fails
      console.error('[complete] Failed to update patient state', err)
    })

    // E6.4.5: Trigger workup check after completion
    // This is async and non-blocking - workup runs in background
    performWorkupCheckAsync(assessmentId, slug, correlationId).catch((err) => {
      // Don't fail the completion if workup fails
      console.error('[complete] Failed to trigger workup check', err)
    })

    // Success response
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

/**
 * E6.4.5: Perform workup check asynchronously
 *
 * Runs workup data sufficiency check in the background after assessment completion.
 * Non-blocking - errors are logged but don't affect completion response.
 *
 * @param assessmentId - The assessment ID
 * @param funnelSlug - The funnel slug
 * @param correlationId - Correlation ID for telemetry
 */
async function performWorkupCheckAsync(assessmentId: string, funnelSlug: string, correlationId: string): Promise<void> {
  try {
    // Create evidence pack from assessment data
    const evidencePack = await createEvidencePack(assessmentId, funnelSlug)

    // Perform workup check (deterministic, rule-based)
    const workupResult = performWorkupCheck(evidencePack)

    // Get ruleset version
    const rulesetVersion = getRulesetVersion(funnelSlug) ?? 'default'

    // Store workup results in database
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

    // Log workup completion
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

/**
 * V0.5 Catalog Funnel validation - checks all required questions from manifest
 */
async function validateV05AllRequiredQuestions(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  slug: string,
  assessmentId: string,
): Promise<{ isValid: boolean; missingQuestions: Array<{ questionId: string; questionKey: string; questionLabel: string; orderIndex: number }> }> {
  console.log('[complete] V0.5 catalog funnel detected, using manifest-based validation', {
    slug,
    assessmentId,
  })

  // Load the manifest to get all required questions
  let manifest
  try {
    const loadedVersion = await loadFunnelVersionWithClient(supabase, slug)
    manifest = loadedVersion.manifest.questionnaire_config
  } catch (err) {
    console.error('[complete] Failed to load manifest:', err)
    throw new Error('Funnel-Manifest konnte nicht geladen werden.')
  }

  // Get all answered questions for this assessment
  const { data: answeredQuestions, error: answersError } = await supabase
    .from('assessment_answers')
    .select('question_id')
    .eq('assessment_id', assessmentId)

  if (answersError) {
    console.error('[complete] Error fetching answers:', answersError)
    throw new Error('Antworten konnten nicht geladen werden.')
  }

  const answeredIds = new Set(answeredQuestions?.map((a) => a.question_id) || [])

  // Collect all missing required questions across all steps
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

/**
 * I2.4: Update patient state on assessment completion
 * 
 * Adds activity entry and updates assessment status in PatientState
 */
async function updatePatientStateOnAssessmentComplete(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  assessmentId: string,
  funnelSlug: string,
  completedAt: string,
): Promise<void> {
  try {
    // Fetch existing patient state
    const { data, error: fetchError } = await supabase
      .from('patient_state')
      .select('state_data')
      .eq('user_id', userId)
      .single()

    let stateData: any = null
    let isNewState = false

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No state exists, create empty state
        isNewState = true
        stateData = {
          patient_state_version: '0.1',
          assessment: {
            lastAssessmentId: null,
            status: 'not_started',
            progress: 0,
            completedAt: null,
          },
          results: {
            summaryCards: [],
            recommendedActions: [],
            lastGeneratedAt: null,
          },
          dialog: {
            lastContext: 'none',
            messageCount: 0,
            lastMessageAt: null,
          },
          activity: {
            recentActivity: [],
          },
          metrics: {
            healthScore: {
              current: 0,
              delta: 0,
              updatedAt: null,
            },
            keyMetrics: [],
          },
          updatedAt: new Date().toISOString(),
        }
      } else {
        throw fetchError
      }
    } else {
      stateData = data.state_data
    }

    // Add new activity entry
    const newActivity = {
      type: 'assessment_completed',
      label: `Completed ${funnelSlug} Assessment`,
      timestamp: completedAt,
      metadata: {
        assessmentId,
        funnelSlug,
      },
    }

    // Keep only last 10 activities
    const recentActivity = [newActivity, ...(stateData.activity?.recentActivity || [])].slice(0, 10)

    // Update assessment state
    stateData.assessment = {
      lastAssessmentId: assessmentId,
      status: 'completed',
      progress: 1.0,
      completedAt,
    }

    // Update activity
    stateData.activity = {
      recentActivity,
    }

    // Update timestamp
    stateData.updatedAt = new Date().toISOString()

    // Save state
    if (isNewState) {
      const { error: insertError } = await supabase
        .from('patient_state')
        .insert({
          user_id: userId,
          patient_state_version: '0.1',
          state_data: stateData,
        })

      if (insertError) {
        throw insertError
      }
    } else {
      const { error: updateError } = await supabase
        .from('patient_state')
        .update({ state_data: stateData })
        .eq('user_id', userId)

      if (updateError) {
        throw updateError
      }
    }

    console.log('[complete] Patient state updated successfully', {
      userId,
      assessmentId,
      activityCount: recentActivity.length,
    })
  } catch (error) {
    console.error('[complete] Failed to update patient state:', error)
    throw error
  }
}
