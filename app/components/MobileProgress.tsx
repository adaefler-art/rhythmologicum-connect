'use client'

import { componentTokens, typography, motion, colors } from '@/lib/design-tokens'

// Step indicator opacity values for different states
const STEP_OPACITY = {
  completed: 1,
  current: 0.8,
  pending: 0.3,
} as const

export type MobileProgressProps = {
  /** Current step index (0-based) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Optional custom className for additional styling */
  className?: string
  /** Whether to show the percentage text */
  showPercentage?: boolean
  /** Whether to show the "Step X of Y" text */
  showStepText?: boolean
  /** Custom color for the progress bar (defaults to primary sky-500) */
  color?: string
  /** Variant style: 'bar' for horizontal bar, 'steps' for step indicators */
  variant?: 'bar' | 'steps'
}

/**
 * MobileProgress Component
 * 
 * A progress indicator component that calculates progress based on funnel step data.
 * Uses design tokens from C1 for consistent styling.
 * 
 * Features:
 * - Calculates progress from current step and total steps
 * - Two variants: horizontal bar or step indicators
 * - Optional step text and percentage display
 * - Smooth animations using design token motion values
 * - Theme-aware colors
 * 
 * @example
 * // Basic usage with progress bar
 * <MobileProgress currentStep={2} totalSteps={5} />
 * 
 * @example
 * // Step indicators variant
 * <MobileProgress
 *   currentStep={1}
 *   totalSteps={4}
 *   variant="steps"
 *   showStepText={false}
 * />
 */
export default function MobileProgress({
  currentStep,
  totalSteps,
  className = '',
  showPercentage = true,
  showStepText = true,
  color = colors.primary[500],
  variant = 'bar',
}: MobileProgressProps) {
  const progressTokens = componentTokens.progressBar

  // Calculate progress percentage (current step is 0-based, so add 1)
  const progressPercent = ((currentStep + 1) / totalSteps) * 100

  if (variant === 'steps') {
    // Step indicator variant
    return (
      <div className={`${className}`}>
        {showStepText && (
          <div
            className="flex items-center justify-between text-slate-700 mb-2"
            style={{ fontSize: typography.fontSize.sm }}
          >
            <span className="font-medium">
              Schritt {currentStep + 1} von {totalSteps}
            </span>
            {showPercentage && (
              <span className="text-slate-500" style={{ fontSize: typography.fontSize.xs }}>
                {Math.round(progressPercent)}%
              </span>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }, (_, i) => {
            const isCompleted = i < currentStep
            const isCurrent = i === currentStep
            const isPending = i > currentStep

            return (
              <div
                key={i}
                className="flex-1 overflow-hidden"
                style={{
                  height: progressTokens.height,
                  borderRadius: progressTokens.borderRadius,
                  backgroundColor: isPending ? colors.neutral[200] : color,
                  opacity: isCompleted
                    ? STEP_OPACITY.completed
                    : isCurrent
                      ? STEP_OPACITY.current
                      : STEP_OPACITY.pending,
                  transition: progressTokens.transition,
                }}
                aria-label={`Schritt ${i + 1}${isCompleted ? ' abgeschlossen' : isCurrent ? ' aktuell' : ''}`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  // Bar variant (default)
  return (
    <div className={`${className}`}>
      {showStepText && (
        <div
          className="flex items-center justify-between text-slate-700 mb-2"
          style={{ fontSize: typography.fontSize.sm }}
        >
          <span className="font-medium">
            Frage {currentStep + 1} von {totalSteps}
          </span>
          {showPercentage && (
            <span className="text-slate-500" style={{ fontSize: typography.fontSize.xs }}>
              {Math.round(progressPercent)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full bg-slate-200 overflow-hidden"
        style={{
          height: progressTokens.height,
          borderRadius: progressTokens.borderRadius,
        }}
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Fortschritt: ${Math.round(progressPercent)}%`}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: progressTokens.height,
            borderRadius: progressTokens.borderRadius,
            backgroundColor: color,
            transition: progressTokens.transition,
          }}
        />
      </div>
    </div>
  )
}
