import { NextRequest } from 'next/server'
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
import { classifySupabaseError, sanitizeSupabaseError, getRequestId, withRequestId, isBlank, logError } from '@/lib/db/errors'
import { env } from '@/lib/env'

/**
 * B7 API Endpoint: Get funnel details with version manifest
 * GET /api/admin/funnels/[id]
 * 
 * [id] can be either a slug or UUID for backward compatibility
 * Returns complete funnel structure from catalog + funnel_versions.manifest
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request)
  
  try {
    const { id: slugOrId } = await params

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

    // Fetch funnel from catalog (try slug first, then UUID for backward compat)
    let { data: funnel, error: funnelError } = await authClient
      .from('funnels_catalog')
      .select('id, slug, title, description, pillar_id, est_duration_min, outcomes, is_active, default_version_id, created_at, updated_at')
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
      .single()

    if (funnelError) {
      const safeErr = sanitizeSupabaseError(funnelError)

      // PGRST116: .single() could not coerce result (usually 0 rows).
      // This is not an auth/RLS failure and should be treated as "not found" here.
      if (safeErr.code === 'PGRST116') {
        return withRequestId(notFoundResponse('Funnel', `Funnel with identifier "${slugOrId}" not found`), requestId)
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
      return withRequestId(notFoundResponse('Funnel', `Funnel with identifier "${slugOrId}" not found`), requestId)
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
    let steps: any[] = []
    if (defaultVersion?.questionnaire_config) {
      try {
        const config = typeof defaultVersion.questionnaire_config === 'string'
          ? JSON.parse(defaultVersion.questionnaire_config)
          : defaultVersion.questionnaire_config
        
        if (config.steps && Array.isArray(config.steps)) {
          steps = config.steps.map((step: any, index: number) => ({
            id: step.id || `step-${index}`,
            funnel_id: funnel.id,
            order_index: index,
            title: step.title || '',
            description: step.description || null,
            type: 'question_step', // manifest steps are question steps
            content_page_id: null,
            content_page: null,
            questions: (step.questions || []).map((q: any, qIndex: number) => ({
              id: q.id || `q-${index}-${qIndex}`,
              key: q.key || '',
              label: q.label || '',
              help_text: q.helpText || null,
              question_type: q.type || 'text',
              funnel_step_question_id: `fsq-${q.id}`,
              is_required: q.required || false,
              order_index: qIndex,
            })),
          }))
        }
      } catch (err) {
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
 * [id] can be either a slug or UUID for backward compatibility
 * Body: { is_active?: boolean, title?: string, description?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request)
  
  try {
    const { id: slugOrId } = await params
    const body = await request.json()

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

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.is_active === 'boolean') {
      updateData.is_active = body.is_active
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

    // Update funnel catalog (try slug first, then UUID for backward compat)
    let { data, error } = await authClient
      .from('funnels_catalog')
      .update(updateData)
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
      .select()
      .single()

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
        return withRequestId(notFoundResponse('Funnel', `Funnel with identifier "${slugOrId}" not found`), requestId)
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
