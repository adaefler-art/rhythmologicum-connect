'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { TopBarV2, type TopBarVariant } from './TopBarV2'
import { BottomNavV2 } from './BottomNavV2'

interface MobileShellV2Props {
  children: ReactNode
}

/**
 * Determine TopBar variant based on current route
 */
function getTopBarVariant(pathname: string): TopBarVariant {
  // Assessment flow screens (content pages, intro)
  if (
    pathname?.includes('/funnel/') &&
    (pathname?.includes('/content/') || pathname?.includes('/intro'))
  ) {
    return 'flow'
  }

  // Result screens
  if (pathname?.includes('/result')) {
    return 'result'
  }

  // Tab screens (dashboard, assess, dialog, profile)
  return 'tab'
}

/**
 * Determine if BottomNav should be hidden
 */
function shouldHideBottomNav(pathname: string): boolean {
  // Hide on flow screens (content, intro)
  if (
    pathname?.includes('/funnel/') &&
    (pathname?.includes('/content/') || pathname?.includes('/intro'))
  ) {
    return true
  }

  return false
}

/**
 * Get page title based on current route
 */
function getPageTitle(pathname: string): string {
  if (pathname?.startsWith('/patient/dashboard')) return 'Dashboard'
  if (pathname?.startsWith('/patient/assess')) return 'Assessment'
  if (pathname?.startsWith('/patient/dialog')) return 'Dialog'
  if (pathname?.startsWith('/patient/profile')) return 'Profil'
  if (pathname?.includes('/result')) return 'Ergebnisse'
  if (pathname?.includes('/funnel/')) return 'Fragebogen'
  return 'Rhythmologicum Connect'
}

/**
 * MobileShellV2 Component
 * 
 * Canonical mobile shell that wraps all v2 patient screens.
 * Handles:
 * - TopBar variant switching (tab/flow/result)
 * - BottomNav visibility (hidden on flow screens)
 * - Scroll container with fixed navigation
 * - Safe area padding for mobile devices
 * 
 * Route behavior:
 * - Tab screens: TopBar variant A, BottomNav visible
 * - Flow screens: TopBar variant B, BottomNav hidden
 * - Result screens: TopBar variant C, BottomNav visible
 */
export function MobileShellV2({ children }: MobileShellV2Props) {
  const pathname = usePathname()

  const variant = getTopBarVariant(pathname)
  const hideBottomNav = shouldHideBottomNav(pathname)
  const title = getPageTitle(pathname)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col transition-colors duration-150">
      {/* TopBar - Always visible on mobile */}
      <TopBarV2 variant={variant} title={title} />

      {/* Main Content Area - Scrollable */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingBottom: hideBottomNav
            ? 'env(safe-area-inset-bottom, 0px)'
            : 'calc(64px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>

      {/* BottomNav - Conditionally visible */}
      {!hideBottomNav && <BottomNavV2 />}
    </div>
  )
}
