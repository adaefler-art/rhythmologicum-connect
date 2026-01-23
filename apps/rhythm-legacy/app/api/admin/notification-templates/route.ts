import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logError } from '@/lib/logging/logger'

/**
 * API Route: Notification Templates Management
 *
 * GET /api/admin/notification-templates
 * - Fetches all notification templates
 * - Query params: ?active_only=true
 *
 * POST /api/admin/notification-templates
 * - Creates a new notification template
 *
 * Authentication: Required (admin or clinician role)
 */

export async function GET(request: NextRequest) {
  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: '/api/admin/notification-templates' })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  // Authorization check
  const isAuthorized = await hasClinicianRole()
  if (!isAuthorized) {
    logUnauthorized({
      endpoint: '/api/admin/notification-templates',
      userId: user.id,
      reason: 'Not admin or clinician',
    })
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    const supabase = createAdminSupabaseClient()
    let query = supabase
      .from('notification_templates' as any)
      .select('*')
      .order('name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: templates, error } = await query

    if (error) {
      logError('Error fetching notification templates', { userId: user.id }, error)
      return internalErrorResponse('Fehler beim Laden der Vorlagen.')
    }

    return successResponse({ templates })
  } catch (error) {
    logError('Unexpected error in GET /api/admin/notification-templates', { userId: user.id }, error)
    return internalErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: '/api/admin/notification-templates' })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  // Authorization check
  const isAuthorized = await hasClinicianRole()
  if (!isAuthorized) {
    logUnauthorized({
      endpoint: '/api/admin/notification-templates',
      userId: user.id,
      reason: 'Not admin or clinician',
    })
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.template_key || !body.name || !body.channel || !body.body_template) {
      return validationErrorResponse('Pflichtfelder fehlen: template_key, name, channel, body_template')
    }

    // Validate channel
    const validChannels = ['in_app', 'email', 'sms']
    if (!validChannels.includes(body.channel)) {
      return validationErrorResponse(`Ungültiger Kanal. Erlaubt: ${validChannels.join(', ')}`)
    }

    const supabase = createAdminSupabaseClient()

    // Check if template_key already exists
    const { data: existing } = await supabase
      .from('notification_templates' as any)
      .select('id')
      .eq('template_key', body.template_key)
      .single()

    if (existing) {
      return validationErrorResponse('Ein Template mit diesem Schlüssel existiert bereits.')
    }

    // Create template
    const { data: template, error } = await supabase
      .from('notification_templates' as any)
      .insert({
        template_key: body.template_key,
        name: body.name,
        description: body.description || null,
        channel: body.channel,
        subject_template: body.subject_template || null,
        body_template: body.body_template,
        variables: body.variables || [],
        is_active: body.is_active ?? true,
        is_system: false,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      logError('Error creating notification template', { userId: user.id, body }, error)
      return internalErrorResponse('Fehler beim Erstellen der Vorlage.')
    }

    return NextResponse.json(
      {
        success: true,
        data: { template },
      },
      { status: 201 },
    )
  } catch (error) {
    logError('Unexpected error in POST /api/admin/notification-templates', { userId: user.id }, error)
    return internalErrorResponse()
  }
}
