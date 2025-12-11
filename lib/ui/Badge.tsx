/**
 * Badge Component
 * 
 * A small, colored label component for displaying status, categories, or tags.
 * Supports multiple variants with semantic colors from the v0.4 design system.
 * 
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="danger">High Risk</Badge>
 * ```
 */

import type { ReactNode } from 'react'
import { colors } from '@/lib/design-tokens'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  /**
   * The visual style variant of the badge
   * @default 'default'
   */
  variant?: BadgeVariant
  
  /**
   * The size of the badge
   * @default 'md'
   */
  size?: BadgeSize
  
  /**
   * Badge content
   */
  children: ReactNode
  
  /**
   * Additional CSS class names
   */
  className?: string
}

/**
 * Badge component for displaying status, tags, or categories
 */
export function Badge({ 
  variant = 'default', 
  size = 'md',
  children, 
  className = '' 
}: BadgeProps) {
  // Variant styles
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-sky-100 text-sky-800 border-sky-200',
    secondary: 'bg-slate-50 text-slate-600 border-slate-200',
  }

  // Size styles
  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  const variantClass = variantStyles[variant]
  const sizeClass = sizeStyles[size]

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full border font-medium
        whitespace-nowrap
        ${variantClass}
        ${sizeClass}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
