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
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-700',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700',
    info: 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border-sky-200 dark:border-sky-700',
    secondary: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
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
