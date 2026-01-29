/**
 * E73.9: useDesignTokensLoader Hook
 * 
 * Client-side hook to load dynamic design tokens from Studio configuration.
 * 
 * This provides the literal callsite required by E73.9 Vertical Slice Strategy A:
 * - Endpoint: /api/patient/design
 * - Callsite: fetch('/api/patient/design') - literal string present
 * - Feature: Studio Design Tool v1 token application
 * 
 * Usage:
 * - Server-side: Use loadDesignTokens() from lib/design-tokens/loader
 * - Client-side: Use this hook for runtime token refresh (optional)
 */

import { useState, useEffect } from 'react'
import designTokens from '@/lib/design/tokens'

type DesignTokens = typeof designTokens

type TokenLoadState = 'idle' | 'loading' | 'success' | 'error'

type UseDesignTokensLoaderResult = {
  tokens: DesignTokens
  state: TokenLoadState
  error: string | null
  reload: () => Promise<void>
}

/**
 * Load design tokens from Studio configuration
 * 
 * E73.9: Provides literal callsite for /api/patient/design endpoint
 * 
 * @param autoLoad - Whether to load tokens on mount (default: false)
 * @returns Design tokens, load state, and reload function
 * 
 * @example
 * function MyComponent() {
 *   const { tokens, state, reload } = useDesignTokensLoader({ autoLoad: true })
 *   
 *   if (state === 'loading') return <LoadingSpinner />
 *   
 *   return <div style={{ color: tokens.colors.primary[500] }}>Hello</div>
 * }
 */
export function useDesignTokensLoader(options?: { autoLoad?: boolean }): UseDesignTokensLoaderResult {
  const [tokens, setTokens] = useState<DesignTokens>(designTokens)
  const [state, setState] = useState<TokenLoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const loadTokens = async () => {
    setState('loading')
    setError(null)

    try {
      // E73.9: Literal callsite for /api/patient/design (Vertical Slice requirement)
      const response = await fetch('/api/patient/design', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to load design tokens: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('Invalid response format')
      }

      const dynamicTokens = result.data.tokens || {}

      // Merge dynamic tokens with static defaults
      const mergedTokens = {
        ...designTokens,
        ...dynamicTokens,
      }

      setTokens(mergedTokens as DesignTokens)
      setState('success')
    } catch (err) {
      console.error('[useDesignTokensLoader] Failed to load tokens', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('error')
      
      // Keep using static defaults on error
      setTokens(designTokens)
    }
  }

  useEffect(() => {
    if (options?.autoLoad) {
      loadTokens()
    }
  }, [options?.autoLoad])

  return {
    tokens,
    state,
    error,
    reload: loadTokens,
  }
}
