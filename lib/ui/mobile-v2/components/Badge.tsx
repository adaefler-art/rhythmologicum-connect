'use client'

import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-[#eff6ff] text-[#4a90e2]',
    success: 'bg-[#dcfce7] text-[#22c55e]',
    warning: 'bg-[#fef9c3] text-[#eab308]',
    danger: 'bg-[#fee2e2] text-[#ef4444]',
    neutral: 'bg-[#f3f4f6] text-[#6b7280]',
  }
  
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  }
  
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  )
}
