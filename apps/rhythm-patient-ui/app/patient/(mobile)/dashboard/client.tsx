'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoadingSkeleton, ErrorState, Card, Badge, ProgressBar, Button } from '@/lib/ui/mobile-v2'
import { ContentTilesGrid } from '../components'
import { useDashboardData } from '@/lib/hooks/useDashboardData'
import { useAppFocus } from '@/lib/hooks/useAppFocus'
import { useDesignTokens } from '@/lib/contexts/DesignTokensContext'
import { supabase } from '@/lib/supabaseClient'
import DashboardHero from './DashboardHero'

/**
 * Patient Dashboard Client Component (E6.5.4 + E6.5.9)
 * E73.9: Enhanced with dynamic design tokens from Studio
 * 
 * Enhanced dashboard layout with sections:
 * - Header with greeting (AC: empty states)
 * - AI assistant slot (placeholder for E6.6)
 * - Next Step card (AC3: always visible when available)
 * - Content tiles grid
 * - Progress summary (funnels/workup)
 * 
 * E6.5.4 Acceptance Criteria:
 * - AC1: Empty states render gracefully (no crashes)
 * - AC2: Mobile responsive (shell)
 * - AC3: NextStep CTA always visible when available
 * 
 * E6.5.9 Acceptance Criteria:
 * - AC1: After completing funnel, dashboard reflects new status without hard reload
 * - AC2: Offline/failed fetch shows error state + retry (not blank)
 * 
 * E73.9 Acceptance Criteria:
 * - Studio edit → save tokens
 * - Patient reload shows changes
 * - Dashboard: at least 1 visible effect (primary color theming)
 * 
 * Refresh Strategy:
 * - Auto-refresh on app focus (mobile-friendly)
 * - Refresh after funnel completion (via ?refresh=funnel)
 * - Refresh after follow-up answered (via ?refresh=followup)
 * - Stale-while-revalidate pattern (shows old data while fetching new)
 */
