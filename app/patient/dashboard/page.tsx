import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import DashboardClient from './client'

export const dynamic = 'force-dynamic'

/**
 * Patient Dashboard Page (E6.4.2)
 * 
 * Landing page after onboarding completion.
 * Shows next steps for patient (start/continue assessments).
 * 
 * Route: /patient/dashboard
 */
export default async function PatientDashboardPage() {
  // Create Supabase server client
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Render client component
  return <DashboardClient />
}
