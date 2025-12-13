// app/patient/layout.tsx
'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { getUserRole, getRoleDisplayName, getPatientNavItems } from '@/lib/utils/roleBasedRouting'
import { PatientNavigation } from '@/app/components/PatientNavigation'
import type { User } from '@supabase/supabase-js'

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Get navigation items from shared configuration
  const navItems = getPatientNavItems(pathname)
  const role = getUserRole(user)
  const roleDisplay = getRoleDisplayName(role)

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Desktop Header */}
      <header className="border-b bg-background hidden md:block" style={{
        borderColor: 'var(--color-neutral-200)',
      }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{
                color: 'var(--color-primary-600)',
              }}>
                Rhythmologicum Connect
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Stress &amp; Resilienz Pilot
              </p>
            </div>
            {/* User info and logout */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-neutral-500">Angemeldet als</p>
                    <p className="text-sm font-medium text-neutral-700">{roleDisplay}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 hover:bg-neutral-100"
                    style={{ color: 'var(--color-neutral-600)' }}
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

      <main className="flex-1 md:pb-0" style={{
        paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))',
      }}>{children}</main>

      {/* Desktop Footer */}
      <footer className="border-t bg-background hidden md:block" style={{
        borderColor: 'var(--color-neutral-200)',
      }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <p className="text-[11px]" style={{ color: 'var(--color-neutral-500)' }}>
              Rhythmologicum Connect – frühe Testversion, nicht für den klinischen Einsatz.
            </p>
            <Link
              href="/datenschutz"
              className="text-[11px] font-medium hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-primary-600)' }}
            >
              Datenschutz
            </Link>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--color-neutral-400)' }}>
            © {new Date().getFullYear()} Rhythmologicum
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Tabs */}
      <PatientNavigation navItems={navItems} variant="mobile" />
    </div>
  )
}
