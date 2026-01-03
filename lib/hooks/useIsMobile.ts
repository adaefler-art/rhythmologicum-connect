'use client'

import { useSyncExternalStore } from 'react'

/**
 * Custom hook to detect if the viewport is mobile-sized
 * 
 * Breakpoint: <640px (Tailwind's sm breakpoint)
 * 
 * Features:
 * - Uses window.matchMedia for efficient media query detection
 * - Handles SSR safely (returns false on server)
 * - Automatically updates on window resize
 * - Cleanup on unmount
 * 
 * @returns boolean - true if viewport width is less than 640px
 * 
 * @example
 * ```tsx
 * const isMobile = useIsMobile()
 * return isMobile ? <MobileView /> : <DesktopView />
 * ```
 */
export function useIsMobile(): boolean {
  const query = '(max-width: 639px)'

  // useSyncExternalStore is the recommended way to read external mutable sources (like matchMedia)
  // while staying consistent across SSR + hydration.
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const mediaQuery = window.matchMedia(query)
      const handler = () => onStoreChange()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    },
    () => {
      if (typeof window === 'undefined') return false
      return window.matchMedia(query).matches
    },
    () => false,
  )
}
