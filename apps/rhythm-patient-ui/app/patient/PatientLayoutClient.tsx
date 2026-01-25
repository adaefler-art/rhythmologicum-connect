'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { getUserRole, getRoleDisplayName, getNavItemsForRole } from '@/lib/utils/roleBasedRouting'
import { PatientNavigation } from '@/app/components/PatientNavigation'
import type { User } from '@supabase/supabase-js'

/**
 * Patient Layout Client Component
 * 
 * This layout handles desktop-only layout for patient routes.
 * Mobile layout is handled by the (mobile) route group layout.
 * 
 * Desktop Layout:
 * - Header with navigation
 * - Main content area
 * - Footer
 * 
 * Mobile Layout:
 * - Handled by apps/rhythm-patient-ui/app/patient/(mobile)/layout.tsx
 * - Uses MobileShellV2 component
 */
export default function PatientLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    fetch('/api/patient/state', { method: 'GET', credentials: 'include' }).catch(() => {})
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    } catch {
      // Ignore network errors; client session is already cleared
    }
    // Redirect to root login page, not /patient
    window.location.assign('/')
  }

  // Get navigation items from shared configuration
  const navItems = getNavItemsForRole(user, pathname)
  const role = getUserRole(user)
  const roleDisplay = getRoleDisplayName(role)

  return (
    <>
      {/* Desktop Layout - Light mode only */}
      <div className="hidden md:block min-h-screen bg-slate-50 flex flex-col transition-colors duration-150">
        {/* Desktop Header */}
        <header className="border-b border-slate-200 bg-white transition-colors duration-150">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                  Rhythmologicum Connect
                </p>
                <p className="text-sm font-medium text-slate-900">
                  Stress &amp; Resilienz Pilot
                </p>
              </div>
              {/* User info and logout */}
              <div className="flex items-center gap-4">
                {user && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Angemeldet als</p>
                      <p className="text-sm font-medium text-slate-700">
                        {roleDisplay}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      Abmelden
                    </button>
                  </div>
                )}
              </div>
            </div>
            <PatientNavigation navItems={navItems} variant="desktop" />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Desktop Footer */}
        <footer className="border-t border-slate-200 bg-white transition-colors duration-150">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <p className="text-[11px] text-slate-500">
                Rhythmologicum Connect – frühe Testversion, nicht für den klinischen Einsatz.
              </p>
              <Link
                href="/datenschutz"
                className="text-[11px] font-medium text-sky-600 hover:opacity-80 transition-opacity"
              >
                Datenschutz
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} Rhythmologicum
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Layout - Defer to (mobile) route group layout */}
      <div className="md:hidden">{children}</div>
    </>
  )
}
