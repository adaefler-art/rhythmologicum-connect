// app/patient/layout.tsx
'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3">
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
              href="/patient/stress-check"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                pathname === '/patient/stress-check'
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
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            Rhythmologicum Connect – frühe Testversion, nicht für den klinischen Einsatz.
          </p>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Rhythmologicum
          </p>
        </div>
      </footer>
    </div>
  )
}
