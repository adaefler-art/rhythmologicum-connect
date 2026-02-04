/**
 * Patient Funnels List API - E74.6
 * 
 * Get all funnel assignments for a specific patient
 * Auth: clinician/admin/nurse
 * 
 * GET /api/clinician/patients/[patientId]/funnels - List patient funnels
 * 
 * Security:
 * - RLS org scoping enforced
 * - Only staff in same org as patient can view
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

type PatientFunnelRow = {
	id: string
	patient_id: string
	funnel_id: string
	active_version_id: string | null
	status: string
	started_at: string | null
	completed_at: string | null
	created_at: string
	updated_at: string
	funnels_catalog?: unknown | unknown[] | null
	funnel_versions?: unknown | unknown[] | null
}

/**
 * GET /api/clinician/patients/[patientId]/funnels - List patient funnels
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ patientId: string }> }
) {
	try {
		const { patientId } = await params
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

		// Query patient funnels with related data
		// RLS will automatically filter to org-scoped funnels
		const { data: patientFunnels, error: queryError } = await supabase
			.from('patient_funnels')
			.select(`
        id,
        patient_id,
        funnel_id,
        active_version_id,
        status,
        started_at,
        completed_at,
        created_at,
        updated_at,
        funnels_catalog:funnel_id (
          id,
          slug,
          title,
          pillar_id,
          is_active
        ),
        funnel_versions:active_version_id (
          id,
          version_number,
          status,
          published_at
        )
      `)
			.eq('patient_id', patientId)
			.order('created_at', { ascending: false })

		if (queryError) {
			console.error('[patient-funnels] Query error:', queryError)
      
			// Check for RLS violation
			if (queryError.code === 'PGRST301' || queryError.code?.startsWith('PGRST3')) {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: 'UNAUTHORIZED_PATIENT',
							message: 'Cannot access patient funnels outside your organization',
						},
					},
					{ status: 403 }
				)
			}
      
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'QUERY_FAILED',
						message: 'Failed to fetch patient funnels',
					},
				},
				{ status: 500 }
			)
		}

		// Transform data to flatten nested objects and handle array responses safely
		const transformedFunnels = ((patientFunnels as PatientFunnelRow[]) ?? []).map((pf) => ({
			id: pf.id,
			patient_id: pf.patient_id,
			funnel_id: pf.funnel_id,
			active_version_id: pf.active_version_id,
			status: pf.status,
			started_at: pf.started_at,
			completed_at: pf.completed_at,
			created_at: pf.created_at,
			updated_at: pf.updated_at,
			funnel: (Array.isArray(pf.funnels_catalog) 
				? pf.funnels_catalog[0] 
				: pf.funnels_catalog) ?? null,
			version: (Array.isArray(pf.funnel_versions) 
				? pf.funnel_versions[0] 
				: pf.funnel_versions) ?? null,
		}))

		return NextResponse.json(
			{
				success: true,
				data: transformedFunnels,
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
