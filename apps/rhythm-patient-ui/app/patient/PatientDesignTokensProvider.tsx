/**
 * E73.9: Patient Design Tokens Provider
 * 
 * Server component that loads design tokens (static + Studio overrides)
 * and provides them to the client-side context.
 */

import type { ReactNode } from 'react'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'
import { loadDesignTokens } from '@/lib/design-tokens/loader'

export default async function PatientDesignTokensProvider({ children }: { children: ReactNode }) {
  // E73.9: Load design tokens server-side (static + dynamic Studio overrides)
  const tokens = await loadDesignTokens()
  
  return <DesignTokensProvider tokens={tokens}>{children}</DesignTokensProvider>
}
