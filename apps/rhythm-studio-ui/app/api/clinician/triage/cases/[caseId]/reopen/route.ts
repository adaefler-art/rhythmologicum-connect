/**
 * E78.4 — HITL Actions v1: Reopen Case
 * 
 * POST /api/clinician/triage/cases/:caseId/reopen
 * 
 * Reopens a previously closed triage case.
 * This will affect the triage_cases_v1 view (via E78.5) to mark the case as active again.
 * 
 * Request Body:
 * {
 *   reason?: string (optional note explaining why case is reopened)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     actionId: string
 *     caseId: string
 *     actionType: "reopen"
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
 * - Reopening an already-open case is a no-op (returns 200)
 */

import { NextRequest } from 'next/server'
import { executeTriageAction } from '../../_shared/actions'

/**
 * R-E78.4-026: POST /api/clinician/triage/cases/:caseId/reopen
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
		'reopen',
		{
			...(reason && { reason }),
		},
		{
			// R-E78.4-027: Idempotency check - is case already open?
			checkIdempotency: async (supabase, _assessment) => {
				// Check for most recent close or reopen action
				const { data: actions } = await supabase
					.from('triage_case_actions')
					.select('*')
					.eq('assessment_id', caseId)
					.in('action_type', ['close', 'reopen'])
					.order('created_at', { ascending: false })
					.limit(1)

				if (actions && actions.length > 0 && actions[0].action_type === 'reopen') {
					// Most recent action was reopen - idempotent
					return {
						isIdempotent: true,
						message: 'Fall ist bereits geöffnet.',
					}
				}

				// Also check if no close/reopen actions exist (case was never closed)
				if (!actions || actions.length === 0) {
					return {
						isIdempotent: true,
						message: 'Fall war nie geschlossen.',
					}
				}

				return { isIdempotent: false }
			},
		},
	)
}
