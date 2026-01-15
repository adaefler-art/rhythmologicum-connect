import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { FUNNEL_SLUG_ALIASES, getCanonicalFunnelSlug } from '@/lib/contracts/registry'
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
  versionedSuccessResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logForbidden, logDatabaseError } from '@/lib/logging/logger'
import {
  PATIENT_ASSESSMENT_SCHEMA_VERSION,
  type GetResultResponseData,
} from '@/lib/api/contracts/patient'

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

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, completed_at, status, workup_status, missing_data_fields')
      .eq('id', assessmentId)
      .in('funnel', getFunnelSlugCandidates(slug))
      .single()

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

    const responseData: GetResultResponseData = {
      id: assessment.id,
      funnel: assessment.funnel,
      completedAt: assessment.completed_at,
      status: assessment.status,
      funnelTitle: funnelRow?.title ?? null,
      workupStatus: assessment.workup_status ?? null,
      missingDataFields: Array.isArray(assessment.missing_data_fields)
        ? assessment.missing_data_fields
        : [],
    }

    return versionedSuccessResponse(responseData, PATIENT_ASSESSMENT_SCHEMA_VERSION)
  } catch (error) {
    console.error('Error in GET /api/funnels/[slug]/assessments/[assessmentId]/result:', error)
    return internalErrorResponse('Internal server error')
  }
}
