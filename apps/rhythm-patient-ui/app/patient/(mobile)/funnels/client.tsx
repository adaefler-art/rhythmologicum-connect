'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/app/components/MobileHeader'
import FunnelCard from '@/app/components/FunnelCard'
import { LoadingSpinner, ErrorState, Card } from '@/lib/ui'
import { typography, radii } from '@/lib/design-tokens'
import type { FunnelCatalogResponse } from '@/lib/types/catalog'
import { PILLAR_KEY } from '@/lib/contracts/registry'

/**
 * Patient Funnel Catalog Client Component (V05-I02.1)
 * 
 * Displays funnels organized by pillar taxonomy.
 * Allows patients to browse and start assessments.
 */
export default function FunnelCatalogClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<FunnelCatalogResponse | null>(null)
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/funnels/catalog')

        if (!response.ok) {
          throw new Error('Failed to load catalog')
        }

        const data = await response.json()

        if (data.success && data.data) {
          setCatalog(data.data)
          // Auto-expand first pillar
          if (data.data.pillars.length > 0) {
            setExpandedPillars(new Set([data.data.pillars[0].pillar.id]))
          }
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('[catalog] Error loading catalog:', err)
        setError('Katalog konnte nicht geladen werden.')
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [])

  const handleFunnelClick = (slug: string, availability?: 'available' | 'coming_soon' | 'not_available') => {
    // Only navigate if funnel is available
    if (availability === 'available' || !availability) {
      // Navigate to funnel intro page
      router.push(`/patient/funnel/${slug}/intro`)
    }
  }

  const togglePillar = (pillarId: string) => {
    setExpandedPillars((prev) => {
      const next = new Set(prev)
      if (next.has(pillarId)) {
        next.delete(pillarId)
      } else {
        next.add(pillarId)
      }
      return next
    })
  }

  // Map pillar keys to icons
  const getPillarIcon = (key: string): string => {
    const iconMap: Record<string, string> = {
      [PILLAR_KEY.NUTRITION]: '🥗',
      [PILLAR_KEY.MOVEMENT]: '🏃',
      [PILLAR_KEY.SLEEP]: '😴',
      [PILLAR_KEY.MENTAL_HEALTH]: '🧘‍♀️',
      [PILLAR_KEY.SOCIAL]: '👥',
      [PILLAR_KEY.MEANING]: '🌟',
      [PILLAR_KEY.PREVENTION]: '🛡️',
    }
    return iconMap[key] || '📋'
  }

  // Map funnel slugs to icons (fallback if needed)
  const getFunnelIcon = (slug: string): string => {
    const iconMap: Record<string, string> = {
      'stress-assessment': '🧘‍♀️',
      'stress': '🧘‍♀️',
      'sleep': '😴',
      'sleep-assessment': '😴',
      'resilience': '💪',
    }
    return iconMap[slug] || '📋'
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 transition-colors duration-150">
      <MobileHeader
        variant="with-title"
        title="Funnel Katalog"
        subtitle="Rhythmologicum Connect"
        showBack={true}
      />

      <main
        className="flex-1 overflow-y-auto px-4 pt-4 sm:pt-6"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 min-w-0 space-y-6">
            <div className="space-y-2">
              <h1
                className="font-bold leading-tight text-slate-900 dark:text-slate-100"
                style={{
                  fontSize: typography.fontSize['2xl'],
                  lineHeight: typography.lineHeight.tight,
                }}
              >
                Verfügbare Assessments
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Wählen Sie ein Assessment aus, um zu starten
              </p>
            </div>

            {loading && <LoadingSpinner size="lg" centered />}

            {error && <ErrorState message={error} />}

            {!loading && !error && catalog && (
              <div className="space-y-6">
                {/* Pillars with funnels */}
                {catalog.pillars.map((pillarData) => (
                  <div key={pillarData.pillar.id} className="space-y-3">
                    {/* Pillar header - clickable accordion */}
                    <Card
                      padding="md"
                      radius="lg"
                      interactive
                      onClick={() => togglePillar(pillarData.pillar.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPillarIcon(pillarData.pillar.key)}</span>
                        <div className="flex-1 text-left">
                          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                            {pillarData.pillar.title}
                          </h2>
                          {pillarData.pillar.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {pillarData.pillar.description}
                            </p>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 text-slate-400 transition-transform ${
                            expandedPillars.has(pillarData.pillar.id) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </Card>

                    {/* Funnels in this pillar */}
                    {expandedPillars.has(pillarData.pillar.id) && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {pillarData.funnels.map((funnel) => (
                          <FunnelCard
                            key={funnel.id}
                            funnel={{
                              id: funnel.id,
                              slug: funnel.slug,
                              title: funnel.title,
                              subtitle: funnel.subtitle,
                              description: funnel.description,
                              default_theme: null,
                            }}
                            icon={getFunnelIcon(funnel.slug)}
                            onClick={() => handleFunnelClick(funnel.slug, funnel.availability)}
                            estimatedDuration={funnel.est_duration_min}
                            outcomes={funnel.outcomes}
                            version={funnel.default_version}
                            availability={funnel.availability}
                          />
                        ))}
                      </div>
                    )}

                    {/* Empty state for pillar */}
                    {expandedPillars.has(pillarData.pillar.id) &&
                      pillarData.funnels.length === 0 && (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          Keine Assessments in dieser Kategorie verfügbar
                        </div>
                      )}
                  </div>
                ))}

                {/* Uncategorized funnels */}
                {catalog.uncategorized_funnels.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                      Weitere Assessments
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {catalog.uncategorized_funnels.map((funnel) => (
                        <FunnelCard
                          key={funnel.id}
                          funnel={{
                            id: funnel.id,
                            slug: funnel.slug,
                            title: funnel.title,
                            subtitle: funnel.subtitle,
                            description: funnel.description,
                            default_theme: null,
                          }}
                          icon={getFunnelIcon(funnel.slug)}
                          onClick={() => handleFunnelClick(funnel.slug, funnel.availability)}
                          estimatedDuration={funnel.est_duration_min}
                          outcomes={funnel.outcomes}
                          version={funnel.default_version}
                          availability={funnel.availability}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state - no funnels at all */}
                {catalog.pillars.length === 0 && catalog.uncategorized_funnels.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">
                      Derzeit sind keine Assessments verfügbar
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
