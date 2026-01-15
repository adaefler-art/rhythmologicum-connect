/**
 * E6.4.5: Workup Check Endpoint
 *
 * POST /api/funnels/[slug]/assessments/[assessmentId]/workup
 *
 * Performs a data sufficiency check on a completed assessment.
 * Deterministic, rule-based - NO LLM, NO DIAGNOSIS.
 *
 * Updates the assessment with:
 * - workup_status: 'needs_more_data' | 'ready_for_review'
 * - missing_data_fields: array of missing field keys
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     assessmentId: string,
 *     workupStatus: 'needs_more_data' | 'ready_for_review',
 *     missingDataFields: string[],
 *     followUpQuestions: FollowUpQuestion[],
 *     evidencePackHash: string,
 *     rulesetVersion: string
 *   }
 * }
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
  versionedSuccessResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logForbidden, logDatabaseError } from '@/lib/logging/logger'
import { performWorkupCheck, getRulesetVersion } from '@/lib/workup'
import { createEvidencePack } from '@/lib/workup/helpers'
import type { WorkupCheckResponse } from '@/lib/types/workup'

const WORKUP_SCHEMA_VERSION = 'v1' as const

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  try {
    const { slug, assessmentId } = await context.params

    if (!slug || !assessmentId) {
      return notFoundResponse('Assessment', 'Assessment nicht gefunden.')
    }

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/workup`,
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/workup`,
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil')
    }

    // Load assessment and verify ownership
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, status')
      .eq('id', assessmentId)
      .eq('funnel', slug)
      .single()

    if (assessmentError || !assessment) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/workup`,
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/workup`,
        },
        'Assessment does not belong to user',
      )
      return forbiddenResponse(
        'Sie haben keine Berechtigung, dieses Assessment zu verarbeiten.',
      )
    }

    // Verify assessment is completed
    if (assessment.status !== 'completed') {
      return internalErrorResponse(
        'Workup kann nur für abgeschlossene Assessments durchgeführt werden.',
      )
    }

    // Create evidence pack from assessment data
    const evidencePack = await createEvidencePack(assessmentId, slug)

    // Perform workup check (deterministic, rule-based)
    const workupResult = performWorkupCheck(evidencePack)

    // Get ruleset version
    const rulesetVersion = getRulesetVersion(slug) ?? 'default'

    // Store workup results in database
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        workup_status: workupResult.isSufficient ? 'ready_for_review' : 'needs_more_data',
        missing_data_fields: workupResult.missingDataFields,
      })
      .eq('id', assessmentId)

    if (updateError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/workup`,
        },
        updateError,
      )
      return internalErrorResponse('Fehler beim Speichern der Workup-Ergebnisse.')
    }

    // Log workup completion
    console.log('[workup] Workup completed', {
      assessmentId,
      funnel: slug,
      workupStatus: workupResult.isSufficient ? 'ready_for_review' : 'needs_more_data',
      missingFieldsCount: workupResult.missingDataFields.length,
      rulesetVersion,
    })

    // Prepare response (NO DIAGNOSIS - only data completeness info)
    const responseData: WorkupCheckResponse = {
      success: true,
      data: {
        assessmentId,
        workupStatus: workupResult.isSufficient ? 'ready_for_review' : 'needs_more_data',
        missingDataFields: workupResult.missingDataFields,
        followUpQuestions: workupResult.followUpQuestions,
        evidencePackHash: workupResult.evidencePackHash,
        rulesetVersion,
      },
    }

    return versionedSuccessResponse(responseData.data, WORKUP_SCHEMA_VERSION)
  } catch (error) {
    console.error('Error in POST /api/funnels/[slug]/assessments/[assessmentId]/workup:', error)
    return internalErrorResponse('Internal server error')
  }
}
