'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { DesktopLayout } from '@/lib/ui'
import {
  getNavItemsForRole,
  hasAnyRole,
  getUserRole,
  getRoleDisplayName,
} from '@/lib/utils/roleBasedRouting'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

type ResolvedUserRole = 'patient' | 'clinician' | 'admin' | 'nurse'

type RoleResolution = { role: ResolvedUserRole | null; status: number | null }

async function notifyAuthCallback(event: string, session: Session | null) {
  try {
    await fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, session }),
    })
  } catch {
    // Best-effort cookie sync; failures are handled by auth guards.
  }
}

async function resolveRole(): Promise<RoleResolution> {
  try {
    const res = await fetch('/api/auth/resolve-role', { method: 'GET' })
    if (!res.ok) return { role: null, status: res.status }
    const json: unknown = await res.json()
    if (!json || typeof json !== 'object') return { role: null, status: res.status }
    const role = (json as { data?: { role?: string } }).data?.role
    if (role === 'patient' || role === 'clinician' || role === 'admin' || role === 'nurse') {
      return { role, status: res.status }
    }
    return { role: null, status: res.status }
  } catch {
    return { role: null, status: null }
  }
}

// Constants for redirect URLs
const AUTH_REQUIRED_REDIRECT = '/?error=authentication_required&message=Bitte melden Sie sich an.'
const ACCESS_DENIED_REDIRECT =
  '/?error=access_denied&message=Keine Berechtigung für den Clinician-Bereich.'

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(AUTH_REQUIRED_REDIRECT)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        await notifyAuthCallback('SIGNED_IN', session)
      }

      // Prefer DB membership role resolution (fail-closed)
      const resolution = await resolveRole()
      if (resolution.role) {
        if (resolution.role !== 'clinician' && resolution.role !== 'admin') {
          router.push(ACCESS_DENIED_REDIRECT)
          return
        }
      } else if (resolution.status === 403) {
        router.push(ACCESS_DENIED_REDIRECT)
        return
      } else {
        // Fallback to metadata only if resolver is unavailable (network/5xx)
        if (!hasAnyRole(user, ['clinician', 'admin'])) {
          router.push(ACCESS_DENIED_REDIRECT)
          return
        }
      }

      setUser(user)
      setLoading(false)
    }

    checkAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't sync SIGNED_OUT events - they're handled by the signout endpoint
      // This prevents auto-relogin after explicit logout
      if (event !== 'SIGNED_OUT') {
        await notifyAuthCallback(event, session ?? null)
      }
      
      if (event === 'SIGNED_OUT') {
        router.push('/')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const resolution = await resolveRole()
          if (resolution.role) {
            if (resolution.role !== 'clinician' && resolution.role !== 'admin') {
              router.push(ACCESS_DENIED_REDIRECT)
              return
            }
          } else if (resolution.status === 403) {
            router.push(ACCESS_DENIED_REDIRECT)
            return
          } else {
            if (!hasAnyRole(session.user, ['clinician', 'admin'])) {
              router.push(ACCESS_DENIED_REDIRECT)
              return
            }
          }
          setUser(session.user)
          setLoading(false)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    } catch {
      // Ignore network errors; client session is already cleared
    }
    window.location.assign('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Authentifizierung wird überprüft…</p>
      </div>
    )
  }

  // Get navigation items and role display name
  const navItems = getNavItemsForRole(user, pathname)
  const role = getUserRole(user)
  const roleDisplay = getRoleDisplayName(role)

  return (
    <DesktopLayout
      appTitle="Rhythmologicum Connect"
      userEmail={user?.email}
      onSignOut={handleSignOut}
      navItems={navItems}
    >
      {/* Role indicator */}
      <div className="mb-4 text-xs text-slate-500">
        Angemeldet als: <span className="font-medium text-slate-700">{roleDisplay}</span>
      </div>
      {children}
    </DesktopLayout>
  )
}
