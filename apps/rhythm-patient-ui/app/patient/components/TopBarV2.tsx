'use client'

import { useRouter } from 'next/navigation'
import { CANONICAL_ROUTES } from '../(mobile)/utils/navigation'

export type TopBarVariant = 'tab' | 'flow' | 'result'

interface TopBarV2Props {
  variant: TopBarVariant
  title: string
  onBurgerClick?: () => void
  onBackClick?: () => void
  onCloseClick?: () => void
  onMenuClick?: () => void
  showAvatar?: boolean
  showBell?: boolean
}

/**
 * TopBarV2 Component (I2.5 Navigation Consistency)
 * 
 * Mobile-first top navigation bar with 3 variants:
 * 
 * **Variant A (Tab Screens)**: Burger + Title + Bell (+ Avatar optional)
 * - Used on: Dashboard, Assess, Dialog, Profile
 * - Shows: Menu burger, screen title, notification bell
 * - Back: Not applicable (tabs use bottom nav)
 * 
 * **Variant B (Assessment Flow)**: Back + Title + Close
 * - Used on: Active funnel/assessment flows
 * - Shows: Back button, progress/title, close button
 * - Back: Handled by onBackClick (previous question) or fallback to Assess
 * - Close: Deterministic exit to /patient/assess (canonical)
 * 
 * **Variant C (Results)**: Back + Title + optional overflow menu
 * - Used on: Assessment result pages
 * - Shows: Back button, result title, optional menu
 * - Back: Deterministic to /patient/dashboard (canonical)
 * 
 * Navigation Semantics (I2.5):
 * - All navigation targets are deterministic and canonical
 * - NO browser history fallbacks (no router.back())
 * - Custom handlers take precedence over defaults
 * 
 * Features:
 * - Safe area padding for notched devices
 * - Touch-friendly tap targets
 * - Smooth transitions
 */
export function TopBarV2({
  variant,
  title,
  onBurgerClick,
  onBackClick,
  onCloseClick,
  onMenuClick,
  showAvatar = false,
  showBell = true,
}: TopBarV2Props) {
  const router = useRouter()

  // I2.5: Deterministic back navigation - no browser history fallbacks
  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      // Flow variant: back to assessments list (if not handled by component)
      // Result variant: back to dashboard
      const fallbackRoute = variant === 'flow' 
        ? CANONICAL_ROUTES.ASSESS 
        : CANONICAL_ROUTES.DASHBOARD
      router.push(fallbackRoute)
    }
  }

  // I2.5: Deterministic close navigation - always canonical routes
  const handleClose = () => {
    if (onCloseClick) {
      onCloseClick()
    } else {
      // Flow variant: close to assessments list
      // All other variants: close to dashboard
      const closeRoute = variant === 'flow' 
        ? CANONICAL_ROUTES.ASSESS 
        : CANONICAL_ROUTES.DASHBOARD
      router.push(closeRoute)
    }
  }

  return (
    <header
      className="md:hidden fixed inset-x-0 top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 transition-colors duration-150"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 min-h-14">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-1">
          {variant === 'tab' && (
            <button
              onClick={onBurgerClick}
              className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {(variant === 'flow' || variant === 'result') && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Zurück"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Title */}
          <h1 className="text-base font-semibold text-slate-900 truncate">
            {title}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {variant === 'tab' && showBell && (
            <button
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
              aria-label="Benachrichtigungen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {/* Optional notification badge */}
              <span className="sr-only">Benachrichtigungen</span>
            </button>
          )}

          {variant === 'tab' && showAvatar && (
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm font-semibold">
              P
            </div>
          )}

          {variant === 'flow' && (
            <button
              onClick={handleClose}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Schließen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {variant === 'result' && onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Mehr"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
