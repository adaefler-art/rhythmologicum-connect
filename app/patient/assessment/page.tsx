import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import FunnelSelectorClient from './client'

/**
 * Mobile Funnel Selector Page
 * 
 * Server component that handles authentication and renders the funnel selection UI.
 * Part of v0.4.1 mobile funnel selector feature.
 * 
 * Route: /patient/assessment
 */
export default async function FunnelSelectorPage() {
  // Create Supabase server client
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  return <FunnelSelectorClient />
}
