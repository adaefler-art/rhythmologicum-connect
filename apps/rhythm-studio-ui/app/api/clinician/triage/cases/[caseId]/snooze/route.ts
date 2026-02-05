/**
 * E78.4 — HITL Actions v1: Snooze Case
 * 
 * POST /api/clinician/triage/cases/:caseId/snooze
 * 
 * Snoozes a triage case until a specific date/time.
 * This will affect the triage_cases_v1 view (via E78.5) to hide the case from inbox.
 * 
 * Request Body:
 * {
 *   snoozedUntil: string (ISO 8601 datetime, required)
 *   reason?: string (optional note)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     actionId: string
 *     caseId: string
 *     actionType: "snooze"
 *     createdAt: string (ISO 8601)
 *     createdBy: string (user ID)
 *     payload: {
 *       snoozedUntil: string
 *       reason?: string
 *     }
 *   }
 * }
 * 
 * Security:
 * - Requires clinician/admin role
 * - RLS enforces org-scoped access
 * 
 * Idempotency:
 * - Re-snoozing updates the snooze time (not truly idempotent, but allowed)
 */

import { NextRequest } from 'next/server'
import { executeTriageAction } from '../../_shared/actions'

/**
 * R-E78.4-022: POST /api/clinician/triage/cases/:caseId/snooze
 */
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ caseId: string }> },
) {
	const { caseId } = await context.params

	// Parse request body
	let body: any
	try {
		body = await request.json()
	} catch {
		body = {}
	}

	const { snoozedUntil, reason } = body

	return executeTriageAction(
		request,
		caseId,
		'snooze',
		{
			snoozedUntil,
			...(reason && { reason }),
		},
		{
			// R-E78.4-023: Validate snoozedUntil is present and valid ISO 8601
			validatePayload: (payload) => {
				if (!payload.snoozedUntil) {
					return { valid: false, error: 'Feld "snoozedUntil" ist erforderlich.' }
				}

				// Check if it's a valid ISO 8601 datetime
				const date = new Date(payload.snoozedUntil as string)
				if (isNaN(date.getTime())) {
					return { valid: false, error: 'Feld "snoozedUntil" muss ein gültiges ISO 8601 Datum sein.' }
				}

				// Check if it's in the future
				if (date <= new Date()) {
					return { valid: false, error: 'Feld "snoozedUntil" muss in der Zukunft liegen.' }
				}

				return { valid: true }
			},
		},
	)
}
