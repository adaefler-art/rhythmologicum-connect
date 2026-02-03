'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Home, MessageCircle, User } from 'lucide-react'
import { CANONICAL_ROUTES } from '../(mobile)/utils/navigation'
import { PATIENT_MOBILE_MENU_ITEMS } from '../(mobile)/navigation/menuConfig'

/**
 * BottomNavV2 Component (I2.5 Navigation Consistency)
 * 
 * Mobile-first bottom navigation with 4 tabs:
 * - Home (Dashboard)
 * - Assess (Assessments)
 * - Dialog (Communication)
 * - Profile (User Profile)
 * 
 * Navigation (I2.5):
 * - Uses canonical routes from navigation utilities
 * - Ensures consistent navigation targets across the app
 * 
 * Features:
 * - Active state based on current route
 * - Safe area padding for notched devices
 * - Touch-friendly tap targets (min 44px)
 * - Smooth transitions
 */
export function BottomNavV2() {
  const pathname = usePathname()

  const navItems = [...PATIENT_MOBILE_MENU_ITEMS].sort((a, b) => a.order - b.order)

  const isActive = (href: string) => {
    // Exact match for dashboard
    if (href === CANONICAL_ROUTES.DASHBOARD) {
      return pathname === CANONICAL_ROUTES.DASHBOARD || pathname === '/patient'
    }
    // Prefix match for others (e.g., /patient/assess includes /patient/assess/...)
    return pathname?.startsWith(href) ?? false
  }

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 transition-colors duration-150"
      style={{
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon =
            item.id === 'home'
              ? Home
              : item.id === 'check-in'
                ? ClipboardList
                : item.id === 'dialog'
                  ? MessageCircle
                  : User
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-15 px-3 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? 'text-sky-600 bg-sky-50'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="mb-0.5 flex h-6 w-6 items-center justify-center">
                <Icon className="h-6 w-6" />
              </span>
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
