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
import { applySafetyPolicy, getEffectiveSafetyState, loadSafetyPolicy } from '@/lib/cre/safety/policyEngine'
import type { SafetyEvaluation, SafetyTriggeredRule } from '@/lib/types/clinicalIntake'
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

  const { data: intake, error } = await supabase
    .from('clinical_intakes')
    .select(
      `
        id,
        status,
        version_number,
        clinical_summary,
        structured_data,
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
    .maybeSingle()

  const { count } = await supabase
    .from('clinical_intakes')
    .select('id', { count: 'exact', head: true })
    .eq(column, value)

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
      foundCount = userIdResult.count
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

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.INVALID_INPUT, message: 'Override reason is required' },
        },
        { status: 400 },
      )
    }


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

    const structured = intakeRecord.structured_data as Record<string, unknown>
    const safety = (structured?.safety as SafetyEvaluation | undefined) ?? {
      red_flag_present: false,
      escalation_level: null,
      red_flags: [],
    }

    const triggeredRules: SafetyTriggeredRule[] = safety.triggered_rules ??
      safety.red_flags?.map((flag) => ({
        rule_id: flag.rule_id,
        severity: flag.level,
        rationale: flag.rationale,
        evidence_message_ids: flag.evidence_message_ids,
        policy_version: flag.policy_version,
      })) ?? []

    const policy = loadSafetyPolicy({ organizationId: intakeRecord.organization_id ?? null, funnelId: null })
    const policyResult = safety.policy_result ?? applySafetyPolicy({ triggeredRules, policy })
    const override = levelOverride || chatActionOverride
      ? {
          level_override: levelOverride,
          chat_action_override: chatActionOverride,
          reason,
          by_user_id: user.id,
          at: new Date().toISOString(),
        }
      : null
    const effective = getEffectiveSafetyState({ policyResult, override })

    const nextSafety: SafetyEvaluation = {
      ...safety,
      triggered_rules: triggeredRules,
      policy_result: policyResult,
      override,
      effective_level: effective.escalationLevel,
      effective_action: effective.chatAction,
    }

    const { data: updated, error: updateError } = await supabase
      .from('clinical_intakes')
      .update({
        structured_data: ({
          ...structured,
          safety: nextSafety,
        } as unknown as Json),
        updated_by: user.id,
      })
      .eq('id', intakeRecord.id)
      .select(
        `
          id,
          status,
          version_number,
          clinical_summary,
          structured_data,
          trigger_reason,
          last_updated_from_messages,
          created_at,
          updated_at
        `,
      )
      .single()

    if (updateError) {
      console.error('[clinician/patient/clinical-intake/latest] Update error:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to update intake override' },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      intake: mapIntake((updated ?? null) as IntakeRecord | null),
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
