import { requireAuth } from '@/lib/api/authHelpers'
import {
  configurationErrorResponse,
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

type UserRole = 'patient' | 'clinician' | 'admin' | 'nurse'

type AdminUserSummary = {
  id: string
  email: string | null
  role: UserRole | null
  created_at: string | null
  last_sign_in_at: string | null
  is_disabled: boolean
}

type AssignmentSummary = {
  id: string
  organization_id: string
  clinician_user_id: string
  patient_user_id: string
  created_at: string
}

type UserOrganizationMap = Record<string, string[]>

type UpdateRoleBody = {
  userId?: string
  role?: UserRole
}

type CreateUserBody = {
  email?: string
  password?: string
  role?: UserRole
}

type UpsertAssignmentBody = {
  patientUserId?: string
  clinicianUserId?: string
}

type DeleteAssignmentBody = {
  patientUserId?: string
  clinicianUserId?: string
}

const ALLOWED_ROLES: readonly UserRole[] = ['patient', 'clinician', 'admin', 'nurse']

function getUserRole(user: {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}): UserRole | null {
  const role = user.app_metadata?.role || user.user_metadata?.role
  if (typeof role !== 'string') {
    return null
  }

  return ALLOWED_ROLES.includes(role as UserRole) ? (role as UserRole) : null
}

function isAdmin(user: {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}) {
  return getUserRole(user) === 'admin'
}

function isClinicianAssignableRole(role: UserRole | null): role is 'clinician' | 'nurse' | 'admin' {
  return role === 'clinician' || role === 'nurse' || role === 'admin'
}

function isPatientRole(role: UserRole | null): role is 'patient' {
  return role === 'patient'
}

async function getOrganizationIdsForUser(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  allowedRoles?: UserRole[],
) {
  let query = admin
    .from('user_org_membership')
    .select('organization_id, role, created_at')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (allowedRoles && allowedRoles.length > 0) {
    query = query.in('role', allowedRoles)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return [] as string[]
  }

  const uniqueOrganizationIds = Array.from(
    new Set((data ?? []).map((entry) => entry.organization_id).filter(Boolean)),
  )

  return uniqueOrganizationIds
}

function intersects(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return false
  }

  const rightSet = new Set(right)
  return left.some((entry) => rightSet.has(entry))
}

async function ensureActiveClinicianMembership(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  clinicianUserId: string,
  organizationId: string,
  role: 'clinician' | 'nurse' | 'admin',
) {
  const { data: existingMemberships, error: existingMembershipError } = await admin
    .from('user_org_membership')
    .select('id, role, is_active, created_at')
    .eq('user_id', clinicianUserId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingMembershipError) {
    return false
  }

  const existingMembership = existingMemberships?.[0]

  if (existingMembership) {
    if (existingMembership.is_active && existingMembership.role !== 'patient') {
      return true
    }

    const { error: updateMembershipError } = await admin
      .from('user_org_membership')
      .update({
        is_active: true,
        role,
      })
      .eq('id', existingMembership.id)

    return !updateMembershipError
  }

  const { error: insertMembershipError } = await admin.from('user_org_membership').insert({
    user_id: clinicianUserId,
    organization_id: organizationId,
    role,
    is_active: true,
  })

  return !insertMembershipError
}

async function ensureActivePatientMembership(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  patientUserId: string,
  organizationId: string,
) {
  const { data: existingMemberships, error: existingMembershipError } = await admin
    .from('user_org_membership')
    .select('id, role, is_active, created_at')
    .eq('user_id', patientUserId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingMembershipError) {
    return false
  }

  const existingMembership = existingMemberships?.[0]

  if (existingMembership) {
    if (existingMembership.is_active && existingMembership.role === 'patient') {
      return true
    }

    const { error: updateMembershipError } = await admin
      .from('user_org_membership')
      .update({
        is_active: true,
        role: 'patient',
      })
      .eq('id', existingMembership.id)

    return !updateMembershipError
  }

  const { error: insertMembershipError } = await admin.from('user_org_membership').insert({
    user_id: patientUserId,
    organization_id: organizationId,
    role: 'patient',
    is_active: true,
  })

  return !insertMembershipError
}

