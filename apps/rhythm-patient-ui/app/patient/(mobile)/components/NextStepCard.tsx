'use client'

import { Card, Button } from '@/lib/ui/mobile-v2'
import type { NextStep } from '@/lib/api/contracts/patient/dashboard'
import { useDesignTokens } from '@/lib/contexts/DesignTokensContext'

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
 * E73.9: Uses dynamic design tokens from Studio configuration
 * 
 * Features:
 * - Always visible when nextStep is available (AC3)
 * - Visual prominence with icon
 * - Responsive design
 * - Light mode only (Mobile v2)
 * - CTA button for action
 * - E73.9: Dynamic theming via design tokens
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
  // E73.9: Get dynamic design tokens from context
  const tokens = useDesignTokens()
  
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

  // E73.9: Use primary color from design tokens (Studio-configurable)
  const primaryColor = tokens.colors?.primary?.[500] || '#0ea5e9'
  const primaryColorLight = tokens.colors?.primary?.[100] || '#e0f2fe'
  const primaryColorBorder = tokens.colors?.primary?.[200] || '#bae6fd'

  return (
    <Card 
      padding="lg" 
      className="border-2 rounded-lg"
      style={{ borderColor: primaryColorBorder }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColorLight }}
          >
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
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onAction}
          >
            {nextStep.label}
          </Button>
        )}
      </div>
    </Card>
  )
}

export default NextStepCard
