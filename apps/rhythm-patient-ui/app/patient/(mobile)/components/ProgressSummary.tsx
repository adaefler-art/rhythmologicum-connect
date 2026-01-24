'use client'

import { useRouter } from 'next/navigation'
import { Card, Badge, ProgressBar, Button } from '@/lib/ui/mobile-v2'
import type { FunnelSummary, WorkupSummary } from '@/lib/api/contracts/patient/dashboard'

export interface ProgressSummaryProps {
  /** Array of funnel summaries from dashboard API */
  funnelSummaries: FunnelSummary[]
  /** Workup summary from dashboard API */
  workupSummary: WorkupSummary
  /** Callback when a funnel is clicked */
  onFunnelClick?: (funnel: FunnelSummary) => void
}

/**
 * Progress Summary Component
 * 
 * Displays patient's progress across funnels and workup status.
 * Part of E6.5.4 implementation.
 * 
 * Features:
 * - Funnel progress visualization
 * - Workup status summary
 * - Empty state handling
 * - Responsive design
 * - Light mode only (Mobile v2)
 * - Interactive funnel cards
 * 
 * @example
 * <ProgressSummary
 *   funnelSummaries={[...]}
 *   workupSummary={{ state: 'no_data', counts: {...} }}
 *   onFunnelClick={handleFunnelClick}
 * />
 */
export function ProgressSummary({
  funnelSummaries,
  workupSummary,
  onFunnelClick,
}: ProgressSummaryProps) {
  const router = useRouter()
  // Status badge mapping
  const statusVariants = {
    not_started: 'neutral' as const,
    in_progress: 'warning' as const,
    completed: 'success' as const,
  }

  const statusLabels = {
    not_started: 'Nicht begonnen',
    in_progress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
  }

  // Workup state mapping
  const workupStateLabels = {
    no_data: 'Keine Daten',
    needs_more_data: 'Weitere Daten erforderlich',
    ready_for_review: 'Bereit zur Überprüfung',
  }

  const workupStateColors = {
    no_data: 'text-slate-600',
    needs_more_data: 'text-amber-600',
    ready_for_review: 'text-green-600',
  }

  return (
    <div className="space-y-6">
      {/* Funnel Progress Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Ihre Assessments
        </h3>

        {funnelSummaries.length === 0 ? (
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
            {funnelSummaries.map((funnel) => (
              <Card
                key={funnel.slug}
                padding="md"
                className="rounded-lg"
                hover={funnel.status === 'in_progress'}
                onClick={() => {
                  if (funnel.status === 'in_progress' && onFunnelClick) {
                    onFunnelClick(funnel)
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
                    <Badge variant={statusVariants[funnel.status]} size="sm">
                      {statusLabels[funnel.status]}
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

      {/* Workup Status Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Workup-Status
        </h3>
        <Card padding="md" className="rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Status:
              </span>
              <span className={`text-sm font-semibold ${workupStateColors[workupSummary.state]}`}>
                {workupStateLabels[workupSummary.state]}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {workupSummary.counts.total}
                </div>
                <div className="text-xs text-slate-600 mt-1">Gesamt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {workupSummary.counts.needsMoreData}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Weitere Daten
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {workupSummary.counts.readyForReview}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Bereit
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ProgressSummary
