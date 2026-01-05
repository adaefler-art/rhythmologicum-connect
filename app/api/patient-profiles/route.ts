/**
 * Patient Profiles API - V05-I07.4
 * 
 * Get list of patient profiles
 * Auth: clinician/admin/nurse
 * 
 * GET /api/patient-profiles - List patient profiles
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
    
    // Query patient profiles with RLS
    const { data: profiles, error: queryError } = await supabase
      .from('patient_profiles')
      .select('id, full_name, user_id')
      .order('full_name', { ascending: true, nullsFirst: false })
    
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
