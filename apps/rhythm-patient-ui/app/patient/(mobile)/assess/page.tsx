import { redirect } from 'next/navigation'

/**
 * V2 Assessment Landing Page
 * 
 * This route redirects to the funnel catalog (/patient/funnels) for now.
 * In the future, this could be a dedicated assessment landing page.
 * 
 * Route: /patient/assess
 */
export default async function AssessPage() {
  // Redirect to funnel catalog
  redirect('/patient/funnels')
}
