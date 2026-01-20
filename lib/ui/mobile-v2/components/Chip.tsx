/**
 * Mobile UI v2 Chip/Tag Component
 * 
 * Primitive chip/tag/pill component using mobile-v2 design tokens.
 * Used for tags, status indicators, and filter chips.
 */

'use client'

import React from 'react'

export type ChipVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
export type ChipSize = 'sm' | 'md'

export interface ChipProps {
  children: React.ReactNode
  variant?: ChipVariant
  size?: ChipSize
  className?: string
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
}

export function Chip({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  onClick,
  removable = false,
  onRemove,
}: ChipProps) {
  const variantStyles: Record<ChipVariant, string> = {
    primary: 'bg-primary-50 text-[#4a90e2]',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    neutral: 'bg-neutral-100 text-neutral-600',
  }

  const sizeStyles: Record<ChipSize, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  const clickableStyles = onClick ? 'cursor-pointer hover:opacity-80' : ''

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${clickableStyles} ${className}`}
    >
      <span>{children}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 hover:opacity-70"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  )
}

// Pill is an alias for Chip with full rounded style
export const Pill = Chip
export const Tag = Chip
