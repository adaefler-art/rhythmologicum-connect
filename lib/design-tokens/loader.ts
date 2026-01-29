/**
 * E73.9: Design Token Loader for Patient UI
 * 
 * Server-side utility to load design tokens from the API.
 * Merges static defaults with dynamic tokens from Studio configuration.
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import designTokens from '@/lib/design/tokens'

type DesignTokens = typeof designTokens

/**
 * Load design tokens for the current user's organization
 * 
 * Returns merged tokens (static defaults + dynamic overrides from Studio).
 * Falls back to static tokens on error.
 * 
 * E73.9 AC: Studio edit → Patient sees changes on reload
 */
export async function loadDesignTokens(): Promise<DesignTokens> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get patient's organization ID (if assigned)
    // For now, we use null (global tokens)
    // TODO E73.9: Implement org lookup from patient_profiles
    const organizationId: string | null = null
    
    // Fetch merged tokens using get_design_tokens function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_design_tokens', { org_id: organizationId as any })
    
    if (tokensError || !tokensData) {
      console.warn('[loadDesignTokens] Failed to fetch tokens, using static defaults', {
        error: tokensError,
      })
      return designTokens
    }
    
    // Merge dynamic tokens with static defaults
    // Dynamic tokens override static ones at the category level
    const mergedTokens = {
      ...designTokens,
      ...(typeof tokensData === 'object' ? tokensData : {}),
    }
    
    console.log('[loadDesignTokens] Loaded design tokens', {
      organizationId,
      dynamicCategories: Object.keys(tokensData),
    })
    
    return mergedTokens as DesignTokens
  } catch (error) {
    console.error('[loadDesignTokens] Error loading tokens', {
      errorType: error instanceof Error ? error.name : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    
    // Fail gracefully: return static defaults
    return designTokens
  }
}
