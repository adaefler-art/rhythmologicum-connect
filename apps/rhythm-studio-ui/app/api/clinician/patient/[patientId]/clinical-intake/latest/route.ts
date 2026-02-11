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

type RouteContext = {
  params: Promise<{ patientId: string }>
}

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
        updated_at
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
    intake: intake ?? null,
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
