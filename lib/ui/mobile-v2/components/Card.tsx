/**
 * Mobile UI v2 Card Component
 * 
 * Primitive card container using mobile-v2 design tokens.
 * No inline styles - uses Tailwind classes.
 */

'use client'

import React from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardShadow = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: CardPadding
  shadow?: CardShadow
  onClick?: () => void
  hover?: boolean
}

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  onClick,
  hover = false,
}: CardProps) {
  const paddingStyles: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  }

  const shadowStyles: Record<CardShadow, string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  }

  const hoverStyles = hover ? 'hover:shadow-md transition-shadow duration-200' : ''
  const clickableStyles = onClick ? 'cursor-pointer' : ''

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl ${paddingStyles[padding]} ${shadowStyles[shadow]} ${hoverStyles} ${clickableStyles} ${className}`}
    >
      {children}
    </div>
  )
}
