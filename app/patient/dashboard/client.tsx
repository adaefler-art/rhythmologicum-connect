'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/app/components/MobileHeader'
import { LoadingSpinner, ErrorState } from '@/lib/ui'
import {
  DashboardHeader,
  AMYSlot,
  NextStepCard,
  ContentTilesGrid,
  ProgressSummary,
} from './components'
import type { DashboardViewModelV1 } from '@/lib/api/contracts/patient/dashboard'

/**
 * Patient Dashboard Client Component (E6.5.4)
 * 
 * Enhanced dashboard layout with sections:
 * - Header with greeting (AC: empty states)
 * - AMY slot (placeholder for E6.6)
 * - Next Step card (AC3: always visible when available)
 * - Content tiles grid
 * - Progress summary (funnels/workup)
 * 
 * Acceptance Criteria:
 * - AC1: Empty states render gracefully (no crashes)
 * - AC2: Mobile responsive (shell)
 * - AC3: NextStep CTA always visible when available
 */
export default function DashboardClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardViewModelV1 | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // E6.5.4: Fetch dashboard data from versioned API endpoint
        const response = await fetch('/api/patient/dashboard')
        
        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load dashboard')
        }

        setDashboardData(result.data)
      } catch (err) {
        console.error('[dashboard] Error loading data:', err)
        setError('Dashboard konnte nicht geladen werden.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

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
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* E6.5.4 AC1: Loading state renders gracefully */}
          {loading && (
            <div className="py-12">
              <LoadingSpinner size="lg" text="Dashboard wird geladen..." centered />
            </div>
          )}

          {/* E6.5.4 AC1: Error state renders gracefully */}
          {error && (
            <ErrorState
              title="Fehler beim Laden"
              message={error}
              onRetry={handleRetry}
              centered
            />
          )}

          {/* E6.5.4 AC1: Dashboard content with empty states */}
          {!loading && !error && dashboardData && (
            <>
              {/* Header Section */}
              <DashboardHeader />

              {/* AMY Slot - Placeholder for E6.6 */}
              <AMYSlot />

              {/* E6.5.4 AC3: Next Step Card - Always visible when available */}
              {dashboardData.nextStep && (
                <NextStepCard
                  nextStep={dashboardData.nextStep}
                  onAction={handleNextStepAction}
                />
              )}

              {/* Content Tiles Grid */}
              <ContentTilesGrid
                tiles={dashboardData.contentTiles}
                onTileClick={handleTileClick}
              />

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
