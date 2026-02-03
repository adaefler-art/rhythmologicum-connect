import { NextRequest, NextResponse } from 'next/server'
import {
	configurationErrorResponse,
	databaseErrorResponse,
	errorResponse,
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
import { ErrorCode } from '@/lib/api/responseTypes'
import { ZodError } from 'zod'
import { createHash } from 'crypto'
import { validateContentManifest, formatValidationErrors } from '@/lib/validators/funnelDefinition'

/**
 * UUID v4 regex pattern for strict validation
 * Matches: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x is [0-9a-f] and y is [89ab]
 */
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuidV4(value: string): boolean {
	return UUID_V4_PATTERN.test(value.trim())
}

/**
 * Maximum request body size (10 MB)
 * Prevents DoS via large payloads
 */
const MAX_BODY_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Creates a deterministic SHA-256 hash of a manifest
 * Used for audit logging without storing PHI/content
 */
function hashManifest(manifest: unknown): string {
	const manifestJson = JSON.stringify(manifest, Object.keys(manifest as object).sort())
	return createHash('sha256').update(manifestJson).digest('hex').substring(0, 16)
}

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

		// Validate UUID format early
		if (!isUuidV4(versionId)) {
			return withRequestId(
				validationErrorResponse('Invalid funnel version id format'),
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

		// Authorization gate (clinician/admin only)
		const role = user.app_metadata?.role || user.user_metadata?.role
		const isAuthorized = role === 'clinician' || role === 'admin'
		if (!isAuthorized) {
			return withRequestId(forbiddenResponse(), requestId)
		}

		// Fetch funnel version
		const { data: version, error: versionError } = (await authClient
			.from('funnel_versions')
			.select('id, funnel_id, version, content_manifest')
			.eq('id', versionId)
			.single()) as {
			data: { id: string; funnel_id: string; version: number; content_manifest: unknown } | null
			error: Error | null
		}

		if (versionError) {
			const sanitized = sanitizeSupabaseError(versionError)

			// PGRST116: .single() could not coerce result (0 rows found)
			if (sanitized.code === 'PGRST116') {
				return withRequestId(notFoundResponse('Funnel version'), requestId)
			}

			const classified = classifySupabaseError(sanitized)
			logError({
				requestId,
				operation: 'fetch_funnel_version_manifest',
				error: sanitized,
				versionId,
			})

			if (classified.kind === 'SCHEMA_NOT_READY') {
				return withRequestId(schemaNotReadyResponse(), requestId)
			}

			return withRequestId(databaseErrorResponse('Failed to fetch funnel version'), requestId)
		}

		if (!version) {
			return withRequestId(notFoundResponse('Funnel version'), requestId)
		}

		// E74.1: Validate manifest structure with comprehensive validator
		const validationResult = validateContentManifest(version.content_manifest)
		
		if (!validationResult.valid) {
			logError({
				requestId,
				operation: 'validate_manifest_get',
				error: { validationErrors: validationResult.errors },
				versionId,
			})

			// 422 for manifest validation
			return withRequestId(
				errorResponse(ErrorCode.VALIDATION_FAILED, 'Invalid manifest structure', 422, {
					errors: validationResult.errors,
					formatted: formatValidationErrors(validationResult.errors),
				}),
				requestId,
			)
		}

		// Parse with Zod for type safety (already validated)
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

		// Validate UUID format early
		if (!isUuidV4(versionId)) {
			return withRequestId(
				validationErrorResponse('Invalid funnel version id format'),
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

		// Authorization gate (clinician/admin only)
		const role = user.app_metadata?.role || user.user_metadata?.role
		const isAuthorized = role === 'clinician' || role === 'admin'
		if (!isAuthorized) {
			return withRequestId(forbiddenResponse(), requestId)
		}

		// Check Content-Length header for payload size
		const contentLength = request.headers.get('content-length')
		if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
			return withRequestId(
				NextResponse.json(
					{
						success: false,
						error: {
							code: 'PAYLOAD_TOO_LARGE',
							message: 'Request body exceeds maximum size of 10 MB',
						},
					},
					{ status: 413 }
				),
				requestId,
			)
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

		// E74.1: Strict validation of manifest with comprehensive validator
		const manifestData = (body as { manifest: unknown }).manifest
		const validationResult = validateContentManifest(manifestData)
		
		if (!validationResult.valid) {
			logError({
				requestId,
				operation: 'validate_manifest_put',
				error: { validationErrors: validationResult.errors },
				versionId,
			})
			// 422 for manifest validation - block publish with error list & codes
			return withRequestId(
				errorResponse(ErrorCode.VALIDATION_FAILED, 'Invalid manifest structure', 422, {
					errors: validationResult.errors,
					formatted: formatValidationErrors(validationResult.errors),
				}),
				requestId,
			)
		}

		// Parse with Zod for type safety (already validated)
		const validatedManifest = FunnelContentManifestSchema.parse(manifestData)

		// Justification: Admin client required to update funnel versions and write audit log (RLS-bypassed admin metadata)
		const adminClient = createAdminSupabaseClient()

		const { data: updatedVersion, error: updateError } = (await (adminClient as any)
			.from('funnel_versions')
			.update({
				content_manifest: validatedManifest,
				updated_at: new Date().toISOString(),
			})
			.eq('id', versionId)
			.select('id, funnel_id, version, content_manifest')
			.single()) as {
			data: { id: string; funnel_id: string; version: number; content_manifest: unknown } | null
			error: Error | null
		}

		if (updateError || !updatedVersion) {
			const sanitized = sanitizeSupabaseError(updateError)
      
			// PGRST116: .single() could not coerce result (0 rows found)
			if (sanitized.code === 'PGRST116') {
				return withRequestId(notFoundResponse('Funnel version'), requestId)
			}

			const classified = classifySupabaseError(sanitized)
			logError({
				requestId,
				operation: 'update_funnel_version_manifest',
				error: sanitized,
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

		// Audit log with manifest hash (no PHI/content)
		const manifestHash = hashManifest(validatedManifest)
		const { error: auditError } = await (adminClient as any).from('audit_log').insert({
			entity_type: AUDIT_ENTITY_TYPE.FUNNEL_VERSION,
			entity_id: versionId,
			action: AUDIT_ACTION.UPDATE,
			actor_id: user.id,
			source: AUDIT_SOURCE.ADMIN_UI,
			metadata: {
				field: 'content_manifest',
				manifest_hash: manifestHash,
				page_count: validatedManifest.pages.length,
				section_count: validatedManifest.pages.reduce((sum, p) => sum + p.sections.length, 0),
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
