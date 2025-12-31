import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import FunnelCatalogClient from './client'
import { env } from '@/lib/env'

/**
 * Patient Funnel Catalog Page (V05-I02.1)
 * 
 * Server component that handles authentication and renders the funnel catalog UI.
 * Displays funnels organized by pillar taxonomy.
 * 
 * Route: /patient/funnels
 */
export default async function FunnelCatalogPage() {
  // Create Supabase server client
  const cookieStore = await cookies()
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

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
