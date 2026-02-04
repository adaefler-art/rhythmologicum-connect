import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { loadAssessmentRun } from '@/lib/api/assessmentPersistence'
import {
  versionedSuccessResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logForbidden, logDatabaseError } from '@/lib/logging/logger'
import { PATIENT_ASSESSMENT_SCHEMA_VERSION } from '@/lib/api/contracts/patient'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { isSessionExpired } from '@/lib/api/authHelpers'

/**
 * I71.4: Get Assessment State (for resume functionality)
 *
 * GET /api/assessments/[id]/state
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: assessmentId } = await context.params
  const correlationId = getCorrelationId(request)

  try {
    if (!assessmentId) {
      return missingFieldsResponse('Assessment-ID fehlt.', undefined, correlationId)
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      if (isSessionExpired(authError)) {
        return unauthorizedResponse('Session abgelaufen.', correlationId)
      }
      logUnauthorized({
        endpoint: `/api/assessments/${assessmentId}/state`,
        assessmentId,
        requestId: correlationId,
      })
      return unauthorizedResponse('Authentifizierung fehlgeschlagen.', correlationId)
    }

    if (!user) {
      logUnauthorized({
        endpoint: `/api/assessments/${assessmentId}/state`,
        assessmentId,
        requestId: correlationId,
      })
      return unauthorizedResponse('Authentifizierung fehlgeschlagen.', correlationId)
    }

    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      if (profileError.code !== 'PGRST116') {
        logDatabaseError(
          {
            userId: user.id,
            endpoint: `/api/assessments/${assessmentId}/state`,
            requestId: correlationId,
          },
          profileError,
        )
      }
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    if (!patientProfile) {
      return notFoundResponse('Benutzerprofil', undefined, correlationId)
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id')
      .eq('id', assessmentId)
      .single()

    if (assessmentError) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId,
          endpoint: `/api/assessments/${assessmentId}/state`,
          requestId: correlationId,
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
          endpoint: `/api/assessments/${assessmentId}/state`,
          requestId: correlationId,
        },
        'Assessment does not belong to user',
      )
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment zu sehen.', correlationId)
    }

    const assessmentRun = await loadAssessmentRun(assessmentId)

    return versionedSuccessResponse(
      assessmentRun,
      PATIENT_ASSESSMENT_SCHEMA_VERSION,
      200,
      correlationId,
    )
  } catch (error) {
    console.error('[assessments/state] Error loading assessment state:', {
      requestId: correlationId,
      assessmentId,
      error: error instanceof Error ? error.message : String(error),
    })

    logDatabaseError(
      {
        endpoint: 'GET /api/assessments/[id]/state',
        requestId: correlationId,
      },
      error,
    )

    return internalErrorResponse('Fehler beim Laden des Assessment-Status.', correlationId)
  }
}