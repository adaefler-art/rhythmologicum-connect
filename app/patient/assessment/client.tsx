'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/app/components/MobileHeader'
import FunnelCard from '@/app/components/FunnelCard'
import { spacing, typography, colors } from '@/lib/design-tokens'

type FunnelData = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  default_theme: string | null
}

/**
 * Mobile Funnel Selector Client Component
 * 
 * Displays all available active funnels as cards for patient selection.
 * Part of v0.4.1 mobile funnel selector feature.
 */
export default function FunnelSelectorClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [funnels, setFunnels] = useState<FunnelData[]>([])

  useEffect(() => {
    const loadActiveFunnels = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/funnels/active')

        if (!response.ok) {
          throw new Error('Failed to load funnels')
        }

        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          setFunnels(data.data)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Error loading funnels:', err)
        setError('Funnels konnten nicht geladen werden.')
      } finally {
        setLoading(false)
      }
    }

    loadActiveFunnels()
  }, [])

  const handleFunnelClick = (slug: string) => {
    // Navigate to funnel intro page
    router.push(`/patient/funnel/${slug}/intro`)
  }

  // Map funnel slugs to appropriate icons
  const getFunnelIcon = (slug: string): string => {
    const iconMap: Record<string, string> = {
      'stress-assessment': '🧘‍♀️',
      'stress': '🧘‍♀️',
      'sleep': '😴',
      'sleep-assessment': '😴',
      'nutrition': '🥗',
      'af': '❤️',
      'longevity': '🌱',
      'recovery': '💪',
    }
    return iconMap[slug] || '📋'
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(to bottom, ${colors.primary[50]}, ${colors.background.light}, ${colors.neutral[50]})`,
      }}
    >
      {/* Mobile Header */}
      <MobileHeader
        variant="with-title"
        title="Assessment auswählen"
        subtitle="Rhythmologicum Connect"
        showBack={true}
      />

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto" style={{ padding: spacing.lg }}>
        <div className="max-w-md mx-auto">
          {/* Page Title */}
          <h1
            className="font-bold text-slate-900 mb-3 leading-tight"
            style={{
              fontSize: typography.fontSize['2xl'],
              lineHeight: typography.lineHeight.tight,
            }}
          >
            Wählen Sie Ihr Assessment
          </h1>

          {/* Description */}
          <p
            className="text-slate-600 mb-6"
            style={{
              fontSize: typography.fontSize.base,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Erkunden Sie verschiedene Bereiche Ihrer Gesundheit und erhalten Sie personalisierte
            Einblicke.
          </p>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block">
                <svg
                  className="animate-spin h-10 w-10 text-sky-600"
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
              </div>
              <p
                className="text-slate-600 mt-4"
                style={{ fontSize: typography.fontSize.sm }}
              >
                Lade Assessments...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              className="bg-red-50 border-2 border-red-200 text-center"
              style={{
                padding: spacing.lg,
                borderRadius: spacing.lg,
              }}
            >
              <p className="text-red-800 font-semibold mb-2">Fehler</p>
              <p className="text-red-700" style={{ fontSize: typography.fontSize.sm }}>
                {error}
              </p>
            </div>
          )}

          {/* Funnels Grid */}
          {!loading && !error && funnels.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {funnels.map((funnel) => (
                <FunnelCard
                  key={funnel.id}
                  slug={funnel.slug}
                  title={funnel.title}
                  subtitle={funnel.subtitle}
                  description={funnel.description}
                  icon={getFunnelIcon(funnel.slug)}
                  theme={funnel.default_theme}
                  onClick={() => handleFunnelClick(funnel.slug)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && funnels.length === 0 && (
            <div
              className="bg-slate-50 border-2 border-slate-200 text-center"
              style={{
                padding: spacing.xl,
                borderRadius: spacing.lg,
              }}
            >
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-slate-700 font-semibold mb-2">
                Keine Assessments verfügbar
              </p>
              <p className="text-slate-600" style={{ fontSize: typography.fontSize.sm }}>
                Derzeit sind keine Assessments aktiviert. Bitte kontaktieren Sie Ihren
                Behandler.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
