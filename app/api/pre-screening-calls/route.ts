/**
 * Pre-screening Calls API - V05-I08.2
 * 
 * Manage pre-screening call records
 * Auth: clinician/admin
 * 
 * POST /api/pre-screening-calls - Create a new pre-screening call record
 * GET /api/pre-screening-calls - List pre-screening calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { logAuditEvent } from '@/lib/audit/log'
import { AUDIT_ENTITY_TYPE } from '@/lib/contracts/registry'

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

/**
 * Get user's organization ID server-side
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
    return null
  }
  
  return data.organization_id
}

/**
 * POST /api/pre-screening-calls - Create a new pre-screening call record
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check FIRST
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

    // Role is stored in auth.users.raw_app_meta_data.role and surfaced to the app as app_metadata.role
    // (user_metadata is user-modifiable, but we keep it as a fallback for legacy/dev cases).
    const userRole = user.app_metadata?.role || user.user_metadata?.role
    if (userRole !== 'clinician' && userRole !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only clinicians and admins can create pre-screening calls',
          },
        },
        { status: 403 }
      )
    }

    // Parse body
    const body = await request.json()
    
    // Validate required fields
    if (!body.patient_id || typeof body.is_suitable !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'patient_id and is_suitable are required',
          },
        },
        { status: 400 }
      )
    }

    // Get organization ID server-side
    const organizationId = await getUserOrgId(supabase, user.id)

    // Prepare data for insertion
    const callData = {
      patient_id: body.patient_id,
      clinician_id: user.id,
      organization_id: organizationId,
      is_suitable: body.is_suitable,
      suitability_notes: body.suitability_notes || null,
      red_flags: body.red_flags || [],
      red_flags_notes: body.red_flags_notes || null,
      recommended_tier: body.recommended_tier || null,
      tier_notes: body.tier_notes || null,
      general_notes: body.general_notes || null,
      call_date: body.call_date || new Date().toISOString(),
    }

    // Insert into database
    const { data: callRecord, error: insertError } = await supabase
      .from('pre_screening_calls')
      .insert(callData)
      .select()
      .single()

    if (insertError) {
      console.error('[pre-screening-calls] Insert failed:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create pre-screening call record',
          },
        },
        { status: 500 }
      )
    }

    // Log audit event (PHI-free: no patient_id, only coded values)
    await logAuditEvent({
      source: 'api',
      actor_user_id: user.id,
      actor_role: userRole as 'clinician' | 'admin',
      org_id: organizationId || undefined,
      entity_type: AUDIT_ENTITY_TYPE.PRE_SCREENING_CALL,
      entity_id: callRecord.id,
      action: 'create',
      metadata: {
        is_suitable: body.is_suitable,
        has_red_flags: (body.red_flags || []).length > 0,
        red_flag_count: (body.red_flags || []).filter((f: { checked: boolean }) => f.checked).length,
        recommended_tier: body.recommended_tier || undefined,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: callRecord,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[pre-screening-calls] POST error:', error)
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

/**
 * GET /api/pre-screening-calls - List pre-screening calls
 */
export async function GET(request: NextRequest) {
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

    // Role is stored in auth.users.raw_app_meta_data.role and surfaced to the app as app_metadata.role
    // (user_metadata is user-modifiable, but we keep it as a fallback for legacy/dev cases).
    const userRole = user.app_metadata?.role || user.user_metadata?.role
    if (!userRole || !['clinician', 'admin', 'nurse'].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      )
    }

    // Query parameters
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Build query
    let query = supabase
      .from('pre_screening_calls')
      .select(
        `
        *,
        patient_profiles!pre_screening_calls_patient_id_fkey (
          id,
          full_name,
          user_id
        )
      `
      )
      .order('call_date', { ascending: false })
      .limit(limit)

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[pre-screening-calls] Query failed:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch pre-screening calls',
          },
        },
        { status: 500 }
      )
    }

    // Parse red_flags JSON
    const parsedData = (data || []).map((call) => ({
      ...call,
      red_flags: typeof call.red_flags === 'string' 
        ? JSON.parse(call.red_flags) 
        : call.red_flags,
    }))

    return NextResponse.json(
      {
        success: true,
        data: parsedData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[pre-screening-calls] GET error:', error)
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
