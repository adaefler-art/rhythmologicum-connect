/**
 * Support Case Detail API - V05-I08.4
 * 
 * Individual support case operations including update and escalation
 * Auth: patient/nurse/clinician/admin
 * 
 * GET /api/support-cases/[id] - Get a specific support case
 * PATCH /api/support-cases/[id] - Update a support case
 * POST /api/support-cases/[id]/escalate - Escalate to clinician (creates task + audit)
 * DELETE /api/support-cases/[id] - Delete a support case (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { Json } from '@/lib/types/supabase'
import {
	UpdateSupportCaseRequestSchema,
	SUPPORT_CASE_STATUS,
	getValidSupportCaseStatusTransitions,
} from '@/lib/contracts/supportCase'
import { logSupportCaseStatusChanged } from '@/lib/audit/log'

/**
 * GET /api/support-cases/[id] - Get a specific support case
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

		// RLS will enforce access control
		const { data: supportCase, error: selectError } = await supabase
			.from('support_cases')
			.select('*')
			.eq('id', id)
			.single()

		if (selectError) {
			if (selectError.code === 'PGRST116') {
				// Not found or no access
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

			console.error('[support-cases] Select error:', selectError, 'requestId:', requestId)

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

		return NextResponse.json(
			{
				success: true,
				data: supportCase,
			},
			{ status: 200 },
		)
	} catch (err) {
		console.error('[support-cases] Unexpected error:', err, 'requestId:', requestId)

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

/**
 * PATCH /api/support-cases/[id] - Update a support case
 */
export async function PATCH(
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

		// Parse and validate request body
		const body = await request.json()

		const requestParse = UpdateSupportCaseRequestSchema.safeParse(body)
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

		const updateRequest = requestParse.data

		// Get current support case (RLS enforced)
		const { data: currentCase, error: selectError } = await supabase
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

			console.error('[support-cases] Select error:', selectError, 'requestId:', requestId)

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

		// Validate status transition if status is being updated
		if (updateRequest.status && updateRequest.status !== currentCase.status) {
			const validTransitions = getValidSupportCaseStatusTransitions(currentCase.status)
			if (!validTransitions.includes(updateRequest.status)) {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'INVALID_STATUS_TRANSITION',
							message: `Cannot transition from ${currentCase.status} to ${updateRequest.status}`,
							details: { valid_transitions: validTransitions },
						},
					},
					{ status: 422 },
				)
			}
		}

		// Prepare update data
		const updateData: Record<string, unknown> = {}
		if (updateRequest.status !== undefined) {
			updateData.status = updateRequest.status

			// Set timestamp fields based on status
			if (updateRequest.status === SUPPORT_CASE_STATUS.RESOLVED) {
				updateData.resolved_at = new Date().toISOString()
			}
			if (updateRequest.status === SUPPORT_CASE_STATUS.CLOSED) {
				updateData.closed_at = new Date().toISOString()
			}
		}
		if (updateRequest.priority !== undefined) updateData.priority = updateRequest.priority
		if (updateRequest.assigned_to_user_id !== undefined)
			updateData.assigned_to_user_id = updateRequest.assigned_to_user_id
		if (updateRequest.description !== undefined) updateData.description = updateRequest.description
		if (updateRequest.notes !== undefined) updateData.notes = updateRequest.notes
		if (updateRequest.resolution_notes !== undefined)
			updateData.resolution_notes = updateRequest.resolution_notes
		if (updateRequest.metadata !== undefined)
			updateData.metadata = updateRequest.metadata as Json

		// Update support case (RLS enforced)
		const { data: updatedCase, error: updateError } = await supabase
			.from('support_cases')
			.update(updateData)
			.eq('id', id)
			.select()
			.single()

		if (updateError) {
			console.error('[support-cases] Update error:', updateError, 'requestId:', requestId)

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

		// Log audit event if status changed (PHI-free)
		if (updateRequest.status && updateRequest.status !== currentCase.status) {
			await logSupportCaseStatusChanged({
				org_id: currentCase.organization_id ?? undefined,
				actor_user_id: user.id,
				actor_role: userRole,
				support_case_id: id,
				status_from: currentCase.status,
				status_to: updateRequest.status,
				has_notes: !!updateRequest.notes || !!updateRequest.resolution_notes,
			})
		}

		console.log('[support-cases] Updated successfully:', {
			support_case_id: id,
			status_changed: updateRequest.status !== currentCase.status,
			requestId,
		})

		return NextResponse.json(
			{
				success: true,
				data: updatedCase,
			},
			{ status: 200 },
		)
	} catch (err) {
		console.error('[support-cases] Unexpected error:', err, 'requestId:', requestId)

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

/**
 * DELETE /api/support-cases/[id] - Delete a support case (admin only)
 */
export async function DELETE(
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

		// Only admins can delete support cases
		if (userRole !== 'admin') {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'FORBIDDEN',
						message: 'Only administrators can delete support cases',
					},
				},
				{ status: 403 },
			)
		}

		// Delete support case (RLS enforced)
		const { error: deleteError } = await supabase.from('support_cases').delete().eq('id', id)

		if (deleteError) {
			console.error('[support-cases] Delete error:', deleteError, 'requestId:', requestId)

			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'DATABASE_ERROR',
						message: 'Failed to delete support case',
					},
				},
				{ status: 500 },
			)
		}

		console.log('[support-cases] Deleted successfully:', {
			support_case_id: id,
			requestId,
		})

		return NextResponse.json(
			{
				success: true,
				data: { id },
			},
			{ status: 200 },
		)
	} catch (err) {
		console.error('[support-cases] Unexpected error:', err, 'requestId:', requestId)

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
