'use client'

import { type ReactNode } from 'react'
import { spacing, typography, radii, shadows, colors, componentTokens } from '@/lib/design-tokens'

export type MobileContentPageProps = {
  /** Page title displayed at the top */
  title: string
  /** Main scrollable content (typically MarkdownRenderer) */
  children: ReactNode
  /** CTA button label */
  ctaLabel?: string
  /** CTA button click handler */
  onCtaClick?: () => void
  /** Optional secondary action label (shown as text link) */
  secondaryLabel?: string
  /** Optional secondary action handler */
  onSecondaryClick?: () => void
  /** Loading state for CTA button */
  isLoading?: boolean
  /** Optional subtitle or category label */
  subtitle?: string
}

/**
 * MobileContentPage Component
 * 
 * A mobile-first content page layout for markdown content with:
 * - Title header
 * - Scrollable content area
 * - Sticky bottom CTA button
 * - Consistent v0.4 design system styling
 * 
 * Features:
 * - Full-screen flex layout (min-h-screen)
 * - Design tokens for spacing and typography
 * - Sticky footer with primary CTA
 * - Optional secondary action
 * - Loading state support
 * - Touch-optimized interactions
 * 
 * @example
 * ```tsx
 * <MobileContentPage
 *   title="Datenschutz"
 *   subtitle="Informationen"
 *   ctaLabel="Zurück"
 *   onCtaClick={() => router.back()}
 * >
 *   <MarkdownRenderer content={markdownContent} />
 * </MobileContentPage>
 * ```
 */
export default function MobileContentPage({
  title,
  children,
  ctaLabel = 'Weiter',
  onCtaClick,
  secondaryLabel,
  onSecondaryClick,
  isLoading = false,
  subtitle,
}: MobileContentPageProps) {
  const navTokens = componentTokens.navigationButton

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(to bottom, ${colors.primary[50]}, ${colors.background.light})`,
      }}
    >
      {/* Header - Title Section */}
      <header 
        className="shrink-0 bg-white border-b border-slate-200"
        style={{ 
          padding: `${spacing.lg} ${spacing.lg}`,
          boxShadow: shadows.sm,
        }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Subtitle/Category Badge */}
          {subtitle && (
            <div className="mb-3">
              <span 
                className="inline-block bg-sky-100 text-sky-700 font-semibold uppercase tracking-wide"
                style={{
                  fontSize: typography.fontSize.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: radii.md,
                }}
              >
                {subtitle}
              </span>
            </div>
          )}
          
          {/* Title */}
          <h1 
            className="font-bold text-slate-900 leading-tight"
            style={{ 
              fontSize: typography.fontSize['3xl'],
              lineHeight: typography.lineHeight.tight,
            }}
          >
            {title}
          </h1>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main 
        className="flex-1 overflow-y-auto"
        style={{ 
          padding: `${spacing.xl} ${spacing.lg}`,
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div 
            className="bg-white border border-slate-200"
            style={{
              padding: `${spacing.xl} ${spacing.lg}`,
              borderRadius: radii['2xl'],
              boxShadow: shadows.lg,
            }}
          >
            {children}
          </div>
        </div>
      </main>

      {/* CTA Footer - Sticky at bottom */}
      <footer 
        className="shrink-0 bg-white border-t border-slate-200"
        style={{ 
          padding: spacing.lg,
          boxShadow: shadows.lg,
        }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Secondary Action (if provided) */}
          {secondaryLabel && onSecondaryClick && (
            <div className="text-center mb-3">
              <button
                type="button"
                onClick={onSecondaryClick}
                className="text-slate-600 hover:text-slate-900 font-medium underline"
                style={{
                  fontSize: typography.fontSize.sm,
                }}
              >
                {secondaryLabel}
              </button>
            </div>
          )}
          
          {/* Primary CTA Button */}
          {onCtaClick && (
            <button
              type="button"
              onClick={onCtaClick}
              disabled={isLoading}
              className="w-full bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-98 flex items-center justify-center gap-2"
              style={{
                padding: `${navTokens.paddingY} ${navTokens.paddingX}`,
                borderRadius: navTokens.borderRadius,
                minHeight: navTokens.minHeight,
                boxShadow: navTokens.shadow,
                fontSize: navTokens.fontSize,
                fontWeight: navTokens.fontWeight,
                transition: navTokens.transition,
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Bitte warten...
                </>
              ) : (
                ctaLabel
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
