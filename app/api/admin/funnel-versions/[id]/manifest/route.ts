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
import { FunnelContentManifestSchema } from '@/lib/contracts/funnelManifest'
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from '@/lib/contracts/registry'
import { ZodError } from 'zod'

/**
 * V05-I06.4 API Endpoint: Get funnel version content manifest
 * GET /api/admin/funnel-versions/[id]/manifest
 * 
 * Returns the content_manifest JSONB from funnel_versions table
 * Validates manifest structure before returning
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request)

  try {
    const { id: versionId } = await params

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

    // Authorization gate (clinician/admin only)
    const role = user.app_metadata?.role || user.user_metadata?.role
    const isAuthorized = role === 'clinician' || role === 'admin'
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(), requestId)
    }

    // Fetch funnel version
    const { data: version, error: versionError } = await authClient
      .from('funnel_versions')
      .select('id, funnel_id, version, content_manifest')
      .eq('id', versionId)
      .single()

    if (versionError || !version) {
      const sanitized = sanitizeSupabaseError(versionError)
      
      // PGRST116: .single() could not coerce result (0 rows found)
      if (sanitized.code === 'PGRST116') {
        return withRequestId(notFoundResponse('Funnel version not found'), requestId)
      }

      const classified = classifySupabaseError(versionError)
      logError({
        requestId,
        operation: 'fetch_funnel_version_manifest',
        error: versionError,
        versionId,
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      return withRequestId(
        databaseErrorResponse('Failed to fetch funnel version'),
        requestId,
      )
    }

    // Validate manifest structure
    try {
      const validatedManifest = FunnelContentManifestSchema.parse(version.content_manifest)

      return withRequestId(
        successResponse({
          versionId: version.id,
          funnelId: version.funnel_id,
          version: version.version,
          manifest: validatedManifest,
        }),
        requestId,
      )
    } catch (error) {
      if (error instanceof ZodError) {
        logError({
          requestId,
          operation: 'validate_manifest_get',
          error,
          versionId,
        })
        return withRequestId(
          validationErrorResponse('Invalid manifest structure', {
            details: error.issues,
          }),
          requestId,
        )
      }
      throw error
    }
  } catch (error) {
    logError({
      requestId,
      operation: 'get_funnel_version_manifest',
      error,
    })
    return withRequestId(internalErrorResponse(), requestId)
  }
}

/**
 * V05-I06.4 API Endpoint: Update funnel version content manifest
 * PUT /api/admin/funnel-versions/[id]/manifest
 * 
 * Updates the content_manifest JSONB in funnel_versions table
 * Strictly validates manifest structure before saving
 * Logs change to audit_log
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request)

  try {
    const { id: versionId } = await params

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

    // Authorization gate (clinician/admin only)
    const role = user.app_metadata?.role || user.user_metadata?.role
    const isAuthorized = role === 'clinician' || role === 'admin'
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(), requestId)
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return withRequestId(
        validationErrorResponse('Invalid JSON in request body'),
        requestId,
      )
    }

    if (!body || typeof body !== 'object' || !('manifest' in body)) {
      return withRequestId(
        validationErrorResponse('Request body must contain "manifest" field'),
        requestId,
      )
    }

    // Strict validation of manifest
    let validatedManifest
    try {
      validatedManifest = FunnelContentManifestSchema.parse((body as { manifest: unknown }).manifest)
    } catch (error) {
      if (error instanceof ZodError) {
        logError({
          requestId,
          operation: 'validate_manifest_put',
          error,
          versionId,
        })
        return withRequestId(
          validationErrorResponse('Invalid manifest structure', {
            details: error.issues,
          }),
          requestId,
        )
      }
      throw error
    }

    // Update manifest using admin client for audit trail
    const adminClient = createAdminSupabaseClient()

    const { data: updatedVersion, error: updateError } = await adminClient
      .from('funnel_versions')
      .update({
        content_manifest: validatedManifest,
        updated_at: new Date().toISOString(),
      })
      .eq('id', versionId)
      .select('id, funnel_id, version, content_manifest')
      .single()

    if (updateError || !updatedVersion) {
      const sanitized = sanitizeSupabaseError(updateError)
      
      // PGRST116: .single() could not coerce result (0 rows found)
      if (sanitized.code === 'PGRST116') {
        return withRequestId(notFoundResponse('Funnel version not found'), requestId)
      }

      const classified = classifySupabaseError(updateError)
      logError({
        requestId,
        operation: 'update_funnel_version_manifest',
        error: updateError,
        versionId,
      })

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      return withRequestId(
        databaseErrorResponse('Failed to update manifest'),
        requestId,
      )
    }

    // Audit log
    const { error: auditError } = await adminClient.from('audit_log').insert({
      entity_type: AUDIT_ENTITY_TYPE.FUNNEL_VERSION,
      entity_id: versionId,
      action: AUDIT_ACTION.UPDATE,
      actor_id: user.id,
      source: AUDIT_SOURCE.ADMIN_UI,
      metadata: {
        field: 'content_manifest',
        page_count: validatedManifest.pages.length,
      },
    })

    if (auditError) {
      logError({
        requestId,
        operation: 'audit_manifest_update',
        error: auditError,
        versionId,
      })
      // Don't fail the request if audit logging fails
    }

    return withRequestId(
      successResponse({
        versionId: updatedVersion.id,
        funnelId: updatedVersion.funnel_id,
        version: updatedVersion.version,
        manifest: updatedVersion.content_manifest,
      }),
      requestId,
    )
  } catch (error) {
    logError({
      requestId,
      operation: 'put_funnel_version_manifest',
      error,
    })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
