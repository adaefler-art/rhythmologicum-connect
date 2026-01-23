import type { ReactNode } from 'react'
import OrgDesignTokensServerProvider from '@/app/components/OrgDesignTokensServerProvider'
import AdminLayoutClient from './AdminLayoutClient'
import { getStudioEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  getStudioEnv()
  return (
    <OrgDesignTokensServerProvider>
      <div className="min-h-screen">
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </div>
    </OrgDesignTokensServerProvider>
  )
}
