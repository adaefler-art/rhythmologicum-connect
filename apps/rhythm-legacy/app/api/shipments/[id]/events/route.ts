/**
 * Shipment Events API - V05-I08.3
 * 
 * Endpoints for shipment event management
 * - POST: Add tracking event
 * - GET: List events for shipment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { logAuditEvent } from '@/lib/audit/log'
import { CreateShipmentEventRequestSchema } from '@/lib/contracts/shipment'

type RouteContext = {
  params: Promise<{ id: string }>
}

// ============================================================
// POST /api/shipments/[id]/events - Add tracking event
// ============================================================

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createServerSupabaseClient()
  const { id: shipmentId } = await context.params

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
          error: { code: 'forbidden', message: 'Only staff can add events' },
        },
        { status: 403 }
      )
    }

    // Verify shipment exists and user has access (RLS handles this)
    const { data: shipment, error: shipmentError } = await supabase
      .from('device_shipments')
      .select('id')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Shipment not found' } },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateShipmentEventRequestSchema.safeParse(body)

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

    const eventData = validationResult.data

    // Create event record
    const { data: event, error: insertError } = await supabase
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        created_by_user_id: user.id,
        event_type: eventData.event_type,
        event_description: eventData.event_description || null,
        location: eventData.location || null,
        carrier: eventData.carrier || null,
        tracking_number: eventData.tracking_number || null,
        metadata: eventData.metadata || {},
      })
      .select()
      .single()

    if (insertError || !event) {
      console.error('Failed to create event:', insertError)
      return NextResponse.json(
        { success: false, error: { code: 'database_error', message: 'Failed to create event' } },
        { status: 500 }
      )
    }

    // Log audit event (PHI-free)
    await logAuditEvent({
      actor_user_id: user.id,
      actor_role: userRole as 'clinician' | 'nurse' | 'admin',
      source: 'api',
      entity_type: 'device_shipment',
      entity_id: shipmentId,
      action: 'update',
      metadata: {
        status_to: eventData.event_type,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: event,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/shipments/[id]/events:', error)
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

// ============================================================
// GET /api/shipments/[id]/events - List events for shipment
// ============================================================

export async function GET(request: NextRequest, context: RouteContext) {
  const supabase = await createServerSupabaseClient()
  const { id: shipmentId } = await context.params

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

    // Verify shipment exists and user has access (RLS handles this)
    const { data: shipment, error: shipmentError } = await supabase
      .from('device_shipments')
      .select('id')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Shipment not found' } },
        { status: 404 }
      )
    }

    // Fetch events (RLS will enforce access control)
    const { data: events, error: queryError } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('event_at', { ascending: false })

    if (queryError) {
      console.error('Failed to fetch events:', queryError)
      return NextResponse.json(
        { success: false, error: { code: 'database_error', message: 'Failed to fetch events' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: events || [],
    })
  } catch (error) {
    console.error('Error in GET /api/shipments/[id]/events:', error)
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
