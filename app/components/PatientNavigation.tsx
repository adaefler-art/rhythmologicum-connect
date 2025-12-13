'use client'

import Link from 'next/link'
import type { RoleNavItem } from '@/lib/utils/roleBasedRouting'

interface PatientNavigationProps {
  navItems: RoleNavItem[]
  variant?: 'desktop' | 'mobile'
}

/**
 * PatientNavigation Component
 * 
 * Reusable navigation component for patient layout that supports both
 * desktop and mobile variants with v0.4 design system styling.
 * 
 * @example
 * // Desktop header navigation
 * <PatientNavigation navItems={navItems} variant="desktop" />
 * 
 * // Mobile bottom tabs
 * <PatientNavigation navItems={navItems} variant="mobile" />
 */
export function PatientNavigation({ navItems, variant = 'desktop' }: PatientNavigationProps) {
  if (variant === 'mobile') {
    return (
      <nav 
        className="md:hidden fixed inset-x-0 bottom-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-around transition-colors duration-150"
        style={{
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {navItems.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs font-semibold transition-colors ${
              item.active 
                ? 'text-sky-700 dark:text-sky-400' 
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="text-lg">{index === 0 ? '📝' : '📊'}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    )
  }

  // Desktop variant
  return (
    <nav className="flex gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
            item.active 
              ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export default PatientNavigation
