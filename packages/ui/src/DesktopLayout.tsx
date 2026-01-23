
// --- NEW MINIMAL ROBUST DESKTOPLAYOUT ---
'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Workflow, FileText, LogOut, User } from 'lucide-react'

const DEFAULT_CONTENT_MAX_WIDTH = '1600px'

export interface NavItem {
  href: string
  label: string
  icon?: ReactNode
  active?: boolean
}

export interface DesktopLayoutProps {
  appTitle?: string
  appSubtitle?: string
  userEmail?: string
  onSignOut?: () => void
  navItems?: NavItem[]
  contentMaxWidth?: number | string | null
  children: ReactNode
}

export function DesktopLayout({
  appTitle = 'Rhythmologicum Connect',
  appSubtitle = '',
  userEmail,
  onSignOut,
  navItems = [],
  contentMaxWidth = DEFAULT_CONTENT_MAX_WIDTH,
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
  const processedNavItems = navItems.map(item => ({
    ...item,
    active: item.active !== undefined
      ? item.active
      : pathname === item.href || (item.href !== '/clinician' && pathname?.startsWith(item.href)),
    icon: item.icon || getDefaultIcon(item.href)
  }))

  return (
    <div
      className="min-h-screen bg-[#f7f9fa] dark:bg-slate-900 transition-colors duration-150 md:grid md:grid-cols-[280px_minmax(0,1fr)]"
      data-testid="desktoplayout-root"
      data-layout-build="DL_MARKER_v1"
    >
      {/* Sidebar */}
      <aside
        data-testid="desktoplayout-sidebar_SB"
        className="hidden md:flex flex-col w-[280px] md:sticky md:top-0 md:h-screen overflow-y-auto z-40 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {appTitle}
            </h1>
            {appSubtitle ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{appSubtitle}</p>
            ) : null}
          </div>
        </div>
        {/* Navigation */}
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
        {/* User Section */}
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
      {/* Content Column */}
      <div className="min-w-0 flex flex-col">
        {/* Topbar */}
        <header
          data-testid="desktoplayout-topbar"
          className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 md:px-8"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {processedNavItems.find(item => item.active)?.label || 'Dashboard'}
          </h2>
        </header>
        {/* Main Content */}
        <main
          data-testid="desktoplayout-main"
          className="flex-1 min-w-0 p-4 md:p-6"
        >
          <div
            data-testid="desktoplayout-children"
            className="w-full"
            style={
              contentMaxWidth === null
                ? undefined
                : { maxWidth: contentMaxWidth, marginLeft: 'auto', marginRight: 'auto' }
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
