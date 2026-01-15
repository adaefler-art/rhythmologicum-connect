/**
 * E6.4.6: Escalation CTA Click Logging
 *
 * API endpoint to log when a patient clicks an escalation CTA.
 * No PHI, only event type + timestamp + correlation ID.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logEscalationCtaClicked } from '@/lib/escalation/auditLog'
import type { EscalationOfferType } from '@/lib/types/escalation'

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client for auth
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

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

    // Log the event
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
