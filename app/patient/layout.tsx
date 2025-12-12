// app/patient/layout.tsx
'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Mobile breakpoint: <640px (Tailwind's sm breakpoint)
// This matches the breakpoint used in useIsMobile() hook
const MOBILE_BREAKPOINT = 640

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // Initialize as undefined to prevent hydration mismatch
  // Will be set on client after hydration
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  // Detect mobile viewport (<640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initial check
    checkMobile()
    
    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Routes that render their own full-screen mobile UI with headers
  const isFullScreenMobileRoute =
    isMobile === true &&
    (pathname?.startsWith('/patient/funnel/') ||
      pathname?.startsWith('/patient/assessment'))

  // Hide layout header/footer on mobile for full-screen routes
  // On first render (isMobile === undefined), use default layout to prevent flash
  if (isFullScreenMobileRoute) {
    return <div className="min-h-screen">{children}</div>
  }

  // Default layout with header and footer (desktop or non-fullscreen mobile routes)
  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-background">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                Rhythmologicum Connect
              </p>
              <p className="text-sm font-medium text-slate-900">
                Stress &amp; Resilienz Pilot
              </p>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex gap-1">
            <Link
              href="/patient/funnel/stress-assessment"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                pathname?.startsWith('/patient/funnel')
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Fragebogen
            </Link>
            <Link
              href="/patient/history"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                pathname === '/patient/history'
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mein Verlauf
            </Link>
          </nav>
        </div>
      </header>

      {/* Hauptinhalt */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-background">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <p className="text-[11px] text-slate-500">
              Rhythmologicum Connect – frühe Testversion, nicht für den klinischen Einsatz.
            </p>
            <Link
              href="/datenschutz"
              className="text-[11px] text-sky-600 hover:text-sky-700 font-medium"
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
  )
}
