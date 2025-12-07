'use client'

import { useState, useEffect } from 'react'

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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Media query for mobile detection (<640px)
    const mediaQuery = window.matchMedia('(max-width: 639px)')
    
    // Set initial value
    setIsMobile(mediaQuery.matches)
    
    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    
    // Add listener (modern browsers)
    mediaQuery.addEventListener('change', handleChange)
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return isMobile
}
