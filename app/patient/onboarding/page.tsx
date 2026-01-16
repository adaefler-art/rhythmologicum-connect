import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

/**
 * Onboarding Index Page
 * 
 * Redirects to the appropriate onboarding step based on user's current status.
 * This page handles the /patient/onboarding route used by the NextStep resolver.
 * 
 * Flow:
 * - If not authenticated → redirect to login
 * - If onboarding not started or in_progress → redirect to consent page
 * - If onboarding completed → redirect to dashboard
 */
export default async function OnboardingIndexPage() {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Get patient profile to check onboarding status
  const { data: profile } = await supabase
    .from('patient_profiles')
    .select('onboarding_status')
    .eq('user_id', user.id)
    .single()

  // If onboarding is already completed, redirect to dashboard
  if (profile?.onboarding_status === 'completed') {
    redirect('/patient/dashboard')
  }

  // Otherwise, redirect to consent page (first step of onboarding)
  redirect('/patient/onboarding/consent')
}
