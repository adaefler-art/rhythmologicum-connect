import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isUuid = (value: string) => UUID_REGEX.test(value)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  const { user: _user, error } = await requireAdminOrClinicianRole()
  if (error || !_user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const { ruleId } = await params
    const admin = createAdminSupabaseClient()

    const ruleQuery = admin
      .from('safety_rules' as any)
      .select('id, key, title, created_at')
      .eq(isUuid(ruleId) ? 'id' : 'key', ruleId)
      .maybeSingle()

    const { data: rule, error: ruleError } = await ruleQuery

    if (ruleError) {
      return databaseErrorResponse('Failed to load safety rule.')
    }

    if (!rule) {
      return notFoundResponse('Safety rule')
    }

    const { data: versions, error: versionsError } = await admin
      .from('safety_rule_versions' as any)
      .select(
        'id, rule_id, version, status, logic_json, defaults, change_reason, created_by, created_at',
      )
      .eq('rule_id', rule.id)
      .order('version', { ascending: false })

    if (versionsError) {
      return databaseErrorResponse('Failed to load safety rule versions.')
    }

    return successResponse({ rule, versions: versions ?? [] })
  } catch (error) {
    console.error('Error in GET /api/admin/safety-rules/[ruleId]:', error)
    return databaseErrorResponse('Failed to load safety rule.')
  }
}
