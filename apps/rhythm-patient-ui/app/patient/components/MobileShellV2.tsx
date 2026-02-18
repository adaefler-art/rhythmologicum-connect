'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TopBarV2, type TopBarVariant } from './TopBarV2'
import { BottomNavV2 } from '@/app/patient/(mobile)/BottomNavV2'
import { HamburgerMenu } from './HamburgerMenu'
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
  if (pathname?.startsWith('/patient/start')) return 'Start'
  if (pathname?.startsWith('/patient/dashboard')) return 'Dashboard'
  if (pathname?.startsWith('/patient/assess')) return 'Assessment'
  if (pathname?.startsWith('/patient/dialog')) return 'Dialog'
  if (pathname?.startsWith('/patient/profile')) return 'Profil'
  if (pathname?.includes('/result')) return 'Ergebnisse'
  if (pathname?.includes('/funnel/')) return 'Fragebogen'
  return 'Rhythmologicum Connect'
}

/**
 * MobileShellV2 Component (I2.5 Navigation Consistency + Issue 2 Chat-First)
 * 
 * Canonical mobile shell that wraps all v2 patient screens.
 * Handles:
 * - TopBar variant switching (tab/flow/result)
 * - Hamburger menu navigation (Issue 2)
 * - BottomNav hidden by default (Issue 2 - kept for potential re-enablement)
 * - Scroll container with fixed navigation
 * - Safe area padding for mobile devices
 * - Deterministic navigation callbacks (I2.5)
 * 
 * Route behavior:
 * - Tab screens: TopBar variant A with hamburger menu
 * - Flow screens: TopBar variant B, custom navigation
 * - Result screens: TopBar variant C
 * 
 * Navigation Semantics (I2.5):
 * - All back/close actions use canonical routes
 * - No browser history fallbacks
 * - Dialog always returns to dashboard
 * - Flows close to assessments list
 * 
 * Issue 2 Changes:
 * - Hamburger menu is now primary navigation
 * - Bottom bar is hidden (but not removed from code)
 */
export function MobileShellV2({ children }: MobileShellV2Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNativeShellNav, setIsNativeShellNav] = useState(false)
  const isDialog = pathname?.startsWith('/patient/dialog')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const userAgent = window.navigator.userAgent || ''
    const searchParams = new URLSearchParams(window.location.search)
    const hasNativeFlag = searchParams.get('rc_native_shell_nav') === '1'
    const isShellUserAgent = userAgent.includes('RhythmPatientiOSShell')

    setIsNativeShellNav(hasNativeFlag || isShellUserAgent)
  }, [])

  const variant = getTopBarVariant(pathname)
  const hideBottomNav = shouldHideBottomNav(pathname)
  const title = isDialog ? '' : getPageTitle(pathname)

  // I2.5: Navigation handlers - deterministic, canonical routes
  const handleBackClick = () => {
    // Dialog screens always go back to dashboard
    if (pathname?.includes('/dialog')) {
      router.push(CANONICAL_ROUTES.START)
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

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col transition-colors duration-150 w-full max-w-[100vw] overflow-x-hidden">
      {/* Hamburger Menu - Issue 2 */}
      {!isNativeShellNav ? <HamburgerMenu isOpen={isMenuOpen} onClose={handleMenuClose} /> : null}

      {/* TopBar - Always visible on mobile */}
      <TopBarV2 
        variant={variant} 
        title={title}
        showTitle={variant !== 'tab'}
        showBell={false}
        showBurger={!isNativeShellNav}
        onBurgerClick={!isNativeShellNav ? () => setIsMenuOpen(true) : undefined}
        onBackClick={variant === 'result' || pathname?.includes('/dialog') ? handleBackClick : undefined}
        onCloseClick={variant === 'flow' ? handleCloseClick : undefined}
      />

      {/* Main Content Area - Scrollable */}
      <main
        className={`flex-1 w-full max-w-[100vw] overflow-x-hidden ${
          isDialog ? 'overflow-y-hidden' : 'overflow-y-auto'
        }`}
        style={{
          paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))',
          // Issue 2: Bottom nav is hidden, no need for bottom padding
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {children}
      </main>

      {/* BottomNav - Hidden per Issue 2, but kept in code for potential re-enablement 
          Note: Using display:none to preserve React component tree and state.
          This allows for quick re-enablement via feature flag without code changes.
          Requirement explicitly states: "deaktiviert, aber nicht entfernt" */}
      <div style={{ display: 'none' }}>
        <BottomNavV2 />
      </div>
    </div>
  )
}
