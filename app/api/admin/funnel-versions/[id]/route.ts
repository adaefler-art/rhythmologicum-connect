import { NextRequest, NextResponse } from 'next/server'
import {
  configurationErrorResponse,
  databaseErrorResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  schemaNotReadyResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  classifySupabaseError,
  sanitizeSupabaseError,
  getRequestId,
  withRequestId,
  isBlank,
  logError,
} from '@/lib/db/errors'
import { env } from '@/lib/env'

/**
 * UUID v4 regex pattern for strict validation
 */
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value.trim())
}

/**
 * V05-I09.3 API Endpoint: Update funnel version settings
 * PATCH /api/admin/funnel-versions/[id]
 * 
 * Allows admins to update:
 * - is_default: Set this version as the default for the funnel
 * - rollout_percent: Control gradual rollout (0-100)
 * - algorithm_bundle_version: Algorithm version string
 * - prompt_version: Prompt version string
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request)

  try {
    const { id: versionId } = await params

    // Validate UUID format
    if (!isUuidV4(versionId)) {
      return withRequestId(
        validationErrorResponse('Invalid funnel version ID format'),
        requestId,
      )
    }

    // Check Supabase configuration
    if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return withRequestId(
        configurationErrorResponse(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        ),
        requestId,
      )
    }

    // Auth gate
    const authClient = await createServerSupabaseClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    // Authorization gate (admin/clinician only)
    const role = user.app_metadata?.role || user.user_metadata?.role
    const isAuthorized = role === 'clinician' || role === 'admin'
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(), requestId)
    }

    // Parse request body
    const body = await request.json()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Validate and add is_default
    if (typeof body.is_default === 'boolean') {
      updateData.is_default = body.is_default
    }

    // Validate and add rollout_percent
    if (body.rollout_percent !== undefined) {
      const rollout = Number(body.rollout_percent)
      if (isNaN(rollout) || rollout < 0 || rollout > 100) {
        return withRequestId(
          validationErrorResponse('rollout_percent must be between 0 and 100'),
          requestId,
        )
      }
      updateData.rollout_percent = rollout
    }

    // Validate and add algorithm_bundle_version
    if (typeof body.algorithm_bundle_version === 'string') {
      const trimmed = body.algorithm_bundle_version.trim()
      if (trimmed.length === 0) {
        return withRequestId(
          validationErrorResponse('algorithm_bundle_version cannot be empty'),
          requestId,
        )
      }
      updateData.algorithm_bundle_version = trimmed
    }

    // Validate and add prompt_version
    if (typeof body.prompt_version === 'string') {
      const trimmed = body.prompt_version.trim()
      if (trimmed.length === 0) {
        return withRequestId(
          validationErrorResponse('prompt_version cannot be empty'),
          requestId,
        )
      }
      updateData.prompt_version = trimmed
    }

    // Use admin client for cross-user writes
    let writeClient
    let usingAdminClient = false
    try {
      writeClient = createAdminSupabaseClient()
      usingAdminClient = true
    } catch (err) {
      logError({
        requestId,
        operation: 'create_admin_client_for_version_update',
        userId: user.id,
        error: err,
      })
      writeClient = authClient
    }

    // If setting as default, first unset other defaults for the same funnel
    // NOTE: This is not a true database transaction due to Supabase client limitations.
    // In production, consider using a database function with proper transaction handling
    // to ensure atomic default version switching across all three operations:
    // 1. Unset is_default on other versions
    // 2. Update funnels_catalog.default_version_id
    // 3. Set is_default on target version
    if (updateData.is_default === true) {
      // Get the funnel_id for this version
      const { data: versionData, error: versionError } = await writeClient
        .from('funnel_versions')
        .select('funnel_id')
        .eq('id', versionId)
        .single()

      if (versionError) {
        const safeErr = sanitizeSupabaseError(versionError)
        if (safeErr.code === 'PGRST116') {
          return withRequestId(
            notFoundResponse('Funnel Version', `Version not found with ID: "${versionId}"`),
            requestId,
          )
        }
        const classified = classifySupabaseError(safeErr)
        if (classified.kind === 'SCHEMA_NOT_READY') {
          logError({
            requestId,
            operation: 'fetch_version_for_default_update',
            userId: user.id,
            error: safeErr,
          })
          return withRequestId(schemaNotReadyResponse(), requestId)
        }
        logError({
          requestId,
          operation: 'fetch_version_for_default_update',
          userId: user.id,
          error: safeErr,
        })
        return withRequestId(
          internalErrorResponse('Failed to fetch version data'),
          requestId,
        )
      }

      if (versionData?.funnel_id) {
        // Unset is_default for all other versions of this funnel
        const { error: unsetError } = await writeClient
          .from('funnel_versions')
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq('funnel_id', versionData.funnel_id)
          .neq('id', versionId)

        if (unsetError) {
          logError({
            requestId,
            operation: 'unset_other_default_versions',
            userId: user.id,
            error: unsetError,
          })
          // Critical error - don't continue if we can't unset other defaults
          // This prevents multiple versions from being marked as default
          const classified = classifySupabaseError(unsetError)
          if (classified.kind === 'SCHEMA_NOT_READY') {
            return withRequestId(schemaNotReadyResponse(), requestId)
          }
          if (classified.kind === 'AUTH_OR_RLS') {
            return withRequestId(forbiddenResponse(), requestId)
          }
          return withRequestId(
            internalErrorResponse('Failed to update default version settings'),
            requestId,
          )
        }

        // Also update the funnels_catalog.default_version_id
        const { error: catalogError } = await writeClient
          .from('funnels_catalog')
          .update({ default_version_id: versionId, updated_at: new Date().toISOString() })
          .eq('id', versionData.funnel_id)

        if (catalogError) {
          logError({
            requestId,
            operation: 'update_funnel_catalog_default_version',
            userId: user.id,
            error: catalogError,
          })
          // This is less critical - version is_default is the source of truth
          // Log but continue with version update
        }
      }
    }

    // Update the version
    let { data, error } = await writeClient
      .from('funnel_versions')
      .update(updateData)
      .eq('id', versionId)
      .select()
      .single()

    // Retry with auth client if admin client failed
    if (error && usingAdminClient) {
      const classified = classifySupabaseError(error)
      if (classified.kind === 'CONFIGURATION_ERROR' || classified.kind === 'AUTH_OR_RLS') {
        logError({
          requestId,
          operation: 'update_funnel_version_admin_fallback',
          userId: user.id,
          error,
        })
        usingAdminClient = false
        writeClient = authClient

        // Retry the update
        ;({ data, error } = await writeClient
          .from('funnel_versions')
          .update(updateData)
          .eq('id', versionId)
          .select()
          .single())
      }
    }

    if (error) {
      const safeErr = sanitizeSupabaseError(error)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        logError({
          requestId,
          operation: 'update_funnel_version',
          userId: user.id,
          error: safeErr,
        })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      if (classified.kind === 'AUTH_OR_RLS') {
        logError({
          requestId,
          operation: 'update_funnel_version',
          userId: user.id,
          error: safeErr,
        })
        return withRequestId(forbiddenResponse(), requestId)
      }

      if (classified.kind === 'TRANSIENT') {
        logError({
          requestId,
          operation: 'update_funnel_version',
          userId: user.id,
          error: safeErr,
        })
        return withRequestId(databaseErrorResponse(), requestId)
      }

      if (classified.kind === 'CONFIGURATION_ERROR') {
        logError({
          requestId,
          operation: 'update_funnel_version',
          userId: user.id,
          error: safeErr,
        })
        return withRequestId(
          configurationErrorResponse(
            'Server-Konfigurationsfehler (Supabase). Bitte prüfen Sie URL/Keys (gleiches Projekt, keine Anführungszeichen, keine Leerzeichen/Zeilenumbrüche) und deployen Sie erneut.',
          ),
          requestId,
        )
      }

      if (safeErr.code === 'PGRST116') {
        return withRequestId(
          notFoundResponse('Funnel Version', `Version not found with ID: "${versionId}"`),
          requestId,
        )
      }

      logError({
        requestId,
        operation: 'update_funnel_version',
        userId: user.id,
        error: safeErr,
      })
      return withRequestId(internalErrorResponse('Failed to update funnel version'), requestId)
    }

    return withRequestId(successResponse({ version: data }), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, operation: 'PATCH /api/admin/funnel-versions/[id]', error: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
