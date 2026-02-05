/**
 * E78.4 — HITL Actions v1: Add Note to Case
 * 
 * POST /api/clinician/triage/cases/:caseId/note
 * 
 * Adds a clinical note to a triage case.
 * Notes are append-only and never deleted by auto-jobs.
 * 
 * Request Body:
 * {
 *   note: string (required, max 5000 chars)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     actionId: string
 *     caseId: string
 *     actionType: "add_note"
 *     createdAt: string (ISO 8601)
 *     createdBy: string (user ID)
 *     payload: {
 *       note: string
 *     }
 *   }
 * }
 * 
 * Security:
 * - Requires clinician/admin role
 * - RLS enforces org-scoped access
 * 
 * Idempotency:
 * - Notes are never idempotent (each note is a separate entry)
 */

import { NextRequest } from 'next/server'
import { executeTriageAction } from '../../_shared/actions'

const MAX_NOTE_LENGTH = 5000

/**
 * R-E78.4-031: POST /api/clinician/triage/cases/:caseId/note
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

	const { note } = body

	return executeTriageAction(
		request,
		caseId,
		'add_note',
		{
			note,
		},
		{
			// R-E78.4-032: Validate note is present and within length limit
			validatePayload: (payload) => {
				if (!payload.note) {
					return { valid: false, error: 'Feld "note" ist erforderlich.' }
				}

				if (typeof payload.note !== 'string') {
					return { valid: false, error: 'Feld "note" muss ein String sein.' }
				}

				if (payload.note.trim().length === 0) {
					return { valid: false, error: 'Feld "note" darf nicht leer sein.' }
				}

				if (payload.note.length > MAX_NOTE_LENGTH) {
					return {
						valid: false,
						error: `Feld "note" darf maximal ${MAX_NOTE_LENGTH} Zeichen lang sein.`,
					}
				}

				return { valid: true }
			},
			// R-E78.4-033: Notes are never idempotent - no idempotency check
		},
	)
}
