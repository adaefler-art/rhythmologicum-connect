/**
 * Server Supabase Client (SSR with User Session)
 * 
 * This is the DEFAULT client for server-side code.
 * - Uses anon key + cookie-based authentication
 * - RLS policies are ACTIVE (user context preserved)
 * - Server-only (never bundled to browser)
 * 
 * Use this for:
 * - API routes
 * - Server components
 * - Server actions
 * - Any server code that needs user-scoped access
 * 
 * @module lib/db/supabase.server
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { Database } from '@/lib/types/supabase'

/**
 * Creates a server-side Supabase client with user session
 * 
 * This client:
 * - Uses cookie-based authentication (preserves user context)
 * - Enforces RLS policies based on authenticated user
 * - Automatically handles session refresh
 * - Server-only (safe to use service operations)
 * 
 * @returns Promise<SupabaseClient> with user context
 * @throws Error if Supabase URL or anon key is not configured
 * 
 * @example
 * ```typescript
 * // In an API route
 * import { createServerSupabaseClient } from '@/lib/db/supabase.server'
 * 
 * export async function GET() {
 *   const supabase = await createServerSupabaseClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   
 *   if (!user) {
 *     return new Response('Unauthorized', { status: 401 })
 *   }
 *   
 *   // RLS will automatically filter based on user
 *   const { data } = await supabase.from('user_data').select('*')
 *   return Response.json({ data })
 * }
 * ```
 */
export async function createServerSupabaseClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Supabase configuration missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              path: options?.path ?? '/',
            })
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  })
}

/**
 * Gets the currently authenticated user
 * 
 * @returns Promise<User | null> - The authenticated user or null if not logged in
 * 
 * @example
 * ```typescript
 * import { getCurrentUser } from '@/lib/db/supabase.server'
 * 
 * export async function GET() {
 *   const user = await getCurrentUser()
 *   if (!user) {
 *     return new Response('Unauthorized', { status: 401 })
 *   }
 *   // ...
 * }
 * ```
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Checks if the current user has clinician role
 * 
 * @returns Promise<boolean> - true if user is a clinician or admin
 * 
 * @example
 * ```typescript
 * import { hasClinicianRole } from '@/lib/db/supabase.server'
 * 
 * export async function GET() {
 *   if (!(await hasClinicianRole())) {
 *     return new Response('Forbidden', { status: 403 })
 *   }
 *   // ...
 * }
 * ```
 */
export async function hasClinicianRole(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Check in app_metadata and user_metadata
  const role = user.app_metadata?.role || user.user_metadata?.role
  return role === 'clinician' || role === 'admin'
}

/**
 * Checks if the current user has admin or clinician role
 * Alias for hasClinicianRole (in this system, clinicians have admin access)
 * 
 * @returns Promise<boolean> - true if user is a clinician or admin
 */
export async function hasAdminOrClinicianRole(): Promise<boolean> {
  return hasClinicianRole()
}

/**
 * Gets user role from app_metadata or user_metadata
 * 
 * @returns Promise<string | null> - User role or null if not found
 */
export async function getUserRole(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return user.app_metadata?.role || user.user_metadata?.role || null
}
