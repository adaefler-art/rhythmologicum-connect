import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

const STAFF_ROLES = new Set(['admin', 'clinician', 'nurse'])

type FixMembershipError = {
  code: string
  message: string
}

function getAssessmentId(request: NextRequest, body: Record<string, unknown> | null) {
  const url = new URL(request.url)
  const queryId = url.searchParams.get('assessmentId')
  if (queryId) return queryId

  const bodyId = typeof body?.assessmentId === 'string' ? body.assessmentId : null
  return bodyId
}

function normalizeStaffRole(rawRole: unknown) {
  if (typeof rawRole === 'string' && STAFF_ROLES.has(rawRole)) {
    return rawRole
  }
  return 'admin'
}

function jsonError(status: number, error: FixMembershipError) {
  return NextResponse.json({ success: false, error }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return jsonError(401, {
      code: 'AUTHENTICATION_REQUIRED',
      message: 'User must be authenticated',
    })
  }

  const body = await request.json().catch(() => null)
  const assessmentId = getAssessmentId(request, body)

  if (!assessmentId) {
    return jsonError(400, {
      code: 'MISSING_ASSESSMENT_ID',
      message: 'assessmentId is required',
    })
  }

  const adminClient = createAdminSupabaseClient()

  const { data: assessment, error: assessmentError } = await adminClient
    .from('assessments')
    .select('id, patient_id')
    .eq('id', assessmentId)
    .maybeSingle()

  if (assessmentError) {
    return jsonError(500, {
      code: 'ASSESSMENT_QUERY_FAILED',
      message: assessmentError.message || 'Failed to fetch assessment',
    })
  }

  if (!assessment?.patient_id) {
    return jsonError(404, {
      code: 'ASSESSMENT_NOT_FOUND',
      message: 'Assessment not found',
    })
  }

  const { data: patientProfile, error: patientError } = await adminClient
    .from('patient_profiles')
    .select('id, user_id')
    .eq('id', assessment.patient_id)
    .maybeSingle()

  if (patientError) {
    return jsonError(500, {
      code: 'PATIENT_PROFILE_QUERY_FAILED',
      message: patientError.message || 'Failed to fetch patient profile',
    })
  }

  if (!patientProfile?.user_id) {
    return jsonError(404, {
      code: 'PATIENT_PROFILE_NOT_FOUND',
      message: 'Patient profile not found',
    })
  }

  const { data: patientMembership, error: patientMembershipError } = await adminClient
    .from('user_org_membership')
    .select('organization_id')
    .eq('user_id', patientProfile.user_id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (patientMembershipError) {
    return jsonError(500, {
      code: 'PATIENT_ORG_QUERY_FAILED',
      message: patientMembershipError.message || 'Failed to fetch patient org membership',
    })
  }

  let organizationId = patientMembership?.organization_id ?? null

  if (!organizationId) {
    const { data: staffMembership, error: staffMembershipError } = await adminClient
      .from('user_org_membership')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (staffMembershipError) {
      return jsonError(500, {
        code: 'STAFF_ORG_QUERY_FAILED',
        message: staffMembershipError.message || 'Failed to fetch staff org membership',
      })
    }

    organizationId = staffMembership?.organization_id ?? null
  }

  if (!organizationId) {
    return jsonError(422, {
      code: 'NO_ORG_LINK',
      message: 'No organization linkage found for patient or staff',
    })
  }

  const staffRole = normalizeStaffRole(user.app_metadata?.role)

  const upsertPayload = [
    {
      user_id: user.id,
      organization_id: organizationId,
      role: staffRole,
      is_active: true,
    },
    {
      user_id: patientProfile.user_id,
      organization_id: organizationId,
      role: 'patient',
      is_active: true,
    },
  ]

  const { data: upserted, error: upsertError } = await adminClient
    .from('user_org_membership')
    .upsert(upsertPayload, { onConflict: 'user_id,organization_id' })
    .select('user_id, organization_id, role, is_active')

  if (upsertError) {
    return jsonError(500, {
      code: 'UPSERT_FAILED',
      message: upsertError.message || 'Failed to upsert org membership',
    })
  }

  const { data: auditData, error: auditError } = await supabase.rpc(
    'rls_audit_assessment_access',
    {
      staff_user_id: user.id,
      assessment_id: assessmentId,
    },
  )

  if (auditError) {
    return jsonError(500, {
      code: 'AUDIT_FAILED',
      message: auditError.message || 'Failed to run audit',
    })
  }

  return NextResponse.json(
    {
      success: true,
      assessmentId,
      organizationId,
      staffUserId: user.id,
      patientUserId: patientProfile.user_id,
      upserted: upserted ?? [],
      audit: auditData ?? null,
    },
    { status: 200 },
  )
}
