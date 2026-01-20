/**
 * Mobile UI v2 Button Component
 * 
 * Primitive button component using mobile-v2 design tokens.
 * No inline styles - uses Tailwind classes with token references.
 */

'use client'

import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  icon,
  iconPosition = 'left',
  type = 'button',
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-[#4a90e2] to-[#6c63ff] text-white shadow-lg hover:shadow-xl disabled:opacity-50 rounded-xl',
    secondary:
      'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 rounded-xl',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 rounded-xl',
  }

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
  }

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
    >
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  )
}
