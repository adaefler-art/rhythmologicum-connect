import type { ReactNode } from 'react'
import { MobileShellV2 } from '@/apps/rhythm-patient-ui/app/patient/components'
import PatientDesignTokensProvider from '@/apps/rhythm-patient-ui/app/patient/PatientDesignTokensProvider'

export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <PatientDesignTokensProvider>
      <MobileShellV2>{children}</MobileShellV2>
    </PatientDesignTokensProvider>
  )
}
