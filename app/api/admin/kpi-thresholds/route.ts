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
 * API Route: KPI Thresholds Management
 */

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: '/api/admin/kpi-thresholds' })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  const isAuthorized = await hasClinicianRole()
  if (!isAuthorized) {
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    const supabase = createAdminSupabaseClient()
    let query = supabase
      .from('kpi_thresholds' as any)
      .select('*')
      .order('name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: thresholds, error } = await query

    if (error) {
      logError('Error fetching KPI thresholds', { userId: user.id }, error)
      return internalErrorResponse('Fehler beim Laden der KPI-Schwellenwerte.')
    }

    return successResponse({ thresholds })
  } catch (error) {
    logError('Unexpected error in GET /api/admin/kpi-thresholds', { userId: user.id }, error)
    return internalErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  const isAuthorized = await hasClinicianRole()
  if (!isAuthorized) {
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  try {
    const body = await request.json()

    if (!body.kpi_key || !body.name || !body.metric_type) {
      return validationErrorResponse('Pflichtfelder fehlen: kpi_key, name, metric_type')
    }

    const validMetricTypes = ['percentage', 'count', 'duration', 'score']
    if (!validMetricTypes.includes(body.metric_type)) {
      return validationErrorResponse(`Ungültiger Metrik-Typ. Erlaubt: ${validMetricTypes.join(', ')}`)
    }

    const supabase = createAdminSupabaseClient()

    const { data: threshold, error } = await supabase
      .from('kpi_thresholds' as any)
      .insert({
        kpi_key: body.kpi_key,
        name: body.name,
        description: body.description || null,
        metric_type: body.metric_type,
        warning_threshold: body.warning_threshold || null,
        critical_threshold: body.critical_threshold || null,
        target_threshold: body.target_threshold || null,
        unit: body.unit || null,
        evaluation_period_days: body.evaluation_period_days || null,
        is_active: body.is_active ?? true,
        notify_on_breach: body.notify_on_breach ?? true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      logError('Error creating KPI threshold', { userId: user.id, body }, error)
      return internalErrorResponse('Fehler beim Erstellen des KPI-Schwellenwerts.')
    }

    return NextResponse.json({ success: true, data: { threshold } }, { status: 201 })
  } catch (error) {
    logError('Unexpected error in POST /api/admin/kpi-thresholds', { userId: user.id }, error)
    return internalErrorResponse()
  }
}
