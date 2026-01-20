/**
 * Mobile UI v2 Icon Component
 * 
 * Wrapper component for icons with consistent sizing and styling.
 * Works with lucide-react or any icon library.
 */

import React from 'react'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface IconProps {
  children: React.ReactNode
  size?: IconSize
  className?: string
  color?: string
}

export function Icon({ children, size = 'md', className = '', color }: IconProps) {
  const sizeStyles: Record<IconSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }

  const colorStyle = color ? { color } : {}

  return (
    <span className={`inline-flex items-center justify-center ${sizeStyles[size]} ${className}`} style={colorStyle}>
      {children}
    </span>
  )
}
