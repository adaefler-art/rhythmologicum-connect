import type { ReactNode } from 'react'
import { MobileShellV2 } from '../patient/components'
import PatientDesignTokensProvider from '../patient/PatientDesignTokensProvider'

export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <PatientDesignTokensProvider>
      <MobileShellV2>{children}</MobileShellV2>
    </PatientDesignTokensProvider>
  )
}
