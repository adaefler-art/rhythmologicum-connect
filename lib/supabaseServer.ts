import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function hasClinicianRole(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  // Check in app_metadata and user_metadata
  const role = user.app_metadata?.role || user.user_metadata?.role
  return role === 'clinician'
}

export async function hasAdminOrClinicianRole(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  // Check in app_metadata and user_metadata
  const role = user.app_metadata?.role || user.user_metadata?.role
  // In this system, clinicians have admin access
  return role === 'clinician' || role === 'admin'
}
