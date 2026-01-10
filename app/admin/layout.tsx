import type { ReactNode } from 'react'
import OrgDesignTokensServerProvider from '@/app/components/OrgDesignTokensServerProvider'
import AdminLayoutClient from './AdminLayoutClient'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <OrgDesignTokensServerProvider>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </OrgDesignTokensServerProvider>
  )
}
