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
import { loadSafetyPolicy } from '@/lib/cre/safety/policyEngine'
import { buildEffectiveSafety } from '@/lib/cre/safety/overrideHelpers'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import { logError } from '@/lib/logging/logger'
import type { ClinicalIntake } from '@/lib/types/clinicalIntake'

const mapIntake = (intake: ClinicalIntake | null) =>
  intake
    ? {
        uuid: intake.id,
        id: intake.id,
        status: intake.status,
        version_number: intake.version_number,
        clinical_summary: intake.clinical_summary,
        structured_data: intake.structured_data,
        policy_override: intake.policy_override ?? null,
        trigger_reason: intake.trigger_reason,
        created_at: intake.created_at,
        updated_at: intake.updated_at,
        last_updated_from_messages: intake.last_updated_from_messages,
      }
    : null

type LatestIntakeResponse = {
  success: boolean
  data?: {
    intake: ReturnType<typeof mapIntake>
  }
  error?: {
    code: string
    message: string
  }
}

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
          requestId: correlationId,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        } satisfies LatestIntakeResponse,
        { status: 401 }
      )
    }

    console.log('[clinical-intake/latest] Request received', {
      userId: user.id,
      correlationId,
    })

    // Fetch latest intake for user
    const { data, error } = await supabase
      .from('clinical_intakes' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })
      .order('updated_at', { ascending: false })
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
          requestId: correlationId,
          error: {
            code: 'QUERY_ERROR',
            message: 'Failed to fetch intake',
          },
        } satisfies LatestIntakeResponse,
        { status: 500 }
      )
    }

    const intake = data as ClinicalIntake | null
    let mapped = mapIntake(intake)

    if (intake && mapped) {
      const policy = loadSafetyPolicy({ organizationId: intake.organization_id ?? null, funnelId: null })
      const { safety } = buildEffectiveSafety({
        structuredData: intake.structured_data as unknown as Record<string, unknown>,
        policyOverride: intake.policy_override ?? null,
        policy,
      })

      mapped = {
        ...mapped,
        structured_data: {
          ...intake.structured_data,
          safety,
        },
      }
    }

    console.log('[clinical-intake/latest] Request completed', {
      userId: user.id,
      hasIntake: !!intake,
      intakeId: intake?.id,
      correlationId,
    })

    return NextResponse.json({
      success: true,
      requestId: correlationId,
      data: {
        intake: mapped,
      },
    } satisfies LatestIntakeResponse)
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
        requestId: correlationId,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } satisfies LatestIntakeResponse,
      { status: 500 }
    )
  }
}
