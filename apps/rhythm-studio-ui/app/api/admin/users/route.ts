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

type UserPrimaryOrganizationMap = Record<string, string>

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

async function getOrganizationIdForUser(
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

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (error) {
    return null
  }

  return data?.organization_id ?? null
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

    let patientPrimaryOrgById: UserPrimaryOrganizationMap = {}
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

      patientPrimaryOrgById = (patientMembershipRows ?? []).reduce<UserPrimaryOrganizationMap>(
        (accumulator, row) => {
          if (!accumulator[row.user_id]) {
            accumulator[row.user_id] = row.organization_id
          }
          return accumulator
        },
        {},
      )
    }

    let clinicianPrimaryOrgById: UserPrimaryOrganizationMap = {}
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

      clinicianPrimaryOrgById = (clinicianMembershipRows ?? []).reduce<UserPrimaryOrganizationMap>(
        (accumulator, row) => {
          if (!accumulator[row.user_id]) {
            accumulator[row.user_id] = row.organization_id
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
        const patientOrgId = patientPrimaryOrgById[patientUserId]
        if (!patientOrgId) {
          accumulator[patientUserId] = []
          return accumulator
        }

        accumulator[patientUserId] = clinicianUserIds.filter(
          (clinicianUserId) => clinicianPrimaryOrgById[clinicianUserId] === patientOrgId,
        )
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

    const [patientOrgId, clinicianOrgId] = await Promise.all([
      getOrganizationIdForUser(admin, patientUserId, ['patient']),
      getOrganizationIdForUser(admin, clinicianUserId, ['clinician', 'nurse', 'admin']),
    ])

    if (!patientOrgId || !clinicianOrgId || patientOrgId !== clinicianOrgId) {
      return validationErrorResponse(
        'Patient und Arzt müssen in derselben aktiven Organisation sein.',
      )
    }

    const { data: assignment, error: upsertError } = await admin
      .from('clinician_patient_assignments')
      .upsert(
        {
          organization_id: patientOrgId,
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

    const [patientOrgId, clinicianOrgId] = await Promise.all([
      getOrganizationIdForUser(admin, patientUserId, ['patient']),
      getOrganizationIdForUser(admin, clinicianUserId, ['clinician', 'nurse', 'admin']),
    ])

    if (!patientOrgId || !clinicianOrgId || patientOrgId !== clinicianOrgId) {
      return validationErrorResponse(
        'Patient und Arzt müssen in derselben aktiven Organisation sein.',
      )
    }

    const { error: deleteError } = await admin
      .from('clinician_patient_assignments')
      .delete()
      .eq('organization_id', patientOrgId)
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