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
        className="md:hidden fixed inset-x-0 bottom-0 bg-background/95 backdrop-blur border-t px-4 py-2.5 flex items-center justify-around"
        style={{
          borderColor: 'var(--color-neutral-200)',
          boxShadow: 'var(--shadow-lg)',
          paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {navItems.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center text-xs font-semibold transition-colors"
            style={{ 
              color: item.active ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
            }}
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
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200"
          style={item.active ? {
            backgroundColor: 'var(--color-primary-100)',
            color: 'var(--color-primary-700)',
          } : {
            color: 'var(--color-neutral-600)',
          }}
          onMouseEnter={(e) => {
            if (!item.active) {
              e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)'
            }
          }}
          onMouseLeave={(e) => {
            if (!item.active) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export default PatientNavigation
