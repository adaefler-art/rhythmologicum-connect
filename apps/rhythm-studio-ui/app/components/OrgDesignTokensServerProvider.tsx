import type { ReactNode } from 'react'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'
import { loadUserDesignTokens } from '@/lib/design-tokens-loader'

export const dynamic = 'force-dynamic'

export default async function OrgDesignTokensServerProvider({
  children,
}: {
  children: ReactNode
}) {
  let tokens
  try {
    tokens = await loadUserDesignTokens()
  } catch (error) {
    console.warn(
      '[OrgDesignTokensServerProvider] Could not load user design tokens, using defaults:',
      error,
    )
    tokens = undefined
  }

  return <DesignTokensProvider tokens={tokens}>{children}</DesignTokensProvider>
}
