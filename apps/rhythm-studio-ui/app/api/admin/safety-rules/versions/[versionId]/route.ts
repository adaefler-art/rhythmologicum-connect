import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { ruleDefaultsSchema, validateRuleConfig } from '@/lib/cre/safety/ruleConfig'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  const { user: _user, error } = await requireAdminOrClinicianRole()
  if (error || !_user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const body = (await request.json()) as {
      logic_json?: unknown
      defaults?: unknown
      change_reason?: string
    }

    const { versionId } = await params
    const admin = createAdminSupabaseClient()

    const { data: version, error: versionError } = (await admin
      .from('safety_rule_versions' as any)
      .select('id, status')
      .eq('id', versionId)
      .maybeSingle()) as any

    if (versionError) {
      return databaseErrorResponse('Failed to load safety rule version.')
    }

    if (!version) {
      return notFoundResponse('Safety rule version')
    }

    if (version.status !== 'draft') {
      return validationErrorResponse('Only draft versions can be edited.')
    }

    const updatePayload: Record<string, unknown> = {}

    if (body.logic_json !== undefined) {
      const validation = validateRuleConfig(body.logic_json)
      if (!validation.ok) {
        return validationErrorResponse('Invalid logic_json payload.', {
          errors: validation.errors,
        })
      }
      updatePayload.logic_json = body.logic_json
    }

    if (body.defaults !== undefined) {
      const defaultsValidation = ruleDefaultsSchema.safeParse(body.defaults)
      if (!defaultsValidation.success) {
        return validationErrorResponse('Invalid defaults payload.', {
          errors: defaultsValidation.error.issues.map((issue) => issue.message),
        })
      }
      updatePayload.defaults = body.defaults
    }

    if (body.change_reason !== undefined) {
      updatePayload.change_reason = body.change_reason
    }

    if (Object.keys(updatePayload).length === 0) {
      return validationErrorResponse('No changes provided.')
    }

    const { data: updated, error: updateError } = await admin
      .from('safety_rule_versions' as any)
      .update(updatePayload)
      .eq('id', versionId)
      .select(
        'id, rule_id, version, status, logic_json, defaults, change_reason, created_by, created_at',
      )
      .single()

    if (updateError) {
      return databaseErrorResponse('Failed to update safety rule version.')
    }

    return successResponse({ version: updated })
  } catch (error) {
    console.error('Error in PATCH /api/admin/safety-rules/versions/[versionId]:', error)
    return databaseErrorResponse('Failed to update safety rule version.')
  }
}
