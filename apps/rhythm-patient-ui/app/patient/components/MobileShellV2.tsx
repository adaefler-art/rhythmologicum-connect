'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TopBarV2, type TopBarVariant } from './TopBarV2'
import { BottomNavV2 } from './BottomNavV2'
import { CANONICAL_ROUTES } from '../(mobile)/utils/navigation'

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
 * MobileShellV2 Component (I2.5 Navigation Consistency)
 * 
 * Canonical mobile shell that wraps all v2 patient screens.
 * Handles:
 * - TopBar variant switching (tab/flow/result)
 * - BottomNav visibility (hidden on flow screens)
 * - Scroll container with fixed navigation
 * - Safe area padding for mobile devices
 * - Deterministic navigation callbacks (I2.5)
 * 
 * Route behavior:
 * - Tab screens: TopBar variant A, BottomNav visible
 * - Flow screens: TopBar variant B, BottomNav hidden, custom navigation
 * - Result screens: TopBar variant C, BottomNav visible
 * 
 * Navigation Semantics (I2.5):
 * - All back/close actions use canonical routes
 * - No browser history fallbacks
 * - Dialog always returns to dashboard
 * - Flows close to assessments list
 */
export function MobileShellV2({ children }: MobileShellV2Props) {
  const pathname = usePathname()
  const router = useRouter()

  const variant = getTopBarVariant(pathname)
  const hideBottomNav = shouldHideBottomNav(pathname)
  const title = getPageTitle(pathname)

  // I2.5: Navigation handlers - deterministic, canonical routes
  const handleBackClick = () => {
    // Dialog screens always go back to dashboard
    if (pathname?.includes('/dialog')) {
      router.push(CANONICAL_ROUTES.DASHBOARD)
      return
    }

    // Result screens go back to dashboard
    if (variant === 'result') {
      router.push(CANONICAL_ROUTES.DASHBOARD)
      return
    }

    // For other screens, use the default TopBarV2 behavior
    // (which will be handled by TopBarV2's handleBack)
  }

  const handleCloseClick = () => {
    // Flow screens close to assessments list
    if (variant === 'flow') {
      router.push(CANONICAL_ROUTES.ASSESS)
      return
    }

    // All other closeable screens close to dashboard
    router.push(CANONICAL_ROUTES.DASHBOARD)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col transition-colors duration-150">
      {/* TopBar - Always visible on mobile */}
      <TopBarV2 
        variant={variant} 
        title={title}
        onBackClick={variant === 'result' || pathname?.includes('/dialog') ? handleBackClick : undefined}
        onCloseClick={variant === 'flow' ? handleCloseClick : undefined}
      />

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
