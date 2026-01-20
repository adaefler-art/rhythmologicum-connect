'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavItem {
  href: string
  label: string
  icon: string
}

/**
 * BottomNavV2 Component
 * 
 * Mobile-first bottom navigation with 4 tabs:
 * - Home (Dashboard)
 * - Assess (Assessments)
 * - Dialog (Communication)
 * - Profile (User Profile)
 * 
 * Features:
 * - Active state based on current route
 * - Safe area padding for notched devices
 * - Touch-friendly tap targets (min 44px)
 * - Smooth transitions
 */
export function BottomNavV2() {
  const pathname = usePathname()

  const navItems: BottomNavItem[] = [
    {
      href: '/patient/dashboard',
      label: 'Home',
      icon: '🏠',
    },
    {
      href: '/patient/assess',
      label: 'Assess',
      icon: '📝',
    },
    {
      href: '/patient/dialog',
      label: 'Dialog',
      icon: '💬',
    },
    {
      href: '/patient/profile',
      label: 'Profile',
      icon: '👤',
    },
  ]

  const isActive = (href: string) => {
    // Exact match for dashboard
    if (href === '/patient/dashboard') {
      return pathname === '/patient/dashboard' || pathname === '/patient'
    }
    // Prefix match for others (e.g., /patient/assess includes /patient/assess/...)
    return pathname?.startsWith(href) ?? false
  }

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 transition-colors duration-150"
      style={{
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[60px] px-3 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
