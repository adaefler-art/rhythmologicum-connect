import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { enforceDashboardFirst } from '@/lib/utils/dashboardFirstPolicy'
import AnamneseTimelineClient from './client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * E75.3: Anamnese Timeline Page
 * 
 * Patient can view, add, edit, and archive medical history entries.
 * Enforces dashboard-first policy.
 * 
 * Route: /patient/anamnese-timeline
 */
export default async function AnamneseTimelinePage() {
  // Create Supabase server client
  const supabase = await createServerSupabaseClient()

  // Check authentication FIRST
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Enforce dashboard-first policy
  const redirectUrl = await enforceDashboardFirst('/patient/anamnese-timeline')
  
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  return <AnamneseTimelineClient />
}
