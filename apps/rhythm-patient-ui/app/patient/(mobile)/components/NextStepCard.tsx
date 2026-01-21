'use client'

import { Card } from '@/lib/ui'
import type { NextStep } from '@/lib/api/contracts/patient/dashboard'

export interface NextStepCardProps {
  /** Next step data from dashboard API */
  nextStep: NextStep
  /** Callback when CTA is clicked */
  onAction?: () => void
}

/**
 * Next Step Card Component
 * 
 * Displays the next action for the patient to take.
 * Part of E6.5.4 implementation.
 * 
 * Features:
 * - Always visible when nextStep is available (AC3)
 * - Visual prominence with icon
 * - Responsive design
 * - Light mode only (Mobile v2)
 * - CTA button for action
 * 
 * @example
 * <NextStepCard
 *   nextStep={{
 *     type: 'funnel',
 *     target: '/patient/funnel/stress',
 *     label: 'Continue Stress Assessment'
 *   }}
 *   onAction={handleAction}
 * />
 */
export function NextStepCard({ nextStep, onAction }: NextStepCardProps) {
  // Don't render if type is 'none'
  if (nextStep.type === 'none') {
    return null
  }

  // Icon mapping based on next step type
  const iconMap = {
    onboarding: '📋',
    funnel: '🎯',
    result: '📊',
    content: '📖',
    none: '',
  }

  const icon = iconMap[nextStep.type]

  return (
    <Card padding="lg" radius="lg" className="border-2 border-sky-200">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl" role="img" aria-label="Next step">
              {icon}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900">
              Nächster Schritt
            </h2>
            <p className="text-sm text-slate-600">{nextStep.label}</p>
          </div>
        </div>

        {nextStep.target && (
          <button
            onClick={onAction}
            className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            {nextStep.label}
          </button>
        )}
      </div>
    </Card>
  )
}

export default NextStepCard