export async function GET() {
  const { user, error } = await requireAuth()
  if (error || !user) {
    return error ?? internalErrorResponse('Authentifizierung fehlgeschlagen.')
  }

  if (!isAdmin(user)) {
    return forbiddenResponse('Nur Administratoren dürfen die Benutzerverwaltung aufrufen.')
  }

  try {
    const admin = createAdminSupabaseClient()
    const { data, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })

    if (listError) {
      return internalErrorResponse('Benutzer konnten nicht geladen werden.')
    }

    const users: AdminUserSummary[] = (data?.users ?? [])
      .map((entry) => ({
        id: entry.id,
        email: entry.email ?? null,
        role: getUserRole(entry),
        created_at: entry.created_at ?? null,
        last_sign_in_at: entry.last_sign_in_at ?? null,
        is_disabled: Boolean(entry.banned_until),
      }))
      .sort((a, b) => {
        const left = a.created_at ? new Date(a.created_at).getTime() : 0
        const right = b.created_at ? new Date(b.created_at).getTime() : 0
        return right - left
      })

    const patientUserIds = users
      .filter((entry) => (entry.role ?? 'patient') === 'patient')
      .map((entry) => entry.id)
    const clinicians = users.filter((entry) => isClinicianAssignableRole(entry.role))
    const clinicianUserIds = clinicians.map((entry) => entry.id)

    let patientOrgIdsByUserId: UserOrganizationMap = {}
    if (patientUserIds.length > 0) {
      const { data: patientMembershipRows, error: patientMembershipError } = await admin
        .from('user_org_membership')
        .select('user_id, organization_id, created_at')
        .in('user_id', patientUserIds)
        .eq('is_active', true)
        .eq('role', 'patient')
        .order('created_at', { ascending: false })

      if (patientMembershipError) {
        return internalErrorResponse('Patient-Organisationen konnten nicht geladen werden.')
      }

      patientOrgIdsByUserId = (patientMembershipRows ?? []).reduce<UserOrganizationMap>(
        (accumulator, row) => {
          if (!accumulator[row.user_id]) {
            accumulator[row.user_id] = []
          }
          if (!accumulator[row.user_id].includes(row.organization_id)) {
            accumulator[row.user_id].push(row.organization_id)
          }
          return accumulator
        },
        {},
      )
    }

    let clinicianOrgIdsByUserId: UserOrganizationMap = {}
    if (clinicianUserIds.length > 0) {
      const { data: clinicianMembershipRows, error: clinicianMembershipError } = await admin
        .from('user_org_membership')
        .select('user_id, organization_id, created_at')
        .in('user_id', clinicianUserIds)
        .eq('is_active', true)
        .in('role', ['clinician', 'nurse', 'admin'])
        .order('created_at', { ascending: false })

      if (clinicianMembershipError) {
        return internalErrorResponse('Arzt-Organisationen konnten nicht geladen werden.')
      }

      clinicianOrgIdsByUserId = (clinicianMembershipRows ?? []).reduce<UserOrganizationMap>(
        (accumulator, row) => {
          if (!accumulator[row.user_id]) {
            accumulator[row.user_id] = []
          }
          if (!accumulator[row.user_id].includes(row.organization_id)) {
            accumulator[row.user_id].push(row.organization_id)
          }
          return accumulator
        },
        {},
      )
    }

    let assignments: AssignmentSummary[] = []
    if (patientUserIds.length > 0) {
      const { data: assignmentRows, error: assignmentError } = await admin
        .from('clinician_patient_assignments')
        .select('id, organization_id, clinician_user_id, patient_user_id, created_at')
        .in('patient_user_id', patientUserIds)

      if (assignmentError) {
        return internalErrorResponse('Zuweisungen konnten nicht geladen werden.')
      }

      assignments = (assignmentRows ?? []) as AssignmentSummary[]
    }

    const assignmentsByPatientId = assignments.reduce<Record<string, string[]>>((accumulator, entry) => {
      if (!accumulator[entry.patient_user_id]) {
        accumulator[entry.patient_user_id] = []
      }
      accumulator[entry.patient_user_id].push(entry.clinician_user_id)
      return accumulator
    }, {})

    const assignableCliniciansByPatientId = patientUserIds.reduce<Record<string, string[]>>(
      (accumulator, patientUserId) => {
        const patientOrgIds = patientOrgIdsByUserId[patientUserId] ?? []

        const compatibleClinicianIds = clinicianUserIds.filter(
          (clinicianUserId) =>
            intersects(patientOrgIds, clinicianOrgIdsByUserId[clinicianUserId] ?? []),
        )

        accumulator[patientUserId] =
          compatibleClinicianIds.length > 0
            ? compatibleClinicianIds
            : patientOrgIds.length > 0 || clinicianUserIds.length > 0
            ? clinicianUserIds
            : []

        return accumulator
      },
      {},
    )

    return successResponse({
      users,
      clinicians,
      assignmentsByPatientId,
      assignableCliniciansByPatientId,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return configurationErrorResponse('SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert.')
    }

    console.error('GET /api/admin/users failed:', error)
    return internalErrorResponse('Benutzer konnten nicht geladen werden.')
  }
}

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth()
  if (error || !user) {
    return error ?? internalErrorResponse('Authentifizierung fehlgeschlagen.')
  }

  if (!isAdmin(user)) {
    return forbiddenResponse('Nur Administratoren dürfen Rollen ändern.')
  }

  let body: UpdateRoleBody
  try {
    body = await request.json()
  } catch {
    return validationErrorResponse('Ungültiger Request-Body.')
  }

  const userId = body.userId?.trim()
  const role = body.role

  if (!userId || !role || !ALLOWED_ROLES.includes(role)) {
    return validationErrorResponse('userId und eine gültige role sind erforderlich.')
  }

  if (userId === user.id && role !== 'admin') {
    return validationErrorResponse('Sie können sich nicht selbst die Admin-Rolle entziehen.')
  }

  try {
    const admin = createAdminSupabaseClient()
    const { data: existing, error: existingError } = await admin.auth.admin.getUserById(userId)

    if (existingError || !existing?.user) {
      return validationErrorResponse('Benutzer nicht gefunden.')
    }

    const existingAppMeta = (existing.user.app_metadata ?? {}) as Record<string, unknown>
    const existingUserMeta = (existing.user.user_metadata ?? {}) as Record<string, unknown>

    const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...existingAppMeta,
        role,
      },
      user_metadata: {
        ...existingUserMeta,
        role,
      },
    })

    if (updateError || !updated?.user) {
      return internalErrorResponse('Rolle konnte nicht aktualisiert werden.')
    }

    const updatedUser: AdminUserSummary = {
      id: updated.user.id,
      email: updated.user.email ?? null,
      role: getUserRole(updated.user),
      created_at: updated.user.created_at ?? null,
      last_sign_in_at: updated.user.last_sign_in_at ?? null,
      is_disabled: Boolean(updated.user.banned_until),
    }

    return successResponse({ user: updatedUser })
  } catch (error) {
    if (error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return configurationErrorResponse('SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert.')
    }

    console.error('PATCH /api/admin/users failed:', error)
    return internalErrorResponse('Rolle konnte nicht aktualisiert werden.')
  }
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth()
  if (error || !user) {
    return error ?? internalErrorResponse('Authentifizierung fehlgeschlagen.')
  }

  if (!isAdmin(user)) {
    return forbiddenResponse('Nur Administratoren dürfen Benutzer anlegen.')
  }

  let body: CreateUserBody
  try {
    body = await request.json()
  } catch {
    return validationErrorResponse('Ungültiger Request-Body.')
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()
  const role = body.role

  if (!email || !email.includes('@')) {
    return validationErrorResponse('Eine gültige E-Mail ist erforderlich.')
  }

  if (!password || password.length < 8) {
    return validationErrorResponse('Ein Passwort mit mindestens 8 Zeichen ist erforderlich.')
  }

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return validationErrorResponse('Eine gültige Rolle ist erforderlich.')
  }

  try {
    const admin = createAdminSupabaseClient()
    const { data, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role,
      },
      user_metadata: {
        role,
      },
    })

    if (createError || !data?.user) {
      const message = createError?.message ?? 'Benutzer konnte nicht angelegt werden.'
      if (/already|exists|registered/i.test(message)) {
        return validationErrorResponse('Ein Benutzer mit dieser E-Mail existiert bereits.')
      }
      return internalErrorResponse('Benutzer konnte nicht angelegt werden.')
    }

    const createdUser: AdminUserSummary = {
      id: data.user.id,
      email: data.user.email ?? null,
      role: getUserRole(data.user),
      created_at: data.user.created_at ?? null,
      last_sign_in_at: data.user.last_sign_in_at ?? null,
      is_disabled: Boolean(data.user.banned_until),
    }

    return successResponse({ user: createdUser })
  } catch (caughtError) {
    if (caughtError instanceof Error && caughtError.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return configurationErrorResponse('SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert.')
    }

    console.error('POST /api/admin/users failed:', caughtError)
    return internalErrorResponse('Benutzer konnte nicht angelegt werden.')
  }
}

