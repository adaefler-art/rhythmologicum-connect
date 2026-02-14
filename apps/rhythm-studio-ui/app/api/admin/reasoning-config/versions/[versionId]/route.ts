import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { validateClinicalReasoningConfig } from '@/lib/cre/reasoning/config'

type UntypedQueryBuilder = {
  select: (...args: unknown[]) => UntypedQueryBuilder
  eq: (...args: unknown[]) => UntypedQueryBuilder
  maybeSingle: () => Promise<unknown>
  update: (values: unknown) => UntypedQueryBuilder
  single: () => Promise<unknown>
}

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
      config_json?: unknown
      change_reason?: string
    }

    const { versionId } = await params
    const admin = createAdminSupabaseClient()
    const fromUnknown = admin.from.bind(admin) as unknown as (
      relation: string,
    ) => UntypedQueryBuilder

    const { data: version, error: versionError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .select('id, status')
      .eq('id', versionId)
      .maybeSingle()) as unknown as {
      data: { id: string; status: 'draft' | 'active' | 'archived' } | null
      error: unknown
    }

    if (versionError) {
      return databaseErrorResponse('Failed to load reasoning config version.')
    }

    if (!version) {
      return notFoundResponse('Reasoning config version')
    }

    if (version.status !== 'draft') {
      return validationErrorResponse('Only draft versions can be edited.')
    }

    const updatePayload: Record<string, unknown> = {}

    if (body.config_json !== undefined) {
      const validation = validateClinicalReasoningConfig(body.config_json)
      if (!validation.ok) {
        return validationErrorResponse('Invalid config_json payload.', {
          errors: validation.errors,
        })
      }
      updatePayload.config_json = validation.value
    }

    if (body.change_reason !== undefined) {
      updatePayload.change_reason = body.change_reason
    }

    if (Object.keys(updatePayload).length === 0) {
      return validationErrorResponse('No changes provided.')
    }

    const { data: updated, error: updateError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .update(updatePayload)
      .eq('id', versionId)
      .select('id, version, status, config_json, change_reason, created_by, created_at')
      .single()) as unknown as { data: unknown; error: unknown }

    if (updateError) {
      return databaseErrorResponse('Failed to update reasoning config version.')
    }

    return successResponse({ version: updated })
  } catch (error) {
    console.error('Error in PATCH /api/admin/reasoning-config/versions/[versionId]:', error)
    return databaseErrorResponse('Failed to update reasoning config version.')
  }
}
