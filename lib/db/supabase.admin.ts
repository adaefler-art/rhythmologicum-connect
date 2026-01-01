/**
 * Admin Supabase Client (Service Role - Use Sparingly!)
 * 
 * ⚠️  WARNING: This client BYPASSES Row Level Security (RLS)
 * 
 * This client has unrestricted database access and should only be used when:
 * 1. Writing audit logs (must persist regardless of user permissions)
 * 2. Cross-user admin operations (e.g., clinician viewing all patients)
 * 3. System-level metadata queries (funnel catalogs, content pages)
 * 4. Background jobs and migrations
 * 
 * EVERY use of this client MUST be:
 * - Documented with a clear justification
 * - Scoped to specific tables/operations
 * - Protected by proper authentication checks
 * 
 * @module lib/db/supabase.admin
 */

import 'server-only' // Ensures this CANNOT be imported in browser code
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/lib/types/supabase'

/**
 * Creates an admin Supabase client with service role
 * 
 * ⚠️  DANGER ZONE: This client bypasses ALL RLS policies
 * 
 * Security considerations:
 * - Server-only (enforced by 'server-only' import)
 * - Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 * - Should only be called from authenticated, authorized contexts
 * - Prefer createServerSupabaseClient when possible
 * 
 * @returns Supabase client with service role privileges
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not configured
 * 
 * @example
 * ```typescript
 * // In an admin API route (after auth check!)
 * import { createAdminSupabaseClient } from '<admin-supabase-factory-module>'
 * import { hasClinicianRole } from '@/lib/db/supabase.server'
 * 
 * export async function GET() {
 *   // ALWAYS check auth first
 *   if (!(await hasClinicianRole())) {
 *     return new Response('Forbidden', { status: 403 })
 *   }
 *   
 *   // Use admin client for cross-user query
 *   const admin = createAdminSupabaseClient()
 *   const { data } = await admin.from('funnels_catalog').select('*')
 *   return Response.json({ data })
 * }
 * ```
 */
export function createAdminSupabaseClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not configured. Admin client unavailable.'
    )
  }

  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Admin client unavailable. ' +
        'This is a server-only secret and must be set in the deployment environment.'
    )
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Scoped admin operations with documented justifications
 * 
 * These helper functions encapsulate common admin operations and make
 * the scope/justification explicit in the code.
 */
export const adminOperations = {
  /**
   * Get all funnels for admin management
   * 
   * Justification: Clinicians need to view/manage all funnels, not just their own
   * Scope: funnels_catalog, funnel_versions, pillars (metadata tables only)
   * 
   * @param includeInactive - Whether to include inactive funnels
   */
  async getFunnelsCatalog(includeInactive = false) {
    const admin = createAdminSupabaseClient()

    let query = admin
      .from('funnels_catalog')
      .select(`
        id,
        slug,
        title,
        description,
        pillar_id,
        est_duration_min,
        outcomes,
        is_active,
        default_version_id,
        created_at,
        updated_at
      `)
      .order('title', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    return query
  },

  /**
   * Get published content pages for a funnel
   * 
   * Justification: Content pages are funnel metadata, need to be accessible
   *                to all users of that funnel
   * Scope: content_pages (published status only), content_page_sections
   * 
   * @param funnelId - UUID of the funnel
   */
  async getPublishedContentPages(funnelId: string) {
    const admin = createAdminSupabaseClient()

    return admin
      .from('content_pages')
      .select('*, content_page_sections(*)')
      .eq('funnel_id', funnelId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('priority', { ascending: false })
  },

  /**
   * Get funnel definition (steps, questions) for runtime
   * 
   * Justification: Funnel structure is metadata needed for all users
   * Scope: funnels, funnel_steps, funnel_step_questions, questions
   * 
   * @param funnelSlug - Funnel slug or UUID
   */
  async getFunnelDefinition(funnelSlug: string) {
    const admin = createAdminSupabaseClient()

    // First get funnel
    const { data: funnel, error: funnelError } = await admin
      .from('funnels')
      .select('id, slug, title')
      .or(`slug.eq.${funnelSlug},id.eq.${funnelSlug}`)
      .single()

    if (funnelError || !funnel) {
      return { data: null, error: funnelError || new Error('Funnel not found') }
    }

    // Then get steps and questions
    const { data: steps, error: stepsError } = await admin
      .from('funnel_steps')
      .select(`
        id,
        order_index,
        funnel_step_questions (
          id,
          question_id,
          is_required,
          order_index,
          questions (
            id,
            text,
            input_type,
            options
          )
        )
      `)
      .eq('funnel_id', funnel.id)
      .order('order_index', { ascending: true })

    if (stepsError) {
      return { data: null, error: stepsError }
    }

    return { data: { funnel, steps }, error: null }
  },
}
