/**
 * InterventionsSection Component
 * 
 * Displays top priority interventions from the ranking algorithm.
 * Shows intervention topics with impact, feasibility, and priority scores.
 */

import { Card, Badge } from '@/lib/ui'
import { Target, TrendingUp, Zap } from 'lucide-react'

export interface RankedIntervention {
  rank: number
  topicId: string
  topicLabel: string
  pillar?: string
  impactScore: number
  feasibilityScore: number
  priorityScore: number
  signals?: string[]
}

export interface InterventionsSectionProps {
  /** Top ranked interventions from priority ranking */
  interventions: RankedIntervention[]
  /** Loading state */
  loading?: boolean
}

/**
 * Get badge color based on priority score
 */
function getPriorityBadge(score: number): {
  variant: 'danger' | 'warning' | 'success' | 'info'
  label: string
} {
  if (score >= 80) {
    return { variant: 'danger', label: 'Sehr hoch' }
  } else if (score >= 60) {
    return { variant: 'warning', label: 'Hoch' }
  } else if (score >= 40) {
    return { variant: 'info', label: 'Mittel' }
  } else {
    return { variant: 'success', label: 'Niedrig' }
  }
}

/**
 * Displays priority-ranked interventions
 */
export function InterventionsSection({ interventions, loading }: InterventionsSectionProps) {
  if (loading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Empfohlene Interventionen
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Interventionen werden geladen…
        </p>
      </Card>
    )
  }

  if (interventions.length === 0) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Empfohlene Interventionen
          </h2>
        </div>
        <div className="text-center py-6">
          <Target className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keine Interventionen verfügbar
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
          Empfohlene Interventionen
        </h2>
      </div>

      <div className="space-y-3">
        {interventions.map((intervention) => {
          const priorityBadge = getPriorityBadge(intervention.priorityScore)

          return (
            <div
              key={intervention.rank}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-800 transition-colors"
            >
              {/* Header: Rank and Priority */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-bold">
                    {intervention.rank}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {intervention.topicLabel}
                  </h3>
                </div>
                <Badge variant={priorityBadge.variant} size="sm">
                  {priorityBadge.label}
                </Badge>
              </div>

              {/* Pillar */}
              {intervention.pillar && (
                <div className="mb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Säule: {intervention.pillar}
                  </span>
                </div>
              )}

              {/* Scores Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-white dark:bg-slate-900/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Priorität</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {intervention.priorityScore}
                  </span>
                </div>

                <div className="text-center p-2 bg-white dark:bg-slate-900/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Impact</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {intervention.impactScore}
                  </span>
                </div>

                <div className="text-center p-2 bg-white dark:bg-slate-900/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Umsetzbar</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {intervention.feasibilityScore}
                  </span>
                </div>
              </div>

              {/* Signals */}
              {intervention.signals && intervention.signals.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {intervention.signals.slice(0, 3).map((signal, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                    >
                      {signal}
                    </span>
                  ))}
                  {intervention.signals.length > 3 && (
                    <span className="inline-block px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                      +{intervention.signals.length - 3} mehr
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
