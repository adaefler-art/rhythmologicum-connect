/**
 * Mobile UI v2 ListRow Component
 * 
 * Primitive list row component for use in lists and menus.
 * No inline styles - uses Tailwind classes with token references.
 */

'use client'

import React from 'react'

export interface ListRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  icon?: React.ReactNode
  trailing?: React.ReactNode
  subtitle?: string
  active?: boolean
  disabled?: boolean
}

export function ListRow({
  children,
  className = '',
  onClick,
  icon,
  trailing,
  subtitle,
  active = false,
  disabled = false,
}: ListRowProps) {
  const baseStyles = 'flex items-center gap-3 p-4 transition-colors duration-150'
  const clickableStyles = onClick && !disabled ? 'cursor-pointer hover:bg-neutral-50' : ''
  const activeStyles = active ? 'bg-primary-50' : ''
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`${baseStyles} ${clickableStyles} ${activeStyles} ${disabledStyles} ${className}`}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-neutral-900 font-medium truncate">{children}</div>
        {subtitle && <div className="text-sm text-neutral-500 truncate">{subtitle}</div>}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  )
}
