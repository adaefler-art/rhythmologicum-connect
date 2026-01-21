'use client'

import { typography } from '@/lib/design-tokens'

export interface DashboardHeaderProps {
  /** Optional greeting name */
  greeting?: string
}

/**
 * Dashboard Header Component
 * 
 * Displays a greeting and subtitle for the dashboard.
 * Part of E6.5.4 implementation.
 * 
 * Features:
 * - Optional personalized greeting
 * - Responsive typography
 * - Light mode only (Mobile v2)
 * 
 * @example
 * <DashboardHeader greeting="Max" />
 * 
 * @example
 * <DashboardHeader />
 */
export function DashboardHeader({ greeting }: DashboardHeaderProps) {
  return (
    <div className="space-y-2">
      <h1
        className="font-bold leading-tight text-slate-900"
        style={{
          fontSize: typography.fontSize['2xl'],
          lineHeight: typography.lineHeight.tight,
        }}
      >
        {greeting ? `Willkommen zurück, ${greeting}` : 'Willkommen zurück'}
      </h1>
      <p className="text-slate-600">
        Ihr persönliches Gesundheits-Dashboard
      </p>
    </div>
  )
}

export default DashboardHeader
