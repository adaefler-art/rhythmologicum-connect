import { redirect } from 'next/navigation'
import { getOnboardingStatus } from '@/lib/actions/onboarding'
import FunnelSelectorClient from './client'

/**
 * Mobile Funnel Selector Page
 * 
 * Server component that handles authentication and renders the funnel selection UI.
 * Checks onboarding status and redirects to consent/profile if incomplete.
 * Part of v0.4.1 mobile funnel selector feature.
 * 
 * Route: /patient/assessment
 */
export default async function FunnelSelectorPage() {
  // Check onboarding status (includes auth check)
  const statusResult = await getOnboardingStatus()

  if (!statusResult.success) {
    // Not authenticated - redirect to login
    redirect('/login')
  }

  const status = statusResult.data!

  // Redirect to appropriate onboarding step if not complete
  if (!status.hasConsent) {
    redirect('/patient/onboarding/consent')
  }

  if (!status.hasProfile) {
    redirect('/patient/onboarding/profile')
  }

  // Onboarding complete - render client component
  return <FunnelSelectorClient />
}
