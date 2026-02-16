import { requireAuth } from '@/lib/api/authHelpers'
import {
  configurationErrorResponse,
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

function isAdmin(user: {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}) {
  const role = user.app_metadata?.role || user.user_metadata?.role
  return role === 'admin'
}

type RouteContext = {
  params: Promise<{ userId: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, error } = await requireAuth()
  if (error || !user) {
    return error ?? internalErrorResponse('Authentifizierung fehlgeschlagen.')
  }

  if (!isAdmin(user)) {
    return forbiddenResponse('Nur Administratoren dürfen Benutzer löschen.')
  }

  const params = await context.params
  const userId = params.userId?.trim()

  if (!userId) {
    return validationErrorResponse('userId ist erforderlich.')
  }

  if (userId === user.id) {
    return validationErrorResponse('Sie können sich nicht selbst löschen.')
  }

  try {
    const admin = createAdminSupabaseClient()

    const { data: existing, error: existingError } = await admin.auth.admin.getUserById(userId)
    if (existingError || !existing?.user) {
      return validationErrorResponse('Benutzer nicht gefunden.')
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      return internalErrorResponse('Benutzer konnte nicht gelöscht werden.')
    }

    return successResponse({ deleted: true, userId })
  } catch (caughtError) {
    if (caughtError instanceof Error && caughtError.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return configurationErrorResponse('SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert.')
    }

    console.error('DELETE /api/admin/users/[userId] failed:', caughtError)
    return internalErrorResponse('Benutzer konnte nicht gelöscht werden.')
  }
}
