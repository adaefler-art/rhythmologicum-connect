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
import { classifySupabaseError, sanitizeSupabaseError, getRequestId, withRequestId, isBlank, logError } from '@/lib/db/errors'
import { env } from '@/lib/env'
import { QUESTION_TYPE, type QuestionType } from '@/lib/contracts/registry'

/**
 * UUID v4 regex pattern for strict validation
 * Matches: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x is [0-9a-f] and y is [89ab]
 */
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Determines if a string is a valid UUID v4
 */
function isUuid(value: string): boolean {
	return UUID_V4_PATTERN.test(value.trim())
}

/**
 * Type guard to check if a value is a valid question type from registry
 */
function isValidQuestionType(value: unknown): value is QuestionType {
	return typeof value === 'string' && Object.values(QUESTION_TYPE).includes(value as QuestionType)
}

/**
 * B7 API Endpoint: Get funnel details with version manifest
 * GET /api/admin/funnels/[id]
 * 
 * [id] can be either a slug or UUID (strict disambiguation)
 * - UUID-shaped strings are always treated as UUIDs
 * - If UUID lookup fails → 404 (no silent fallback to slug)
 * - Otherwise treated as slug
 * 
 * Returns complete funnel structure from catalog + funnel_versions.manifest
 */
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const requestId = getRequestId(request)
  
	try {
		const { id: slugOrId } = await context.params

		// Check Supabase configuration
		if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
			return withRequestId(
				configurationErrorResponse(
					'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
				),
				requestId,
			)
		}

		// Auth gate (must run before any DB calls)
		const authClient = await createServerSupabaseClient()
		const {
			data: { user },
		} = await authClient.auth.getUser()

		if (!user) {
			return withRequestId(unauthorizedResponse(), requestId)
		}

		// Authorization gate (clinician/admin)
		const role = user.app_metadata?.role || user.user_metadata?.role
		const isAuthorized = role === 'clinician' || role === 'admin'
		if (!isAuthorized) {
			return withRequestId(forbiddenResponse(), requestId)
		}

		// Determine if parameter is UUID or slug (strict disambiguation)
		const isUuidParam = isUuid(slugOrId)
    
		// Fetch funnel from catalog
		let funnel
		let funnelError
    
		if (isUuidParam) {
			// UUID path: query by ID only, no fallback
			;({ data: funnel, error: funnelError } = await authClient
				.from('funnels_catalog')
				.select('id, slug, title, description, pillar_id, est_duration_min, outcomes, is_active, published, default_version_id, created_at, updated_at')
				.eq('id', slugOrId)
				.single())
		} else {
			// Slug path: query by slug only
			;({ data: funnel, error: funnelError } = await authClient
				.from('funnels_catalog')
				.select('id, slug, title, description, pillar_id, est_duration_min, outcomes, is_active, published, default_version_id, created_at, updated_at')
				.eq('slug', slugOrId)
				.single())
		}

		if (funnelError) {
			const safeErr = sanitizeSupabaseError(funnelError)

			// PGRST116: .single() could not coerce result (0 rows found)
			if (safeErr.code === 'PGRST116') {
				const paramType = isUuidParam ? 'UUID' : 'slug'
				return withRequestId(
					notFoundResponse('Funnel', `Funnel not found with ${paramType}: "${slugOrId}"`),
					requestId,
				)
			}
			const classified = classifySupabaseError(safeErr)

			if (classified.kind === 'SCHEMA_NOT_READY') {
				logError({ requestId, operation: 'fetch_funnel_catalog', userId: user.id, error: safeErr })
				return withRequestId(schemaNotReadyResponse(), requestId)
			}

			if (classified.kind === 'AUTH_OR_RLS') {
				logError({ requestId, operation: 'fetch_funnel_catalog', userId: user.id, error: safeErr })
				return withRequestId(forbiddenResponse(), requestId)
			}

			if (classified.kind === 'TRANSIENT') {
				logError({ requestId, operation: 'fetch_funnel_catalog', userId: user.id, error: safeErr })
				return withRequestId(databaseErrorResponse(), requestId)
			}

			if (classified.kind === 'CONFIGURATION_ERROR') {
				logError({ requestId, operation: 'fetch_funnel_catalog', userId: user.id, error: safeErr })
				return withRequestId(
					configurationErrorResponse(
						'Server-Konfigurationsfehler (Supabase). Bitte prüfen Sie URL/Keys (gleiches Projekt, keine Anführungszeichen, keine Leerzeichen/Zeilenumbrüche) und deployen Sie erneut.',
					),
					requestId,
				)
			}

			logError({ requestId, operation: 'fetch_funnel_catalog', userId: user.id, error: safeErr })
			return withRequestId(internalErrorResponse('Failed to fetch funnel.'), requestId)
		}

		if (!funnel) {
			const paramType = isUuidParam ? 'UUID' : 'slug'
			return withRequestId(
				notFoundResponse('Funnel', `Funnel not found with ${paramType}: "${slugOrId}"`),
				requestId,
			)
		}

		// Fetch pillar information if funnel has a pillar_id
		let pillar = null
		if (funnel.pillar_id) {
			const { data: pillarData } = await authClient
				.from('pillars')
				.select('id, key, title, description')
				.eq('id', funnel.pillar_id)
				.single()
			pillar = pillarData
		}

		// Fetch all versions for this funnel
		const { data: versions, error: versionsError } = await authClient
			.from('funnel_versions')
			.select('id, funnel_id, version, is_default, rollout_percent, questionnaire_config, content_manifest, algorithm_bundle_version, prompt_version, created_at, updated_at')
			.eq('funnel_id', funnel.id)
			.order('version', { ascending: false })
			.order('id', { ascending: true })

		if (versionsError) {
			const safeErr = sanitizeSupabaseError(versionsError)
			const classified = classifySupabaseError(safeErr)

			if (classified.kind === 'SCHEMA_NOT_READY') {
				logError({ requestId, operation: 'fetch_funnel_versions', userId: user.id, error: safeErr })
				return withRequestId(schemaNotReadyResponse(), requestId)
			}

			if (classified.kind === 'AUTH_OR_RLS') {
				logError({ requestId, operation: 'fetch_funnel_versions', userId: user.id, error: safeErr })
				return withRequestId(forbiddenResponse(), requestId)
			}

			if (classified.kind === 'TRANSIENT') {
				logError({ requestId, operation: 'fetch_funnel_versions', userId: user.id, error: safeErr })
				return withRequestId(databaseErrorResponse(), requestId)
			}

			if (classified.kind === 'CONFIGURATION_ERROR') {
				logError({ requestId, operation: 'fetch_funnel_versions', userId: user.id, error: safeErr })
				return withRequestId(
					configurationErrorResponse(
						'Server-Konfigurationsfehler (Supabase). Bitte prüfen Sie URL/Keys (gleiches Projekt, keine Anführungszeichen, keine Leerzeichen/Zeilenumbrüche) und deployen Sie erneut.',
					),
					requestId,
				)
			}

			logError({ requestId, operation: 'fetch_funnel_versions', userId: user.id, error: safeErr })
			return withRequestId(internalErrorResponse('Failed to fetch funnel versions.'), requestId)
		}

		// Find default version
		const defaultVersion = (versions || []).find((v) => v.is_default) || null

		// ADAPTER LAYER: Convert manifest to steps/questions format for backward compat UI
		// This allows the UI to continue working while we transition to manifest-based editing
		// IMPORTANT: Validates all types against registry - no fantasy types allowed
		type ManifestQuestion = {
			id?: string
			key?: string
			label?: string
			helpText?: string
			type?: string
			required?: boolean
		}
		type ManifestStep = {
			id?: string
			title?: string
			description?: string | null
			questions?: ManifestQuestion[]
		}
		type QuestionnaireConfig = { steps?: ManifestStep[] }

		type AdapterQuestion = {
			id: string
			key: string
			label: string
			help_text: string | null
			question_type: string
			funnel_step_question_id: string
			is_required: boolean
			order_index: number
		}

		type AdapterStep = {
			id: string
			funnel_id: string
			order_index: number
			title: string
			description: string | null
			type: 'question_step'
			content_page_id: null
			content_page: null
			questions: AdapterQuestion[]
		}

		const steps: AdapterStep[] = []
		if (defaultVersion?.questionnaire_config) {
			try {
				const config: QuestionnaireConfig =
					typeof defaultVersion.questionnaire_config === 'string'
						? (JSON.parse(defaultVersion.questionnaire_config) as QuestionnaireConfig)
						: (defaultVersion.questionnaire_config as QuestionnaireConfig)
        
				if (config.steps && Array.isArray(config.steps)) {
					// Validate and map steps
					for (let index = 0; index < config.steps.length; index++) {
						const step = config.steps[index]
						const mappedQuestions = []
            
						// Validate and map questions
						const stepQuestions = Array.isArray(step.questions) ? step.questions : []
						for (let qIndex = 0; qIndex < stepQuestions.length; qIndex++) {
							const q = stepQuestions[qIndex]
							const questionType = typeof q.type === 'string' ? q.type : ''
              
							// Strict validation: question type must be in registry
							if (!isValidQuestionType(questionType)) {
								logError({
									requestId,
									operation: 'adapter_validate_question_type',
									userId: user.id,
									error: {
										code: 'INVALID_QUESTION_TYPE',
										message: `Invalid question type "${questionType}" in manifest (question: ${q.id || qIndex})`,
										hint: `Valid types: ${Object.values(QUESTION_TYPE).join(', ')}`,
									},
								})
								// Return 422 for invalid manifest data
								return withRequestId(
									NextResponse.json(
										{
											success: false,
											error: {
												code: 'VALIDATION_ERROR',
												message: `Manifest contains invalid question type: "${questionType}". Valid types: ${Object.values(QUESTION_TYPE).join(', ')}`,
												requestId,
											},
										},
										{ status: 422 },
									),
									requestId,
								)
							}
              
							mappedQuestions.push({
								id: q.id || `q-${index}-${qIndex}`,
								key: q.key || '',
								label: q.label || '',
								help_text: q.helpText || null,
								question_type: questionType, // validated against registry
								funnel_step_question_id: `fsq-${q.id}`,
								is_required: q.required || false,
								order_index: qIndex,
							})
						}
            
						steps.push({
							id: step.id || `step-${index}`,
							funnel_id: funnel.id,
							order_index: index,
							title: step.title || '',
							description: step.description || null,
							type: 'question_step', // manifest steps are question steps
							content_page_id: null,
							content_page: null,
							questions: mappedQuestions,
						})
					}
				}
			} catch (err) {
				logError({
					requestId,
					operation: 'adapter_parse_manifest',
					userId: user.id,
					error: err,
				})
				console.warn('Failed to parse questionnaire_config for adapter:', err)
			}
		}

		return withRequestId(
			successResponse({
				funnel: {
					...funnel,
					outcomes: Array.isArray(funnel.outcomes) ? funnel.outcomes : [],
					pillar: pillar,
				},
				versions: versions || [],
				default_version: defaultVersion,
				// Backward compat: provide steps for existing UI
				steps,
			}),
			requestId,
		)
	} catch (error) {
		const safeErr = sanitizeSupabaseError(error)
		console.error({ requestId, operation: 'GET /api/admin/funnels/[id]', error: safeErr })
		return withRequestId(internalErrorResponse(), requestId)
	}
}

