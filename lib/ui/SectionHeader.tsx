'use client'

import { type ReactNode } from 'react'
import { spacing } from '@/lib/design-tokens'

export interface SectionHeaderProps {
  /** Section title */
  title: string
  /** Optional subtitle/description */
  description?: string
  /** Optional action buttons on the right */
  actions?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * SectionHeader Component
 * 
 * Standardized section header for use within pages.
 * Smaller than PageHeader, used for subsections.
 * 
 * @example
 * <SectionHeader
 *   title="Recent Assessments"
 *   description="Aktuelle Messungen und Risikobewertungen"
 *   actions={<Button size="sm">Filter</Button>}
 * />
 */
export function SectionHeader({ title, description, actions, className = '' }: SectionHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      style={{ marginBottom: spacing.lg }}
    >
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2 items-start shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

export default SectionHeader
