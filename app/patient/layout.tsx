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
          </div>
          <nav className="flex gap-2">
            <Link
              href="/patient/assessment"
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200"
              style={isAssessments ? {
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-700)',
              } : {
                color: 'var(--color-neutral-600)',
              }}
              onMouseEnter={(e) => {
                if (!isAssessments) {
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isAssessments) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              Assessments
            </Link>
            <Link
              href="/patient/history"
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200"
              style={isHistory ? {
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-700)',
              } : {
                color: 'var(--color-neutral-600)',
              }}
              onMouseEnter={(e) => {
                if (!isHistory) {
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isHistory) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              Verlauf
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 md:pb-0" style={{
        paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom, 0px)))',
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
      <nav 
        className="md:hidden fixed inset-x-0 bottom-0 bg-background/95 backdrop-blur border-t px-4 py-2.5 flex items-center justify-around"
        style={{
          borderColor: 'var(--color-neutral-200)',
          boxShadow: 'var(--shadow-lg)',
          paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Link
          href="/patient/assessment"
          className="flex flex-col items-center text-xs font-semibold transition-colors"
          style={{ 
            color: isAssessments ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
          }}
        >
          <span className="text-lg">📝</span>
          Assessments
        </Link>
        <Link
          href="/patient/history"
          className="flex flex-col items-center text-xs font-semibold transition-colors"
          style={{ 
            color: isHistory ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
          }}
        >
          <span className="text-lg">📊</span>
          Verlauf
        </Link>
      </nav>
    </div>
  )
}