export async function PUT(request: Request) {
  const { user, error } = await requireAuth()
  if (error || !user) {
    return error ?? internalErrorResponse('Authentifizierung fehlgeschlagen.')
  }

  if (!isAdmin(user)) {
    return forbiddenResponse('Nur Administratoren dürfen Zuweisungen verwalten.')
  }

  let body: UpsertAssignmentBody
  try {
    body = await request.json()
  } catch {
    return validationErrorResponse('Ungültiger Request-Body.')
  }

  const patientUserId = body.patientUserId?.trim()
  const clinicianUserId = body.clinicianUserId?.trim()

  if (!patientUserId || !clinicianUserId) {
    return validationErrorResponse('patientUserId und clinicianUserId sind erforderlich.')
  }

  if (patientUserId === clinicianUserId) {
    return validationErrorResponse('Ein Benutzer kann nicht sich selbst zugewiesen werden.')
  }

  try {
    const admin = createAdminSupabaseClient()

    const [{ data: patientData, error: patientError }, { data: clinicianData, error: clinicianError }] =
      await Promise.all([
        admin.auth.admin.getUserById(patientUserId),
        admin.auth.admin.getUserById(clinicianUserId),
      ])

    if (patientError || !patientData?.user) {
      return validationErrorResponse('Patient-Benutzer nicht gefunden.')
    }

    if (clinicianError || !clinicianData?.user) {
      return validationErrorResponse('Arzt-Benutzer nicht gefunden.')
    }

    const patientRole = getUserRole(patientData.user)
    const clinicianRole = getUserRole(clinicianData.user)

    if (!isPatientRole(patientRole)) {
      return validationErrorResponse('patientUserId muss die Rolle patient haben.')
    }

    if (!isClinicianAssignableRole(clinicianRole)) {
      return validationErrorResponse('clinicianUserId muss die Rolle clinician, nurse oder admin haben.')
    }

    const [patientOrgIds, clinicianOrgIds] = await Promise.all([
      getOrganizationIdsForUser(admin, patientUserId, ['patient']),
      getOrganizationIdsForUser(admin, clinicianUserId, ['clinician', 'nurse', 'admin']),
    ])

    let sharedOrgId = patientOrgIds.find((orgId) => clinicianOrgIds.includes(orgId))

    if (!sharedOrgId && patientOrgIds.length === 0 && clinicianOrgIds.length > 0) {
      const targetClinicianOrgId = clinicianOrgIds[0]
      const patientMembershipEnsured = await ensureActivePatientMembership(
        admin,
        patientUserId,
        targetClinicianOrgId,
      )

      if (patientMembershipEnsured) {
        sharedOrgId = targetClinicianOrgId
      }
    }

    if (!sharedOrgId && patientOrgIds.length > 0) {
      const targetPatientOrgId = patientOrgIds[0]
      const membershipEnsured = await ensureActiveClinicianMembership(
        admin,
        clinicianUserId,
        targetPatientOrgId,
        clinicianRole,
      )

      if (membershipEnsured) {
        sharedOrgId = targetPatientOrgId
      }
    }

    if (!sharedOrgId) {
      return validationErrorResponse(
        'Patient und Arzt müssen in derselben aktiven Organisation sein.',
      )
    }

    const { data: assignment, error: upsertError } = await admin
      .from('clinician_patient_assignments')
      .upsert(
        {
          organization_id: sharedOrgId,
          clinician_user_id: clinicianUserId,
          patient_user_id: patientUserId,
          created_by: user.id,
        },
        {
          onConflict: 'organization_id,clinician_user_id,patient_user_id',
          ignoreDuplicates: false,
        },
      )
      .select('id, organization_id, clinician_user_id, patient_user_id, created_at')
      .single()

    if (upsertError || !assignment) {
      return internalErrorResponse('Zuweisung konnte nicht gespeichert werden.')
    }

    return successResponse({ assignment })
  } catch (caughtError) {
    if (caughtError instanceof Error && caughtError.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return configurationErrorResponse('SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert.')
    }

    console.error('PUT /api/admin/users failed:', caughtError)
    return internalErrorResponse('Zuweisung konnte nicht gespeichert werden.')
  }
}

