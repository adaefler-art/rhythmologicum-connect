/**
 * E6.4.6, E6.5.1: Escalation Page
 *
 * Server wrapper for escalation placeholder page.
 * Enforces authentication and dashboard-first policy.
 *
 * Route: /patient/escalation
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { enforceDashboardFirst } from '@/lib/utils/dashboardFirstPolicy'
import EscalationClient from './client'

export const dynamic = 'force-dynamic'

export default async function EscalationPage() {
  const supabase = await createServerSupabaseClient()

  // E6.5.1 AC3: Check authentication FIRST (401-first, no DB calls before auth)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?error=authentication_required')
  }

  // E6.5.1 AC2: Enforce dashboard-first policy
  const redirectUrl = await enforceDashboardFirst('/patient/escalation')
  
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  return <EscalationClient />
}
