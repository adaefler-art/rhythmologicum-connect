/**
 * E78.4 — HITL Actions v1: Shared Action Utilities
 * 
 * Common logic for triage case actions:
 * - Authentication and authorization
 * - Action recording
 * - Payload validation
 * 
 * Security:
 * - Requires clinician/admin role
 * - RLS enforces org-scoped access to patients
 * - Actions are append-only (no updates/deletes)
 */

import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import {
	successResponse,
	unauthorizedResponse,
	forbiddenResponse,
	notFoundResponse,
	validationErrorResponse,
	databaseErrorResponse,
	internalErrorResponse,
} from '@/lib/api/responses'
import {
	classifySupabaseError,
	getRequestId,
	isNotFoundPostgrestError,
	logError,
	withRequestId,
} from '@/lib/db/errors'
import type { Json, TablesInsert } from '@/lib/types/supabase'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Valid action types for triage cases
 */
export type TriageActionType =
	| 'acknowledge'
	| 'snooze'
	| 'close'
	| 'reopen'
	| 'manual_flag'
	| 'clear_manual_flag'
	| 'add_note'

/**
 * Result of a triage action
 */
export interface TriageActionResult {
	actionId: string
	caseId: string
	actionType: TriageActionType
	createdAt: string
	createdBy: string
	payload: Record<string, unknown>
}

/**
 * R-E78.4-009: Verify that the case (assessment) exists and is accessible
 */
async function verifyCaseAccess(
	supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
	caseId: string,
	requestId: string,
): Promise<{ success: true; assessment: any } | { success: false; response: NextResponse }> {
	// Fetch the assessment to verify it exists and user has access
	const { data: assessment, error: assessmentError } = await supabase
		.from('assessments')
		.select('id, patient_id, funnel_id, status')
		.eq('id', caseId)
		.single()

	if (assessmentError || !assessment) {
		if (isNotFoundPostgrestError(assessmentError)) {
			return {
				success: false,
				response: withRequestId(
					notFoundResponse('Case', `Case mit ID ${caseId} nicht gefunden.`, requestId),
					requestId,
				),
			}
		}

		const classified = classifySupabaseError(assessmentError)

		if (classified.kind === 'AUTH_OR_RLS') {
			return {
				success: false,
				response: withRequestId(
					forbiddenResponse('Sie haben keine Berechtigung für diesen Fall.', requestId),
					requestId,
				),
			}
		}

		logError({
			requestId,
			operation: 'verify_case_access',
			error: assessmentError,
		})

		return {
			success: false,
			response: withRequestId(
				databaseErrorResponse('Fehler beim Abrufen des Falls.', requestId),
				requestId,
			),
		}
	}

	return { success: true, assessment }
}

/**
 * R-E78.4-010: Record a triage action in the database
 */
async function recordAction(
	supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
	userId: string,
	assessment: any,
	actionType: TriageActionType,
	payload: Record<string, unknown>,
	requestId: string,
): Promise<{ success: true; action: any } | { success: false; response: NextResponse }> {
	const insertPayload: TablesInsert<'triage_case_actions'> = {
		created_by: userId,
		patient_id: assessment.patient_id,
		assessment_id: assessment.id,
		funnel_id: assessment.funnel_id,
		action_type: actionType,
		payload: payload as Json,
	}

	const { data: action, error: insertError } = await supabase
		.from('triage_case_actions')
		.insert(insertPayload)
		.select('id, created_at, created_by, assessment_id, action_type, payload')
		.single()

	if (insertError || !action) {
		const classified = classifySupabaseError(insertError)

		logError({
			requestId,
			operation: 'record_action',
			userId,
			error: insertError,
		})

		if (classified.kind === 'AUTH_OR_RLS') {
			return {
				success: false,
				response: withRequestId(
					forbiddenResponse('Sie haben keine Berechtigung für diese Aktion.', requestId),
					requestId,
				),
			}
		}

		return {
			success: false,
			response: withRequestId(
				databaseErrorResponse('Fehler beim Speichern der Aktion.', requestId),
				requestId,
			),
		}
	}

	return { success: true, action }
}

/**
 * R-E78.4-011: Get the latest action of a specific type for a case
 * Used for idempotency checks (e.g., is case already closed?)
 */
export async function getLatestAction(
	supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
	caseId: string,
	actionType: TriageActionType,
): Promise<any | null> {
	const { data: actions } = await supabase
		.from('triage_case_actions')
		.select('*')
		.eq('assessment_id', caseId)
		.eq('action_type', actionType)
		.order('created_at', { ascending: false })
		.limit(1)

	return actions && actions.length > 0 ? actions[0] : null
}

/**
 * R-E78.4-012: Main handler for executing a triage action
 * 
 * Performs authentication, authorization, validation, and recording.
 * This function implements the core workflow for all action endpoints.
 */
export async function executeTriageAction(
	request: NextRequest,
	caseId: string,
	actionType: TriageActionType,
	payload: Record<string, unknown>,
	options?: {
		validatePayload?: (payload: Record<string, unknown>) => { valid: true } | { valid: false; error: string }
		checkIdempotency?: (
			supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
			assessment: any,
		) => Promise<{ isIdempotent: boolean; message?: string }>
	},
): Promise<NextResponse> {
	const requestId = getRequestId(request)

	try {
		const supabase = await createServerSupabaseClient()

		// R-E78.4-013: Authentication check
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()

		if (authError || !user) {
			logError({
				requestId,
				operation: 'auth_check',
				error: authError || new Error('No user'),
			})
			return withRequestId(
				unauthorizedResponse('Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.', requestId),
				requestId,
			)
		}

		// R-E78.4-014: Authorization check (clinician/admin only)
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

		// R-E78.4-015: Validate payload if validator provided
		if (options?.validatePayload) {
			const validation = options.validatePayload(payload)
			if (!validation.valid) {
				return withRequestId(
					validationErrorResponse(validation.error, { payload }, requestId),
					requestId,
				)
			}
		}

		// R-E78.4-016: Verify case exists and is accessible
		const accessResult = await verifyCaseAccess(supabase, caseId, requestId)
		if (!accessResult.success) {
			return accessResult.response
		}
		const { assessment } = accessResult

		// R-E78.4-017: Check idempotency if checker provided
		if (options?.checkIdempotency) {
			const idempotencyResult = await options.checkIdempotency(supabase, assessment)
			if (idempotencyResult.isIdempotent) {
				// Action is already in the desired state - return success with message
				return withRequestId(
					successResponse(
						{
							message: idempotencyResult.message || 'Aktion bereits durchgeführt.',
							caseId,
							actionType,
							idempotent: true,
						},
						200,
						requestId,
					),
					requestId,
				)
			}
		}

		// R-E78.4-018: Record the action
		const recordResult = await recordAction(supabase, user.id, assessment, actionType, payload, requestId)
		if (!recordResult.success) {
			return recordResult.response
		}
		const { action } = recordResult

		// R-E78.4-019: Return success response
		const result: TriageActionResult = {
			actionId: action.id,
			caseId: action.assessment_id,
			actionType: action.action_type,
			createdAt: action.created_at,
			createdBy: action.created_by,
			payload:
				action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload)
					? (action.payload as Record<string, unknown>)
					: {},
		}

		return withRequestId(
			successResponse(result, 201, requestId),
			requestId,
		)
	} catch (error) {
		logError({
			requestId,
			operation: 'execute_triage_action',
			actionType,
			error,
		})

		return withRequestId(
			internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.', requestId),
			requestId,
		)
	}
}
