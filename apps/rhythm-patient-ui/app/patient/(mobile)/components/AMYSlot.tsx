'use client'

import { Card } from '@/lib/ui'

/**
 * AMY Slot Component
 * 
 * Placeholder component for AMY (AI Assistant) integration.
 * Will be wired in E6.6 with actual AMY functionality.
 * Part of E6.5.4 implementation.
 * 
 * Features:
 * - Visual placeholder for AMY assistant
 * - Responsive design
 * - Light mode only (Mobile v2)
 * - Ready for E6.6 integration
 * 
 * @example
 * <AMYSlot />
 */
export function AMYSlot() {
  return (
    <Card padding="lg" radius="lg">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl" role="img" aria-label="AMY Assistant">
            🤖
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            AMY - Ihr persönlicher Assistent
          </h3>
          <p className="text-sm text-slate-600">
            AMY wird bald verfügbar sein, um Ihnen personalisierte Einblicke und Empfehlungen zu
            bieten.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default AMYSlot
