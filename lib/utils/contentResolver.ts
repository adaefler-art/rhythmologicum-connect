import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ContentPage } from '@/lib/types/content'
import { env } from '@/lib/env'

/**
 * F5 - Content Resolver: Core utility for Funnel Integration
 * 
 * This module provides the central API for selecting appropriate content pages
 * based on funnel, category, and optional slug parameters, with intelligent
 * fallback handling.
 */

/**
 * Options for content page resolution
 */
export type ContentResolverOptions = {
  /** Funnel slug or UUID */
  funnel: string
  /** Optional category filter (e.g., 'intro', 'info', 'result') */
  category?: string
  /** Optional specific page slug */
  slug?: string
  /** Whether to include draft pages (default: false) */
  includeDrafts?: boolean
}

/**
 * Result of content page resolution
 */
export type ContentResolverResult = {
  /** The resolved content page, or null if not found */
  page: ContentPage | null
  /** The resolution strategy that was used */
  strategy: 'exact-match' | 'category-default' | 'funnel-default' | 'not-found'
  /** Any error that occurred during resolution (non-fatal) */
  error?: string
}

/**
 * Initialize Supabase client for content resolution
 * Uses service role key for unrestricted access to published content
 */
function getSupabaseClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

/**
 * Check if a string is a valid UUID
 */
function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Type for funnel query result
 */
type FunnelQueryResult = {
  id: string
}

/**
 * Resolve funnel slug or UUID to funnel ID
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveFunnelId(supabase: SupabaseClient<any>, funnelIdentifier: string): Promise<string | null> {
  try {
    // If it's already a UUID, return it
    if (isUUID(funnelIdentifier)) {
      return funnelIdentifier
    }

    // Otherwise, look up by slug
    const { data: funnel, error } = await supabase
      .from('funnels')
      .select('id')
      .eq('slug', funnelIdentifier)
      .single()

    if (error || !funnel) {
      return null
    }

    return (funnel as FunnelQueryResult).id
  } catch (error) {
    console.error('Error resolving funnel ID:', error)
    return null
  }
}

/**
 * Main Content Resolver API
 * 
 * Fetches the most appropriate content page based on funnel, category, and slug.
 * Implements intelligent fallback logic:
 * 
 * 1. **Exact Match**: funnel + category + slug
 * 2. **Category Default**: funnel + category, highest priority
 * 3. **Funnel Default**: funnel only, highest priority
 * 4. **Not Found**: Returns null gracefully
 * 
 * @param options - Resolution options (funnel, category, slug)
 * @returns ContentResolverResult with page and resolution strategy
 * 
 * @example
 * ```typescript
 * // Get a specific page by slug
 * const result = await getContentPage({
 *   funnel: 'stress-assessment',
 *   category: 'intro',
 *   slug: 'was-ist-stress'
 * })
 * 
 * // Get default intro page for funnel
 * const result = await getContentPage({
 *   funnel: 'stress-assessment',
 *   category: 'intro'
 * })
 * 
 * // Get any default page for funnel
 * const result = await getContentPage({
 *   funnel: 'stress-assessment'
 * })
 * ```
 */
export async function getContentPage(
  options: ContentResolverOptions,
): Promise<ContentResolverResult> {
  try {
    const supabase = getSupabaseClient()
    const { funnel, category, slug, includeDrafts = false } = options

    // Resolve funnel to UUID
    const funnelId = await resolveFunnelId(supabase, funnel)
    if (!funnelId) {
      return {
        page: null,
        strategy: 'not-found',
        error: `Funnel not found: ${funnel}`,
      }
    }

    // Build base query
    let query = supabase
      .from('content_pages')
      .select('*')
      .eq('funnel_id', funnelId)
      .is('deleted_at', null)

    // Filter by status unless includeDrafts is true
    if (!includeDrafts) {
      query = query.eq('status', 'published')
    }

    // Strategy 1: Exact match (funnel + category + slug)
    // Note: If slug is provided without category, it falls through to Strategy 2/3
    // where slug matching happens implicitly if the page exists
    if (category && slug) {
      const { data, error } = await query
        .eq('category', category)
        .eq('slug', slug)
        .single()

      if (!error && data) {
        return {
          page: data as ContentPage,
          strategy: 'exact-match',
        }
      }
    }

    // Strategy 2: Category default (funnel + category, highest priority)
    if (category) {
      const { data, error } = await query
        .eq('category', category)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        return {
          page: data as ContentPage,
          strategy: 'category-default',
        }
      }
    }

    // Strategy 3: Funnel default (highest priority in funnel)
    const { data, error } = await query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      return {
        page: data as ContentPage,
        strategy: 'funnel-default',
      }
    }

    // Strategy 4: Not found
    return {
      page: null,
      strategy: 'not-found',
      error: 'No matching content page found',
    }
  } catch (error) {
    // Graceful error handling - never crash
    console.error('Content Resolver error:', error)
    return {
      page: null,
      strategy: 'not-found',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get multiple content pages for a funnel with optional category filter
 * 
 * @param options - Resolution options
 * @returns Array of content pages, ordered by priority (descending)
 * 
 * @example
 * ```typescript
 * // Get all intro pages for a funnel
 * const pages = await getContentPages({
 *   funnel: 'stress-assessment',
 *   category: 'intro'
 * })
 * ```
 */
export async function getContentPages(
  options: ContentResolverOptions,
): Promise<ContentPage[]> {
  try {
    const supabase = getSupabaseClient()
    const { funnel, category, includeDrafts = false } = options

    // Resolve funnel to UUID
    const funnelId = await resolveFunnelId(supabase, funnel)
    if (!funnelId) {
      return []
    }

    // Build query
    let query = supabase
      .from('content_pages')
      .select('*')
      .eq('funnel_id', funnelId)
      .is('deleted_at', null)

    // Filter by status unless includeDrafts is true
    if (!includeDrafts) {
      query = query.eq('status', 'published')
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Order by priority and creation date
    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching content pages:', error)
      return []
    }

    return (data || []) as ContentPage[]
  } catch (error) {
    // Graceful error handling
    console.error('Content Resolver error:', error)
    return []
  }
}

/**
 * Check if a content page exists for the given criteria
 * 
 * @param options - Resolution options
 * @returns true if at least one matching page exists
 * 
 * @example
 * ```typescript
 * const hasIntro = await hasContentPage({
 *   funnel: 'stress-assessment',
 *   category: 'intro'
 * })
 * ```
 */
export async function hasContentPage(
  options: ContentResolverOptions,
): Promise<boolean> {
  const result = await getContentPage(options)
  return result.page !== null
}
