// app/patient/layout.tsx
'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isAssessments =
    pathname?.startsWith('/patient/assessment') || pathname?.startsWith('/patient/funnel') || false
  const isHistory = pathname === '/patient/history'

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Desktop Header */}
      <header className="border-b border-slate-200 bg-background hidden md:block">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                Rhythmologicum Connect
              </p>
              <p className="text-sm font-medium text-slate-900">Stress &amp; Resilienz Pilot</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <Link
              href="/patient/assessment"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                isAssessments
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Assessments
            </Link>
            <Link
              href="/patient/history"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                isHistory ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Verlauf
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Desktop Footer */}
      <footer className="border-t border-slate-200 bg-background hidden md:block">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
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
          <p className="text-[11px] text-slate-400">© {new Date().getFullYear()} Rhythmologicum</p>
        </div>
      </footer>

      {/* Mobile Bottom Tabs */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 bg-background/95 backdrop-blur border-t border-slate-200 px-4 py-2.5 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <Link
          href="/patient/assessment"
          className={`flex flex-col items-center text-xs font-semibold transition ${
            isAssessments ? 'text-sky-700' : 'text-slate-600'
          }`}
        >
          <span className="text-lg">📝</span>
          Assessments
        </Link>
        <Link
          href="/patient/history"
          className={`flex flex-col items-center text-xs font-semibold transition ${
            isHistory ? 'text-sky-700' : 'text-slate-600'
          }`}
        >
          <span className="text-lg">📊</span>
          Verlauf
        </Link>
      </nav>
    </div>
  )
}
