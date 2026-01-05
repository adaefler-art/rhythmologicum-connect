'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Info } from 'lucide-react'
import { spacing, typography, shadows, colors } from '@/lib/design-tokens'

export type MobileHeaderVariant = 'minimal' | 'with-title' | 'with-action'

export type MobileHeaderProps = {
  /**
   * Display variant of the header
   * - 'minimal': Only back button
   * - 'with-title': Back button + title
   * - 'with-action': Back button + title + action icon
   */
  variant?: MobileHeaderVariant
  /**
   * Title to display in the header
   */
  title?: string
  /**
   * Optional subtitle/breadcrumb text
   */
  subtitle?: string
  /**
   * Show back button (default: true)
   */
  showBack?: boolean
  /**
   * Custom back navigation handler
   * If not provided, uses router.back()
   */
  onBack?: () => void
  /**
   * Action icon type ('settings' or 'info')
   */
  actionIcon?: 'settings' | 'info'
  /**
   * Handler for action icon click
   */
  onAction?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * MobileHeader Component
 * 
 * Global mobile navigation header for all /patient/* pages.
 * Provides consistent back navigation and optional title/actions.
 * 
 * Features:
 * - Sticky positioning with elevated z-index
 * - Touch-friendly 44px minimum hit areas
 * - Accessible focus management
 * - Three variants: minimal, with-title, with-action
 * - Consistent design tokens
 * 
 * UX Pattern:
 * [← Back] [Title/Subtitle] [Action Icon]
 * 
 * @example
 * // Minimal - just back button
 * <MobileHeader variant="minimal" />
 * 
 * @example
 * // With title
 * <MobileHeader variant="with-title" title="Stress Assessment" />
 * 
 * @example
 * // With action icon
 * <MobileHeader 
 *   variant="with-action" 
 *   title="Ergebnisse"
 *   actionIcon="info"
 *   onAction={() => console.log('Info clicked')}
 * />
 */
export default function MobileHeader({
  variant = 'with-title',
  title,
  subtitle,
  showBack = true,
  onBack,
  actionIcon = 'settings',
  onAction,
  className = '',
}: MobileHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  // Render action icon based on type
  const renderActionIcon = () => {
    if (!onAction) return null

    const iconProps = {
      size: 20,
      strokeWidth: 2,
      'aria-hidden': true,
    }

    return (
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        style={{
          width: '44px',
          height: '44px',
        }}
        aria-label={actionIcon === 'settings' ? 'Einstellungen' : 'Information'}
      >
        {actionIcon === 'settings' ? (
          <Settings {...iconProps} className="text-slate-700 dark:text-slate-300" />
        ) : (
          <Info {...iconProps} className="text-slate-700 dark:text-slate-300" />
        )}
      </button>
    )
  }

  return (
    <header
      className={`sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors duration-150 ${className}`}
      style={{
        zIndex: 50,
        boxShadow: shadows.sm,
      }}
    >
      <div
        className="flex items-center gap-3"
        style={{
          padding: `${spacing.sm} ${spacing.md}`,
          minHeight: '56px',
        }}
      >
        {/* Back Button */}
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            style={{
              width: '44px',
              height: '44px',
            }}
            aria-label="Zurück"
          >
            <ArrowLeft
              size={20}
              strokeWidth={2}
              className="text-slate-700 dark:text-slate-300"
              aria-hidden={true}
            />
          </button>
        )}

        {/* Title Section */}
        {(variant === 'with-title' || variant === 'with-action') && (
          <div className="flex-1 min-w-0">
            {subtitle && (
              <p
                className="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wide truncate"
                style={{ fontSize: typography.fontSize.xs }}
              >
                {subtitle}
              </p>
            )}
            {title && (
              <h1
                className="font-semibold text-slate-900 dark:text-slate-100 truncate"
                style={{
                  fontSize: typography.fontSize.lg,
                  lineHeight: typography.lineHeight.tight,
                }}
              >
                {title}
              </h1>
            )}
          </div>
        )}

        {/* Action Icon */}
        {variant === 'with-action' && renderActionIcon()}
      </div>
    </header>
  )
}
