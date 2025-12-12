'use client'

import { spacing, typography, radii, shadows, colors, componentTokens } from '@/lib/design-tokens'

export type MobileWelcomeScreenProps = {
  title: string
  subtitle?: string
  description?: string
  bulletPoints?: string[]
  ctaLabel?: string
  onContinue: () => void
  isLoading?: boolean
}

/**
 * MobileWelcomeScreen Component
 * 
 * A mobile-first welcome/intro screen with clean, modern design.
 * Optimized for 360-430px viewport widths.
 * 
 * Features:
 * - Illustration placeholder
 * - Title and subtitle
 * - Bullet point list
 * - Primary CTA button
 * - Responsive layout using design tokens
 */
export default function MobileWelcomeScreen({
  title,
  subtitle,
  description,
  bulletPoints = [],
  ctaLabel = 'Assessment starten',
  onContinue,
  isLoading = false,
}: MobileWelcomeScreenProps) {
  const navTokens = componentTokens.navigationButton
  const infoTokens = componentTokens.infoBox

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(to bottom, ${colors.primary[50]}, ${colors.background.light}, ${colors.neutral[50]})`,
      }}
    >
      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto" style={{ padding: spacing.lg }}>
        <div className="max-w-md mx-auto">
          
          {/* Illustration Placeholder */}
          <div 
            className="mb-8 flex items-center justify-center overflow-hidden"
            style={{ 
              height: '240px',
              borderRadius: radii['2xl'],
              border: `1px solid ${colors.primary[200]}`,
              background: `linear-gradient(to bottom right, ${colors.primary[100]}, ${colors.primary[50]})`,
            }}
          >
            <div className="text-center">
              <div className="text-6xl mb-3">🧘‍♀️</div>
              <p 
                className="font-medium"
                style={{ 
                  fontSize: typography.fontSize.sm,
                  color: colors.primary[700],
                }}
              >
                Rhythmologicum Connect
              </p>
            </div>
          </div>

          {/* Subtitle Badge */}
          {subtitle && (
            <div className="mb-4">
              <span 
                className="inline-block bg-sky-600 text-white font-semibold uppercase tracking-wide"
                style={{
                  fontSize: typography.fontSize.xs,
                  padding: `${spacing.xs} ${spacing.md}`,
                  borderRadius: radii.full,
                }}
              >
                {subtitle}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 
            className="font-bold text-slate-900 mb-4 leading-tight"
            style={{ 
              fontSize: typography.fontSize['3xl'],
              lineHeight: typography.lineHeight.tight,
            }}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p 
              className="text-slate-600 mb-6"
              style={{ 
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {description}
            </p>
          )}

          {/* Info Cards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Duration Card */}
            <div 
              className="bg-white border border-slate-200"
              style={{ 
                padding: spacing.md,
                borderRadius: radii.lg,
                boxShadow: shadows.sm,
              }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">⏱️</div>
                <p 
                  className="font-semibold text-slate-900 mb-1"
                  style={{ fontSize: typography.fontSize.sm }}
                >
                  Dauer
                </p>
                <p 
                  className="text-slate-600"
                  style={{ fontSize: typography.fontSize.xs }}
                >
                  5-10 Min
                </p>
              </div>
            </div>

            {/* Privacy Card */}
            <div 
              className="bg-white border border-slate-200"
              style={{ 
                padding: spacing.md,
                borderRadius: radii.lg,
                boxShadow: shadows.sm,
              }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🔒</div>
                <p 
                  className="font-semibold text-slate-900 mb-1"
                  style={{ fontSize: typography.fontSize.sm }}
                >
                  Sicher
                </p>
                <p 
                  className="text-slate-600"
                  style={{ fontSize: typography.fontSize.xs }}
                >
                  Vertraulich
                </p>
              </div>
            </div>
          </div>

          {/* Bullet Points List */}
          {bulletPoints.length > 0 && (
            <div 
              className="bg-white border border-slate-200 mb-6"
              style={{ 
                padding: spacing.lg,
                borderRadius: radii.xl,
                boxShadow: shadows.sm,
              }}
            >
              <h2 
                className="font-semibold text-slate-900 mb-4 flex items-center gap-2"
                style={{ fontSize: typography.fontSize.lg }}
              >
                <span className="text-sky-600">✓</span>
                Was Sie erwartet
              </h2>
              <ul className="space-y-3">
                {bulletPoints.map((point, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <span 
                      className="shrink-0 bg-sky-100 text-sky-700 font-semibold flex items-center justify-center"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: radii.full,
                        fontSize: typography.fontSize.xs,
                      }}
                    >
                      {index + 1}
                    </span>
                    <p 
                      className="text-slate-700 flex-1"
                      style={{ 
                        fontSize: typography.fontSize.sm,
                        lineHeight: typography.lineHeight.relaxed,
                      }}
                    >
                      {point}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Info Note */}
          <div 
            className="bg-blue-50 border border-blue-200 mb-6"
            style={{ 
              padding: infoTokens.padding,
              borderRadius: infoTokens.borderRadius,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">ℹ️</span>
              <p 
                className="text-blue-900 flex-1"
                style={{ 
                  fontSize: infoTokens.fontSize,
                  lineHeight: infoTokens.lineHeight,
                }}
              >
                Nehmen Sie sich Zeit für die Beantwortung. Es gibt keine richtigen oder falschen Antworten.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* CTA Footer - Fixed at bottom */}
      <footer 
        className="bg-white border-t border-slate-200 shadow-lg"
        style={{ padding: spacing.lg }}
      >
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={onContinue}
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
              <>
                {ctaLabel} →
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}
