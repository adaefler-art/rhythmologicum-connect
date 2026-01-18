import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { FUNNEL_SLUG_ALIASES, getCanonicalFunnelSlug } from '@/lib/contracts/registry'
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

function getFunnelSlugCandidates(slug: string): string[] {
  const normalized = slug.toLowerCase().trim()
  const canonical = getCanonicalFunnelSlug(normalized)
  const legacySlugsForCanonical = Object.entries(FUNNEL_SLUG_ALIASES)
    .filter(([, canonicalSlug]) => canonicalSlug === canonical)
    .map(([legacySlug]) => legacySlug)

  return Array.from(new Set([normalized, canonical, ...legacySlugsForCanonical]))
}

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

    // E6.4.4: Fetch assessment with workup status and missing data fields
    // Type assertion needed as schema types not yet regenerated from migration
    const { data: assessment, error: assessmentError } = (await supabase
      .from('assessments')
      .select('id, patient_id, funnel, completed_at, status, workup_status, missing_data_fields')
      .eq('id', assessmentId)
      .in('funnel', getFunnelSlugCandidates(slug))
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

    // V061-I02: Result endpoint only returns data for completed assessments
    // - incomplete → 409 (STATE_CONFLICT)
    // - completed → 200 with result data
    if (assessment.status !== 'completed') {
      logIncompleteAssessmentAccess(
        {
          assessmentId,
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result`,
        },
        assessment.status,
      )
      // Use default message from helper function
      return assessmentNotCompletedResponse(
        'Dieses Assessment wurde noch nicht abgeschlossen. Bitte schließen Sie das Assessment ab, um die Ergebnisse zu sehen.',
        { assessmentId, status: assessment.status },
      )
    }

    // Try legacy funnels table first, then funnels_catalog
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

    // Fallback to funnels_catalog if legacy table has no title
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
      .select('question_id, answer_value, answer_data')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      logDatabaseError(
        { userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` },
        answersError,
      )
    }

    const answersEcho = (answers || [])
      .map((row) => {
        const rawValue = row.answer_data ?? row.answer_value

        if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
          return {
            questionId: row.question_id,
            value: rawValue,
          }
        }

        if (rawValue !== null && rawValue !== undefined) {
          return {
            questionId: row.question_id,
            value: JSON.stringify(rawValue),
          }
        }

        return null
      })
      .filter(
        (row): row is { questionId: string; value: string | number | boolean } => row !== null,
      )

    const ageAnswer = answersEcho.find((row) => row.questionId === 'q1-age')
    const cardiovascularAgeYears =
      typeof ageAnswer?.value === 'number' ? ageAnswer.value : null

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
