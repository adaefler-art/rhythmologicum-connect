'use client'

import { type ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Workflow, 
  FileText, 
  Menu, 
  X,
  ChevronLeft,
  LogOut,
  User
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon?: ReactNode
  active?: boolean
}

export interface DesktopLayoutProps {
  /** Application title */
  appTitle?: string
  /** User email or identifier */
  userEmail?: string
  /** Sign out handler */
  onSignOut?: () => void
  /** Navigation items */
  navItems?: NavItem[]
  /** Main content */
  children: ReactNode
}

/**
 * DesktopLayout Component
 * 
 * Modern desktop layout for clinician dashboard with:
 * - Collapsible sidebar navigation
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
  userEmail,
  onSignOut,
  navItems = [],
  children,
}: DesktopLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <div className="min-h-screen bg-[#f7f9fa] flex">
      {/* Desktop Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200
          hidden lg:flex flex-col shrink-0
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {appTitle}
              </h1>
              <p className="text-xs text-slate-500 truncate">Clinician</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft 
              className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${
                sidebarCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
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
                        ? 'bg-sky-50 text-sky-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={item.active ? 'text-sky-600' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-sm">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        {userEmail && (
          <div className="border-t border-slate-200 p-4">
            <div
              className={`flex items-center gap-3 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {userEmail.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                </div>
              )}
            </div>
            {onSignOut && !sidebarCollapsed && (
              <button
                onClick={onSignOut}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white border border-slate-200 shadow-sm"
        aria-label="Toggle mobile menu"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-slate-600" />
        ) : (
          <Menu className="w-6 h-6 text-slate-600" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-72 bg-white border-r border-slate-200
          flex flex-col lg:hidden
          transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200">
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-slate-900">{appTitle}</h1>
            <p className="text-xs text-slate-500">Clinician</p>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {processedNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${
                      item.active
                        ? 'bg-sky-50 text-sky-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <span className={item.active ? 'text-sky-600' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-sm">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile User Section */}
        {userEmail && (
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {userEmail.split('@')[0]}
                </p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
            {onSignOut && (
              <button
                onClick={() => {
                  onSignOut()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div
        className={`
          flex-1 min-w-0
          transition-all duration-300 ease-in-out
          lg:${sidebarCollapsed ? 'ml-16' : 'ml-64'}
          min-h-screen
        `}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-8">
          <div className="flex items-center justify-between w-full">
            {/* Page title will be rendered by individual pages */}
            <h2 className="text-lg font-semibold text-slate-900">
              {processedNavItems.find(item => item.active)?.label || 'Dashboard'}
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DesktopLayout
