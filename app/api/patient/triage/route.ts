/**
 * E6.6.4 — POST /api/patient/triage
 *
 * Patient-facing triage endpoint with full governance:
 * - Auth→eligibility→validate request→run triage engine→return result
 * - 401-first ordering (no DB calls before auth)
 * - Pilot eligibility gate (403 if not eligible)
 * - Request validation (oversize → 413 or 400)
 * - Contract-validated response
 *
 * Acceptance Criteria:
 * AC1: Unauth→401 first
 * AC2: Not eligible→403/404
 * AC3: Request validated; oversize→413 or 400
 * AC4: Result conforms to schema; rationale bounded; redFlags allowlist enforced
 */

import { NextResponse } from 'next/server'
import { requirePilotEligibility } from '@/lib/api/authHelpers'
import {
  successResponse,
  invalidInputResponse,
  payloadTooLargeResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import {
  safeValidateTriageRequest,
  getOversizeErrorStatus,
  validateTriageResult,
  TRIAGE_INPUT_MAX_LENGTH,
} from '@/lib/api/contracts/triage'
import { runTriageEngine } from '@/lib/triage/engine'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitTriageSubmitted, emitTriageRouted } from '@/lib/telemetry/events'
import { TRIAGE_TIER, TRIAGE_NEXT_ACTION } from '@/lib/api/contracts/triage'
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper'

/**
 * POST /api/patient/triage
 *
 * Run triage decision for patient input
 */
export async function POST(req: Request) {
  const requestStartTime = Date.now()
  const correlationId = getCorrelationId(req)

  console.log('[patient/triage] POST request received', { correlationId })

  try {
    // AC1: Auth check FIRST (401-first ordering)
    // AC2: Pilot eligibility check (403 if not eligible)
    const authResult = await requirePilotEligibility()

    if (authResult.error) {
      // Returns 401 for auth issues, 403 for pilot eligibility
      return authResult.error
    }

    // Explicit null check before using non-null assertion
    if (!authResult.user) {
      return internalErrorResponse(
        'Authentication succeeded but user is null',
        correlationId,
      )
    }

    const user = authResult.user

    // Parse request body
    const body = await req.json().catch((parseError) => {
      console.error('[patient/triage] JSON parsing error', {
        error: String(parseError),
        correlationId,
      })
      return null
    })

    if (!body) {
      return invalidInputResponse(
        'Request body must be valid JSON',
        undefined,
        correlationId,
      )
    }

    // AC3: Validate request with TriageRequestV1 schema
    const validatedRequest = safeValidateTriageRequest({
      inputText: body.inputText,
      locale: body.locale,
      patientContext: body.patientContext,
    })

    if (!validatedRequest) {
      // Check if it's an oversize error (AC3: oversize→413 or 400)
      const inputText = (body.inputText || '') as string
      const oversizeStatus = getOversizeErrorStatus(inputText)

      if (oversizeStatus) {
        console.warn('[patient/triage] Input exceeds max length', {
          length: inputText.length,
          status: oversizeStatus,
          correlationId,
        })

        if (oversizeStatus === 413) {
          return payloadTooLargeResponse(
            `Input text is too large. Maximum ${TRIAGE_INPUT_MAX_LENGTH} characters allowed.`,
            { maxLength: TRIAGE_INPUT_MAX_LENGTH, actualLength: inputText.length },
            correlationId,
          )
        } else {
          return invalidInputResponse(
            `Input text exceeds maximum length of ${TRIAGE_INPUT_MAX_LENGTH} characters.`,
            { maxLength: TRIAGE_INPUT_MAX_LENGTH, actualLength: inputText.length },
            correlationId,
          )
        }
      }

      // Other validation error (too short, missing field, etc.)
      console.warn('[patient/triage] Request validation failed', {
        body,
        correlationId,
      })
      return invalidInputResponse(
        'Request validation failed. Input must be 10-800 characters.',
        undefined,
        correlationId,
      )
    }

    console.log('[patient/triage] Processing triage request', {
      userId: user.id,
      inputLength: validatedRequest.inputText.length,
      correlationId,
    })

    // Emit TRIAGE_SUBMITTED event (best-effort telemetry)
    const syntheticAssessmentId = `triage-${Date.now()}-${user.id.slice(0, 8)}`
    await emitTriageSubmitted({
      correlationId,
      assessmentId: syntheticAssessmentId,
      patientId: user.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit TRIAGE_SUBMITTED event', err)
    })

    // Run deterministic rule-based triage engine
    const triageResultV1 = runTriageEngine({
      inputText: validatedRequest.inputText,
      correlationId,
    })

    console.log('[patient/triage] Triage engine completed', {
      tier: triageResultV1.tier,
      nextAction: triageResultV1.nextAction,
      redFlagsCount: triageResultV1.redFlags.length,
      correlationId,
    })

    // AC4: Validate result conforms to schema
    // This ensures rationale is bounded and redFlags are from allowlist
    try {
      validateTriageResult(triageResultV1)
    } catch (validationError) {
      console.error('[patient/triage] Triage result validation failed', {
        error: validationError,
        result: triageResultV1,
        correlationId,
      })
      return internalErrorResponse(
        'Triage result validation failed',
        correlationId,
      )
    }

    // Map v1 tier to legacy tier for telemetry compatibility
    const legacyTier =
      triageResultV1.tier === TRIAGE_TIER.INFO
        ? 'low'
        : triageResultV1.tier === TRIAGE_TIER.ASSESSMENT
          ? 'moderate'
          : 'high'

    // Map v1 nextAction to legacy nextAction for telemetry compatibility
    const legacyNextAction =
      triageResultV1.nextAction === TRIAGE_NEXT_ACTION.SHOW_CONTENT
        ? 'self-help'
        : triageResultV1.nextAction === TRIAGE_NEXT_ACTION.START_FUNNEL_A ||
            triageResultV1.nextAction === TRIAGE_NEXT_ACTION.START_FUNNEL_B
          ? 'funnel'
          : 'escalation'

    // Emit TRIAGE_ROUTED event (best-effort telemetry)
    await emitTriageRouted({
      correlationId,
      assessmentId: syntheticAssessmentId,
      nextAction: legacyNextAction,
      tier: legacyTier,
      patientId: user.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit TRIAGE_ROUTED event', err)
    })

    const totalDuration = Date.now() - requestStartTime
    console.log('[patient/triage] Request completed successfully', {
      duration: `${totalDuration}ms`,
      tier: triageResultV1.tier,
      nextAction: triageResultV1.nextAction,
      correlationId,
    })

    // Return success response with validated triage result
    const response = successResponse(
      triageResultV1,
      200,
      correlationId,
    )

    // Track usage (fire and forget)
    trackUsage('POST /api/patient/triage', response)

    return response
  } catch (err: unknown) {
    const totalDuration = Date.now() - requestStartTime
    const error = err as { message?: string }
    console.error('[patient/triage] Unexpected error', {
      duration: `${totalDuration}ms`,
      error: error?.message ?? String(err),
      correlationId,
    })

    const response = internalErrorResponse(
      'Internal server error',
      correlationId,
    )

    // Track usage (fire and forget)
    trackUsage('POST /api/patient/triage', response)

    return response
  }
}
