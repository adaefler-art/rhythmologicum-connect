/**
 * Funnel Catalog API (Patient UI)
 *
 * GET /api/funnels/catalog
 * Returns all active funnels organized by pillar for the catalog view.
 *
 * Auth: Requires authentication (any role)
 * DB Access: Uses user-scoped server client (RLS active)
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
	classifySupabaseError,
	getRequestId,
	withRequestId,
	logError,
} from '@/lib/db/errors'
import { successResponse } from '@/lib/api/responses'
import type { FunnelCatalogResponse, PillarWithFunnels, CatalogFunnel } from '@/lib/types/catalog'
import { env } from '@/lib/env'
import { NextResponse } from 'next/server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getTierContract } from '@/lib/contracts/tiers'
import { getActivePillars, getAllowedFunnels } from '@/lib/contracts/programTier'
import { isValidProgramTier } from '@/lib/contracts/registry'
import {
	generateETag,
	generateLastModified,
	generateCacheControl,
	checkETagMatch,
	notModifiedResponse,
	addCacheHeaders,
	decodeCursor,
	encodeCursor,
	findMostRecentTimestamp,
	type PaginationMetadata,
} from '@/lib/api/caching'
import type { Json } from '@/lib/types/supabase'

function isBlank(value: unknown): boolean {
	return typeof value !== 'string' || value.trim().length === 0
}

function isNonEmptyJson(value: Json | null | undefined): boolean {
	if (value === null || value === undefined) return false
	if (typeof value === 'string') return value.trim().length > 0
	if (Array.isArray(value)) return value.length > 0
	if (typeof value === 'object') return Object.keys(value).length > 0
	return true
}

function errorResponseWithRequestId(
	code: ErrorCode,
	message: string,
	status: number,
	requestId: string,
) {
	return withRequestId(
		NextResponse.json(
			{
				success: false,
				error: {
					code,
					message,
				},
				requestId,
			},
			{ status },
		),
		requestId,
	)
}

function getSupabaseErrorLogFields(error: unknown): {
	code?: unknown
	message?: unknown
	details?: unknown
	hint?: unknown
} {
	if (!error || typeof error !== 'object') return {}
	const record = error as Record<string, unknown>
	return {
		code: record.code,
		message: record.message,
		details: record.details,
		hint: record.hint,
	}
}

/**
 * GET /api/funnels/catalog
 *
 * Returns all active funnels organized by pillar for the catalog view.
 * Requires authentication but no special role.
 *
 * Query Parameters:
 * - tier (optional): Filter by program tier (e.g., 'tier-1-essential')
 * - limit (optional): Items per page (default: 50, max: 100)
 * - cursor (optional): Pagination cursor for next page
 */
