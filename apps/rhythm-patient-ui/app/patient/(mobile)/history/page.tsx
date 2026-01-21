import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { enforceDashboardFirst } from '@/lib/utils/dashboardFirstPolicy'
import PatientHistoryClient from './PatientHistoryClient'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * Patient History Page (E6.5.1)
 * 
 * Shows patient assessment history.
 * Enforces dashboard-first policy.
 * 
 * Route: /patient/history
 */
export default async function PatientHistoryPage() {
  // Create Supabase server client
  const supabase = await createServerSupabaseClient()

  // E6.5.1 AC3: Check authentication FIRST (401-first, no DB calls before auth)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // E6.5.1 AC2: Enforce dashboard-first policy
  const redirectUrl = await enforceDashboardFirst('/patient/history')
  
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  return <PatientHistoryClient />
}
