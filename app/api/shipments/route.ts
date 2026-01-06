/**
 * Shipments API - V05-I08.3
 * 
 * Endpoints for device shipment management
 * - POST: Create new shipment
 * - GET: List shipments with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { logAuditEvent } from '@/lib/audit/log'
import {
  CreateShipmentRequestSchema,
  ShipmentFiltersSchema,
} from '@/lib/contracts/shipment'

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

async function getUserOrgId(supabase: ServerSupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_org_membership')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error('[shipments] Failed to get user org:', error)
    return null
  }

  return data.organization_id
}

async function getPatientProfileIdForUser(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    console.error('[shipments] Failed to get patient profile:', error)
    return null
  }

  return data.id
}

// ============================================================
// POST /api/shipments - Create new shipment
// ============================================================

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

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
    if (!userRole || !['clinician', 'admin'].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'forbidden', message: 'Only clinicians and admins can create shipments' },
        },
        { status: 403 }
      )
    }

    const organizationId = await getUserOrgId(supabase, user.id)
    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'forbidden', message: 'User not associated with an organization' },
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateShipmentRequestSchema.safeParse(body)

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

    const shipmentData = validationResult.data

    // Verify patient exists and is in same organization
    const { data: patient } = await supabase
      .from('patient_profiles')
      .select('id, user_id')
      .eq('id', shipmentData.patient_id)
      .single()

    if (!patient) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Patient not found' } },
        { status: 404 }
      )
    }

    const patientOrgId = await getUserOrgId(supabase, patient.user_id)
    if (!patientOrgId || patientOrgId !== organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'forbidden', message: 'Patient not in your organization' },
        },
        { status: 403 }
      )
    }

    // Create shipment record
    const { data: shipment, error: insertError } = await supabase
      .from('device_shipments')
      .insert({
        patient_id: shipmentData.patient_id,
        task_id: shipmentData.task_id || null,
        organization_id: organizationId,
        created_by_user_id: user.id,
        device_type: shipmentData.device_type,
        device_serial_number: shipmentData.device_serial_number || null,
        tracking_number: shipmentData.tracking_number || null,
        carrier: shipmentData.carrier || null,
        shipping_address: shipmentData.shipping_address || null,
        expected_delivery_at: shipmentData.expected_delivery_at || null,
        notes: shipmentData.notes || null,
        metadata: shipmentData.metadata || {},
        status: 'ordered',
      })
      .select()
      .single()

    if (insertError || !shipment) {
      console.error('Failed to create shipment:', insertError)
      return NextResponse.json(
        { success: false, error: { code: 'database_error', message: 'Failed to create shipment' } },
        { status: 500 }
      )
    }

    // Log audit event (PHI-free)
    await logAuditEvent({
      org_id: organizationId,
      actor_user_id: user.id,
      actor_role: userRole as 'clinician' | 'admin',
      source: 'api',
      entity_type: 'device_shipment',
      entity_id: shipment.id,
      action: 'create',
      metadata: {
        status_to: 'ordered',
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: shipment,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/shipments:', error)
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

// ============================================================
// GET /api/shipments - List shipments with filters
// ============================================================

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

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
    if (!userRole) {
      return NextResponse.json(
        { success: false, error: { code: 'forbidden', message: 'User profile not found' } },
        { status: 403 }
      )
    }

    const isPatient = userRole === 'patient'
    const isStaff = ['clinician', 'nurse', 'admin'].includes(userRole)

    if (!isPatient && !isStaff) {
      return NextResponse.json(
        { success: false, error: { code: 'forbidden', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const patientProfileId = isPatient ? await getPatientProfileIdForUser(supabase, user.id) : null
    const organizationId = isStaff ? await getUserOrgId(supabase, user.id) : null

    if (isPatient && !patientProfileId) {
      return NextResponse.json(
        { success: false, error: { code: 'forbidden', message: 'Patient profile not found' } },
        { status: 403 }
      )
    }

    if (isStaff && !organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'forbidden', message: 'User not associated with an organization' },
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      patient_id: searchParams.get('patient_id') || undefined,
      task_id: searchParams.get('task_id') || undefined,
      status: searchParams.get('status') || undefined,
      device_type: searchParams.get('device_type') || undefined,
      needs_reminder: searchParams.get('needs_reminder') === 'true' || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    }

    // Validate filters
    const validationResult = ShipmentFiltersSchema.safeParse(filters)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Invalid query parameters',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const parsedFilters = validationResult.data

    // Build query
    let query = supabase.from('device_shipments').select(
      `
        *,
        patient_profiles!device_shipments_patient_id_fkey (
          id,
          full_name,
          user_id
        )
      `
    )

    // Apply role-based filtering
    if (isPatient && patientProfileId) {
      // Patients can only see their own shipments
      query = query.eq('patient_id', patientProfileId)
    }

    if (isStaff && organizationId) {
      // Staff can see all shipments in their organization
      query = query.eq('organization_id', organizationId)
    }

    // Apply additional filters
    if (parsedFilters.patient_id) {
      query = query.eq('patient_id', parsedFilters.patient_id)
    }
    if (parsedFilters.task_id) {
      query = query.eq('task_id', parsedFilters.task_id)
    }
    if (parsedFilters.status) {
      query = query.eq('status', parsedFilters.status)
    }
    if (parsedFilters.device_type) {
      query = query.ilike('device_type', `%${parsedFilters.device_type}%`)
    }
    if (parsedFilters.needs_reminder) {
      // Filter for shipments that need reminders (overdue and not yet delivered)
      query = query
        .not('expected_delivery_at', 'is', null)
        .lt('expected_delivery_at', new Date().toISOString())
        .not('status', 'in', '(delivered,returned,cancelled)')
    }

    // Order by created_at DESC and apply limit
    query = query.order('created_at', { ascending: false }).limit(parsedFilters.limit || 50)

    const { data: shipments, error: queryError } = await query

    if (queryError) {
      console.error('Failed to fetch shipments:', queryError)
      return NextResponse.json(
        { success: false, error: { code: 'database_error', message: 'Failed to fetch shipments' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: shipments || [],
    })
  } catch (error) {
    console.error('Error in GET /api/shipments:', error)
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
