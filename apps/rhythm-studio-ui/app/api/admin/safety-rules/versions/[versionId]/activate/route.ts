import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  missingFieldsResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { guardRuleActivation } from '@/lib/cre/safety/ruleConfig'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ versionId: string }> },
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

    const { versionId } = await params
    const admin = createAdminSupabaseClient()

    const { data: version, error: versionError } = await admin
      .from('safety_rule_versions' as any)
      .select('id, rule_id, version, status, logic_json, defaults, change_reason, safety_rules ( key )')
      .eq('id', versionId)
      .maybeSingle()

    if (versionError) {
      return databaseErrorResponse('Failed to load safety rule version.')
    }

    if (!version) {
      return notFoundResponse('Safety rule version')
    }

    if (version.status !== 'draft') {
      return validationErrorResponse('Only draft versions can be activated.')
    }

    const ruleKey = version.safety_rules?.key
    if (!ruleKey) {
      return validationErrorResponse('Safety rule key is missing.')
    }

    const guardResult = guardRuleActivation({
      ruleKey,
      logic: version.logic_json,
      defaults: version.defaults,
    })

    if (!guardResult.ok) {
      return validationErrorResponse('Safety rule activation guard failed.', {
        errors: guardResult.errors,
      })
    }

    const { data: activeVersions, error: activeError } = await admin
      .from('safety_rule_versions' as any)
      .select('id, status')
      .eq('rule_id', version.rule_id)
      .eq('status', 'active')

    if (activeError) {
      return databaseErrorResponse('Failed to load active safety rule version.')
    }

    const activeIds = (activeVersions ?? []).map((entry) => entry.id)

    if (activeIds.length > 0) {
      const { error: archiveError } = await admin
        .from('safety_rule_versions' as any)
        .update({ status: 'archived' })
        .in('id', activeIds)

      if (archiveError) {
        return databaseErrorResponse('Failed to archive active safety rule version.')
      }
    }

    const { data: activated, error: activateError } = await admin
      .from('safety_rule_versions' as any)
      .update({ status: 'active', change_reason: body.change_reason.trim() })
      .eq('id', versionId)
      .select('id, rule_id, version, status, logic_json, defaults, change_reason, created_by, created_at')
      .single()

    if (activateError) {
      return databaseErrorResponse('Failed to activate safety rule version.')
    }

    const { error: auditError } = await admin.from('operational_settings_audit' as any).insert({
      table_name: 'safety_rule_versions',
      record_id: versionId,
      operation: 'UPDATE',
      old_values: { status: version.status, version: version.version },
      new_values: { status: 'active', version: version.version },
      changed_by: user.id,
      change_reason: body.change_reason.trim(),
    })

    if (auditError) {
      console.error('Failed to write safety rule audit log', auditError)
      return databaseErrorResponse('Failed to write safety rule audit log.')
    }

    return successResponse({
      version: activated,
      archived_version_ids: activeIds,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/safety-rules/versions/[versionId]/activate:', error)
    return databaseErrorResponse('Failed to activate safety rule version.')
  }
}
