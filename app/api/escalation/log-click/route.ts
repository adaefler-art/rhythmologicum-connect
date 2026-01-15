/**
 * E6.4.6: Escalation CTA Click Logging
 *
 * API endpoint to log when a patient clicks an escalation CTA.
 * No PHI, only event type + timestamp + correlation ID.
 * 
 * E6.4.8: Emits ESCALATION_OFFER_CLICKED telemetry event.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { logEscalationCtaClicked } from '@/lib/escalation/auditLog'
import type { EscalationOfferType } from '@/lib/types/escalation'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { emitEscalationOfferClicked } from '@/lib/telemetry/events'

export async function POST(request: NextRequest) {
  // E6.4.8: Get correlation ID for telemetry
  const requestCorrelationId = getCorrelationId(request)
  
  try {
    // Get Supabase client for auth
    const supabase = await createServerSupabaseClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { assessmentId, correlationId, offerType } = body

    // Validate inputs
    if (!assessmentId || !correlationId || !offerType) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Missing required fields: assessmentId, correlationId, offerType' 
          } 
        },
        { status: 400 }
      )
    }

    // Validate offer type
    const validOfferTypes: EscalationOfferType[] = ['video_consultation', 'doctor_appointment', 'emergency_contact']
    if (!validOfferTypes.includes(offerType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_OFFER_TYPE', 
            message: 'Invalid offer type' 
          } 
        },
        { status: 400 }
      )
    }

    // Log the event (existing audit trail)
    const auditResult = await logEscalationCtaClicked(
      assessmentId,
      user.id,
      correlationId,
      offerType
    )

    if (!auditResult.success) {
      console.error('[escalation/log-click] Audit logging failed:', auditResult.error)
      // Don't fail the request if audit logging fails
    }

    // E6.4.8: Emit ESCALATION_OFFER_CLICKED telemetry event (best-effort)
    // Get patient ID for telemetry
    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    await emitEscalationOfferClicked({
      correlationId: requestCorrelationId,
      assessmentId,
      offerType,
      escalationCorrelationId: correlationId,
      patientId: patientProfile?.id,
    }).catch((err) => {
      console.warn('[TELEMETRY] Failed to emit ESCALATION_OFFER_CLICKED event', err)
    })

    return NextResponse.json({
      success: true,
      data: {
        logged: auditResult.success,
        correlationId,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[escalation/log-click] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to log escalation click' 
        } 
      },
      { status: 500 }
    )
  }
}
