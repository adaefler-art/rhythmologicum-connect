'use client'

import { type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { spacing, typography } from '@/lib/design-tokens'

export interface MobileHeaderProps {
  /** Page title */
  title: string
  /** Subtitle or description */
  subtitle?: string
  /** Back button handler */
  onBack?: () => void
  /** Back button label (defaults to "Zurück") */
  backLabel?: string
  /** Whether to show back button */
  showBack?: boolean
  /** Optional action button or content on the right */
  action?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * MobileHeader Component
 * 
 * A mobile-optimized header component with back button and title.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Back button with icon
 * - Title and optional subtitle
 * - Optional action button/content
 * - Touch-optimized (44px min height for interactive elements)
 * - Sticky positioning option
 * - Consistent with design tokens
 * 
 * @example
 * // Basic header with back button
 * <MobileHeader
 *   title="Stress Assessment"
 *   onBack={() => router.back()}
 * />
 * 
 * @example
 * // Header with subtitle and action
 * <MobileHeader
 *   title="Frage 3"
 *   subtitle="Stress-Fragebogen"
 *   onBack={() => router.back()}
 *   action={<Button variant="ghost" size="sm">Hilfe</Button>}
 * />
 * 
 * @example
 * // Header without back button
 * <MobileHeader
 *   title="Willkommen"
 *   showBack={false}
 * />
 */
export function MobileHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Zurück',
  showBack = true,
  action,
  className = '',
}: MobileHeaderProps) {
  return (
    <header
      className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors duration-150 ${className}`}
      style={{
        paddingLeft: spacing.md,
        paddingRight: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left side: Back button or spacer */}
        <div className="flex-shrink-0">
          {showBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 active:bg-slate-200 dark:active:bg-slate-600 transition-all duration-200 touch-manipulation"
              aria-label={backLabel}
            >
              <ArrowLeft className="w-5 h-5" />
              <span
                className="hidden sm:inline font-medium"
                style={{ fontSize: typography.fontSize.sm }}
              >
                {backLabel}
              </span>
            </button>
          ) : (
            <div className="w-11" /> // Spacer to maintain centering
          )}
        </div>

        {/* Center: Title and subtitle */}
        <div className="flex-1 text-center min-w-0">
          <h1
            className="font-semibold text-slate-900 dark:text-slate-100 truncate"
            style={{ fontSize: typography.fontSize.lg }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-slate-500 dark:text-slate-400 truncate mt-0.5"
              style={{ fontSize: typography.fontSize.xs }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side: Action or spacer */}
        <div className="flex-shrink-0">
          {action ? (
            action
          ) : (
            <div className="w-11" /> // Spacer to maintain centering
          )}
        </div>
      </div>
    </header>
  )
}

export default MobileHeader
