import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { markDashboardVisited } from '@/lib/utils/dashboardFirstPolicy'
import DashboardClient from './client'

export const dynamic = 'force-dynamic'

/**
 * Patient Dashboard Page (E6.4.2, E6.5.1)
 * 
 * Landing page after onboarding completion.
 * Shows next steps for patient (start/continue assessments).
 * 
 * E6.5.1: Dashboard-first entry point - marks dashboard as visited
 * 
 * Route: /patient/dashboard
 */
export default async function PatientDashboardPage() {
  // Create Supabase server client
  const supabase = await createServerSupabaseClient()

  // Check authentication (AC3: 401-first, no DB calls before auth)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // E6.5.1 AC1: Mark dashboard as visited for this session
  // This allows subsequent navigation to funnels/results
  await markDashboardVisited()

  // Render client component
  return <DashboardClient />
}
