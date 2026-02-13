 /**
 * Clinician Clinical Intake API - Latest
 *
 * GET /api/clinician/patient/[patientId]/clinical-intake/latest
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientIds } from '@/lib/patients/resolvePatientIds'
import { env } from '@/lib/env'
import { loadSafetyPolicy } from '@/lib/cre/safety/policyEngine'
import { buildEffectiveSafety } from '@/lib/cre/safety/overrideHelpers'
import { setPolicyOverride } from '@/lib/cre/safety/overridePersistence'
import type { PolicyOverride, SafetyEvaluation } from '@/lib/types/clinicalIntake'
import type { Json } from '@/lib/types/supabase'

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

const fetchLatestIntake = async (params: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  column: 'patient_id' | 'user_id'
  value: string
}) => {
  const { supabase, column, value } = params

  const { data: intake, error } = (await supabase
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
    .order('version_number', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: any; error: any }

  const { count } = (await supabase
    .from('clinical_intakes' as any)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)) as { count: any }

  return {
    intake: mapIntake((intake ?? null) as IntakeRecord | null),
    record: (intake ?? null) as IntakeRecord | null,
    count: count ?? 0,
    error,
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
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

    const debugEnabled = env.NODE_ENV !== 'production'
    let usedFilter: { column: 'patient_id' | 'user_id'; value: string } | null = null

    const patientIdResult = await fetchLatestIntake({
      supabase,
      column: 'patient_id',
      value: resolution.patientProfileId,
    })

    usedFilter = { column: 'patient_id', value: resolution.patientProfileId }

    if (patientIdResult.error) {
      console.error('[clinician/patient/clinical-intake/latest] Intake error:', patientIdResult.error)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake' },
        },
        { status: 500 },
      )
    }

    let intake = patientIdResult.intake
    let foundCount = patientIdResult.count
    let intakeRecord = patientIdResult.record

    if (!intake && resolution.patientUserId) {
      const userIdResult = await fetchLatestIntake({
        supabase,
        column: 'user_id',
        value: resolution.patientUserId,
      })

      usedFilter = { column: 'user_id', value: resolution.patientUserId }

      if (userIdResult.error) {
        console.error('[clinician/patient/clinical-intake/latest] Intake error:', userIdResult.error)
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake' },
          },
          { status: 500 },
        )
      }

      intake = userIdResult.intake
      intakeRecord = userIdResult.record
      foundCount = userIdResult.count
    }

    if (!intake) {
      const adminPatientIdResult = await fetchLatestIntake({
        supabase: admin,
        column: 'patient_id',
        value: resolution.patientProfileId,
      })

      if (adminPatientIdResult.error) {
        console.error(
          '[clinician/patient/clinical-intake/latest] Admin intake error:',
          adminPatientIdResult.error,
        )
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake' },
          },
          { status: 500 },
        )
      }

      usedFilter = { column: 'patient_id', value: resolution.patientProfileId }
      intake = adminPatientIdResult.intake
      intakeRecord = adminPatientIdResult.record
      foundCount = adminPatientIdResult.count
    }

    if (!intake && resolution.patientUserId) {
      const adminUserIdResult = await fetchLatestIntake({
        supabase: admin,
        column: 'user_id',
        value: resolution.patientUserId,
      })

      if (adminUserIdResult.error) {
        console.error(
          '[clinician/patient/clinical-intake/latest] Admin intake error:',
          adminUserIdResult.error,
        )
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake' },
          },
          { status: 500 },
        )
      }

      usedFilter = { column: 'user_id', value: resolution.patientUserId }
      intake = adminUserIdResult.intake
      intakeRecord = adminUserIdResult.record
      foundCount = adminUserIdResult.count
    }

    if (intake && intakeRecord) {
      const policy = loadSafetyPolicy({
        organizationId: intakeRecord.organization_id ?? null,
        funnelId: null,
      })
      const { safety } = buildEffectiveSafety({
        structuredData: intakeRecord.structured_data,
        policyOverride: intakeRecord.policy_override ?? null,
        policy,
      })

      intake = {
        ...intake,
        structured_data: {
          ...intakeRecord.structured_data,
          safety,
        },
        policy_override: intakeRecord.policy_override ?? null,
      }
    }

    return NextResponse.json({
      success: true,
      intake,
      _debug: debugEnabled
        ? {
            urlPatientId: patientId,
            resolved: {
              patientProfileId: resolution.patientProfileId,
              userId: resolution.patientUserId ?? null,
            },
            usedFilter,
            foundCount,
          }
        : undefined,
    })
  } catch (err) {
    console.error('[clinician/patient/clinical-intake/latest] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
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

    const body = await request.json()
    const levelOverride = body?.levelOverride ?? null
    const chatActionOverride = body?.chatActionOverride ?? null
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''


    const patientIdResult = await fetchLatestIntake({
      supabase,
      column: 'patient_id',
      value: resolution.patientProfileId,
    })

    if (patientIdResult.error) {
      console.error('[clinician/patient/clinical-intake/latest] Intake error:', patientIdResult.error)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake' },
        },
        { status: 500 },
      )
    }

    let intakeRecord = patientIdResult.record

    if (!intakeRecord && resolution.patientUserId) {
      const userIdResult = await fetchLatestIntake({
        supabase,
        column: 'user_id',
        value: resolution.patientUserId,
      })

      if (userIdResult.error) {
        console.error('[clinician/patient/clinical-intake/latest] Intake error:', userIdResult.error)
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch clinical intake' },
          },
          { status: 500 },
        )
      }

      intakeRecord = userIdResult.record
    }

    if (!intakeRecord) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Intake not found' },
        },
        { status: 404 },
      )
    }

    const structured = (intakeRecord.structured_data ?? {}) as Record<string, unknown>
    const overrideResult = await setPolicyOverride({
      supabase,
      intakeId: intakeRecord.id,
      organizationId: intakeRecord.organization_id ?? null,
      structuredData: structured,
      overrideLevel: levelOverride,
      overrideAction: chatActionOverride,
      reason,
      updatedBy: { id: user.id, email: user.email ?? null },
    })

    if (!overrideResult.ok) {
      const isValidation = overrideResult.error === 'Invalid override values' ||
        overrideResult.error === 'Override reason is required'
      return NextResponse.json(
        {
          success: false,
          error: {
            code: isValidation ? ErrorCode.INVALID_INPUT : ErrorCode.DATABASE_ERROR,
            message: overrideResult.error ?? 'Failed to update intake override',
          },
        },
        { status: isValidation ? 400 : 500 },
      )
    }

    return NextResponse.json({
      success: true,
      intake: mapIntake((overrideResult.data?.updated ?? null) as IntakeRecord | null),
    })
  } catch (err) {
    console.error('[clinician/patient/clinical-intake/latest] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
