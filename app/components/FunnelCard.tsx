'use client'

import { spacing, typography, radii, shadows, colors, motion } from '@/lib/design-tokens'

export type FunnelCardProps = {
  /** Funnel slug for routing */
  slug: string
  /** Display name of the funnel */
  title: string
  /** Short tagline/subtitle */
  subtitle?: string | null
  /** Brief description of what the funnel assesses */
  description?: string | null
  /** Emoji or icon to represent the funnel */
  icon?: string
  /** Theme color for the card (future use) */
  theme?: string | null
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
  slug,
  title,
  subtitle,
  description,
  icon = '📋',
  theme,
  onClick,
}: FunnelCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white border-2 border-slate-200 hover:border-sky-400 hover:shadow-xl active:scale-[0.98] text-left"
      style={{
        padding: spacing.lg,
        borderRadius: radii.xl,
        boxShadow: shadows.md,
        transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
      }}
      aria-label={`${title} Assessment starten`}
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
          <span className="text-5xl">{icon}</span>
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
        className="font-bold text-slate-900 mb-2"
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
          className="text-slate-600"
          style={{
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {description}
        </p>
      )}

      {/* CTA Arrow */}
      <div className="mt-4 flex items-center gap-2 text-sky-600 font-semibold">
        <span style={{ fontSize: typography.fontSize.sm }}>Assessment starten</span>
        <span>→</span>
      </div>
    </button>
  )
}
