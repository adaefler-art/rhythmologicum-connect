import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'
import { loadSafetyPolicy } from '@/lib/cre/safety/policyEngine'
import { buildEffectiveSafety } from '@/lib/cre/safety/overrideHelpers'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import type { PolicyOverride } from '@/lib/types/clinicalIntake'

type RouteContext = {
  params: Promise<{ patientId: string; versionNumber: string }>
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

const mapIntake = (intake: IntakeRecord | null) =>
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
        last_updated_from_messages: intake.last_updated_from_messages,
        created_at: intake.created_at,
        updated_at: intake.updated_at,
      }
    : null

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

const fetchIntakeVersion = async (params: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  column: 'patient_id' | 'user_id'
  value: string
  versionNumber: number
}) => {
  const { supabase, column, value, versionNumber } = params

  const { data, error } = (await supabase
    .from('clinical_intakes' as any)
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
    .eq('version_number', versionNumber)
    .limit(1)
    .maybeSingle()) as { data: any; error: any }

  return { data: (data ?? null) as IntakeRecord | null, error }
}

export async function GET(_request: Request, context: RouteContext) {
  const correlationId = getCorrelationId()
  try {
    const { patientId, versionNumber } = await context.params
    const parsed = Number(versionNumber)

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json(
        {
          success: false,
          requestId: correlationId,
          error: { code: ErrorCode.INVALID_INPUT, message: 'Invalid intake version number' },
        },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()
    const admin = createAdminSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          requestId: correlationId,
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
          requestId: correlationId,
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
          requestId: correlationId,
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
            requestId: correlationId,
            error: { code: ErrorCode.FORBIDDEN, message: 'You do not have access to this patient' },
          },
          { status: 403 },
        )
      }
    }

    const patientIdResult = await fetchIntakeVersion({
      supabase,
      column: 'patient_id',
      value: resolution.patientProfileId,
      versionNumber: parsed,
    })

    if (patientIdResult.error) {
      console.error('[clinician/patient/intake/version] Intake error:', patientIdResult.error)
      return NextResponse.json(
        {
          success: false,
          requestId: correlationId,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch intake version' },
        },
        { status: 500 },
      )
    }

    let intake = patientIdResult.data

    if (!intake && resolution.patientUserId) {
      const userIdResult = await fetchIntakeVersion({
        supabase,
        column: 'user_id',
        value: resolution.patientUserId,
        versionNumber: parsed,
      })

      if (userIdResult.error) {
        console.error('[clinician/patient/intake/version] Intake error:', userIdResult.error)
        return NextResponse.json(
          {
            success: false,
            requestId: correlationId,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch intake version' },
          },
          { status: 500 },
        )
      }

      intake = userIdResult.data
    }

    if (!intake) {
      const adminPatientIdResult = await fetchIntakeVersion({
        supabase: admin,
        column: 'patient_id',
        value: resolution.patientProfileId,
        versionNumber: parsed,
      })

      if (adminPatientIdResult.error) {
        console.error('[clinician/patient/intake/version] Admin intake error:', adminPatientIdResult.error)
        return NextResponse.json(
          {
            success: false,
            requestId: correlationId,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch intake version' },
          },
          { status: 500 },
        )
      }

      intake = adminPatientIdResult.data
    }

    if (!intake && resolution.patientUserId) {
      const adminUserIdResult = await fetchIntakeVersion({
        supabase: admin,
        column: 'user_id',
        value: resolution.patientUserId,
        versionNumber: parsed,
      })

      if (adminUserIdResult.error) {
        console.error('[clinician/patient/intake/version] Admin intake error:', adminUserIdResult.error)
        return NextResponse.json(
          {
            success: false,
            requestId: correlationId,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch intake version' },
          },
          { status: 500 },
        )
      }

      intake = adminUserIdResult.data
    }

    if (!intake) {
      return NextResponse.json(
        {
          success: false,
          requestId: correlationId,
          error: { code: ErrorCode.NOT_FOUND, message: 'Intake version not found' },
        },
        { status: 404 },
      )
    }

    const policy = loadSafetyPolicy({ organizationId: intake.organization_id ?? null, funnelId: null })
    const { safety } = buildEffectiveSafety({
      structuredData: intake.structured_data,
      policyOverride: intake.policy_override ?? null,
      policy,
    })

    return NextResponse.json({
      success: true,
      requestId: correlationId,
      data: {
        intake: {
          ...mapIntake(intake),
          structured_data: {
            ...intake.structured_data,
            safety,
          },
        },
      },
    })
  } catch (err) {
    console.error('[clinician/patient/intake/version] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        requestId: correlationId,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
