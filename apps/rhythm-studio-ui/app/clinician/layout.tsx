import type { ReactNode } from 'react'
import OrgDesignTokensServerProvider from '@/app/components/OrgDesignTokensServerProvider'
import ClinicianLayoutClient from './ClinicianLayoutClient'
import { getStudioEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default function ClinicianLayout({ children }: { children: ReactNode }) {
  getStudioEnv()
  return (
    <OrgDesignTokensServerProvider>
      <ClinicianLayoutClient>{children}</ClinicianLayoutClient>
    </OrgDesignTokensServerProvider>
  )
}
