/**
 * Card Renderer (V05-I06.2)
 * 
 * Optional wrapper component for rendering content in card format
 * Can be used to wrap sections for consistent card styling
 */

'use client'

import { type ReactNode } from 'react'

export type CardRendererProps = {
  children: ReactNode
  title?: string
  className?: string
}

/**
 * Card Renderer - Wraps content in card styling
 * 
 * Provides consistent card appearance across different content blocks
 * Optional title for card header
 */
export function CardRenderer({ children, title, className = '' }: CardRendererProps) {
  return (
    <div className={`card-renderer bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
      {title && (
        <div className="card-header border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </div>
      )}
      <div className="card-body p-6">
        {children}
      </div>
    </div>
  )
}
