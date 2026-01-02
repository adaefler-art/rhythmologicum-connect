/**
 * Public Supabase Client (Browser-Safe)
 * 
 * This client is safe for use in browser bundles.
 * - Uses anon key only (no secrets)
 * - RLS policies are ACTIVE
 * - Suitable for client components and public data
 * 
 * @module lib/db/supabase.public
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/lib/types/supabase'

/**
 * Creates a public Supabase client for browser use
 * 
 * This client:
 * - Uses NEXT_PUBLIC_SUPABASE_ANON_KEY (safe for client bundles)
 * - Enforces RLS policies
 * - Should be used sparingly in favor of server-side data fetching
 * 
 * @returns Supabase client instance
 * @throws Error if Supabase URL or anon key is not configured
 * 
 * @example
 * ```typescript
 * import { createPublicClient } from '@/lib/db/supabase.public'
 * 
 * const supabase = createPublicClient()
 * const { data } = await supabase.from('public_table').select('*')
 * ```
 */
export function createPublicClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Supabase configuration missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

/**
 * Singleton public client instance (lazy-initialized)
 * 
 * Use this for client-side operations where you don't need a fresh instance.
 * For most use cases, prefer server-side data fetching with createServerSupabaseClient.
 * 
 * Lazy initialization ensures tests can mock before client creation.
 */
let _supabasePublic: ReturnType<typeof createPublicClient> | null = null

export function getSupabasePublic() {
  if (!_supabasePublic) {
    _supabasePublic = createPublicClient()
  }
  return _supabasePublic
}

/**
 * @deprecated Use getSupabasePublic() instead for lazy initialization
 * This is kept for backward compatibility but will be removed in future versions
 */
export const supabasePublic = new Proxy({} as ReturnType<typeof createPublicClient>, {
  get(target, prop) {
    return getSupabasePublic()[prop as keyof ReturnType<typeof createPublicClient>]
  }
})
