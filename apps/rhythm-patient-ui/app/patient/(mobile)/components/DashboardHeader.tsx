'use client'

import Link from 'next/link'
import { mobileTypography, Button } from '@/lib/ui/mobile-v2'
import { MessageCircle } from '@/lib/ui/mobile-v2/icons'
import { ASSISTANT_CONFIG } from '@/lib/config/assistant'

export interface DashboardHeaderProps {
  /** Optional greeting name */
  greeting?: string
}

/**
 * Dashboard Header Component
 * 
 * Displays a greeting and subtitle for the dashboard.
 * Part of E6.5.4 implementation.
 * I2.2: Added "Chat with assistant" entry point
 * 
 * Features:
 * - Optional personalized greeting
 * - Responsive typography
 * - Light mode only (Mobile v2)
 * - I2.2: Chat with assistant button (entry point to /patient/dialog?context=dashboard)
 * 
 * @example
 * <DashboardHeader greeting="Max" />
 * 
 * @example
 * <DashboardHeader />
 */
export function DashboardHeader({ greeting }: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h1
            className="font-bold leading-tight text-slate-900"
            style={{
              fontSize: mobileTypography.fontSize['2xl'],
              lineHeight: mobileTypography.lineHeight.tight,
            }}
          >
            {greeting ? `Willkommen zurück, ${greeting}` : 'Willkommen zurück'}
          </h1>
          <p className="text-slate-600">
            Ihr persönliches Gesundheits-Dashboard
          </p>
        </div>
        
        {/* I2.2: Chat with assistant entry point */}
        <Link href="/patient/dialog?context=dashboard">
          <Button 
            variant="secondary" 
            size="sm"
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat mit {ASSISTANT_CONFIG.name}</span>
            <span className="sm:hidden">{ASSISTANT_CONFIG.name}</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default DashboardHeader
