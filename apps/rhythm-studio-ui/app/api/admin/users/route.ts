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

type UpdateRoleBody = {
  userId?: string
  role?: UserRole
}

type CreateUserBody = {
  email?: string
  password?: string
  role?: UserRole
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

    return successResponse({ users })
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