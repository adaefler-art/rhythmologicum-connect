'use client'

/**
 * Design Tokens Context
 * 
 * V05-I09.2: Provides design tokens to client components with organization override support.
 * Tokens are loaded server-side and passed to client components via this context.
 */

import { createContext, useContext, type ReactNode } from 'react'
import designTokens from '@/lib/design-tokens'

type DesignTokens = typeof designTokens

const DesignTokensContext = createContext<DesignTokens>(designTokens)

interface DesignTokensProviderProps {
  children: ReactNode
  tokens?: DesignTokens
}

/**
 * Design Tokens Provider
 * 
 * Wraps the application to provide design tokens to all child components.
 * Tokens can be customized per organization by passing organization-specific
 * tokens via the `tokens` prop.
 * 
 * @param props.children - Child components
 * @param props.tokens - Optional custom tokens (defaults to base design tokens)
 * 
 * @example
 * // In a server component or layout
 * import { loadUserDesignTokens } from '@/lib/design-tokens-loader'
 * 
 * const tokens = await loadUserDesignTokens()
 * 
 * <DesignTokensProvider tokens={tokens}>
 *   {children}
 * </DesignTokensProvider>
 */
export function DesignTokensProvider({ children, tokens = designTokens }: DesignTokensProviderProps) {
  return (
    <DesignTokensContext.Provider value={tokens}>
      {children}
    </DesignTokensContext.Provider>
  )
}

/**
 * Use Design Tokens Hook
 * 
 * Access design tokens from any client component within the provider tree.
 * Tokens automatically include organization-specific overrides if provided.
 * 
 * @returns Design tokens object with all token categories
 * 
 * @example
 * function MyComponent() {
 *   const { spacing, colors, typography } = useDesignTokens()
 *   
 *   return (
 *     <div style={{ padding: spacing.lg, color: colors.primary[500] }}>
 *       <h1 style={{ fontSize: typography.fontSize['2xl'] }}>Hello</h1>
 *     </div>
 *   )
 * }
 */
export function useDesignTokens(): DesignTokens {
  const context = useContext(DesignTokensContext)
  
  if (!context) {
    // Fallback to default tokens if context is not available
    console.warn('[useDesignTokens] Context not found, using default tokens')
    return designTokens
  }
  
  return context
}
