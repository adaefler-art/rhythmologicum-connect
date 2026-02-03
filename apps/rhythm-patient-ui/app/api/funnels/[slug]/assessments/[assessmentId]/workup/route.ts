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
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitWorkupStarted, emitWorkupNeedsMoreData, emitWorkupReadyForReview } from '@/lib/telemetry/events'

const WORKUP_SCHEMA_VERSION = 'v1' as const

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  try {
    const { slug, assessmentId } = await context.params
    const correlationId = getCorrelationId(request)

    if (!slug || !assessmentId) {
      return notFoundResponse('Assessment', 'Assessment nicht gefunden.', correlationId)
    }

    const supabase = (await createServerSupabaseClient()) as any

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/workup`,
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
          endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/workup`,
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

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
      return notFoundResponse('Assessment', undefined, correlationId)
    }

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
        correlationId,
      )
    }

    if (assessment.status !== 'completed') {
      return internalErrorResponse(
        'Workup kann nur für abgeschlossene Assessments durchgeführt werden.',
        correlationId,
      )
    }

    await emitWorkupStarted({
      correlationId,
      assessmentId,
      patientId: patientProfile.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit WORKUP_STARTED event', err)
    })

    const evidencePack = await createEvidencePack(assessmentId, slug)
    const workupResult = performWorkupCheck(evidencePack)
    const rulesetVersion = getRulesetVersion(slug) ?? 'default'

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
      return internalErrorResponse('Fehler beim Speichern der Workup-Ergebnisse.', correlationId)
    }

    if (workupResult.isSufficient) {
      await emitWorkupReadyForReview({
        correlationId,
        assessmentId,
        patientId: patientProfile.id,
      }).catch((err) => {
        console.warn('[TELEMETRY] Failed to emit WORKUP_READY_FOR_REVIEW event', err)
      })
    } else {
      await emitWorkupNeedsMoreData({
        correlationId,
        assessmentId,
        missingDataCount: workupResult.missingDataFields.length,
        patientId: patientProfile.id,
      }).catch((err) => {
        console.warn('[TELEMETRY] Failed to emit WORKUP_NEEDS_MORE_DATA event', err)
      })
    }

    console.log('[workup] Workup completed', {
      assessmentId,
      funnel: slug,
      workupStatus: workupResult.isSufficient ? 'ready_for_review' : 'needs_more_data',
      missingFieldsCount: workupResult.missingDataFields.length,
      rulesetVersion,
    })

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

    return versionedSuccessResponse(responseData.data, WORKUP_SCHEMA_VERSION, 200, correlationId)
  } catch (error) {
    console.error('Error in POST /api/funnels/[slug]/assessments/[assessmentId]/workup:', error)
    return internalErrorResponse('Internal server error', getCorrelationId(request))
  }
}