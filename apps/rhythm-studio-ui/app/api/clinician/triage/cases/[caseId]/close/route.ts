/**
 * E78.4 — HITL Actions v1: Close Case
 * 
 * POST /api/clinician/triage/cases/:caseId/close
 * 
 * Closes a triage case, marking it as resolved by HITL intervention.
 * This will affect the triage_cases_v1 view (via E78.5) to mark the case as resolved.
 * 
 * Request Body:
 * {
 *   reason?: string (optional note explaining why case is closed)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     actionId: string
 *     caseId: string
 *     actionType: "close"
 *     createdAt: string (ISO 8601)
 *     createdBy: string (user ID)
 *     payload: {
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
 * - Closing an already-closed case is a no-op (returns 200)
 */

import { NextRequest } from 'next/server'
import { executeTriageAction, getLatestAction } from '../../_shared/actions'

/**
 * R-E78.4-024: POST /api/clinician/triage/cases/:caseId/close
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

	const { reason } = body

	return executeTriageAction(
		request,
		caseId,
		'close',
		{
			...(reason && { reason }),
		},
		{
			// R-E78.4-025: Idempotency check - is case already closed?
			checkIdempotency: async (supabase, _assessment) => {
				// Check for most recent close or reopen action
				const { data: actions } = await supabase
					.from('triage_case_actions')
					.select('*')
					.eq('assessment_id', caseId)
					.in('action_type', ['close', 'reopen'])
					.order('created_at', { ascending: false })
					.limit(1)

				if (actions && actions.length > 0 && actions[0].action_type === 'close') {
					// Most recent action was close - idempotent
					return {
						isIdempotent: true,
						message: 'Fall ist bereits geschlossen.',
					}
				}

				return { isIdempotent: false }
			},
		},
	)
}
