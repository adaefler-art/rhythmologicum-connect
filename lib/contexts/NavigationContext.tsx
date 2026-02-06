'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { RoleNavItem } from '@/lib/utils/roleBasedRouting'

type NavigationContextValue = {
  navItems: RoleNavItem[]
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({
  navItems,
  children,
}: {
  navItems: RoleNavItem[]
  children: ReactNode
}) {
  const value = useMemo(() => ({ navItems }), [navItems])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useActiveNavLabel(fallback?: string): string | null {
  const context = useContext(NavigationContext)
  const pathname = usePathname()

  if (!context || context.navItems.length === 0) {
    return fallback ?? null
  }

  const activeItem =
    context.navItems.find((item) => item.active) ||
    context.navItems.find(
      (item) => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)),
    )

  return activeItem?.label ?? fallback ?? null
}
