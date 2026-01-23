'use client'

import { type ReactNode } from 'react'
import { componentTokens, shadows, radii, spacing, motion } from '@/lib/design-tokens'

export type MobileCardProps = {
  children: ReactNode
  /** Optional custom className for additional styling */
  className?: string
  /** Card padding variant - uses design tokens */
  padding?: 'sm' | 'md' | 'lg'
  /** Shadow depth variant */
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  /** Border radius variant */
  radius?: 'md' | 'lg' | 'xl' | '2xl'
  /** Whether to show a border */
  border?: boolean
  /** Optional onClick handler for interactive cards */
  onClick?: () => void
  /** Whether the card is interactive (adds hover effects) */
  interactive?: boolean
}

/**
 * MobileCard Component
 * 
 * A reusable wrapper component for mobile content with consistent card styling.
 * Uses design tokens from C1 for spacing, shadows, and border radius.
 * 
 * Features:
 * - Configurable padding, shadow, and radius using design tokens
 * - Optional border and interactive states
 * - Touch-optimized with hover effects for interactive cards
 * - Consistent with the design system
 * 
 * @example
 * // Basic usage
 * <MobileCard>
 *   <p>Card content</p>
 * </MobileCard>
 * 
 * @example
 * // Interactive card with custom styling
 * <MobileCard
 *   interactive
 *   onClick={() => console.log('clicked')}
 *   padding="lg"
 *   shadow="lg"
 * >
 *   <p>Interactive card</p>
 * </MobileCard>
 */
export default function MobileCard({
  children,
  className = '',
  padding = 'lg',
  shadow: shadowVariant = 'lg',
  radius: radiusVariant = '2xl',
  border = true,
  onClick,
  interactive = false,
}: MobileCardProps) {
  // Map padding variants to design tokens
  const paddingMap = {
    sm: spacing.md,
    md: spacing.lg,
    lg: componentTokens.mobileQuestionCard.padding,
  }

  // Map shadow variants to design tokens
  const shadowMap = {
    none: shadows.none,
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
  }

  // Map radius variants to design tokens
  const radiusMap = {
    md: radii.md,
    lg: radii.lg,
    xl: radii.xl,
    '2xl': radii['2xl'],
  }

  const paddingValue = paddingMap[padding]
  const shadowValue = shadowMap[shadowVariant]
  const radiusValue = radiusMap[radiusVariant]

  // Base classes
  const baseClasses = 'bg-white'
  const borderClasses = border ? 'border-2 border-slate-200' : ''
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-sky-400 hover:shadow-xl active:scale-[0.98]'
    : ''

  return (
    <div
      className={`${baseClasses} ${borderClasses} ${interactiveClasses} ${className}`}
      style={{
        padding: paddingValue,
        boxShadow: shadowValue,
        borderRadius: radiusValue,
        transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