export async function DELETE(request: Request) {
  const { user, error } = await requireAuth()
  if (error || !user) {
    return error ?? internalErrorResponse('Authentifizierung fehlgeschlagen.')
  }

  if (!isAdmin(user)) {
    return forbiddenResponse('Nur Administratoren dürfen Zuweisungen verwalten.')
  }

  let body: DeleteAssignmentBody
  try {
    body = await request.json()
  } catch {
    return validationErrorResponse('Ungültiger Request-Body.')
  }

  const patientUserId = body.patientUserId?.trim()
  const clinicianUserId = body.clinicianUserId?.trim()

  if (!patientUserId || !clinicianUserId) {
    return validationErrorResponse('patientUserId und clinicianUserId sind erforderlich.')
  }

  try {
    const admin = createAdminSupabaseClient()

    const { error: deleteError } = await admin
      .from('clinician_patient_assignments')
      .delete()
      .eq('patient_user_id', patientUserId)
      .eq('clinician_user_id', clinicianUserId)

    if (deleteError) {
      return internalErrorResponse('Zuweisung konnte nicht entfernt werden.')
    }

    return successResponse({ removed: true })
  } catch (caughtError) {
    if (caughtError instanceof Error && caughtError.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return configurationErrorResponse('SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert.')
    }

    console.error('DELETE /api/admin/users failed:', caughtError)
    return internalErrorResponse('Zuweisung konnte nicht entfernt werden.')
  }
}