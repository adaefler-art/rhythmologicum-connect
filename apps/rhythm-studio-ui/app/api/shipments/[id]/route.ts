/**
 * Shipment Detail API - V05-I08.3
 * 
 * Endpoints for individual shipment operations
 * - GET: Get shipment details
 * - PATCH: Update shipment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { logAuditEvent } from '@/lib/audit/log'
import { UpdateShipmentRequestSchema, getValidStatusTransitions, type ShipmentStatus } from '@/lib/contracts/shipment'

type RouteContext = {
	params: Promise<{ id: string }>
}

// ============================================================
// GET /api/shipments/[id] - Get shipment details
// ============================================================

export async function GET(request: NextRequest, context: RouteContext) {
	const supabase = await createServerSupabaseClient()
	const { id } = await context.params

	try {
		// Auth check
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()

		if (authError || !user) {
			return NextResponse.json(
				{ success: false, error: { code: 'unauthorized', message: 'Authentication required' } },
				{ status: 401 }
			)
		}

		// Fetch shipment (RLS will enforce access control)
		const { data: shipment, error: queryError } = await supabase
			.from('device_shipments')
			.select(
				`
				*,
				patient_profiles!device_shipments_patient_id_fkey (
					id,
					full_name,
					user_id
				)
			`
			)
			.eq('id', id)
			.single()

		if (queryError) {
			if (queryError.code === 'PGRST116') {
				return NextResponse.json(
					{ success: false, error: { code: 'not_found', message: 'Shipment not found' } },
					{ status: 404 }
				)
			}
			console.error('Failed to fetch shipment:', queryError)
			return NextResponse.json(
				{ success: false, error: { code: 'database_error', message: 'Failed to fetch shipment' } },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			success: true,
			data: shipment,
		})
	} catch (error) {
		console.error('Error in GET /api/shipments/[id]:', error)
		return NextResponse.json(
			{ success: false, error: { code: 'internal_error', message: 'Internal server error' } },
			{ status: 500 }
		)
	}
}

// ============================================================
// PATCH /api/shipments/[id] - Update shipment
// ============================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
	const supabase = await createServerSupabaseClient()
	const { id } = await context.params

	try {
		// Auth check
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()

		if (authError || !user) {
			return NextResponse.json(
				{ success: false, error: { code: 'unauthorized', message: 'Authentication required' } },
				{ status: 401 }
			)
		}

		const userRole = user.app_metadata?.role || user.user_metadata?.role

		if (!userRole || !['clinician', 'nurse', 'admin'].includes(userRole)) {
			return NextResponse.json(
				{
					success: false,
					error: { code: 'forbidden', message: 'Only staff can update shipments' },
				},
				{ status: 403 }
			)
		}

		// Parse and validate request body
		const body = await request.json()
		const validationResult = UpdateShipmentRequestSchema.safeParse(body)

		if (!validationResult.success) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'validation_error',
						message: 'Invalid request data',
						details: validationResult.error.issues,
					},
				},
				{ status: 400 }
			)
		}

		const updateData = validationResult.data

		// Prevent changing organization_id or patient_id (tenant isolation)
		// These fields are not in UpdateShipmentRequestSchema, but double-check
		if ('organization_id' in updateData || 'patient_id' in updateData) {
			return NextResponse.json(
				{
					success: false,
					error: { code: 'forbidden', message: 'Cannot change organization or patient' },
				},
				{ status: 403 }
			)
		}

		// Validate status transitions if status is being changed
		if (updateData.status) {
			// First fetch current shipment to get current status
			const { data: currentShipment, error: fetchError } = await supabase
				.from('device_shipments')
				.select('status')
				.eq('id', id)
				.single()

			if (fetchError || !currentShipment) {
				return NextResponse.json(
					{ success: false, error: { code: 'not_found', message: 'Shipment not found' } },
					{ status: 404 }
				)
			}

			// Validate transition using helper function
			const validTransitions = getValidStatusTransitions(currentShipment.status as ShipmentStatus)
			if (!validTransitions.includes(updateData.status as ShipmentStatus) && updateData.status !== currentShipment.status) {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'invalid_transition',
							message: `Cannot transition from ${currentShipment.status} to ${updateData.status}`,
						},
					},
					{ status: 400 }
				)
			}
		}

		// Auto-set timestamp fields based on status changes
		if (updateData.status) {
			const now = new Date().toISOString()
			switch (updateData.status) {
				case 'shipped':
					if (!updateData.shipped_at) {
						updateData.shipped_at = now
					}
					break
				case 'delivered':
					if (!updateData.delivered_at) {
						updateData.delivered_at = now
					}
					break
				case 'returned':
					if (!updateData.returned_at) {
						updateData.returned_at = now
					}
					break
			}
		}

		// Update shipment (RLS will enforce access control)
		const { data: shipment, error: updateError } = await supabase
			.from('device_shipments')
			.update(updateData)
			.eq('id', id)
			.select()
			.single()

		if (updateError) {
			if (updateError.code === 'PGRST116') {
				return NextResponse.json(
					{ success: false, error: { code: 'not_found', message: 'Shipment not found' } },
					{ status: 404 }
				)
			}
			console.error('Failed to update shipment:', updateError)
			return NextResponse.json(
				{ success: false, error: { code: 'database_error', message: 'Failed to update shipment' } },
				{ status: 500 }
			)
		}

		// Log audit event (PHI-free)
		await logAuditEvent({
			actor_user_id: user.id,
			actor_role: userRole as 'clinician' | 'nurse' | 'admin',
			source: 'api',
			entity_type: 'device_shipment',
			entity_id: id,
			action: 'update',
			metadata: {
				status_to: updateData.status,
			},
		})

		return NextResponse.json({
			success: true,
			data: shipment,
		})
	} catch (error) {
		console.error('Error in PATCH /api/shipments/[id]:', error)
		return NextResponse.json(
			{ success: false, error: { code: 'internal_error', message: 'Internal server error' } },
			{ status: 500 }
		)
	}
}
