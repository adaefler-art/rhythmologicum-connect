import { redirect } from 'next/navigation'

/**
 * Legacy Funnel Selector Route (V05-FIXOPT-01)
 * 
 * This route has been deprecated in favor of /patient/funnels.
 * Redirects to the new funnel catalog page to prevent broken bookmarks.
 * 
 * Route: /patient/assessment (DEPRECATED)
 * New Route: /patient/funnels
 */
export default async function LegacyFunnelSelectorPage() {
  // Redirect to new funnel catalog page
  redirect('/patient/funnels')
}
