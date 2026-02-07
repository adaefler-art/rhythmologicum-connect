import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  databaseErrorResponse,
} from '@/lib/api/responses'
import { getRequestId, logError, withRequestId } from '@/lib/db/errors'
import { fetchBasicTriageCases } from '@/lib/db/triageBasic.server'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

/**
 * GET /api/triage/basic
 *
 * Minimal triage backstop endpoint. No schema readiness gate.
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)

  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logError({ requestId, operation: 'auth_check', error: authError || new Error('No user') })
      return withRequestId(
        unauthorizedResponse('Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.', requestId),
        requestId,
      )
    }

    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      logError({
        requestId,
        operation: 'role_check',
        userId: user.id,
        error: new Error('User does not have clinician/admin role'),
      })
      return withRequestId(
        forbiddenResponse('Sie haben keine Berechtigung für diese Aktion.', requestId),
        requestId,
      )
    }

    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit'))
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
      : DEFAULT_LIMIT

    const cases = await fetchBasicTriageCases(supabase, limit)

    return withRequestId(
      successResponse(
        {
          cases,
          count: cases.length,
          basicMode: true,
        },
        200,
        requestId,
      ),
      requestId,
    )
  } catch (error) {
    logError({ requestId, operation: 'get_triage_basic_cases', error })
    return withRequestId(
      databaseErrorResponse('Fehler beim Abrufen der Triage-Fälle.', requestId),
      requestId,
    )
  }
}
