import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { getSeedClinicalReasoningConfig } from '@/lib/cre/reasoning/configStore'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { env } from '@/lib/env'

type UntypedQueryBuilder = {
  select: (...args: unknown[]) => UntypedQueryBuilder
  eq: (...args: unknown[]) => UntypedQueryBuilder
  order: (...args: unknown[]) => UntypedQueryBuilder
  limit: (...args: unknown[]) => UntypedQueryBuilder
  maybeSingle: () => Promise<unknown>
  insert: (values: unknown) => UntypedQueryBuilder
  single: () => Promise<unknown>
}

type SupabaseErrorLike = {
  message?: string
  details?: string | null
  hint?: string | null
  code?: string | null
}

const createDraftSchema = z.object({
  change_reason: z.string().trim().min(1, 'change_reason is required.'),
})

const toSupabaseError = (error: unknown): SupabaseErrorLike | null => {
  if (!error || typeof error !== 'object') {
    return null
  }

  const candidate = error as SupabaseErrorLike
  if (
    typeof candidate.message !== 'string' &&
    typeof candidate.details !== 'string' &&
    typeof candidate.hint !== 'string' &&
    typeof candidate.code !== 'string'
  ) {
    return null
  }

  return candidate
}

const databaseError = (message: string, supabaseError?: unknown) => {
  const parsed = toSupabaseError(supabaseError)
  const details = parsed
    ? {
        details: parsed.details ?? null,
        hint: parsed.hint ?? null,
        code: parsed.code ?? null,
      }
    : undefined

  return NextResponse.json(
    {
      success: false,
      code: 'DATABASE_ERROR',
      message,
      ...(details ? { details } : {}),
    },
    { status: 500 },
  )
}

const validationError = (message: string, details?: unknown) => {
  return NextResponse.json(
    {
      success: false,
      code: 'VALIDATION_ERROR',
      message,
      ...(details ? { details } : {}),
    },
    { status: 400 },
  )
}

const misconfiguredError = (message: string) => {
  return NextResponse.json(
    {
      success: false,
      code: 'SERVER_MISCONFIGURED',
      message,
    },
    { status: 500 },
  )
}

export async function POST(request: Request) {
  const { user, error } = await requireAdminOrClinicianRole()
  if (error || !user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const parsedBody = createDraftSchema.safeParse(body)

    if (!parsedBody.success) {
      return validationError('change_reason is required.', {
        issues: parsedBody.error.issues,
      })
    }

    if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      console.error(
        'POST /api/admin/reasoning-config/versions misconfigured: SUPABASE_SERVICE_ROLE_KEY is missing.',
      )
      return misconfiguredError('SUPABASE_SERVICE_ROLE_KEY is not configured on the server.')
    }

    const admin = createAdminSupabaseClient()
    const fromUnknown = admin.from as unknown as (relation: string) => UntypedQueryBuilder

    const createdBy = (user.id || user.email || '').trim()
    if (!createdBy) {
      return validationError('Unable to resolve clinician identity for created_by.')
    }

    const { data: activeVersion, error: activeVersionError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .select('version, config_json')
      .eq('status', 'active')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()) as unknown as {
      data: { version: number; config_json: unknown } | null
      error: unknown
    }

    if (activeVersionError) {
      console.error(
        'DB error loading active reasoning config in POST /api/admin/reasoning-config/versions',
        activeVersionError,
      )
      const dbError = toSupabaseError(activeVersionError)
      return databaseError(
        dbError?.message || 'Failed to load active clinical reasoning config version.',
        activeVersionError,
      )
    }

    const nextVersion = (activeVersion?.version ?? 0) + 1

    const { data: inserted, error: insertError } = (await fromUnknown(
      'clinical_reasoning_configs',
    )
      .insert({
        version: nextVersion,
        status: 'draft',
        config_json: activeVersion?.config_json ?? getSeedClinicalReasoningConfig(),
        change_reason: parsedBody.data.change_reason,
        created_by: createdBy,
      })
      .select('id, version, status, config_json, change_reason, created_by, created_at')
      .single()) as unknown as { data: unknown; error: unknown }

    if (insertError) {
      console.error(
        'DB error creating reasoning draft in POST /api/admin/reasoning-config/versions',
        insertError,
      )
      const dbError = toSupabaseError(insertError)
      return databaseError(dbError?.message || 'Failed to create reasoning config draft.', insertError)
    }

    return successResponse(
      {
        versionId: (inserted as { id: string }).id,
        version: (inserted as { version: number }).version,
      },
      201,
    )
  } catch (error) {
    console.error('Error in POST /api/admin/reasoning-config/versions:', error)
    const dbError = toSupabaseError(error)
    return databaseError(dbError?.message || (error as Error)?.message || 'Failed to create reasoning config draft.', error)
  }
}
