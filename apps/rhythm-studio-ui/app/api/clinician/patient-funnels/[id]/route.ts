/**
 * Patient Funnel Update API - E74.6
 * 
 * Update funnel status, version, or completion for a specific patient funnel
 * Auth: clinician/admin/nurse
 * 
 * PATCH /api/clinician/patient-funnels/[id] - Update patient funnel
 * 
 * Security:
 * - RLS org scoping enforced
 * - Only staff in same org as patient can update
 * - Audit logging for all changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

type UpdateFunnelRequest = {
  status?: 'active' | 'paused' | 'completed' | 'archived'
  active_version_id?: string
}

/**
 * PATCH /api/clinician/patient-funnels/[id] - Update patient funnel
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const supabase = await createServerSupabaseClient()
    
		// Auth check
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
				{ status: 401 }
			)
		}

		// Role check
		const userRole = user.app_metadata?.role
    
		if (!userRole || !['clinician', 'admin', 'nurse'].includes(userRole)) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'FORBIDDEN',
						message: 'Insufficient permissions. Requires clinician, admin, or nurse role.',
					},
				},
				{ status: 403 }
			)
		}
    
		// Parse request body
		const body = (await request.json()) as UpdateFunnelRequest
		const { status, active_version_id } = body
    
		// Validate at least one field is provided
		if (!status && !active_version_id) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'INVALID_REQUEST',
						message: 'At least one field must be provided: status or active_version_id',
					},
				},
				{ status: 400 }
			)
		}

		// Validate status if provided
		if (status && !['active', 'paused', 'completed', 'archived'].includes(status)) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'INVALID_STATUS',
						message: 'Status must be one of: active, paused, completed, archived',
					},
				},
				{ status: 400 }
			)
		}

		// Get current patient funnel (also verifies access via RLS)
		const { data: currentFunnel, error: fetchError } = await supabase
			.from('patient_funnels')
			.select('id, patient_id, funnel_id, status, active_version_id')
			.eq('id', id)
			.single()

		if (fetchError || !currentFunnel) {
			console.error('[patient-funnels] Fetch error:', fetchError)
      
			if (fetchError?.code === 'PGRST116') {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'NOT_FOUND',
							message: 'Patient funnel not found or access denied',
						},
					},
					{ status: 404 }
				)
			}
      
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'FETCH_FAILED',
						message: 'Failed to retrieve patient funnel',
					},
				},
				{ status: 500 }
			)
		}

		// Build update object
		const updateData: {
			status?: 'active' | 'paused' | 'completed' | 'archived'
			completed_at?: string | null
			active_version_id?: string
		} = {}

		if (status) {
			updateData.status = status
      
			// If marking as completed, set completed_at
			if (status === 'completed' && currentFunnel.status !== 'completed') {
				updateData.completed_at = new Date().toISOString()
			}
      
			// If reactivating from completed, clear completed_at
			if (status !== 'completed' && currentFunnel.status === 'completed') {
				updateData.completed_at = null
			}
		}

		if (active_version_id) {
			// Verify version exists and is published
			const { data: versionData, error: versionError } = await supabase
				.from('funnel_versions')
				.select('id, version_number, status')
				.eq('id', active_version_id)
				.eq('funnel_catalog_id', currentFunnel.funnel_id)
				.single()

			if (versionError || !versionData) {
				console.error('[patient-funnels] Version not found:', versionError)
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'VERSION_NOT_FOUND',
							message: 'Specified version does not exist for this funnel',
						},
					},
					{ status: 404 }
				)
			}

			if (versionData.status !== 'published') {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'VERSION_NOT_PUBLISHED',
							message: 'Cannot assign draft or archived version to patient',
						},
					},
					{ status: 400 }
				)
			}

			updateData.active_version_id = active_version_id
		}

		// Update patient funnel
		// RLS will verify org scoping
		const { data: updatedFunnel, error: updateError } = await supabase
			.from('patient_funnels')
			.update(updateData)
			.eq('id', id)
			.select('id, patient_id, funnel_id, active_version_id, status, started_at, completed_at, updated_at')
			.single()

		if (updateError) {
			console.error('[patient-funnels] Update error:', updateError)
      
			// Check for RLS violation
			if (updateError.code === 'PGRST301' || updateError.code?.startsWith('PGRST3')) {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'UNAUTHORIZED_UPDATE',
							message: 'Cannot update patient funnel outside your organization',
						},
					},
					{ status: 403 }
				)
			}
      
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'UPDATE_FAILED',
						message: 'Failed to update patient funnel',
					},
				},
				{ status: 500 }
			)
		}

		// Audit logging is handled by database trigger
    
		return NextResponse.json(
			{
				success: true,
				data: updatedFunnel,
			},
			{ status: 200 }
		)
	} catch (err) {
		console.error('[patient-funnels] Unexpected error:', err)
		return NextResponse.json(
			{
				success: false,
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
				},
			},
			{ status: 500 }
		)
	}
}
