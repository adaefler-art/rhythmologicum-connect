'use client'

import { Card } from '@/lib/ui/mobile-v2'
import { ASSISTANT_CONFIG } from '@/lib/config/assistant'

/**
 * Assistant Slot Component
 * 
 * Placeholder component for AI Assistant integration.
 * Will be wired in E6.6 with actual assistant functionality.
 * Part of E6.5.4 implementation.
 * 
 * Features:
 * - Visual placeholder for AI assistant
 * - Responsive design
 * - Light mode only (Mobile v2)
 * - Ready for E6.6 integration
 * 
 * @example
 * <AMYSlot />
 */
export function AMYSlot() {
  return (
    <Card padding="lg" className="rounded-lg">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl" role="img" aria-label={`${ASSISTANT_CONFIG.name} Assistant`}>
            🤖
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {ASSISTANT_CONFIG.name} - {ASSISTANT_CONFIG.description}
          </h3>
          <p className="text-sm text-slate-600">
            {ASSISTANT_CONFIG.name} wird bald verfügbar sein, um Ihnen personalisierte Einblicke und Empfehlungen zu
            bieten.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default AMYSlot
