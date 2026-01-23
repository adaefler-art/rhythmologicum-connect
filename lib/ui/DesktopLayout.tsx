'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Workflow,
  FileText,
  LogOut,
  User,
} from 'lucide-react'
import { layout } from '@/lib/design-tokens'

export interface NavItem {
  href: string
  label: string
  icon?: ReactNode
  active?: boolean
}

export interface DesktopLayoutProps {
  /** Application title */
  appTitle?: string
  /** Optional subtitle under the app title */
  appSubtitle?: string
  /** User email or identifier */
  userEmail?: string
  /** Sign out handler */
  onSignOut?: () => void
  /** Navigation items */
  navItems?: NavItem[]
  /** Toggle topbar title rendering */
  showTopbarTitle?: boolean
  /** Optional max width for content container (null = full width) */
  contentMaxWidth?: number | string | null
  /** Main content */
  children: ReactNode
}

/**
 * DesktopLayout Component
 * 
 * Modern desktop layout for clinician dashboard with:
 * - Fixed sidebar navigation
 * - Topbar with title and user menu
 * - Responsive design (1024px+)
 * - Active state indication
 * 
 * @example
 * <DesktopLayout
 *   appTitle="Rhythmologicum Connect"
 *   userEmail="doctor@example.com"
 *   onSignOut={handleSignOut}
 *   navItems={navItems}
 * >
 *   <PageContent />
 * </DesktopLayout>
 */
export function DesktopLayout({
  appTitle = 'Rhythmologicum Connect',
  appSubtitle = '',
  userEmail,
  onSignOut,
  navItems = [],
  showTopbarTitle = true,
  contentMaxWidth = layout.contentMaxWidth,
  children,
}: DesktopLayoutProps) {
  const pathname = usePathname()

  // Icon mapping for common routes
  const getDefaultIcon = (href: string) => {
    if (href === '/clinician' || href.endsWith('dashboard')) {
      return <LayoutDashboard className="w-5 h-5" />
    }
    if (href.includes('funnel')) {
      return <Workflow className="w-5 h-5" />
    }
    if (href.includes('content')) {
      return <FileText className="w-5 h-5" />
    }
    return <FileText className="w-5 h-5" />
  }

  // Determine active state if not explicitly set
  const getNavItems = () => {
    return navItems.map(item => ({
      ...item,
      active: item.active !== undefined 
        ? item.active 
        : pathname === item.href || (item.href !== '/clinician' && pathname?.startsWith(item.href)),
      icon: item.icon || getDefaultIcon(item.href)
    }))
  }

  const processedNavItems = getNavItems()

  return (
    <div className="min-h-screen bg-[#f7f9fa] dark:bg-slate-900 transition-colors duration-150 md:grid md:grid-cols-[280px_minmax(0,1fr)]">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col shrink-0
          w-[280px]
          md:sticky md:top-0 h-screen
          overflow-y-auto
          z-40 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {appTitle}
            </h1>
            {appSubtitle ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{appSubtitle}</p>
            ) : null}
          </div>
        </div>

        {/* Navigation - Scrollable with flex-1 */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {processedNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${
                      item.active
                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                    }
                  `}
                >
                  <span className={item.active ? 'text-sky-600' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section - Always visible at bottom */}
        {userEmail && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {userEmail.split('@')[0]}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
              </div>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Menu (hidden for now) */}

      {/* Main Content Area */}
      <div
        className={`
          min-w-0
          min-h-screen
        `}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 lg:px-8 transition-colors duration-150">
          <div className="flex items-center justify-between w-full">
            {/* Page title will be rendered by individual pages */}
            {showTopbarTitle ? (
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {processedNavItems.find(item => item.active)?.label || 'Dashboard'}
              </h2>
            ) : (
              <div className="h-6" />
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 w-full">
          <div
            className={contentMaxWidth === null ? 'w-full' : 'w-full mx-auto'}
            style={contentMaxWidth === null ? undefined : { maxWidth: contentMaxWidth }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DesktopLayout
