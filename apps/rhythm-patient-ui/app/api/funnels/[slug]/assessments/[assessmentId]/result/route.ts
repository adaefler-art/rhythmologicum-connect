import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
  versionedSuccessResponse,
  assessmentNotCompletedResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logForbidden, logDatabaseError, logIncompleteAssessmentAccess } from '@/lib/logging/logger'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type GetResultResponseData,
} from '@/lib/api/contracts/patient'
import type { AssessmentWithWorkup } from '@/lib/types/workupStatus'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
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
      return internalErrorResponse('Fehler beim Laden des Assessments.')
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

    if (assessment.status !== 'completed') {
      logIncompleteAssessmentAccess(
        {
          assessmentId,
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result`,
        },
        assessment.status,
      )
      return assessmentNotCompletedResponse(
        'Dieses Assessment wurde noch nicht abgeschlossen. Bitte schließen Sie das Assessment ab, um die Ergebnisse zu sehen.',
        { assessmentId, status: assessment.status },
      )
    }

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
      return internalErrorResponse('Fehler beim Laden des Funnels.')
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
    return internalErrorResponse('Internal server error')
  }
}