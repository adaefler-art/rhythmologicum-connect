'use client'

import { type ReactNode } from 'react'
import { typography, spacing } from '@/lib/design-tokens'

export type MobileSectionTitleProps = {
  children: ReactNode
  /** Optional subtitle/caption text */
  subtitle?: string
  /** Optional custom className for additional styling */
  className?: string
  /** Size variant for different hierarchy levels */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Optional icon or emoji to display before the title */
  icon?: ReactNode
  /** Whether to add bottom margin */
  marginBottom?: boolean
}

/**
 * MobileSectionTitle Component
 * 
 * A consistent heading component for mobile funnel and content sections.
 * Uses design tokens from C1 for typography and spacing.
 * 
 * Features:
 * - Multiple size variants for different hierarchy levels
 * - Optional subtitle for additional context
 * - Optional icon/emoji support
 * - Configurable alignment and spacing
 * - Consistent typography using design tokens
 * 
 * @example
 * // Basic usage
 * <MobileSectionTitle>Willkommen</MobileSectionTitle>
 * 
 * @example
 * // With subtitle and icon
 * <MobileSectionTitle
 *   size="lg"
 *   subtitle="Bitte wählen Sie eine Antwort"
 *   icon="📋"
 * >
 *   Stress Assessment
 * </MobileSectionTitle>
 * 
 * @example
 * // Centered heading
 * <MobileSectionTitle
 *   size="xl"
 *   align="center"
 *   marginBottom
 * >
 *   Ergebnisse
 * </MobileSectionTitle>
 */
export default function MobileSectionTitle({
  children,
  subtitle,
  className = '',
  size = 'md',
  align = 'left',
  icon,
  marginBottom = true,
}: MobileSectionTitleProps) {
  // Map size variants to design tokens
  const sizeMap = {
    sm: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      subtitleSize: typography.fontSize.sm,
    },
    md: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      subtitleSize: typography.fontSize.sm,
    },
    lg: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      subtitleSize: typography.fontSize.base,
    },
    xl: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      subtitleSize: typography.fontSize.lg,
    },
  }

  const sizeConfig = sizeMap[size]
  const textAlignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
  const marginClass = marginBottom ? 'mb-4' : ''

  return (
    <div className={`${textAlignClass} ${marginClass} ${className}`}>
      <h2
        className={`text-slate-900 ${icon ? 'flex items-center gap-2' : ''} ${align === 'center' ? 'justify-center' : ''}`}
        style={{
          fontSize: sizeConfig.fontSize,
          fontWeight: sizeConfig.fontWeight,
          lineHeight: sizeConfig.lineHeight,
        }}
      >
        {icon && <span aria-hidden="true">{icon}</span>}
        <span>{children}</span>
      </h2>
      {subtitle && (
        <p
          className="text-slate-600 mt-1"
          style={{
            fontSize: sizeConfig.subtitleSize,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
