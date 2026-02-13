import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  missingFieldsResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isUuid = (value: string) => UUID_REGEX.test(value)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  const { user, error } = await requireAdminOrClinicianRole()
  if (error || !user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const body = (await request.json()) as { change_reason?: string }
    if (!body.change_reason?.trim()) {
      return missingFieldsResponse('change_reason is required.')
    }

    const { ruleId } = await params
    const admin = createAdminSupabaseClient()

    const { data: rule, error: ruleError } = await admin
      .from('safety_rules' as any)
      .select('id, key, title')
      .eq(isUuid(ruleId) ? 'id' : 'key', ruleId)
      .maybeSingle()

    if (ruleError) {
      return databaseErrorResponse('Failed to load safety rule.')
    }

    if (!rule) {
      return notFoundResponse('Safety rule')
    }

    const latestQuery = admin
      .from('safety_rule_versions' as any)
      .select('id, version, logic_json, defaults')
      .eq('rule_id', rule.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle() as any

    const { data: latestVersion, error: latestError } = await latestQuery

    if (latestError) {
      return databaseErrorResponse('Failed to read safety rule versions.')
    }

    const nextVersion = (latestVersion?.version ?? 0) + 1

    const { data: newVersion, error: insertError } = await admin
      .from('safety_rule_versions' as any)
      .insert({
        rule_id: rule.id,
        version: nextVersion,
        status: 'draft',
        logic_json: latestVersion?.logic_json ?? {},
        defaults: latestVersion?.defaults ?? {},
        change_reason: body.change_reason.trim(),
        created_by: user.id,
      })
      .select(
        'id, rule_id, version, status, logic_json, defaults, change_reason, created_by, created_at',
      )
      .single()

    if (insertError) {
      return databaseErrorResponse('Failed to create draft safety rule version.')
    }

    return successResponse({ version: newVersion }, 201)
  } catch (error) {
    console.error('Error in POST /api/admin/safety-rules/[ruleId]/versions:', error)
    return databaseErrorResponse('Failed to create draft safety rule version.')
  }
}
