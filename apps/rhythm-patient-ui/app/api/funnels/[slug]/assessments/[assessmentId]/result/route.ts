import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
  versionedSuccessResponse,
  versionedErrorResponse,
  assessmentNotCompletedResponse,
  stateConflictResponse,
  ErrorCode,
} from '@/lib/api/responses'
import { logUnauthorized, logForbidden, logDatabaseError, logIncompleteAssessmentAccess } from '@/lib/logging/logger'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type GetResultResponseData,
  type GetResultStateResponseData,
  RESULT_STATE,
} from '@/lib/api/contracts/patient'
import type { AssessmentWithWorkup } from '@/lib/types/workupStatus'
import { loadCalculatedResults } from '@/lib/results/persistence'
import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'
import { getCorrelationId } from '@/lib/telemetry/correlationId'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  const correlationId = getCorrelationId(request)
  try {
    const { slug, assessmentId } = await context.params

    if (!slug || !assessmentId) {
      return notFoundResponse('Assessment', 'Assessment nicht gefunden.')
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result`, assessmentId })
      return unauthorizedResponse()
    }

    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      logDatabaseError(
        { userId: user.id, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` },
        profileError,
      )
      return notFoundResponse('Benutzerprofil')
    }

    const { data: assessment, error: assessmentError } = (await supabase
      .from('assessments')
      .select('id, patient_id, funnel, completed_at, status, workup_status, missing_data_fields')
      .eq('id', assessmentId)
      .single()) as { data: AssessmentWithWorkup | null; error: unknown }

    if (assessmentError) {
      logDatabaseError(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` },
        assessmentError,
      )
        return internalErrorResponse('Fehler beim Laden des Assessments.', correlationId)
    }

    if (!assessment) {
      return notFoundResponse('Assessment', 'Assessment nicht gefunden.')
    }

    if (assessment.patient_id !== patientProfile.id) {
      logForbidden(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment anzusehen.')
    }

    // E73.4: Check feature flag once for entire request
    const useStateContract = flagEnabled(env.E73_4_RESULT_SSOT)

    if (useStateContract && !(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY)) {
      console.error('[result/route] Missing service role key', {
        correlationId,
        assessmentId,
        stage: 'results_stage',
        errorCode: 'CONFIGURATION_ERROR',
      })

      return versionedErrorResponse(
        ErrorCode.CONFIGURATION_ERROR,
        'Server configuration error',
        500,
        PATIENT_ASSESSMENT_SCHEMA_VERSION,
        { reason: 'SUPABASE_SERVICE_ROLE_KEY missing' },
        correlationId,
      )
    }

    if (assessment.status !== 'completed') {
      logIncompleteAssessmentAccess(
        {
          assessmentId,
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result`,
        },
        assessment.status,
      )
      
      if (useStateContract) {
        // E73.4: Return 409 with in_progress state
          return stateConflictResponse(
            'Assessment ist noch nicht abgeschlossen.',
            { state: 'in_progress', assessmentId: assessment.id },
            correlationId,
          )
      }
      
      // Legacy behavior
      return assessmentNotCompletedResponse(
        'Dieses Assessment wurde noch nicht abgeschlossen. Bitte schließen Sie das Assessment ab, um die Ergebnisse zu sehen.',
        { assessmentId, status: assessment.status },
      )
    }
    
    if (useStateContract) {
      // E73.4: SSOT-first approach - fetch from calculated_results
      const { success: loadSuccess, result: calculatedResult, error: loadError } = await loadCalculatedResults(
        supabase,
        assessmentId,
      )
      
      if (!loadSuccess || loadError) {
        console.error('[result/route] Error loading calculated results:', loadError)
          return internalErrorResponse('Fehler beim Laden der Ergebnisse.', correlationId)
      }
      
      if (!calculatedResult) {
        // E73.4: Completed but no calculated_results → 409 processing
          return stateConflictResponse(
            'Die Ergebnisse werden aktuell berechnet. Bitte versuchen Sie es in Kürze erneut.',
            { state: 'processing', assessmentId: assessment.id },
            correlationId,
          )
      }
      
      // E73.4: Return SSOT result
      const stateData: GetResultStateResponseData = {
        state: RESULT_STATE.READY,
        assessmentId: assessment.id,
        result: {
          scores: calculatedResult.scores,
          riskModels: calculatedResult.riskModels,
          priorityRanking: calculatedResult.priorityRanking,
          algorithmVersion: calculatedResult.algorithmVersion,
          computedAt: calculatedResult.computedAt,
        },
      }
      
      return versionedSuccessResponse(stateData, PATIENT_ASSESSMENT_SCHEMA_VERSION)
    }

    // Legacy POC behavior below


    let funnelTitle: string | null = null

    const { data: funnelRow, error: funnelError } = await supabase
      .from('funnels')
      .select('title')
      .eq('slug', assessment.funnel)
      .maybeSingle()

    if (funnelError) {
      logDatabaseError(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` },
        funnelError,
      )
        return internalErrorResponse('Fehler beim Laden des Funnels.', correlationId)
    }

    funnelTitle = funnelRow?.title ?? null

    if (!funnelTitle) {
      const { data: catalogRow } = await supabase
        .from('funnels_catalog')
        .select('title')
        .eq('slug', assessment.funnel)
        .maybeSingle()

      funnelTitle = catalogRow?.title ?? null
    }

    const { data: answers, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      logDatabaseError(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` },
        answersError,
      )
    }

    const answersEcho = (answers || []).map((row) => ({
      questionId: row.question_id,
      value: row.answer_value,
    }))

    const ageAnswer = answersEcho.find((row) => row.questionId === 'q1-age')
    const cardiovascularAgeYears = typeof ageAnswer?.value === 'number' ? ageAnswer.value : null

    const responseData: GetResultResponseData = {
      id: assessment.id,
      funnel: assessment.funnel,
      completedAt: assessment.completed_at,
      status: assessment.status as 'in_progress' | 'completed',
      funnelTitle,
      workupStatus: assessment.workup_status ?? null,
      missingDataFields: Array.isArray(assessment.missing_data_fields)
        ? (assessment.missing_data_fields as string[])
        : [],
      result: {
        kind: 'poc',
        summaryTitle: 'Ergebnis wird vorbereitet',
        summaryBullets: [
          'Ihre Antworten wurden erfolgreich gespeichert.',
          'Die Auswertung wird aktuell vorbereitet.',
          'Sie erhalten die Ergebnisse in Kürze.',
        ],
        derived: {
          cardiovascularAgeYears,
          riskBand: 'unknown',
        },
        answersEcho,
      },
      nextActions: [
        {
          kind: 'clinicianReview',
          label: 'Zur ärztlichen Prüfung',
          status: assessment.workup_status ?? 'ready_for_review',
        },
      ],
      report: {
        id: null,
        status: 'not_generated',
      },
    }

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION)
  } catch (error) {
    console.error('Error in GET /api/funnels/[slug]/assessments/[assessmentId]/result:', error)
    return internalErrorResponse('Internal server error', correlationId)
  }
}