export async function GET(request: Request) {
	const requestId = getRequestId(request)

	const url = new URL(request.url)
	const tierParam = url.searchParams.get('tier')
	const limitParam = url.searchParams.get('limit')
	const cursorParam = url.searchParams.get('cursor')

	const limit = Math.min(Math.max(parseInt(limitParam || '50', 10), 1), 100)
	let cursorData: { title: string; slug: string } | null = null

	if (cursorParam) {
		cursorData = decodeCursor(cursorParam)
		if (!cursorData) {
			return errorResponseWithRequestId(
				ErrorCode.INVALID_INPUT,
				'Pagination cursor is invalid or expired. Please restart from the first page.',
				400,
				requestId,
			)
		}
	}

	try {
		if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
			return errorResponseWithRequestId(
				ErrorCode.CONFIGURATION_ERROR,
				'Supabase Konfiguration fehlt oder ist leer.',
				500,
				requestId,
			)
		}

		const serverClient = (await createServerSupabaseClient()) as any
		const {
			data: { user },
		} = await serverClient.auth.getUser()

		if (!user) {
			return errorResponseWithRequestId(
				ErrorCode.UNAUTHORIZED,
				'Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.',
				401,
				requestId,
			)
		}

		const dataClient = serverClient

		let tierContract = null
		let activePillarKeys: string[] | null = null
		let allowedFunnelSlugs: string[] | null = null

		if (tierParam) {
			if (!isValidProgramTier(tierParam)) {
				return errorResponseWithRequestId(
					ErrorCode.VALIDATION_FAILED,
					`Ungültiger Tier-Parameter: '${tierParam}'. Erlaubte Werte: tier-1-essential, tier-2-5-enhanced, tier-2-comprehensive`,
					422,
					requestId,
				)
			}

			tierContract = getTierContract(tierParam)
			if (tierContract) {
				activePillarKeys = getActivePillars(tierContract)
				allowedFunnelSlugs = getAllowedFunnels(tierContract)
			}
		}

		const { data: pillars, error: pillarsError } = await dataClient
			.from('pillars')
			.select('id, key, title, description, sort_order')
			.order('sort_order', { ascending: true })
			.order('id', { ascending: true })

		if (pillarsError) {
			const classified = classifySupabaseError(pillarsError)

			logError({
				requestId,
				operation: 'fetch_pillars',
				error: pillarsError,
				userId: user.id,
				supabase: getSupabaseErrorLogFields(pillarsError),
			})

			if (classified.kind === 'SCHEMA_NOT_READY') {
				return errorResponseWithRequestId(
					ErrorCode.SCHEMA_NOT_READY,
					'Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut.',
					503,
					requestId,
				)
			}
			if (classified.kind === 'AUTH_OR_RLS') {
				return errorResponseWithRequestId(
					ErrorCode.FORBIDDEN,
					'Sie haben keine Berechtigung für diese Aktion.',
					403,
					requestId,
				)
			}

			return errorResponseWithRequestId(
				ErrorCode.INTERNAL_ERROR,
				'Failed to fetch pillars.',
				500,
				requestId,
			)
		}

		let funnelsQuery = dataClient
			.from('funnels_catalog')
			.select(`
				id,
				slug,
				title,
				pillar_id,
				description,
				est_duration_min,
				outcomes,
				is_active,
				default_version_id,
				updated_at,
				created_at
			`)
			.eq('is_active', true)
			.order('title', { ascending: true })
			.order('slug', { ascending: true })

		if (cursorData) {
			funnelsQuery = funnelsQuery.or(
				`title.gt.${cursorData.title},and(title.eq.${cursorData.title},slug.gt.${cursorData.slug})`,
			)
		}

		funnelsQuery = funnelsQuery.limit(limit + 1)

		const { data: funnels, error: funnelsError } = await funnelsQuery

		if (funnelsError) {
			const classified = classifySupabaseError(funnelsError)
			logError({
				requestId,
				operation: 'fetch_funnels_catalog',
				error: funnelsError,
				userId: user.id,
				supabase: getSupabaseErrorLogFields(funnelsError),
			})

			if (classified.kind === 'SCHEMA_NOT_READY') {
				return errorResponseWithRequestId(
					ErrorCode.SCHEMA_NOT_READY,
					'Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut.',
					503,
					requestId,
				)
			}
			if (classified.kind === 'AUTH_OR_RLS') {
				return errorResponseWithRequestId(
					ErrorCode.FORBIDDEN,
					'Sie haben keine Berechtigung für diese Aktion.',
					403,
					requestId,
				)
			}

			return errorResponseWithRequestId(
				ErrorCode.INTERNAL_ERROR,
				'Failed to fetch catalog funnels',
				500,
				requestId,
			)
		}

		const defaultVersionIds = (funnels || [])
			.map((f) => f.default_version_id)
			.filter((id): id is string => Boolean(id))

		const versionsResult =
			defaultVersionIds.length > 0
				? await dataClient
						.from('funnel_versions')
						.select('id, version, content_manifest, questionnaire_config')
						.in('id', defaultVersionIds)
						.order('id', { ascending: true })
				: { data: null, error: null }

		if (versionsResult.error) {
			const classified = classifySupabaseError(versionsResult.error)
			logError({
				requestId,
				operation: 'fetch_funnel_versions',
				error: versionsResult.error,
				userId: user.id,
				supabase: getSupabaseErrorLogFields(versionsResult.error),
			})

			if (classified.kind === 'SCHEMA_NOT_READY') {
				return errorResponseWithRequestId(
					ErrorCode.SCHEMA_NOT_READY,
					'Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut.',
					503,
					requestId,
				)
			}
			if (classified.kind === 'AUTH_OR_RLS') {
				return errorResponseWithRequestId(
					ErrorCode.FORBIDDEN,
					'Sie haben keine Berechtigung für diese Aktion.',
					403,
					requestId,
				)
			}
			// Non-critical: continue without version info
		}

		const versionById = new Map<string, { version: string; hasDefinition: boolean }>()

		if (versionsResult.data) {
			versionsResult.data.forEach((v) => {
				const hasDefinition =
					isNonEmptyJson(v.content_manifest) || isNonEmptyJson(v.questionnaire_config)
				versionById.set(v.id, { version: v.version, hasDefinition })
			})
		}

		const versionMap = new Map<string, string>()
		if (funnels) {
			funnels.forEach((f) => {
				if (!f.default_version_id) return
				const version = versionById.get(f.default_version_id)?.version
				if (version) versionMap.set(f.id, version)
			})
		}

		const pillarMap = new Map<string, PillarWithFunnels>()
		const uncategorizedFunnels: CatalogFunnel[] = []

		if (!pillarsError && pillars) {
			pillars.forEach((pillar) => {
				if (activePillarKeys && !activePillarKeys.includes(pillar.key)) {
					return
				}

				pillarMap.set(pillar.key, {
					pillar,
					funnels: [],
				})
			})
		}

		const hasMore = funnels && funnels.length > limit
		const pageFunnels = funnels ? funnels.slice(0, limit) : []

		if (pageFunnels) {
			pageFunnels.forEach((funnel) => {
				if (allowedFunnelSlugs && !allowedFunnelSlugs.includes(funnel.slug)) {
					return
				}

				const versionInfo = funnel.default_version_id
					? versionById.get(funnel.default_version_id)
					: null

				let availability: 'available' | 'coming_soon' = 'coming_soon'
				if (funnel.is_active && funnel.default_version_id) {
					if (versionInfo) {
						availability = versionInfo.hasDefinition ? 'available' : 'coming_soon'
					} else {
						availability = 'available'
						if (env.NODE_ENV !== 'production') {
							console.warn('[FUNNEL_CATALOG] availability fallback (no version data)', {
								requestId,
								funnelId: funnel.id,
								slug: funnel.slug,
								defaultVersionId: funnel.default_version_id,
							})
						}
					}
				}

				const catalogFunnel: CatalogFunnel = {
					...funnel,
					subtitle: null,
					outcomes: Array.isArray(funnel.outcomes) ? (funnel.outcomes as string[]) : [],
					default_version: versionMap.get(funnel.id) || null,
					availability,
				}

				if (funnel.pillar_id && pillarMap.has(funnel.pillar_id)) {
					pillarMap.get(funnel.pillar_id)!.funnels.push(catalogFunnel)
				} else {
					uncategorizedFunnels.push(catalogFunnel)
				}
			})
		}

		const lastFunnel = pageFunnels.length > 0 ? pageFunnels[pageFunnels.length - 1] : null
		const pagination: PaginationMetadata = {
			limit,
			hasMore: Boolean(hasMore),
			nextCursor:
				hasMore && lastFunnel
					? encodeCursor({ title: lastFunnel.title, slug: lastFunnel.slug })
					: null,
		}

		const catalogData: FunnelCatalogResponse & { tier?: string; pagination?: PaginationMetadata } = {
			pillars: Array.from(pillarMap.values()),
			uncategorized_funnels: uncategorizedFunnels,
			pagination,
		}

		if (tierParam && tierContract) {
			catalogData.tier = tierParam
		}

		const allTimestamps = pageFunnels.map((f) => f.updated_at || f.created_at)
		const lastModifiedDate = findMostRecentTimestamp(allTimestamps)

		const etag = generateETag('funnels', '1', lastModifiedDate)
		const cacheControl = generateCacheControl(300, true, true)

		if (checkETagMatch(request, etag)) {
			return withRequestId(notModifiedResponse(etag, cacheControl), requestId)
		}

		const response = successResponse(catalogData)
		const lastModified = generateLastModified(lastModifiedDate)

		return withRequestId(addCacheHeaders(response, etag, lastModified, cacheControl), requestId)
	} catch (error) {
		logError({
			requestId,
			operation: 'get_funnel_catalog',
			error,
			supabase: getSupabaseErrorLogFields(error),
		})
		return errorResponseWithRequestId(
			ErrorCode.INTERNAL_ERROR,
			'Ein unerwarteter Fehler ist aufgetreten.',
			500,
			requestId,
		)
	}
}
