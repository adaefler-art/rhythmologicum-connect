/**
 * useAppFocus Hook - E6.5.9
 *
 * Detects when the app/browser tab comes into focus.
 * Useful for triggering data refreshes when user returns to the app.
 *
 * Mobile-friendly: Handles both visibilitychange and focus events
 * for maximum compatibility across devices.
 */

import { useEffect, useRef } from 'react'

type AppFocusCallback = () => void

/**
 * Hook that calls a callback when the app comes into focus
 *
 * @param onFocus - Callback to execute when app gains focus
 * @param enabled - Whether the hook is active (default: true)
 *
 * @example
 * ```tsx
 * useAppFocus(() => {
 *   console.log('App is now in focus, refreshing data...')
 *   refetchData()
 * })
 * ```
 */
export function useAppFocus(onFocus: AppFocusCallback, enabled: boolean = true) {
  const callbackRef = useRef(onFocus)

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = onFocus
  }, [onFocus])

  useEffect(() => {
    if (!enabled) return

    // Track if we're currently visible to avoid duplicate calls
    let wasVisible = !document.hidden

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden

      // Only call callback when transitioning from hidden to visible
      if (!wasVisible && isVisible) {
        callbackRef.current()
      }

      wasVisible = isVisible
    }

    const handleFocus = () => {
      // Only call if document is visible (prevents duplicate calls)
      if (!document.hidden) {
        callbackRef.current()
      }
    }

    // Listen for visibility changes (mobile-friendly)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Listen for window focus events (desktop)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled])
}
