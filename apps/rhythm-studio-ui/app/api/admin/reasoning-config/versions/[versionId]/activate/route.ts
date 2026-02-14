import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  missingFieldsResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { guardReasoningActivation } from '@/lib/cre/reasoning/config'

type UntypedQueryBuilder = {
  select: (...args: unknown[]) => UntypedQueryBuilder
  eq: (...args: unknown[]) => UntypedQueryBuilder
  maybeSingle: () => Promise<unknown>
  update: (values: unknown) => UntypedQueryBuilder
  in: (...args: unknown[]) => Promise<unknown> | UntypedQueryBuilder
  single: () => Promise<unknown>
  insert: (values: unknown) => Promise<unknown>
}

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
    const fromUnknown = admin.from.bind(admin) as unknown as (
      relation: string,
    ) => UntypedQueryBuilder

    const { data: version, error: versionError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .select('id, version, status, config_json')
      .eq('id', versionId)
      .maybeSingle()) as unknown as {
      data:
        | {
            id: string
            version: number
            status: 'draft' | 'active' | 'archived'
            config_json: unknown
          }
        | null
      error: unknown
    }

    if (versionError) {
      return databaseErrorResponse('Failed to load reasoning config version.')
    }

    if (!version) {
      return notFoundResponse('Reasoning config version')
    }

    if (version.status !== 'draft') {
      return validationErrorResponse('Only draft versions can be activated.')
    }

    const guard = guardReasoningActivation(version.config_json)
    if (!guard.ok) {
      return validationErrorResponse('Reasoning config activation guard failed.', {
        errors: guard.errors,
      })
    }

    const { data: activeVersions, error: activeError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .select('id')
      .eq('status', 'active')) as unknown as {
      data: Array<{ id: string }> | null
      error: unknown
    }

    if (activeError) {
      return databaseErrorResponse('Failed to load active reasoning config version.')
    }

    const activeIds = ((activeVersions ?? []) as Array<{ id: string }>).map((entry) => entry.id)

    if (activeIds.length > 0) {
      const { error: archiveError } = (await fromUnknown('clinical_reasoning_configs')
        .update({ status: 'archived' })
        .in('id', activeIds)) as { error: unknown }

      if (archiveError) {
        return databaseErrorResponse('Failed to archive active reasoning config version.')
      }
    }

    const { data: activated, error: activateError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .update({ status: 'active', change_reason: body.change_reason.trim() })
      .eq('id', versionId)
      .select('id, version, status, config_json, change_reason, created_by, created_at')
      .single()) as unknown as { data: unknown; error: unknown }

    if (activateError) {
      return databaseErrorResponse('Failed to activate reasoning config version.')
    }

    await fromUnknown('operational_settings_audit').insert({
      table_name: 'clinical_reasoning_configs',
      record_id: versionId,
      operation: 'UPDATE',
      old_values: { status: version.status, version: version.version },
      new_values: { status: 'active', version: version.version },
      changed_by: user.id,
      change_reason: body.change_reason.trim(),
    })

    return successResponse({
      version: activated,
      archived_version_ids: activeIds,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/reasoning-config/versions/[versionId]/activate:', error)
    return databaseErrorResponse('Failed to activate reasoning config version.')
  }
}
