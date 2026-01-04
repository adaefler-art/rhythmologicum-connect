'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { DesktopLayout } from '@/lib/ui'
import { getNavItemsForRole, hasAnyRole, getUserRole, getRoleDisplayName } from '@/lib/utils/roleBasedRouting'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'

// Constants for redirect URLs
const AUTH_REQUIRED_REDIRECT = '/?error=authentication_required&message=Bitte melden Sie sich an.'
const ACCESS_DENIED_REDIRECT = '/?error=access_denied&message=Keine Berechtigung für den Clinician-Bereich.'

export default function AdminLayout({ children }: { children: ReactNode }) {
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

      // Check if user has clinician or admin or nurse role
      if (!hasAnyRole(user, ['clinician', 'admin', 'nurse'])) {
        router.push(ACCESS_DENIED_REDIRECT)
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          if (!hasAnyRole(session.user, ['clinician', 'admin', 'nurse'])) {
            router.push(ACCESS_DENIED_REDIRECT)
          } else {
            setUser(session.user)
            setLoading(false)
          }
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
