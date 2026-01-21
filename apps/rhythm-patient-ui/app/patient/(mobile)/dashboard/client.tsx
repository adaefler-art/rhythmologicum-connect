'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MobileHeader from '@/app/components/MobileHeader'
import { LoadingSpinner, ErrorState } from '@/lib/ui'
import {
  DashboardHeader,
  AMYComposer,
  NextStepCard,
  ContentTilesGrid,
  ProgressSummary,
} from '../components'
import { useDashboardData } from '@/lib/hooks/useDashboardData'
import { useAppFocus } from '@/lib/hooks/useAppFocus'

/**
 * Patient Dashboard Client Component (E6.5.4 + E6.5.9)
 * 
 * Enhanced dashboard layout with sections:
 * - Header with greeting (AC: empty states)
 * - AMY slot (placeholder for E6.6)
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
 * Refresh Strategy:
 * - Auto-refresh on app focus (mobile-friendly)
 * - Refresh after funnel completion (via ?refresh=funnel)
 * - Refresh after follow-up answered (via ?refresh=followup)
 * - Stale-while-revalidate pattern (shows old data while fetching new)
 */
export default function DashboardClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // E6.5.9: Use dashboard data hook with stale-while-revalidate
  const { data: dashboardData, state, error, isStale, refresh, retry } = useDashboardData()

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

  const handleNextStepAction = () => {
    if (dashboardData?.nextStep?.target) {
      router.push(dashboardData.nextStep.target)
    }
  }

  const handleFunnelClick = (funnel: any) => {
    router.push(`/patient/funnel/${funnel.slug}`)
  }

  const handleTileClick = (tile: any) => {
    if (tile.actionTarget) {
      router.push(tile.actionTarget)
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 transition-colors duration-150">
      <MobileHeader
        variant="with-title"
        title="Dashboard"
        subtitle="Rhythmologicum Connect"
        showBack={false}
      />

      <main
        className="flex-1 overflow-y-auto px-4 pt-4 sm:pt-6"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <div className="w-full space-y-6">
          {/* E6.5.9: Loading state - show spinner only on initial load */}
          {state === 'loading' && !dashboardData && (
            <div className="py-12">
              <LoadingSpinner size="lg" text="Dashboard wird geladen..." centered />
            </div>
          )}

          {/* E6.5.9: Revalidating state - show subtle indicator while keeping content visible */}
          {state === 'revalidating' && isStale && dashboardData && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-2 text-sm text-sky-700">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-sky-600 border-t-transparent rounded-full" />
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
              centered={!dashboardData}
            />
          )}

          {/* E6.5.4 AC1: Dashboard content with empty states */}
          {/* E6.5.9: Show stale data during revalidation (stale-while-revalidate) */}
          {dashboardData && (
            <>
              {/* Header Section */}
              <DashboardHeader />

              {/* E6.6.1: AMY Composer - Guided Mode for bounded input */}
              <AMYComposer />

              {/* E6.5.4 AC3: Next Step Card - Always visible when available */}
              {dashboardData.nextStep && (
                <NextStepCard
                  nextStep={dashboardData.nextStep}
                  onAction={handleNextStepAction}
                />
              )}

              {/* Content Tiles Grid - E6.6.5: Add id for scroll-to navigation */}
              <div id="content-tiles">
                <ContentTilesGrid
                  tiles={dashboardData.contentTiles}
                  onTileClick={handleTileClick}
                />
              </div>

              {/* Progress Summary */}
              <ProgressSummary
                funnelSummaries={dashboardData.funnelSummaries}
                workupSummary={dashboardData.workupSummary}
                onFunnelClick={handleFunnelClick}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
