import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  missingFieldsResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { getSeedClinicalReasoningConfig } from '@/lib/cre/reasoning/configStore'

type UntypedQueryBuilder = {
  select: (...args: unknown[]) => UntypedQueryBuilder
  order: (...args: unknown[]) => UntypedQueryBuilder
  limit: (...args: unknown[]) => UntypedQueryBuilder
  maybeSingle: () => Promise<unknown>
  insert: (values: unknown) => UntypedQueryBuilder
  single: () => Promise<unknown>
}

export async function POST(request: Request) {
  const { user, error } = await requireAdminOrClinicianRole()
  if (error || !user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const body = (await request.json()) as { change_reason?: string }
    if (!body.change_reason?.trim()) {
      return missingFieldsResponse('change_reason is required.')
    }

    const admin = createAdminSupabaseClient()
    const fromUnknown = admin.from as unknown as (relation: string) => UntypedQueryBuilder

    const { data: latestVersion, error: latestError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .select('version, config_json')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()) as unknown as {
      data: { version: number; config_json: unknown } | null
      error: unknown
    }

    if (latestError) {
      return databaseErrorResponse('Failed to load clinical reasoning config versions.')
    }

    const nextVersion = (latestVersion?.version ?? 0) + 1

    const { data: inserted, error: insertError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .insert({
        version: nextVersion,
        status: 'draft',
        config_json: latestVersion?.config_json ?? getSeedClinicalReasoningConfig(),
        change_reason: body.change_reason.trim(),
        created_by: user.id,
      })
      .select('id, version, status, config_json, change_reason, created_by, created_at')
      .single()) as unknown as { data: unknown; error: unknown }

    if (insertError) {
      return databaseErrorResponse('Failed to create reasoning config draft.')
    }

    return successResponse({ version: inserted }, 201)
  } catch (error) {
    console.error('Error in POST /api/admin/reasoning-config/versions:', error)
    return databaseErrorResponse('Failed to create reasoning config draft.')
  }
}
