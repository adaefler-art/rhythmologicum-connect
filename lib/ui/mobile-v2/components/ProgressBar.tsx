/**
 * Mobile UI v2 ProgressBar Component
 * 
 * Primitive progress bar component using mobile-v2 design tokens.
 * Supports linear progress with optional label.
 */

import React from 'react'

export type ProgressBarColor = 'primary' | 'success' | 'warning' | 'danger'

export interface ProgressBarProps {
  value: number
  max?: number
  color?: ProgressBarColor
  showLabel?: boolean
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = false,
  label,
  className = '',
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colorStyles: Record<ProgressBarColor, string> = {
    primary: 'bg-gradient-to-r from-[#4a90e2] to-[#6c63ff]',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  }

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-neutral-600">{label || 'Progress'}</span>
          <span className="text-sm font-medium text-neutral-900">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-neutral-200 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${sizeStyles[size]} ${colorStyles[color]} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
