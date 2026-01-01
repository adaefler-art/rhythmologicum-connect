import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import {
  configurationErrorResponse,
  forbiddenResponse,
  internalErrorResponse,
  schemaNotReadyResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'

/**
 * B7 API Endpoint: List all funnels for admin/clinician management
 * GET /api/admin/funnels
 * 
 * Returns all funnels with basic metadata for overview page
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const publicSupabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const publicSupabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isBlank(publicSupabaseUrl) || isBlank(publicSupabaseAnonKey)) {
      return withRequestId(
        configurationErrorResponse(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        ),
        requestId,
      )
    }

    const cookieStore = await cookies()
    const authClient = createServerClient(publicSupabaseUrl, publicSupabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    const role = user.app_metadata?.role || user.user_metadata?.role
    const hasAccess = role === 'clinician' || role === 'admin'
    if (!hasAccess) {
      return withRequestId(forbiddenResponse(), requestId)
    }

    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
    const readClient = !isBlank(serviceKey)
      ? createClient(publicSupabaseUrl, serviceKey, { auth: { persistSession: false } })
      : authClient

    const { data: pillars, error: pillarsError } = await readClient
      .from('pillars')
      .select('id,key,title,description,sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (pillarsError) {
      const safeErr = sanitizeSupabaseError(pillarsError)
      const classified = classifySupabaseError(safeErr)

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

    const { data: funnels, error: funnelsError } = await readClient
      .from('funnels_catalog')
      .select(
        'id,slug,title,description,pillar_id,est_duration_min,outcomes,is_active,default_version_id,created_at,updated_at',
      )
      .order('title', { ascending: true })
      .order('slug', { ascending: true })

    if (funnelsError) {
      const safeErr = sanitizeSupabaseError(funnelsError)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      if (classified.kind === 'AUTH_OR_RLS') {
        console.warn({ requestId, supabaseError: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      console.error({ requestId, supabaseError: safeErr })
      return withRequestId(internalErrorResponse('Failed to fetch funnels.'), requestId)
    }

    const funnelIds = (funnels ?? []).map((f) => f.id)

    const defaultVersionLookup = new Map<string, string>()
    if (funnelIds.length > 0) {
      const { data: versions, error: versionsError } = await readClient
        .from('funnel_versions')
        .select('id,version,funnel_id')
        .in('funnel_id', funnelIds)
        .order('id', { ascending: true })

      if (versionsError) {
        const safeErr = sanitizeSupabaseError(versionsError)
        const classified = classifySupabaseError(safeErr)

        if (classified.kind === 'SCHEMA_NOT_READY') {
          console.error({ requestId, supabaseError: safeErr })
          return withRequestId(schemaNotReadyResponse(), requestId)
        }

        if (classified.kind === 'AUTH_OR_RLS') {
          console.warn({ requestId, supabaseError: safeErr })
          return withRequestId(forbiddenResponse(), requestId)
        }

        console.error({ requestId, supabaseError: safeErr })
        return withRequestId(internalErrorResponse('Failed to fetch funnel versions.'), requestId)
      }

      ;(versions ?? []).forEach((v) => {
        defaultVersionLookup.set(v.id, v.version)
      })
    }

    const funnelsWithVersions = (funnels ?? []).map((f) => ({
      ...f,
      subtitle: null,
      outcomes: Array.isArray(f.outcomes) ? f.outcomes : [],
      default_version: f.default_version_id
        ? (defaultVersionLookup.get(f.default_version_id) ?? null)
        : null,
    }))

    const pillarById = new Map(
      (pillars ?? []).map((p) => [
        p.id,
        {
          pillar: p,
          funnels: [] as typeof funnelsWithVersions,
        },
      ]),
    )

    const uncategorized: typeof funnelsWithVersions = []
    for (const funnel of funnelsWithVersions) {
      if (!funnel.pillar_id) {
        uncategorized.push(funnel)
        continue
      }
      const bucket = pillarById.get(funnel.pillar_id)
      if (!bucket) {
        uncategorized.push(funnel)
        continue
      }
      bucket.funnels.push(funnel)
    }

    const pillarGroups = Array.from(pillarById.values())

    return withRequestId(
      successResponse({
        pillars: pillarGroups,
        uncategorized_funnels: uncategorized,
      }),
      requestId,
    )
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, supabaseError: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0
}

function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') || crypto.randomUUID()
}

function withRequestId(response: Response, requestId: string): Response {
  response.headers.set('x-request-id', requestId)
  return response
}

type SafeSupabaseError = {
  code?: string
  message: string
}

function sanitizeSupabaseError(error: unknown): SafeSupabaseError {
  if (!error) return { message: 'Unknown error' }
  if (typeof error === 'string') return { message: error }

  if (typeof error === 'object') {
    const maybeCode = 'code' in error ? (error as { code?: unknown }).code : undefined
    const maybeMessage = 'message' in error ? (error as { message?: unknown }).message : undefined
    return {
      code: typeof maybeCode === 'string' ? maybeCode : undefined,
      message: typeof maybeMessage === 'string' ? maybeMessage : 'Unknown error',
    }
  }

  return { message: 'Unknown error' }
}

function classifySupabaseError(error: SafeSupabaseError):
  | { kind: 'SCHEMA_NOT_READY' }
  | { kind: 'AUTH_OR_RLS' }
  | { kind: 'OTHER' } {
  const code = error.code
  const message = error.message.toLowerCase()

  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    code === '42703' ||
    message.includes('schema cache') ||
    (message.includes('could not find') && message.includes('schema cache')) ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('column') && message.includes('does not exist')
  ) {
    return { kind: 'SCHEMA_NOT_READY' }
  }

  if (
    code === '42501' ||
    message.includes('permission denied') ||
    message.includes('rls') ||
    message.includes('jwt') ||
    message.includes('not authorized')
  ) {
    return { kind: 'AUTH_OR_RLS' }
  }

  return { kind: 'OTHER' }
}
