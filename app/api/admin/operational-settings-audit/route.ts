import { NextRequest } from 'next/server'
import { getCurrentUser, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logError } from '@/lib/logging/logger'

/**
 * API Route: Operational Settings Audit Logs
 *
 * GET /api/admin/operational-settings-audit
 * - Fetches audit trail for operational settings changes
 * - Query params:
 *   - table_name: filter by table (notification_templates, reassessment_rules, kpi_thresholds)
 *   - record_id: filter by specific record
 *   - limit: number of records (default 50, max 200)
 *   - offset: pagination offset
 *
 * Authentication: Required (admin or clinician role)
 */

export async function GET(request: NextRequest) {
  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: '/api/admin/operational-settings-audit' })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  // Authorization check
  const isAuthorized = await hasClinicianRole(user.id)
  if (!isAuthorized) {
    logUnauthorized({
      endpoint: '/api/admin/operational-settings-audit',
      userId: user.id,
      reason: 'Not admin or clinician',
    })
    return unauthorizedResponse('Zugriff verweigert. Admin- oder Clinician-Rolle erforderlich.')
  }

  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table_name')
    const recordId = searchParams.get('record_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createAdminSupabaseClient()
    let query = supabase
      .from('operational_settings_audit' as any)
      .select('*', { count: 'exact' })
      .order('changed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (tableName) {
      query = query.eq('table_name', tableName)
    }

    if (recordId) {
      query = query.eq('record_id', recordId)
    }

    const { data: auditLogs, error, count } = (await query) as {
      data: any[] | null
      error: any
      count: number | null
    }

    if (error) {
      logError('Error fetching audit logs', { userId: user.id }, error)
      return internalErrorResponse('Fehler beim Laden der Audit-Logs.')
    }

    return successResponse({
      auditLogs: auditLogs || [],
      total: count || 0,
      hasMore: count ? offset + limit < count : false,
    })
  } catch (error) {
    logError('Unexpected error in GET /api/admin/operational-settings-audit', { userId: user.id }, error)
    return internalErrorResponse()
  }
}
