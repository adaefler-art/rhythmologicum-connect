/**
 * E78.4 — HITL Actions v1: Flag/Unflag Case
 * 
 * POST /api/clinician/triage/cases/:caseId/flag
 * 
 * Adds or clears a manual flag on a triage case.
 * Manual flags are not overwritten by auto-jobs and persist until explicitly cleared.
 * 
 * Request Body:
 * {
 *   action: "set" | "clear" (required)
 *   severity?: "critical" | "warning" | "info" (required if action is "set")
 *   reason?: string (optional note)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     actionId: string
 *     caseId: string
 *     actionType: "manual_flag" | "clear_manual_flag"
 *     createdAt: string (ISO 8601)
 *     createdBy: string (user ID)
 *     payload: {
 *       severity?: string (for manual_flag)
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
 * - Setting an already-set flag is a no-op (returns 200)
 * - Clearing an already-cleared flag is a no-op (returns 200)
 */

import { NextRequest } from 'next/server'
import { executeTriageAction, getLatestAction } from '../../_shared/actions'

/**
 * R-E78.4-028: POST /api/clinician/triage/cases/:caseId/flag
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

	const { action, severity, reason } = body

	// Determine action type based on the action parameter
	const actionType = action === 'clear' ? 'clear_manual_flag' : 'manual_flag'

	return executeTriageAction(
		request,
		caseId,
		actionType,
		{
			...(severity && { severity }),
			...(reason && { reason }),
		},
		{
			// R-E78.4-029: Validate action and severity
			validatePayload: (payload) => {
				if (!action || (action !== 'set' && action !== 'clear')) {
					return { valid: false, error: 'Feld "action" muss "set" oder "clear" sein.' }
				}

				if (action === 'set' && !severity) {
					return { valid: false, error: 'Feld "severity" ist erforderlich wenn action="set".' }
				}

				if (action === 'set' && severity && !['critical', 'warning', 'info'].includes(severity)) {
					return {
						valid: false,
						error: 'Feld "severity" muss "critical", "warning" oder "info" sein.',
					}
				}

				return { valid: true }
			},
			// R-E78.4-030: Idempotency check
			checkIdempotency: async (supabase, _assessment) => {
				// Check for most recent flag or clear action
				const { data: actions } = (await supabase
					.from('triage_case_actions' as any)
					.select('*')
					.eq('assessment_id', caseId)
					.in('action_type', ['manual_flag', 'clear_manual_flag'])
					.order('created_at', { ascending: false })
					.limit(1)) as { data: any }

				if (actions && actions.length > 0) {
					const latestAction = actions[0]

					if (action === 'set' && latestAction.action_type === 'manual_flag') {
						// Already flagged - idempotent
						return {
							isIdempotent: true,
							message: 'Fall ist bereits markiert.',
						}
					}

					if (action === 'clear' && latestAction.action_type === 'clear_manual_flag') {
						// Already cleared - idempotent
						return {
							isIdempotent: true,
							message: 'Markierung ist bereits entfernt.',
						}
					}
				}

				// If no flag actions exist and we're clearing, that's also idempotent
				if (action === 'clear' && (!actions || actions.length === 0)) {
					return {
						isIdempotent: true,
						message: 'Fall hat keine Markierung.',
					}
				}

				return { isIdempotent: false }
			},
		},
	)
}
