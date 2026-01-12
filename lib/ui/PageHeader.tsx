'use client'

import { type ReactNode } from 'react'
import { spacing } from '@/lib/design-tokens'

export interface PageHeaderProps {
  /** Main page title */
  title: string
  /** Optional subtitle/description */
  description?: string
  /** Optional action buttons on the right */
  actions?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * PageHeader Component
 * 
 * Standardized page header for Clinician and Admin pages.
 * Provides consistent spacing, typography, and layout.
 * 
 * @example
 * <PageHeader
 *   title="Dashboard"
 *   description="Übersicht aller Patientinnen und Patienten"
 *   actions={<Button>Export</Button>}
 * />
 */
export function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${className}`}
      style={{ marginBottom: spacing.xl }}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-base text-slate-600 dark:text-slate-300">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-3 items-start shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

export default PageHeader
