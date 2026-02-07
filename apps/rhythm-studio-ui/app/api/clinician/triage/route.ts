/**
 * E78.3 — Clinician API: /api/clinician/triage (Inbox Read)
 * 
 * Stable API for UI with server-side filter/sort.
 * Auth: clinician/admin only
 * 
 * GET /api/clinician/triage - Read triage inbox with filters
 * 
 * Query Parameters:
 * - activeOnly (default: true) - Filter by is_active field
 * - q (search) - Search patient name/id or funnel slug
 * - status (optional) - Filter by case_state (needs_input | in_progress | ready_for_review | resolved | snoozed)
 * - attention (optional) - Filter by attention_level (critical | warn | info)
 * - assignedTo (optional) - Reserved for future use
 * 
 * Sorting: Default critical → overdue → review_ready → last_activity desc
 * 
 * Security:
 * - RLS enforced - clinicians see only org-scoped patients
 * - Requires clinician or admin role
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import {
	successResponse,
	unauthorizedResponse,
	forbiddenResponse,
	internalErrorResponse,
	databaseErrorResponse,
	validationErrorResponse,
} from '@/lib/api/responses'
import { classifySupabaseError, getRequestId, logError, withRequestId } from '@/lib/db/errors'
import { schemaManager } from '@/lib/db/schemaReadiness.server'
import { ErrorCode } from '@/lib/api/responseTypes'

/**
 * Valid case states from triage_cases_v1 view
 */
const VALID_CASE_STATES = ['needs_input', 'in_progress', 'ready_for_review', 'resolved', 'snoozed'] as const
type CaseState = typeof VALID_CASE_STATES[number]

/**
 * Valid attention levels from triage_cases_v1 view
 */
const VALID_ATTENTION_LEVELS = ['critical', 'warn', 'info', 'none'] as const
type AttentionLevel = typeof VALID_ATTENTION_LEVELS[number]

/**
 * GET /api/clinician/triage - Read triage inbox with filters
 * 
 * R-E78.3-001: Endpoint must be accessible only to authenticated users
 * R-E78.3-002: Endpoint must enforce clinician/admin role requirement
 * R-E78.3-003: activeOnly parameter defaults to true
 * R-E78.3-004: Query parameter q searches patient name/id and funnel slug
 * R-E78.3-005: status parameter filters by valid case_state values
 * R-E78.3-006: attention parameter filters by valid attention_level values
 * R-E78.3-007: Default sorting is by priority_score DESC, assigned_at ASC
 * R-E78.3-008: RLS policies enforce org-scoping (clinician sees only assigned/org patients)
 * R-E78.3-009: Response follows standard API contract (success/data/error)
 * R-E78.3-010: Invalid query parameters return 400 validation error
 */
