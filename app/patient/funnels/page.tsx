import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { enforceDashboardFirst } from '@/lib/utils/dashboardFirstPolicy'
import FunnelCatalogClient from './client'

// V05-FIXOPT-01: Prevent static generation for authenticated page
export const dynamic = 'force-dynamic'

/**
 * Patient Funnel Catalog Page (V05-I02.1, E6.5.1)
 * 
 * Server component that handles authentication and renders the funnel catalog UI.
 * Displays funnels organized by pillar taxonomy.
 * 
 * E6.5.1: Enforces dashboard-first policy
 * 
 * Route: /patient/funnels
 */
export default async function FunnelCatalogPage() {
  // Create Supabase server client (canonical)
  const supabase = await createServerSupabaseClient()

  // E6.5.1 AC3: Check authentication FIRST (401-first, no DB calls before auth)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // E6.5.1 AC2: Enforce dashboard-first policy
  const redirectUrl = await enforceDashboardFirst('/patient/funnels')
  
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  // Render client component
  return <FunnelCatalogClient />
}
