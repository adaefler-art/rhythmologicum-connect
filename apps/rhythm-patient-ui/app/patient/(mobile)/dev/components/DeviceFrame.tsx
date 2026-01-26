import type { ReactNode } from 'react'
import { FullBleed } from './FullBleed'

/**
 * DeviceFrame Component
 * 
 * Renders content in a fixed phone-width frame (390px)
 * with device-like visual styling.
 * 
 * Features:
 * - Fixed width: 390px (iPhone 12/13/14 standard)
 * - Centered with mx-auto
 * - Responsive: max-w-full on narrow viewports
 * - Visual frame: rounded corners, border, shadow
 * - Inner content forced to full width (no parent constraint leakage)
 * 
 * Usage:
 * ```tsx
 * <DeviceFrame>
 *   <YourMobileScreen />
 * </DeviceFrame>
 * ```
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center">
      <div
        className="w-full max-w-none overflow-hidden rounded-2xl border border-slate-300 shadow-2xl bg-white"
        style={{ width: 390, maxWidth: '100%' }}
      >
        <FullBleed>
          {children}
        </FullBleed>
      </div>
    </div>
  )
}
