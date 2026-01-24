import type { ReactNode } from 'react'

/**
 * FullBleed Component
 * 
 * Neutralizes parent layout constraints (container, max-w-*, prose)
 * to ensure full-width rendering for screen compositions.
 * 
 * Purpose:
 * - Prevents "narrow box" error in dev/gallery contexts
 * - Forces w-full max-w-none to override parent constraints
 * - Safe wrapper for any screen that needs full viewport width
 * 
 * Usage:
 * ```tsx
 * <FullBleed>
 *   <YourScreenComponent />
 * </FullBleed>
 * ```
 */
export function FullBleed({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-none">
      {children}
    </div>
  )
}
