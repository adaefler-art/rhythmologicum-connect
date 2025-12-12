'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { spacing } from '@/lib/design-tokens'

export interface AppShellProps {
  /** Application title displayed in header */
  appTitle?: string
  /** Subtitle or area name */
  subtitle?: string
  /** User email or identifier */
  userEmail?: string
  /** Sign out handler */
  onSignOut?: () => void
  /** Navigation items */
  navItems?: Array<{
    href: string
    label: string
    active?: boolean
  }>
  /** Main content */
  children: ReactNode
  /** Optional footer content */
  footerContent?: ReactNode
}

/**
 * AppShell Component
 * 
 * A consistent layout shell for authenticated areas (Clinician, Admin, Patient).
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Consistent header with branding and user info
 * - Optional navigation bar
 * - Main content area with proper spacing
 * - Footer section
 * - Responsive design
 * 
 * @example
 * <AppShell
 *   appTitle="Rhythmologicum Connect"
 *   subtitle="Clinician Dashboard"
 *   userEmail="doctor@example.com"
 *   onSignOut={handleSignOut}
 *   navItems={[
 *     { href: '/clinician', label: 'Dashboard', active: true },
 *     { href: '/clinician/funnels', label: 'Funnels' },
 *   ]}
 * >
 *   <PageContent />
 * </AppShell>
 */
export function AppShell({
  appTitle = 'Rhythmologicum Connect',
  subtitle,
  userEmail,
  onSignOut,
  navItems = [],
  children,
  footerContent,
}: AppShellProps) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-150">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-150">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-5"
          style={{ paddingLeft: spacing.lg, paddingRight: spacing.lg }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                {appTitle}
              </p>
              {subtitle && (
                <p className="text-sm md:text-base font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              {userEmail && (
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 hidden sm:inline">
                  {userEmail}
                </span>
              )}
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 touch-manipulation"
                >
                  Abmelden
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {navItems.length > 0 && (
        <nav className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-150">
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6"
            style={{ paddingLeft: spacing.lg, paddingRight: spacing.lg }}
          >
            <div className="flex gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-3 text-sm font-medium
                    transition-all duration-200
                    border-b-2
                    whitespace-nowrap
                    ${
                      item.active
                        ? 'text-sky-600 dark:text-sky-400 border-sky-600 dark:border-sky-400'
                        : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1" style={{ padding: spacing.lg }}>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto transition-colors duration-150">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-5"
          style={{ paddingLeft: spacing.lg, paddingRight: spacing.lg }}
        >
          {footerContent ? (
            footerContent
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <p className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
                  {appTitle} – Frühe Testversion, nicht für den klinischen Einsatz.
                </p>
                <Link
                  href="/datenschutz"
                  className="text-[11px] sm:text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors"
                >
                  Datenschutz
                </Link>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">© {currentYear} Rhythmologicum</p>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}

export default AppShell
