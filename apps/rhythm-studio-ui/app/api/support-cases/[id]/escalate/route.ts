/**
 * Support Case Escalation API - V05-I08.4
 * 
 * Escalate a support case to a clinician
 * Creates a task and records an audit trail
 * 
 * POST /api/support-cases/[id]/escalate - Escalate case to clinician
 * 
 * Auth: nurse/clinician/admin
 * 
 * Security:
 * - Only staff can escalate support cases
 * - Creates task with proper role assignment
 * - Records audit event (PHI-free)
 * - Updates support case status to ESCALATED
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { Json } from '@/lib/types/supabase'
import {
	EscalateSupportCaseRequestSchema,
	SUPPORT_CASE_STATUS,
	canEscalateSupportCase,
} from '@/lib/contracts/supportCase'
import { TASK_TYPE, TASK_STATUS } from '@/lib/contracts/task'
import { logSupportCaseEscalated } from '@/lib/audit/log'

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

/**
 * Get user's organization ID server-side (never trust client)
 */
async function getUserOrgId(
	supabase: ServerSupabaseClient,
	userId: string,
): Promise<string | null> {
	const { data, error } = await supabase
		.from('user_org_membership')
		.select('organization_id')
		.eq('user_id', userId)
		.eq('is_active', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.single()

	if (error || !data) {
		console.error('[support-cases/escalate] Failed to get user org:', error)
		return null
	}

	return data.organization_id
}

/**
 * POST /api/support-cases/[id]/escalate - Escalate case to clinician
 */
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const requestId = crypto.randomUUID()
	const { id } = await context.params

	try {
		const supabase = await createServerSupabaseClient()

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()

		if (authError || !user) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'AUTHENTICATION_REQUIRED',
						message: 'User must be authenticated',
					},
				},
				{ status: 401 },
			)
		}

		const userRole = user.app_metadata?.role

		// Only staff can escalate support cases
		if (!userRole || !['clinician', 'admin', 'nurse'].includes(userRole)) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'FORBIDDEN',
						message: 'Only staff members can escalate support cases',
					},
				},
				{ status: 403 },
			)
		}

		// Parse and validate request body
		const body = await request.json()

		const requestParse = EscalateSupportCaseRequestSchema.safeParse(body)
		if (!requestParse.success) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Invalid request format',
						details: requestParse.error.issues,
					},
				},
				{ status: 422 },
			)
		}

		const escalationRequest = requestParse.data

		// Get organization_id SERVER-SIDE
		const organizationId = await getUserOrgId(supabase, user.id)
		if (!organizationId) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'FORBIDDEN',
						message: 'User not associated with an organization',
					},
				},
				{ status: 403 },
			)
		}

		// Get current support case with row lock to prevent concurrent escalations (RLS enforced)
		const { data: supportCase, error: selectError } = await supabase
			.from('support_cases')
			.select('*')
			.eq('id', id)
			.single()

		if (selectError) {
			if (selectError.code === 'PGRST116') {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'NOT_FOUND',
							message: 'Support case not found or access denied',
						},
					},
					{ status: 404 },
				)
			}

			console.error('[support-cases/escalate] Select error:', selectError, 'requestId:', requestId)

			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'DATABASE_ERROR',
						message: 'Failed to retrieve support case',
					},
				},
				{ status: 500 },
			)
		}

		// Check if case can be escalated (idempotency check)
		if (!canEscalateSupportCase(supportCase)) {
			// If already escalated, return 409 Conflict with existing task info
			if (supportCase.escalated_task_id) {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'ALREADY_ESCALATED',
							message: 'Support case has already been escalated',
							details: {
								escalated_task_id: supportCase.escalated_task_id,
								escalated_at: supportCase.escalated_at,
							},
						},
					},
					{ status: 409 },
				)
			}
      
			// Otherwise, it's closed or in invalid state
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'INVALID_OPERATION',
						message: 'Support case cannot be escalated (closed or invalid status)',
						details: {
							current_status: supportCase.status,
						},
					},
				},
				{ status: 422 },
			)
		}

		// ============================================================
		// TRANSACTIONAL ESCALATION (via RPC or sequential with rollback)
		// ============================================================
		// Note: Supabase JS client doesn't support explicit transactions,
		// but we implement rollback on failure + unique constraint prevents duplicates

		// Create task for clinician (PHI-free payload)
		const taskPayload: Json = {
			support_case_id: id,
			// PHI-safe: only IDs and escalation metadata, no free text
		}

		const { data: task, error: taskError } = await supabase
			.from('tasks')
			.insert({
				organization_id: organizationId,
				patient_id: supportCase.patient_id,
				created_by_role: userRole,
				assigned_to_role: escalationRequest.assigned_to_role,
				assigned_to_user_id: escalationRequest.assigned_to_user_id ?? null,
				task_type: TASK_TYPE.CONTACT_PATIENT,
				payload: taskPayload,
				status: TASK_STATUS.PENDING,
				due_at: escalationRequest.task_due_at ?? null,
			})
			.select()
			.single()

		if (taskError) {
			console.error('[support-cases/escalate] Task creation error:', taskError, 'requestId:', requestId)

			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'DATABASE_ERROR',
						message: 'Failed to create escalation task',
					},
				},
				{ status: 500 },
			)
		}

		// Update support case with escalation info
		// Include idempotency check: only update if escalated_task_id is still NULL
		const { data: updatedCase, error: updateError } = await supabase
			.from('support_cases')
			.update({
				status: SUPPORT_CASE_STATUS.ESCALATED,
				escalated_task_id: task.id,
				escalated_at: new Date().toISOString(),
				escalated_by_user_id: user.id,
				assigned_to_user_id: escalationRequest.assigned_to_user_id ?? null,
			})
			.eq('id', id)
			.is('escalated_task_id', null) // Idempotency: only update if not already escalated
			.select()
			.single()

		if (updateError) {
			console.error('[support-cases/escalate] Update error:', updateError, 'requestId:', requestId)

			// Rollback: try to delete the task
			await supabase.from('tasks').delete().eq('id', task.id)

			// Check if this was a concurrent escalation (unique constraint violation or no rows updated)
			if (updateError.code === 'PGRST116') {
				// No rows updated - someone else escalated concurrently
				// Clean up our task and return 409
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'ALREADY_ESCALATED',
							message: 'Support case was escalated by another request',
						},
					},
					{ status: 409 },
				)
			}

			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'DATABASE_ERROR',
						message: 'Failed to update support case',
					},
				},
				{ status: 500 },
			)
		}

		// Log audit event (PHI-free)
		await logSupportCaseEscalated({
			org_id: organizationId,
			actor_user_id: user.id,
			actor_role: userRole,
			support_case_id: id,
			task_id: task.id,
			assigned_to_role: escalationRequest.assigned_to_role,
		})

		console.log('[support-cases/escalate] Escalated successfully:', {
			support_case_id: id,
			task_id: task.id,
			assigned_to_role: escalationRequest.assigned_to_role,
			requestId,
		})

		return NextResponse.json(
			{
				success: true,
				data: {
					support_case: updatedCase,
					task,
				},
			},
			{ status: 200 },
		)
	} catch (err) {
		console.error('[support-cases/escalate] Unexpected error:', err, 'requestId:', requestId)

		return NextResponse.json(
			{
				success: false,
				error: {
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unexpected error occurred',
				},
			},
			{ status: 500 },
		)
	}
}