export async function GET(request: NextRequest) {
	const requestId = getRequestId(request)

	try {
		const supabase = await createServerSupabaseClient()

		// R-E78.3-001: Authentication check
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

		// R-E78.3-002: Authorization check (clinician/admin only)
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

		// Parse query parameters
		const { searchParams } = new URL(request.url)

		// R-E78.3-003: activeOnly defaults to true
		const activeOnlyParam = searchParams.get('activeOnly')
		const activeOnly = activeOnlyParam === null ? true : activeOnlyParam !== 'false'

		// R-E78.3-004: q parameter for search
		const searchQuery = searchParams.get('q')

		// R-E78.3-005: status parameter validation
		const statusParam = searchParams.get('status')
		let statusFilter: CaseState | null = null
		if (statusParam) {
			if (!VALID_CASE_STATES.includes(statusParam as CaseState)) {
				return withRequestId(
					validationErrorResponse(
						`Invalid status parameter. Must be one of: ${VALID_CASE_STATES.join(', ')}`,
						{ status: statusParam, valid_values: VALID_CASE_STATES },
						requestId,
					),
					requestId,
				)
			}
			statusFilter = statusParam as CaseState
		}

		// R-E78.3-006: attention parameter validation
		const attentionParam = searchParams.get('attention')
		let attentionFilter: AttentionLevel | null = null
		if (attentionParam) {
			if (!VALID_ATTENTION_LEVELS.includes(attentionParam as AttentionLevel)) {
				return withRequestId(
					validationErrorResponse(
						`Invalid attention parameter. Must be one of: ${VALID_ATTENTION_LEVELS.join(', ')}`,
						{ attention: attentionParam, valid_values: VALID_ATTENTION_LEVELS },
						requestId,
					),
					requestId,
				)
			}
			attentionFilter = attentionParam as AttentionLevel
		}

		// assignedTo parameter (reserved for future use)
		const assignedToParam = searchParams.get('assignedTo')
		if (assignedToParam) {
			// For v1, we don't implement assignedTo filtering
			// Just log it and ignore
			console.log('[triage-api] assignedTo parameter not yet implemented:', assignedToParam)
		}

		// Build query from triage_cases_v1 view
		const schemaStatus = schemaManager.getStatus()
		if (!schemaStatus.ready && schemaStatus.stage === 'building') {
			return withRequestId(
				NextResponse.json(
					{
						success: false,
						error: {
							code: ErrorCode.SCHEMA_NOT_READY,
							message: 'Server-Schema wird aufgebaut. Bitte erneut versuchen.',
							details: {
								stage: schemaStatus.stage,
								retryAfterMs: schemaStatus.retryAfterMs ?? null,
								requestId,
							},
						},
						requestId,
					},
					{ status: 503 },
				),
				requestId,
			)
		}

		const schemaReadiness = await schemaManager.ensureReady({ reason: 'triage', requestId })
		if (!schemaReadiness.ready) {
			const errorCode =
				schemaReadiness.stage === 'error' ? ErrorCode.SCHEMA_ERROR : ErrorCode.SCHEMA_NOT_READY
			return withRequestId(
				NextResponse.json(
					{
						success: false,
						error: {
							code: errorCode,
							message:
								schemaReadiness.lastErrorMessage ||
								'Server-Schema ist nicht bereit. Bitte Administrator kontaktieren.',
							details: {
								stage: schemaReadiness.stage,
								requestId,
								retryAfterMs: schemaReadiness.retryAfterMs ?? null,
								schemaVersion: schemaReadiness.schemaVersion,
								dbMigrationStatus: schemaReadiness.dbMigrationStatus,
								lastErrorCode: schemaReadiness.lastErrorCode,
								lastErrorDetails: schemaReadiness.lastErrorDetails,
							},
						},
						requestId,
					},
					{ status: 503 },
				),
				requestId,
			)
		}

		let query = supabase
			.from('triage_cases_v1')
			.select('*')

		// Apply activeOnly filter
		// R-E78.5-007: Closed cases filtered out when activeOnly=true
		// R-E78.5-008: Snoozed cases (snoozed_until > now) filtered out when activeOnly=true
		if (activeOnly) {
			query = query.eq('is_active', true)
			// Also filter out currently snoozed cases
			// Cases where snoozed_until is NULL OR snoozed_until <= now are visible
			query = query.or('snoozed_until.is.null,snoozed_until.lte.' + new Date().toISOString())
		}

		// Apply status filter
		if (statusFilter) {
			query = query.eq('case_state', statusFilter)
		}

		// Apply attention filter
		if (attentionFilter) {
			query = query.eq('attention_level', attentionFilter)
		}

		// Apply search query (patient name or funnel slug)
		// R-E78.3-004: Search across patient_display and funnel_slug
		if (searchQuery && searchQuery.trim()) {
			const searchTerm = searchQuery.trim()
			// Use OR filter for patient_display or funnel_slug
			// Note: Supabase uses ilike for case-insensitive pattern matching
			query = query.or(`patient_display.ilike.%${searchTerm}%,funnel_slug.ilike.%${searchTerm}%`)
		}

		// R-E78.3-007: Default sorting by priority_score DESC, assigned_at ASC
		// This implements: critical → overdue → review_ready → last_activity desc
		// (priority_score already encodes critical/overdue/review_ready weights)
		query = query
			.order('priority_score', { ascending: false })
			.order('assigned_at', { ascending: true })

		// Execute query
		// R-E78.3-008: RLS policies automatically enforce org-scoping
		const { data: cases, error: queryError } = await query

		if (queryError) {
			const classified = classifySupabaseError(queryError)
			
			logError({
				requestId,
				operation: 'fetch_triage_cases',
				userId: user.id,
				error: queryError,
			})

			if (classified.kind === 'SCHEMA_NOT_READY') {
				const readiness = await schemaManager.ensureReady({ reason: 'triage_query', requestId })
				const errorCode = readiness.lastErrorCode || ErrorCode.SCHEMA_BUILD_FAILED
				return withRequestId(
					NextResponse.json(
						{
							success: false,
							error: {
								code: errorCode,
								message:
									readiness.lastErrorMessage ||
									'Server-Schema ist nicht bereit. Bitte Administrator kontaktieren.',
								details: {
									stage: readiness.stage,
									requestId,
									schemaVersion: readiness.schemaVersion,
									dbMigrationStatus: readiness.dbMigrationStatus,
									lastErrorDetails: readiness.lastErrorDetails,
								},
							},
							requestId,
						},
						{ status: 503 },
					),
					requestId,
				)
			}

			if (classified.kind === 'AUTH_OR_RLS') {
				return withRequestId(
					forbiddenResponse('Sie haben keine Berechtigung für diese Aktion.', requestId),
					requestId,
				)
			}

			return withRequestId(
				databaseErrorResponse('Fehler beim Abrufen der Triage-Fälle.', requestId),
				requestId,
			)
		}

		// R-E78.3-009: Return standard API response
		return withRequestId(
			successResponse(
				{
					cases: cases || [],
					filters: {
						activeOnly,
						status: statusFilter,
						attention: attentionFilter,
						search: searchQuery || null,
					},
					count: cases?.length || 0,
				},
				200,
				requestId,
			),
			requestId,
		)
	} catch (error) {
		logError({
			requestId,
			operation: 'get_triage_cases',
			error,
		})

		return withRequestId(
			internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.', requestId),
			requestId,
		)
	}
}
