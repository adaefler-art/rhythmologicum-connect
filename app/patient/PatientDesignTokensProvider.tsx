import type { ReactNode } from 'react'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'
import patientTokens from '@/lib/design-tokens/patientTokens'

export default function PatientDesignTokensProvider({ children }: { children: ReactNode }) {
  return <DesignTokensProvider tokens={patientTokens}>{children}</DesignTokensProvider>
}
