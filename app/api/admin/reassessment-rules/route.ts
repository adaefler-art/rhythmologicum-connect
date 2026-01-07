import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
  badRequestResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logError } from '@/lib/logging/logger'

/**
 * API Route: Reassessment Rules Management
 */

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: '/api/admin/reassessment-rules' })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  const isAuthorized = await hasClinicianRole(user.id)
  if (!isAuthorized) {
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    const supabase = createAdminSupabaseClient()
    let query = supabase
      .from('reassessment_rules' as any)
      .select('*')
      .order('priority', { ascending: false })
      .order('rule_name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: rules, error } = await query

    if (error) {
      logError('Error fetching reassessment rules', { userId: user.id }, error)
      return internalErrorResponse('Fehler beim Laden der Regeln.')
    }

    return successResponse({ rules })
  } catch (error) {
    logError('Unexpected error in GET /api/admin/reassessment-rules', { userId: user.id }, error)
    return internalErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  const isAuthorized = await hasClinicianRole(user.id)
  if (!isAuthorized) {
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  try {
    const body = await request.json()

    if (!body.rule_name || !body.trigger_condition) {
      return badRequestResponse('Pflichtfelder fehlen: rule_name, trigger_condition')
    }

    if (!body.schedule_interval_days && !body.schedule_cron) {
      return badRequestResponse('Entweder schedule_interval_days oder schedule_cron muss angegeben werden.')
    }

    const supabase = createAdminSupabaseClient()

    const { data: rule, error } = await supabase
      .from('reassessment_rules' as any)
      .insert({
        rule_name: body.rule_name,
        description: body.description || null,
        funnel_id: body.funnel_id || null,
        trigger_condition: body.trigger_condition,
        schedule_interval_days: body.schedule_interval_days || null,
        schedule_cron: body.schedule_cron || null,
        priority: body.priority || 'medium',
        is_active: body.is_active ?? true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      logError('Error creating reassessment rule', { userId: user.id, body }, error)
      return internalErrorResponse('Fehler beim Erstellen der Regel.')
    }

    return NextResponse.json({ success: true, data: { rule } }, { status: 201 })
  } catch (error) {
    logError('Unexpected error in POST /api/admin/reassessment-rules', { userId: user.id }, error)
    return internalErrorResponse()
  }
}
