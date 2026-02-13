/**
 * Clinician Inbox API - Assigned Patients
 *
 * GET /api/clinician/inbox
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { resolvePatientDisplayName } from '@/lib/utils/patientDisplayName'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

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

    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Clinician or admin role required' },
        },
        { status: 403 },
      )
    }

    const { data: assignments, error: assignmentError } = await supabase
      .from('clinician_patient_assignments')
      .select('patient_user_id, organization_id, created_at')
      .eq('clinician_user_id', user.id)
      .order('created_at', { ascending: false })

    if (assignmentError) {
      console.error('[clinician/inbox] Assignment error:', assignmentError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load assignments' },
        },
        { status: 500 },
      )
    }

    const patientUserIds = (assignments ?? [])
      .map((assignment) => assignment.patient_user_id)
      .filter((id): id is string => Boolean(id))

    if (patientUserIds.length === 0) {
      return NextResponse.json({ success: true, patients: [] })
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('patient_profiles')
      .select('id, user_id, full_name, first_name, last_name, preferred_name, birth_year, sex')
      .in('user_id', patientUserIds)

    if (profilesError) {
      console.error('[clinician/inbox] Profile error:', profilesError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load patient profiles' },
        },
        { status: 500 },
      )
    }

    const profileByUserId = new Map(
      (profiles ?? []).map((profile) => [profile.user_id, profile]),
    )

    const { data: intakeRows, error: intakeError } = (await supabase
      .from('clinical_intakes' as any)
      .select('user_id, updated_at')
      .in('user_id', patientUserIds)
      .order('updated_at', { ascending: false })) as { data: any; error: any }

    if (intakeError) {
      console.error('[clinician/inbox] Intake error:', intakeError)
    }

    const latestIntakeByUserId = new Map<string, string>()
    ;(intakeRows ?? []).forEach((row: any) => {
      if (!latestIntakeByUserId.has(row.user_id)) {
        latestIntakeByUserId.set(row.user_id, row.updated_at)
      }
    })

    const nowYear = new Date().getFullYear()

    const patients = patientUserIds
      .map((patientUserId) => {
        const profile = profileByUserId.get(patientUserId)
        const patientId = profile?.id ?? null
        const display = resolvePatientDisplayName({
          id: patientId ?? patientUserId,
          full_name: profile?.full_name ?? null,
          first_name: profile?.first_name ?? null,
          last_name: profile?.last_name ?? null,
          display_label: profile?.preferred_name ?? null,
        })
        const age = profile?.birth_year ? nowYear - profile.birth_year : null

        return {
          patientId,
          name: display.displayName,
          age,
          sex: profile?.sex ?? null,
          lastActivityAt: null,
          lastIntakeAt: latestIntakeByUserId.get(patientUserId) ?? null,
        }
      })
      .filter((patient) => Boolean(patient.patientId))

    return NextResponse.json({ success: true, patients })
  } catch (err) {
    console.error('[clinician/inbox] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
