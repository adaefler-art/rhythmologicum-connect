import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import { databaseErrorResponse, successResponse, unauthorizedResponse } from '@/lib/api/responses'

export async function GET() {
  const { user: _user, error } = await requireAdminOrClinicianRole()
  if (error || !_user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const admin = createAdminSupabaseClient()

    const { data: rules, error: rulesError } = await admin
      .from('safety_rules' as any)
      .select('id, key, title, created_at')
      .order('title', { ascending: true })

    if (rulesError) {
      return databaseErrorResponse('Failed to load safety rules.')
    }

    const { data: activeVersions, error: versionsError } = await admin
      .from('safety_rule_versions' as any)
      .select('id, rule_id, version, status, created_at, change_reason, created_by, defaults')
      .eq('status', 'active')

    if (versionsError) {
      return databaseErrorResponse('Failed to load active safety rule versions.')
    }

    const activeByRule = new Map(
      (activeVersions ?? []).map((version) => [version.rule_id, version])
    )

    const payload = (rules ?? []).map((rule) => ({
      ...rule,
      active_version: activeByRule.get(rule.id) ?? null,
    }))

    return successResponse({ rules: payload })
  } catch (error) {
    console.error('Error in GET /api/admin/safety-rules:', error)
    return databaseErrorResponse('Failed to load safety rules.')
  }
}
