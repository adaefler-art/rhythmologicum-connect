import { NextRequest } from 'next/server'
import { getCurrentUser, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logError } from '@/lib/logging/logger'

/**
 * API Route: Individual Notification Template Operations
 *
 * PUT /api/admin/notification-templates/[id]
 * - Updates an existing notification template
 *
 * DELETE /api/admin/notification-templates/[id]
 * - Deletes a notification template (only non-system templates)
 *
 * Authentication: Required (admin or clinician role)
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: `/api/admin/notification-templates/${id}` })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  // Authorization check
  const isAuthorized = await hasClinicianRole(user.id)
  if (!isAuthorized) {
    logUnauthorized({
      endpoint: `/api/admin/notification-templates/${id}`,
      userId: user.id,
      reason: 'Not admin or clinician',
    })
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return badRequestResponse('Ungültige Template-ID.')
  }

  try {
    const body = await request.json()
    const supabase = createAdminSupabaseClient()

    // Check if template exists
    const { data: existing } = await supabase
      .from('notification_templates' as any)
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) {
      return notFoundResponse('Template nicht gefunden.')
    }

    // Validate channel if provided
    if (body.channel) {
      const validChannels = ['in_app', 'email', 'sms']
      if (!validChannels.includes(body.channel)) {
        return badRequestResponse(`Ungültiger Kanal. Erlaubt: ${validChannels.join(', ')}`)
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_by: user.id,
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.channel !== undefined) updateData.channel = body.channel
    if (body.subject_template !== undefined) updateData.subject_template = body.subject_template
    if (body.body_template !== undefined) updateData.body_template = body.body_template
    if (body.variables !== undefined) updateData.variables = body.variables
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Update template
    const { data: template, error } = await supabase
      .from('notification_templates' as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error updating notification template', { userId: user.id, id, body }, error)
      return internalErrorResponse('Fehler beim Aktualisieren der Vorlage.')
    }

    return successResponse({ template })
  } catch (error) {
    logError('Unexpected error in PUT /api/admin/notification-templates/[id]', { userId: user.id, id }, error)
    return internalErrorResponse()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: `/api/admin/notification-templates/${id}` })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  // Authorization check
  const isAuthorized = await hasClinicianRole(user.id)
  if (!isAuthorized) {
    logUnauthorized({
      endpoint: `/api/admin/notification-templates/${id}`,
      userId: user.id,
      reason: 'Not admin or clinician',
    })
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return badRequestResponse('Ungültige Template-ID.')
  }

  try {
    const supabase = createAdminSupabaseClient()

    // Check if template exists and is not a system template
    const { data: existing } = await supabase
      .from('notification_templates' as any)
      .select('is_system')
      .eq('id', id)
      .single()

    if (!existing) {
      return notFoundResponse('Template nicht gefunden.')
    }

    if (existing.is_system) {
      return badRequestResponse('System-Templates können nicht gelöscht werden. Deaktivieren Sie sie stattdessen.')
    }

    // Delete template (this will trigger audit logging)
    const { error } = await supabase
      .from('notification_templates' as any)
      .delete()
      .eq('id', id)

    if (error) {
      logError('Error deleting notification template', { userId: user.id, id }, error)
      return internalErrorResponse('Fehler beim Löschen der Vorlage.')
    }

    return successResponse({ message: 'Template erfolgreich gelöscht.' })
  } catch (error) {
    logError('Unexpected error in DELETE /api/admin/notification-templates/[id]', { userId: user.id, id }, error)
    return internalErrorResponse()
  }
}
