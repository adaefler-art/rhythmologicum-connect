'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { DesktopLayout } from '@/lib/ui'
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

      const role = user.app_metadata?.role || user.user_metadata?.role
      
      // Allow access for clinician and admin roles
      const hasAccess = role === 'clinician' || role === 'admin'
      if (!hasAccess) {
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
          const role = session.user.app_metadata?.role || session.user.user_metadata?.role
          // Allow access for clinician and admin roles
          const hasAccess = role === 'clinician' || role === 'admin'
          if (!hasAccess) {
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

  // Navigation items with active state detection
  const navItems = [
    {
      href: '/clinician',
      label: 'Dashboard',
      active: pathname === '/clinician',
    },
    {
      href: '/clinician/funnels',
      label: 'Funnels',
      active: pathname?.startsWith('/clinician/funnels') ?? false,
    },
    {
      href: '/admin/content',
      label: 'Content',
      active: pathname?.startsWith('/admin/content') ?? false,
    },
  ]

  return (
    <DesktopLayout
      appTitle="Rhythmologicum Connect"
      userEmail={user?.email}
      onSignOut={handleSignOut}
      navItems={navItems}
    >
      {children}
    </DesktopLayout>
  )
}
