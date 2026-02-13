/**
 * Clinician Clinical Intake API - History
 *
 * GET /api/clinician/patient/[patientId]/clinical-intake/history
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'
import { loadSafetyPolicy } from '@/lib/cre/safety/policyEngine'
import { buildEffectiveSafety } from '@/lib/cre/safety/overrideHelpers'
import type { PolicyOverride } from '@/lib/types/clinicalIntake'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

type IntakeRecord = {
  id: string
  status: string
  version_number: number
  clinical_summary: string | null
  structured_data: Record<string, unknown>
  policy_override?: PolicyOverride | null
  trigger_reason: string | null
  last_updated_from_messages: string[] | null
  created_at: string
  updated_at: string
  organization_id?: string | null
}

const mapIntake = (intake: IntakeRecord) => ({
  uuid: intake.id,
  id: intake.id,
  status: intake.status,
  version_number: intake.version_number,
  clinical_summary: intake.clinical_summary,
  structured_data: intake.structured_data,
  policy_override: intake.policy_override ?? null,
  trigger_reason: intake.trigger_reason,
  last_updated_from_messages: intake.last_updated_from_messages,
  created_at: intake.created_at,
  updated_at: intake.updated_at,
})

const getUserRole = (user: {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}) => {
  const appRole = user.app_metadata?.role
  if (typeof appRole === 'string') return appRole
  const userRole = user.user_metadata?.role
  if (typeof userRole === 'string') return userRole
  return null
}

const parseLimit = (request: Request) => {
  const { searchParams } = new URL(request.url)
  const raw = Number(searchParams.get('limit'))
  if (!Number.isFinite(raw)) return 10
  if (raw <= 0) return 10
  return Math.min(raw, 50)
}

const fetchIntakeHistory = async (params: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  column: 'patient_id' | 'user_id'
  value: string
  limit: number
}) => {
  const { supabase, column, value, limit } = params

  const { data, error } = await supabase
    .from('clinical_intakes')
    .select(
      `
        id,
        status,
        version_number,
        clinical_summary,
        structured_data,
        policy_override,
        trigger_reason,
        last_updated_from_messages,
        created_at,
        updated_at,
        organization_id
      `,
    )
    .eq(column, value)
    .order('version_number', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit)

  return { data: (data ?? []) as unknown as IntakeRecord[], error }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const supabase = await createServerSupabaseClient()
    const admin = createAdminSupabaseClient()
    const limit = parseLimit(request)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const role = getUserRole(user)
    const isAdmin = role === 'admin'
    const isClinician = role === 'clinician' || isAdmin

    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Clinician or admin role required' },
        },
        { status: 403 },
      )
    }

    const resolution = await resolvePatientIds(admin, patientId)

    if (!resolution.patientProfileId || !resolution.patientUserId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Patient not found' },
        },
        { status: 404 },
      )
    }

    if (!isAdmin) {
      const { data: assignment, error: assignmentError } = await supabase
        .from('clinician_patient_assignments')
        .select('id')
        .eq('clinician_user_id', user.id)
        .eq('patient_user_id', resolution.patientUserId)
        .maybeSingle()

      if (assignmentError || !assignment) {
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.FORBIDDEN, message: 'You do not have access to this patient' },
          },
          { status: 403 },
        )
      }
    }

    const patientIdResult = await fetchIntakeHistory({
      supabase,
      column: 'patient_id',
      value: resolution.patientProfileId,
      limit,
    })

    if (patientIdResult.error) {
      console.error('[clinician/patient/clinical-intake/history] Intake error:', patientIdResult.error)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake history' },
        },
        { status: 500 },
      )
    }

    let intakes = patientIdResult.data

    if (intakes.length === 0 && resolution.patientUserId) {
      const userIdResult = await fetchIntakeHistory({
        supabase,
        column: 'user_id',
        value: resolution.patientUserId,
        limit,
      })

      if (userIdResult.error) {
        console.error('[clinician/patient/clinical-intake/history] Intake error:', userIdResult.error)
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake history' },
          },
          { status: 500 },
        )
      }

      intakes = userIdResult.data
    }

    if (intakes.length === 0) {
      const adminPatientIdResult = await fetchIntakeHistory({
        supabase: admin,
        column: 'patient_id',
        value: resolution.patientProfileId,
        limit,
      })

      if (adminPatientIdResult.error) {
        console.error(
          '[clinician/patient/clinical-intake/history] Admin intake error:',
          adminPatientIdResult.error,
        )
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake history' },
          },
          { status: 500 },
        )
      }

      intakes = adminPatientIdResult.data
    }

    if (intakes.length === 0 && resolution.patientUserId) {
      const adminUserIdResult = await fetchIntakeHistory({
        supabase: admin,
        column: 'user_id',
        value: resolution.patientUserId,
        limit,
      })

      if (adminUserIdResult.error) {
        console.error(
          '[clinician/patient/clinical-intake/history] Admin intake error:',
          adminUserIdResult.error,
        )
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake history' },
          },
          { status: 500 },
        )
      }

      intakes = adminUserIdResult.data
    }

    const mapped = intakes.map((intake) => {
      const policy = loadSafetyPolicy({ organizationId: intake.organization_id ?? null, funnelId: null })
      const { safety } = buildEffectiveSafety({
        structuredData: intake.structured_data,
        policyOverride: intake.policy_override ?? null,
        policy,
      })

      return {
        ...mapIntake(intake),
        structured_data: {
          ...intake.structured_data,
          safety,
        },
      }
    })

    return NextResponse.json({
      success: true,
      intakes: mapped,
    })
  } catch (err) {
    console.error('[clinician/patient/clinical-intake/history] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
