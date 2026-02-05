/**
 * E78.4 — HITL Actions v1: Acknowledge Case
 * 
 * POST /api/clinician/triage/cases/:caseId/ack
 * 
 * Acknowledges a triage case to indicate that a clinician has reviewed it.
 * This action does not change the case state but records that HITL has seen it.
 * 
 * Request Body: {} (empty)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     actionId: string
 *     caseId: string
 *     actionType: "acknowledge"
 *     createdAt: string (ISO 8601)
 *     createdBy: string (user ID)
 *     payload: {}
 *   }
 * }
 * 
 * Security:
 * - Requires clinician/admin role
 * - RLS enforces org-scoped access
 * 
 * Idempotency:
 * - Acknowledging an already-acknowledged case is a no-op (returns 200)
 */

import { NextRequest } from 'next/server'
import { executeTriageAction, getLatestAction } from '../../_shared/actions'

/**
 * R-E78.4-020: POST /api/clinician/triage/cases/:caseId/ack
 */
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ caseId: string }> },
) {
	const { caseId } = await context.params

	return executeTriageAction(
		request,
		caseId,
		'acknowledge',
		{}, // Empty payload for acknowledge
		{
			// R-E78.4-021: Idempotency check - is case already acknowledged?
			checkIdempotency: async (supabase, _assessment) => {
				const latestAck = await getLatestAction(supabase, caseId, 'acknowledge')
				
				if (latestAck) {
					// Case already acknowledged - idempotent
					return {
						isIdempotent: true,
						message: 'Fall wurde bereits bestätigt.',
					}
				}
				
				return { isIdempotent: false }
			},
		},
	)
}
