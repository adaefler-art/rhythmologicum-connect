import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
  configurationErrorResponse,
  schemaNotReadyResponse,
} from '@/lib/api/responses'
import type { FunnelCatalogResponse, PillarWithFunnels, CatalogFunnel } from '@/lib/types/catalog'
import { env } from '@/lib/env'

type ClassifiedError =
  | { kind: 'SCHEMA_NOT_READY' }
  | { kind: 'AUTH_OR_RLS' }
  | { kind: 'TRANSIENT_OR_NONCRITICAL' }

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function getRequestId(request: Request): string {
  const headerId = request.headers.get('x-request-id')
  if (headerId && headerId.trim().length > 0) return headerId

  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function withRequestId<T extends Response>(response: T, requestId: string): T {
  response.headers.set('x-request-id', requestId)
  return response
}

function sanitizeSupabaseError(error: unknown): { code?: string; message?: string } {
  if (!error || typeof error !== 'object') return {}
  const anyErr = error as { code?: unknown; message?: unknown }
  return {
    code: typeof anyErr.code === 'string' ? anyErr.code : undefined,
    message: typeof anyErr.message === 'string' ? anyErr.message : undefined,
  }
}

function classifySupabaseError(error: unknown): ClassifiedError {
  const { code, message } = sanitizeSupabaseError(error)
  const msg = message || ''

  // Postgres error codes: 42P01 undefined_table, 42703 undefined_column
  if (code === '42P01' || code === '42703') return { kind: 'SCHEMA_NOT_READY' }

  // Postgres permission denied
  if (code === '42501') return { kind: 'AUTH_OR_RLS' }

  // PostgREST/auth/RLS signals (best-effort)
  if (
    code === 'PGRST116' ||
    code === 'PGRST301' ||
    code === 'PGRST302' ||
    /jwt|permission denied|rls/i.test(msg)
  ) {
    return { kind: 'AUTH_OR_RLS' }
  }

  // Message-based schema detection
  if (/relation .* does not exist|column .* does not exist/i.test(msg)) {
    return { kind: 'SCHEMA_NOT_READY' }
  }

  return { kind: 'TRANSIENT_OR_NONCRITICAL' }
}

/**
 * GET /api/funnels/catalog
 * 
 * Returns all active funnels organized by pillar for the catalog view.
 * Requires authentication but no special role.
 * 
 * Response structure:
 * {
 *   success: true,
 *   data: {
 *     pillars: [{ pillar: {...}, funnels: [...] }],
 *     uncategorized_funnels: [...]
 *   }
 * }
 */
export async function GET(request: Request) {
  try {
    const requestId = getRequestId(request)

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

    // We need anonKey for cookie/JWT-based auth checks.
    if (isBlank(supabaseUrl) || isBlank(anonKey)) {
      return withRequestId(
        configurationErrorResponse('Supabase Konfiguration fehlt oder ist leer.'),
        requestId,
      )
    }

    // Create Supabase server client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl,
      anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    // Use service role for catalog reads when available (metadata only)
    const dataClient = !isBlank(serviceKey)
      ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
      : supabase

    // Fetch all pillars ordered by sort_order
    const { data: pillars, error: pillarsError } = await dataClient
      .from('pillars')
      .select('id, key, title, description, sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (pillarsError) {
      const classified = classifySupabaseError(pillarsError)
      const safeErr = sanitizeSupabaseError(pillarsError)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        console.warn({ requestId, supabaseError: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      console.error({ requestId, supabaseError: safeErr })
      return withRequestId(internalErrorResponse('Failed to fetch pillars.'), requestId)
    }

    // Fetch all active funnels with their pillar information
    const { data: funnels, error: funnelsError } = await dataClient
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
        default_version_id
      `)
      .eq('is_active', true)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })

    if (funnelsError) {
      const classified = classifySupabaseError(funnelsError)
      const safeErr = sanitizeSupabaseError(funnelsError)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        console.warn({ requestId, supabaseError: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      console.error({ requestId, supabaseError: safeErr })
      return withRequestId(internalErrorResponse('Failed to fetch catalog funnels'), requestId)
    }

    // Fetch default versions for funnels
    const funnelIds = (funnels || []).map((f) => f.id)
    const versionsResult =
      funnelIds.length > 0
        ? await dataClient
            .from('funnel_versions')
            .select('id, funnel_id, version, is_default')
            .in('funnel_id', funnelIds)
            .eq('is_default', true)
            .order('id', { ascending: true })
        : { data: null, error: null }

    if (versionsResult.error) {
      const classified = classifySupabaseError(versionsResult.error)
      const safeErr = sanitizeSupabaseError(versionsResult.error)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }
      if (classified.kind === 'AUTH_OR_RLS') {
        console.warn({ requestId, supabaseError: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      // Non-critical: continue without version info
      console.warn({ requestId, supabaseError: safeErr })
    }

    // Create version lookup map
    const versionMap = new Map<string, string>()
    if (versionsResult.data) {
      versionsResult.data.forEach((v) => {
        versionMap.set(v.funnel_id, v.version)
      })
    }

    // Organize funnels by pillar
    const pillarMap = new Map<string, PillarWithFunnels>()
    const uncategorizedFunnels: CatalogFunnel[] = []

    // Initialize pillar map
    if (!pillarsError && pillars) {
      pillars.forEach((pillar) => {
        pillarMap.set(pillar.id, {
          pillar,
          funnels: [],
        })
      })
    }

    // Distribute funnels to pillars or uncategorized
    if (funnels) {
      funnels.forEach((funnel) => {
        const catalogFunnel: CatalogFunnel = {
          ...funnel,
          subtitle: null, // funnels_catalog doesn't have subtitle
          outcomes: Array.isArray(funnel.outcomes) ? funnel.outcomes : [],
          default_version: versionMap.get(funnel.id) || null,
        }

        if (funnel.pillar_id && pillarMap.has(funnel.pillar_id)) {
          pillarMap.get(funnel.pillar_id)!.funnels.push(catalogFunnel)
        } else {
          uncategorizedFunnels.push(catalogFunnel)
        }
      })
    }

    // Convert map to array, preserving sort order
    const catalogData: FunnelCatalogResponse = {
      pillars: Array.from(pillarMap.values()),
      uncategorized_funnels: uncategorizedFunnels,
    }

    return withRequestId(successResponse(catalogData), requestId)
  } catch (error) {
    const requestId = getRequestId(request)
    console.error({ requestId, supabaseError: sanitizeSupabaseError(error) })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
