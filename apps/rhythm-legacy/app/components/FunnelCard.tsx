'use client'

import { Heart } from 'lucide-react'
import { spacing, typography, radii, shadows, colors, motion } from '@/lib/design-tokens'

// Funnel slugs that should display the heart icon instead of emoji
const STRESS_FUNNEL_SLUGS = ['stress-assessment', 'stress']

// Heart icon configuration for stress assessment cards
const HEART_ICON_SIZE = 48 // px
const HEART_ICON_STROKE_WIDTH = 2.5

export type FunnelCardProps = {
  /** Funnel data object (legacy support) */
  funnel?: {
    id: string
    slug: string
    title: string
    subtitle?: string | null
    description?: string | null
    default_theme?: string | null
  }
  /** Funnel slug for routing (can be overridden by funnel.slug) */
  slug?: string
  /** Display name of the funnel (can be overridden by funnel.title) */
  title?: string
  /** Short tagline/subtitle (can be overridden by funnel.subtitle) */
  subtitle?: string | null
  /** Brief description of what the funnel assesses (can be overridden by funnel.description) */
  description?: string | null
  /** Emoji or icon to represent the funnel */
  icon?: string
  /** Use icon component instead of emoji (for stress/heart icon) */
  useIconComponent?: boolean
  /** Theme color for the card (future use) */
  theme?: string | null
  /** Estimated duration in minutes */
  estimatedDuration?: number | null
  /** Array of outcome tags */
  outcomes?: string[]
  /** Version string */
  version?: string | null
  /** Availability status (V05-FIXOPT-01) */
  availability?: 'available' | 'coming_soon' | 'not_available'
  /** Click handler */
  onClick: () => void
}

/**
 * FunnelCard Component
 * 
 * A mobile-optimized card for displaying and selecting funnel types.
 * Part of the v0.4.1 mobile funnel selector feature.
 * 
 * Features:
 * - Clean, touch-friendly design
 * - Icon/emoji display
 * - Title, subtitle, and description
 * - Hover and active states
 * - Consistent with v0.4 design tokens
 * 
 * @example
 * <FunnelCard
 *   slug="stress-assessment"
 *   title="Stress & Resilienz"
 *   subtitle="Stress-Assessment"
 *   description="Erfassen Sie Ihr aktuelles Stresslevel und entdecken Sie Ihre Resilienzfaktoren."
 *   icon="🧘‍♀️"
 *   onClick={() => router.push('/patient/funnel/stress-assessment/intro')}
 * />
 */
export default function FunnelCard({
  funnel,
  slug: slugProp,
  title: titleProp,
  subtitle: subtitleProp,
  description: descriptionProp,
  icon = '📋',
  useIconComponent = false,
  theme: themeProp,
  estimatedDuration,
  outcomes,
  version,
  availability = 'available',
  onClick,
}: FunnelCardProps) {
  // Support both funnel object and individual props
  const slug = funnel?.slug ?? slugProp ?? ''
  const title = funnel?.title ?? titleProp ?? ''
  const subtitle = funnel?.subtitle ?? subtitleProp
  const description = funnel?.description ?? descriptionProp
  const theme = funnel?.default_theme ?? themeProp

  // Determine if this funnel should use the heart icon
  const isStressFunnel = STRESS_FUNNEL_SLUGS.includes(slug)
  const shouldUseHeartIcon = useIconComponent || isStressFunnel

  // V05-FIXOPT-01: Disable card if not available
  const isDisabled = availability === 'coming_soon' || availability === 'not_available'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-left transition-colors duration-150 ${
        isDisabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-xl active:scale-[0.98]'
      }`}
      style={{
        padding: spacing.lg,
        borderRadius: radii.xl,
        boxShadow: shadows.md,
        transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
      }}
      aria-label={`${title} Assessment ${isDisabled ? '(In Kürze verfügbar)' : 'starten'}`}
    >
      {/* Icon/Emoji */}
      <div className="mb-4 flex items-center justify-center">
        <div
          className="flex items-center justify-center border"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: radii.xl,
            background: `linear-gradient(to bottom right, ${colors.primary[100]}, ${colors.primary[50]})`,
            borderColor: colors.primary[200],
          }}
        >
          {shouldUseHeartIcon ? (
            // Heart icon with pulse animation for stress/resilience assessment
            <Heart
              className="heartbeat-pulse text-rose-600 dark:text-rose-500"
              size={HEART_ICON_SIZE}
              strokeWidth={HEART_ICON_STROKE_WIDTH}
              fill="currentColor"
              aria-hidden="true"
            />
          ) : (
            // Default emoji for other funnels
            <span className="text-5xl">{icon}</span>
          )}
        </div>
      </div>

      {/* Subtitle Badge */}
      {subtitle && (
        <div className="mb-3">
          <span
            className="inline-block bg-sky-600 text-white font-semibold uppercase tracking-wide"
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
      <h3
        className="font-bold text-slate-900 dark:text-slate-100 mb-2"
        style={{
          fontSize: typography.fontSize.xl,
          lineHeight: typography.lineHeight.tight,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className="text-slate-600 dark:text-slate-300 mb-3"
          style={{
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {description}
        </p>
      )}

      {/* Metadata tags */}
      {(estimatedDuration || outcomes || version) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {estimatedDuration && (
            <span
              className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded"
              style={{
                fontSize: typography.fontSize.xs,
                borderRadius: radii.sm,
              }}
            >
              ⏱️ ca. {estimatedDuration} Min.
            </span>
          )}
          {version && (
            <span
              className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded"
              style={{
                fontSize: typography.fontSize.xs,
                borderRadius: radii.sm,
              }}
            >
              v{version}
            </span>
          )}
        </div>
      )}

      {/* Outcomes */}
      {outcomes && outcomes.length > 0 && (
        <div className="mb-3">
          <ul className="space-y-1">
            {outcomes.slice(0, 3).map((outcome, idx) => (
              <li
                key={idx}
                className="text-slate-600 dark:text-slate-400 flex items-start gap-2"
                style={{
                  fontSize: typography.fontSize.xs,
                }}
              >
                <span className="text-sky-500 mt-0.5">✓</span>
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA Arrow */}
      <div className="mt-4 flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold">
        <span style={{ fontSize: typography.fontSize.sm }}>
          {isDisabled ? 'In Kürze verfügbar' : 'Assessment starten'}
        </span>
        {!isDisabled && <span>→</span>}
      </div>
    </button>
  )
}
