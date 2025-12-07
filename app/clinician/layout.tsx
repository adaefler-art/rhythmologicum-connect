'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'

// Constants for redirect URLs
const AUTH_REQUIRED_REDIRECT = '/?error=authentication_required&message=Bitte melden Sie sich an.'
const ACCESS_DENIED_REDIRECT = '/?error=access_denied&message=Keine Berechtigung für den Clinician-Bereich.'

export default function ClinicianLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
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
      
      if (role !== 'clinician') {
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
          if (role !== 'clinician') {
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-sky-600">
                Rhythmologicum Connect
              </p>
              <p className="text-sm md:text-base font-medium text-slate-900">
                Clinician Dashboard
              </p>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-xs sm:text-sm text-slate-600 hidden sm:inline">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 transition touch-manipulation"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
            Rhythmologicum Connect – Clinician View – Frühe Testversion, nicht für den klinischen Einsatz.
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400">
            © {new Date().getFullYear()} Rhythmologicum
          </p>
        </div>
      </footer>
    </div>
  )
}