export default function DashboardClient({
  contentTilesSlot,
}: {
  contentTilesSlot?: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [greetingName, setGreetingName] = useState<string | undefined>(undefined)
  
  // E73.9: Get dynamic design tokens from context
  const tokens = useDesignTokens()
  
  // E6.5.9: Use dashboard data hook with stale-while-revalidate
  const { data: dashboardData, state, error, isStale, refresh, retry } = useDashboardData()

  useEffect(() => {
    let active = true

    const loadUserName = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!active) return

        const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
        const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : null
        const givenName = typeof metadata.given_name === 'string' ? metadata.given_name : null
        const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : null
        const displayName = typeof metadata.display_name === 'string' ? metadata.display_name : null
        const name = firstName || givenName || fullName || displayName || undefined

        setGreetingName(name)
      } catch {
        if (!active) return
        setGreetingName(undefined)
      }
    }

    loadUserName()
    return () => {
      active = false
    }
  }, [])

  // E6.5.9: Auto-refresh on app focus (mobile-friendly)
  useAppFocus(() => {
    refresh()
  })

  // E6.5.9: Refresh when returning from funnel completion or follow-up
  // E6.6.5: Handle scroll-to-content from triage router
  useEffect(() => {
    const refreshTrigger = searchParams.get('refresh')
    const scrollTo = searchParams.get('scrollTo')
    const action = searchParams.get('action')
    
    if (refreshTrigger === 'funnel' || refreshTrigger === 'followup') {
      // Clear the query param to avoid repeated refreshes
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('refresh')
      router.replace(newUrl.pathname + newUrl.search, { scroll: false })
      
      // Trigger refresh
      refresh()
    }

    // E6.6.5: Handle scroll-to-content from triage SHOW_CONTENT action
    if (scrollTo === 'content') {
      // Scroll to content tiles after a short delay to allow render
      setTimeout(() => {
        const contentElement = document.getElementById('content-tiles')
        if (contentElement) {
          contentElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)

      // Clear the query param
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('scrollTo')
      router.replace(newUrl.pathname + newUrl.search, { scroll: false })
    }

    // E6.6.5: Handle resume action from triage RESUME_FUNNEL
    if (action === 'resume' && dashboardData?.nextStep?.target) {
      // Auto-navigate to resume target
      setTimeout(() => {
        router.push(dashboardData.nextStep.target!)
      }, 500)

      // Clear the query param
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('action')
      router.replace(newUrl.pathname + newUrl.search, { scroll: false })
    }
  }, [searchParams, router, refresh, dashboardData])

  const handleFunnelClick = (funnel: any) => {
    router.push(`/patient/assess/${funnel.slug}/flow`)
  }

  const handleTileClick = (tile: any) => {
    if (tile.actionTarget) {
      router.push(tile.actionTarget)
    }
  }

  const handleAmyChat = () => {
    router.push('/patient/dialog')
  }


  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-sky-50 via-slate-50 to-slate-100 transition-colors duration-150">
      <main
        className="flex-1 overflow-y-auto px-4 pt-4 sm:pt-6"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <div className="w-full space-y-6">
          {/* New Greeting + AI Assistant Card */}
          <DashboardHero greetingName={greetingName} onChat={handleAmyChat} />

          {/* E6.5.9: Loading state - show spinner only on initial load */}
          {state === 'loading' && !dashboardData && (
            <div className="py-12">
              <LoadingSkeleton variant="card" count={3} />
            </div>
          )}

          {/* E6.5.9: Revalidating state - show subtle indicator while keeping content visible */}
          {/* E73.9: Use primary color from design tokens */}
          {state === 'revalidating' && isStale && dashboardData && (
            <div 
              className="border rounded-lg px-4 py-2 text-sm"
              style={{ 
                backgroundColor: tokens.colors?.primary?.[50] || '#f0f9ff',
                borderColor: tokens.colors?.primary?.[200] || '#bae6fd',
                color: tokens.colors?.primary?.[700] || '#0369a1'
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full"
                  style={{ borderColor: tokens.colors?.primary?.[600] || '#0284c7' }}
                />
                <span>Aktualisiere Dashboard...</span>
              </div>
            </div>
          )}

          {/* E6.5.9 AC2: Error state with retry - not a blank screen */}
          {error && (
            <ErrorState
              title="Fehler beim Laden"
              message={error}
              onRetry={retry}
            />
          )}

          {/* E6.5.4 AC1: Dashboard content with empty states */}
          {/* E6.5.9: Show stale data during revalidation (stale-while-revalidate) */}
          {dashboardData && (
            <>
              {/* Ihre Assessments */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Ihre Assessments
                </h3>

                {dashboardData.funnelSummaries.length === 0 ? (
                  <Card padding="lg" className="rounded-lg">
                    <div className="text-center py-6">
                      <div className="text-4xl mb-3">📋</div>
                      <h4 className="text-base font-medium text-slate-900 mb-2">
                        Noch keine Assessments
                      </h4>
                      <p className="text-sm text-slate-600">
                        Starten Sie Ihr erstes Assessment, um Ihren Fortschritt zu verfolgen.
                      </p>
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => router.push('/patient/assess')}
                        >
                          Assessment starten
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.funnelSummaries.map((funnel) => (
                      <Card
                        key={funnel.slug}
                        padding="md"
                        className="rounded-lg"
                        hover={funnel.status === 'in_progress'}
                        onClick={() => {
                          if (funnel.status === 'in_progress') {
                            handleFunnelClick(funnel)
                          }
                        }}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 mb-1">
                                {funnel.title}
                              </h4>
                              {funnel.description && (
                                <p className="text-sm text-slate-600 line-clamp-2">
                                  {funnel.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={
                                funnel.status === 'completed'
                                  ? 'success'
                                  : funnel.status === 'in_progress'
                                    ? 'warning'
                                    : 'neutral'
                              }
                              size="sm"
                            >
                              {funnel.status === 'completed'
                                ? 'Abgeschlossen'
                                : funnel.status === 'in_progress'
                                  ? 'In Bearbeitung'
                                  : 'Nicht begonnen'}
                            </Badge>
                          </div>

                          {funnel.progress && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>Fortschritt</span>
                                <span>
                                  {funnel.progress.current} / {funnel.progress.total}
                                </span>
                              </div>
                              <ProgressBar
                                value={(funnel.progress.current / funnel.progress.total) * 100}
                                color="primary"
                                showLabel={false}
                                size="sm"
                              />
                            </div>
                          )}

                          {funnel.completedAt && (
                            <p className="text-xs text-slate-500">
                              Abgeschlossen am {new Date(funnel.completedAt).toLocaleDateString('de-DE')}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Tiles Grid - E6.6.5: Add id for scroll-to navigation */}
              <div id="content-tiles">
                {contentTilesSlot ?? (
                  <ContentTilesGrid
                    tiles={dashboardData.contentTiles}
                    onTileClick={handleTileClick}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>

    </div>
  )
}
