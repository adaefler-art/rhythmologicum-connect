import { type HTMLAttributes } from 'react'
import { componentTokens, colors, typography } from '@/lib/design-tokens'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Current progress value (0-100) */
  value: number
  /** Whether to show the percentage text */
  showPercentage?: boolean
  /** Whether to show the "Step X of Y" text */
  showStepText?: boolean
  /** Current step number (1-based) */
  currentStep?: number
  /** Total number of steps */
  totalSteps?: number
  /** Custom color for the progress bar (defaults to primary sky-500) */
  color?: string
  /** Variant style: 'bar' for horizontal bar, 'steps' for step indicators */
  variant?: 'bar' | 'steps'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Progress Component
 * 
 * A versatile progress indicator component for showing completion status.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Two variants: horizontal bar or step indicators
 * - Optional step text and percentage display
 * - Smooth animations using design token motion values
 * - Theme-aware colors
 * - Accessible with proper ARIA attributes
 * - Touch-optimized
 * 
 * @example
 * // Basic progress bar
 * <Progress value={60} />
 * 
 * @example
 * // With step indicators
 * <Progress
 *   value={50}
 *   currentStep={2}
 *   totalSteps={4}
 *   variant="steps"
 * />
 * 
 * @example
 * // Assessment progress
 * <Progress
 *   value={33}
 *   currentStep={2}
 *   totalSteps={6}
 *   showStepText
 *   showPercentage
 * />
 */
export function Progress({
  value,
  showPercentage = true,
  showStepText = true,
  currentStep,
  totalSteps,
  color = colors.primary[500],
  variant = 'bar',
  size = 'md',
  className = '',
  ...props
}: ProgressProps) {
  const progressTokens = componentTokens.progressBar

  // Size configurations
  const sizeConfig = {
    sm: {
      height: '0.375rem', // 6px
      fontSize: typography.fontSize.xs,
    },
    md: {
      height: progressTokens.height, // 0.5rem (8px)
      fontSize: typography.fontSize.sm,
    },
    lg: {
      height: '0.75rem', // 12px
      fontSize: typography.fontSize.base,
    },
  }

  const config = sizeConfig[size]

  // Clamp value between 0-100
  const clampedValue = Math.min(Math.max(value, 0), 100)

  // Calculate step display text
  const stepText =
    currentStep && totalSteps
      ? `Schritt ${currentStep} von ${totalSteps}`
      : showStepText && totalSteps
        ? `Frage ${Math.ceil((clampedValue / 100) * totalSteps)} von ${totalSteps}`
        : null

  if (variant === 'steps' && totalSteps) {
    // Step indicator variant
    const currentStepIndex = currentStep ? currentStep - 1 : Math.floor((clampedValue / 100) * totalSteps)

    return (
      <div className={className} {...props}>
        {(showStepText || showPercentage) && (
          <div
            className="flex items-center justify-between text-slate-700 mb-2"
            style={{ fontSize: config.fontSize }}
          >
            {stepText && <span className="font-medium">{stepText}</span>}
            {showPercentage && (
              <span className="text-slate-500" style={{ fontSize: typography.fontSize.xs }}>
                {Math.round(clampedValue)}%
              </span>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }, (_, i) => {
            const isCompleted = i < currentStepIndex
            const isCurrent = i === currentStepIndex
            const isPending = i > currentStepIndex

            return (
              <div
                key={i}
                className="flex-1 overflow-hidden"
                style={{
                  height: config.height,
                  borderRadius: progressTokens.borderRadius,
                  backgroundColor: isPending ? colors.neutral[200] : color,
                  opacity: isCompleted ? 1 : isCurrent ? 0.8 : 0.3,
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
    <div className={className} {...props}>
      {(showStepText || showPercentage) && (
        <div
          className="flex items-center justify-between text-slate-700 mb-2"
          style={{ fontSize: config.fontSize }}
        >
          {stepText && <span className="font-medium">{stepText}</span>}
          {showPercentage && (
            <span className="text-slate-500" style={{ fontSize: typography.fontSize.xs }}>
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full bg-slate-200 overflow-hidden"
        style={{
          height: config.height,
          borderRadius: progressTokens.borderRadius,
        }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Fortschritt: ${Math.round(clampedValue)}%`}
      >
        <div
          style={{
            width: `${clampedValue}%`,
            height: config.height,
            borderRadius: progressTokens.borderRadius,
            backgroundColor: color,
            transition: progressTokens.transition,
          }}
        />
      </div>
    </div>
  )
}

export default Progress