/**
 * B7 API Endpoint: Update funnel is_active status or content fields
 * PATCH /api/admin/funnels/[id]
 * 
 * [id] can be either a slug or UUID (strict disambiguation)
 * - UUID-shaped strings are always treated as UUIDs
 * - Uses admin/service client for cross-user writes
 * 
 * Body: { is_active?: boolean, title?: string, description?: string }
 */
export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const requestId = getRequestId(request)
  
	try {
		const { id: slugOrId } = await context.params

		// Check Supabase configuration
		if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
			return withRequestId(
				configurationErrorResponse(
					'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
				),
				requestId,
			)
		}

		// Auth gate (must run before any DB calls)
		const authClient = await createServerSupabaseClient()
		const {
			data: { user },
		} = await authClient.auth.getUser()

		if (!user) {
			return withRequestId(unauthorizedResponse(), requestId)
		}

		// Authorization gate (clinician/admin) - MUST happen before DB write
		const role = user.app_metadata?.role || user.user_metadata?.role
		const isAuthorized = role === 'clinician' || role === 'admin'
		if (!isAuthorized) {
			return withRequestId(forbiddenResponse(), requestId)
		}

		// Parse and validate body
		const body = await request.json()

		// Build update object with only provided fields
		const updateData: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		}

		if (typeof body.is_active === 'boolean') {
			updateData.is_active = body.is_active
		}
		if (body.published !== undefined && typeof body.published !== 'boolean') {
			return withRequestId(
				validationErrorResponse('Published must be a boolean'),
				requestId,
			)
		}
		if (typeof body.published === 'boolean') {
			updateData.published = body.published
		}
		if (typeof body.title === 'string') {
			const trimmedTitle = body.title.trim()
			if (trimmedTitle.length === 0) {
				return withRequestId(
					validationErrorResponse('Title cannot be empty'),
					requestId,
				)
			}
			if (trimmedTitle.length > 255) {
				return withRequestId(
					validationErrorResponse('Title too long (max 255 characters)'),
					requestId,
				)
			}
			updateData.title = trimmedTitle
		}
		if (typeof body.description === 'string') {
			const trimmedDescription = body.description.trim()
			if (trimmedDescription.length > 2000) {
				return withRequestId(
					validationErrorResponse('Description too long (max 2000 characters)'),
					requestId,
				)
			}
			updateData.description = trimmedDescription || null
		}

		// Use admin/service client for cross-user writes to metadata tables
		// Justification: Clinicians need to manage all funnels, not just their own
		let writeClient
		let usingAdminClient = false
		try {
			writeClient = createAdminSupabaseClient()
			usingAdminClient = true
		} catch (err) {
			logError({
				requestId,
				operation: 'create_admin_client_for_write',
				userId: user.id,
				error: err,
			})
			// Fallback to auth client if admin client unavailable
			writeClient = authClient
		}

		// Determine if parameter is UUID or slug (strict disambiguation)
		const isUuidParam = isUuid(slugOrId)
    
		// Update funnel catalog
		let data
		let error
    
		if (isUuidParam) {
			// UUID path: update by ID only
			;({ data, error } = await writeClient
				.from('funnels_catalog')
				.update(updateData)
				.eq('id', slugOrId)
				.select()
				.single())
		} else {
			// Slug path: update by slug only
			;({ data, error } = await writeClient
				.from('funnels_catalog')
				.update(updateData)
				.eq('slug', slugOrId)
				.select()
				.single())
		}

		// If admin client failed with auth/config error, retry with auth client
		if (error && usingAdminClient) {
			const classified = classifySupabaseError(error)
			if (classified.kind === 'CONFIGURATION_ERROR' || classified.kind === 'AUTH_OR_RLS') {
				logError({
					requestId,
					operation: 'update_funnel_admin_fallback',
					userId: user.id,
					error,
				})
				usingAdminClient = false
				writeClient = authClient
        
				if (isUuidParam) {
					;({ data, error } = await writeClient
						.from('funnels_catalog')
						.update(updateData)
						.eq('id', slugOrId)
						.select()
						.single())
				} else {
					;({ data, error } = await writeClient
						.from('funnels_catalog')
						.update(updateData)
						.eq('slug', slugOrId)
						.select()
						.single())
				}
			}
		}

		if (error) {
			const safeErr = sanitizeSupabaseError(error)
			const classified = classifySupabaseError(safeErr)

			if (classified.kind === 'SCHEMA_NOT_READY') {
				logError({ requestId, operation: 'update_funnel_catalog', userId: user.id, error: safeErr })
				return withRequestId(schemaNotReadyResponse(), requestId)
			}

			if (classified.kind === 'AUTH_OR_RLS') {
				logError({ requestId, operation: 'update_funnel_catalog', userId: user.id, error: safeErr })
				return withRequestId(forbiddenResponse(), requestId)
			}

			if (classified.kind === 'TRANSIENT') {
				logError({ requestId, operation: 'update_funnel_catalog', userId: user.id, error: safeErr })
				return withRequestId(databaseErrorResponse(), requestId)
			}

			if (classified.kind === 'CONFIGURATION_ERROR') {
				logError({ requestId, operation: 'update_funnel_catalog', userId: user.id, error: safeErr })
				return withRequestId(
					configurationErrorResponse(
						'Server-Konfigurationsfehler (Supabase). Bitte prüfen Sie URL/Keys (gleiches Projekt, keine Anführungszeichen, keine Leerzeichen/Zeilenumbrüche) und deployen Sie erneut.',
					),
					requestId,
				)
			}

			// PGRST116 means no rows found
			if (safeErr.code === 'PGRST116') {
				const paramType = isUuidParam ? 'UUID' : 'slug'
				return withRequestId(
					notFoundResponse('Funnel', `Funnel not found with ${paramType}: "${slugOrId}"`),
					requestId,
				)
			}

			logError({ requestId, operation: 'update_funnel_catalog', userId: user.id, error: safeErr })
			return withRequestId(internalErrorResponse('Failed to update funnel.'), requestId)
		}

		return withRequestId(successResponse({ funnel: data }), requestId)
	} catch (error) {
		const safeErr = sanitizeSupabaseError(error)
		console.error({ requestId, operation: 'PATCH /api/admin/funnels/[id]', error: safeErr })
		return withRequestId(internalErrorResponse(), requestId)
	}
}
