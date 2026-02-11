/**
 * Issue 10: Get Latest Clinical Intake API
 * 
 * GET /api/clinical-intake/latest
 * 
 * Retrieves the latest clinical intake for the authenticated user.
 * 
 * Security:
 * - Requires authentication
 * - Users can only retrieve their own intakes
 * - RLS policies ensure data isolation
 * 
 * API Contract:
 * Response: { success: true, data: { intake: ClinicalIntake | null } }
 * Error: { success: false, error: { code: string, message: string } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { logError } from '@/lib/logging/logger'
import type { GetIntakeResponse, ClinicalIntake } from '@/lib/types/clinicalIntake'

/**
 * GET /api/clinical-intake/latest
 */
export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId()

  try {
    // Get authenticated user
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
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        } satisfies GetIntakeResponse,
        { status: 401 }
      )
    }

    console.log('[clinical-intake/latest] Request received', {
      userId: user.id,
      correlationId,
    })

    // Fetch latest intake for user
    const { data, error } = await supabase
      .from('clinical_intakes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[clinical-intake/latest] Query error', { error: error.message })

      logError('Failed to fetch latest clinical intake', {
        endpoint: '/api/clinical-intake/latest',
        error: error.message,
        correlationId,
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_ERROR',
            message: 'Failed to fetch intake',
          },
        } satisfies GetIntakeResponse,
        { status: 500 }
      )
    }

    const intake = data as ClinicalIntake | null

    console.log('[clinical-intake/latest] Request completed', {
      userId: user.id,
      hasIntake: !!intake,
      intakeId: intake?.id,
      correlationId,
    })

    return NextResponse.json({
      success: true,
      data: {
        intake,
      },
    } satisfies GetIntakeResponse)
  } catch (error) {
    console.error('[clinical-intake/latest] Unexpected error', {
      error: String(error),
      correlationId,
    })

    logError('Clinical intake retrieval failed', {
      endpoint: '/api/clinical-intake/latest',
      error: String(error),
      correlationId,
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } satisfies GetIntakeResponse,
      { status: 500 }
    )
  }
}
