import type { ReactNode } from 'react'
import OrgDesignTokensServerProvider from '@/app/components/OrgDesignTokensServerProvider'
import ClinicianLayoutClient from './ClinicianLayoutClient'

export const dynamic = 'force-dynamic'

export default function ClinicianLayout({ children }: { children: ReactNode }) {
  return (
    <OrgDesignTokensServerProvider>
      <ClinicianLayoutClient>{children}</ClinicianLayoutClient>
    </OrgDesignTokensServerProvider>
  )
}
