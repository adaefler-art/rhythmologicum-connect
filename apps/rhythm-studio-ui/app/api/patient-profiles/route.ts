/**
 * Patient Profiles API - V05-I07.4
 * 
 * Get minimal list of patient profiles for task assignment
 * Auth: clinician/admin/nurse
 * 
 * GET /api/patient-profiles - List patient profiles (minimal fields, org-scoped)
 * 
 * Security:
 * - RLS org scoping enforced
 * - Minimal fields only (id, full_name, user_id)
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

/**
 * GET /api/patient-profiles - List patient profiles
 */
export async function GET() {
	try {
		// Auth check
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
				{ status: 401 }
			)
		}

		// Role check: clinician/admin/nurse can view patient profiles
		const userRole = user.app_metadata?.role
    
		if (!userRole || !['clinician', 'admin', 'nurse'].includes(userRole)) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'FORBIDDEN',
						message: 'Insufficient permissions',
					},
				},
				{ status: 403 }
			)
		}
    
		// Query patient profiles with RLS (org-scoped automatically)
		// Select ONLY minimal fields needed for task assignment dropdown
		const { data: profiles, error: queryError } = await supabase
			.from('patient_profiles')
			.select('id, full_name, user_id')
			.order('full_name', { ascending: true, nullsFirst: false })
			.order('id', { ascending: true }) // Tie-breaker for determinism
    
		if (queryError) {
			console.error('[patient-profiles] Query error:', queryError)
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'QUERY_FAILED',
						message: 'Failed to fetch patient profiles',
					},
				},
				{ status: 500 }
			)
		}
    
		return NextResponse.json(
			{
				success: true,
				data: profiles ?? [],
			},
			{ status: 200 }
		)
	} catch (err) {
		console.error('[patient-profiles] Unexpected error:', err)
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
