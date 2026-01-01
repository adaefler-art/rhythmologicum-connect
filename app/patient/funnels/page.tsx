import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import FunnelCatalogClient from './client'

/**
 * Patient Funnel Catalog Page (V05-I02.1)
 * 
 * Server component that handles authentication and renders the funnel catalog UI.
 * Displays funnels organized by pillar taxonomy.
 * 
 * Route: /patient/funnels
 */
export default async function FunnelCatalogPage() {
  // Create Supabase server client (canonical)
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Render client component
  return <FunnelCatalogClient />
}
