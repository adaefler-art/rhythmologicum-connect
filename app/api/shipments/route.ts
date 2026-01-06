/**
 * Shipments API - V05-I08.3
 * 
 * Endpoints for device shipment management
 * - POST: Create new shipment
 * - GET: List shipments with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase.server'
import { logAuditEvent } from '@/lib/audit/auditLogger'
import {
  CreateShipmentRequestSchema,
  ShipmentFiltersSchema,
  type DeviceShipment,
} from '@/lib/contracts/shipment'

// ============================================================
// POST /api/shipments - Create new shipment
// ============================================================

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

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

    // Get user role
    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['clinician', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'forbidden', message: 'Only clinicians and admins can create shipments' },
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
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const shipmentData = validationResult.data

    // Verify patient exists and is in same organization
    const { data: patient } = await supabase
      .from('patient_profiles')
      .select('id, organization_id')
      .eq('id', shipmentData.patient_id)
      .single()

    if (!patient) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Patient not found' } },
        { status: 404 }
      )
    }

    if (patient.organization_id !== profile.organization_id) {
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
        organization_id: profile.organization_id,
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
      eventType: 'shipment_created',
      userId: user.id,
      metadata: {
        shipmentId: shipment.id,
        deviceType: shipmentData.device_type,
        status: 'ordered',
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
  const supabase = await createServerClient()

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

    // Get user role
    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('role, organization_id, id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'forbidden', message: 'User profile not found' } },
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
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

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
    if (profile.role === 'patient') {
      // Patients can only see their own shipments
      query = query.eq('patient_id', profile.id)
    } else {
      // Staff can see all shipments in their organization
      query = query.eq('organization_id', profile.organization_id)
    }

    // Apply additional filters
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id)
    }
    if (filters.task_id) {
      query = query.eq('task_id', filters.task_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.device_type) {
      query = query.ilike('device_type', `%${filters.device_type}%`)
    }
    if (filters.needs_reminder) {
      // Filter for shipments that need reminders (overdue and not yet delivered)
      query = query
        .not('expected_delivery_at', 'is', null)
        .lt('expected_delivery_at', new Date().toISOString())
        .not('status', 'in', '(delivered,returned,cancelled)')
    }

    // Order by created_at DESC and apply limit
    query = query.order('created_at', { ascending: false }).limit(filters.limit || 50)

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
