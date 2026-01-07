/**
 * Design Tokens Loader with Organization Override Support
 * 
 * V05-I09.2: Provides runtime loading of design tokens with tenant/clinic overrides.
 * Tokens can be customized per organization in the database while maintaining
 * backwards compatibility with the default tokens defined in design-tokens.ts
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import designTokens from './design-tokens'

/**
 * Deep merge function for combining default tokens with overrides
 * @param target - Default token object
 * @param source - Override token object
 * @returns Merged token object
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = deepMerge(target[key], source[key] as any)
      } else {
        result[key] = source[key] as any
      }
    } else {
      result[key] = source[key] as any
    }
  }
  
  return result
}

/**
 * Load design tokens with organization-specific overrides
 * 
 * @param organizationId - Optional organization ID for tenant-specific tokens
 * @returns Design tokens object with any organization overrides applied
 * 
 * @example
 * // Load default tokens
 * const tokens = await loadDesignTokens()
 * 
 * // Load tokens with org override
 * const orgTokens = await loadDesignTokens('org-uuid')
 */
export async function loadDesignTokens(organizationId?: string | null) {
  // Start with default tokens
  let tokens = { ...designTokens }
  
  // If no organizationId provided, return defaults
  if (!organizationId) {
    return tokens
  }
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // Fetch organization-specific token overrides
    const { data: overrides, error } = await supabase
      // @ts-expect-error - design_tokens table will be added to types after type regeneration
      .from('design_tokens')
      .select('token_category, token_key, token_value')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
    
    if (error) {
      console.error('[loadDesignTokens] Error fetching token overrides:', error)
      // Return default tokens on error
      return tokens
    }
    
    // Apply overrides to the default tokens
    if (overrides && overrides.length > 0) {
      const overridesByCategory: Record<string, Record<string, any>> = {}
      
      // Group overrides by category - type assertion until types are regenerated
      const overrideArray = overrides as any[]
      
      for (const override of overrideArray) {
        if (!overridesByCategory[override.token_category]) {
          overridesByCategory[override.token_category] = {}
        }
        overridesByCategory[override.token_category][override.token_key] = override.token_value
      }
      
      // Merge overrides into tokens
      for (const category in overridesByCategory) {
        if (category in tokens) {
          tokens = {
            ...tokens,
            [category]: deepMerge(
              tokens[category as keyof typeof tokens] as any,
              overridesByCategory[category]
            ),
          }
        }
      }
    }
    
    return tokens
  } catch (err) {
    console.error('[loadDesignTokens] Unexpected error:', err)
    // Return default tokens on error
    return tokens
  }
}

/**
 * Get organization ID from user's membership
 * 
 * @returns Organization ID if user is a member, null otherwise
 */
export async function getUserOrganizationId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return null
    }
    
    // Get user's active organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('user_org_membership')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (membershipError || !membership) {
      return null
    }
    
    return membership.organization_id
  } catch (err) {
    console.error('[getUserOrganizationId] Error:', err)
    return null
  }
}

/**
 * Load design tokens for the current user's organization
 * 
 * Convenience function that automatically determines the user's organization
 * and loads appropriate tokens.
 * 
 * @returns Design tokens with organization overrides if applicable
 * 
 * @example
 * const tokens = await loadUserDesignTokens()
 */
export async function loadUserDesignTokens() {
  const organizationId = await getUserOrganizationId()
  return loadDesignTokens(organizationId)
}

/**
 * Type definition for loaded design tokens
 */
export type LoadedDesignTokens = typeof designTokens
