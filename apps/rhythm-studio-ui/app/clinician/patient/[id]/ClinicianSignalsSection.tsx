/**
 * Clinician Signals Section (Issue 8)
 * 
 * Displays full signal data for clinician view
 * - Risk Level / Risk Category
 * - Signal Codes / Labels
 * - Priority Ranking
 * - Red Flags (with rationale)
 * - Clearly marked as "automatically generated"
 */

import { Card, Badge } from '@/lib/ui'
import { AlertTriangle, Activity, Flag, Info } from 'lucide-react'
import type { ClinicianSignal } from '@/lib/types/signals'

export interface ClinicianSignalsSectionProps {
  signal: ClinicianSignal | null
  loading?: boolean
}

/**
 * Get badge variant based on risk level
 */
function getRiskLevelBadge(riskLevel: string): {
  variant: 'danger' | 'warning' | 'success' | 'secondary'
  label: string
} {
  switch (riskLevel.toLowerCase()) {
    case 'high':
    case 'critical':
      return { variant: 'danger', label: 'Hoch' }
    case 'moderate':
      return { variant: 'warning', label: 'Moderat' }
    case 'low':
      return { variant: 'success', label: 'Niedrig' }
    default:
      return { variant: 'secondary', label: riskLevel }
  }
}

/**
 * Clinician Signals Section Component
 * Full transparency view for medical professionals
 */
export function ClinicianSignalsSection({ signal, loading }: ClinicianSignalsSectionProps) {
  if (loading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Signals (automatisch generiert)
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Daten werden geladen…</p>
      </Card>
    )
  }

  if (!signal) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Signals (automatisch generiert)
          </h2>
        </div>
        <div className="text-center py-6">
          <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keine Signals verfügbar
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg" shadow="md">
      {/* Header with automation notice */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Signals
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Automatisch generierte medizinische Hinweisinformation (nicht ärztlich validiert)
          </p>
        </div>
        {signal.generatedAt && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generiert: {new Date(signal.generatedAt).toLocaleString('de-DE')}
          </p>
        )}
        {signal.algorithmVersion && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Algorithmus-Version: {signal.algorithmVersion}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {/* Risk Level / Category */}
        {signal.riskLevel && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Risk Level / Risk Category
              </span>
              <Badge variant={getRiskLevelBadge(signal.riskLevel).variant}>
                {getRiskLevelBadge(signal.riskLevel).label}
              </Badge>
            </div>
            {signal.riskScore !== null && signal.riskScore !== undefined && (
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {signal.riskScore}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">/ 100</span>
              </div>
            )}
          </div>
        )}

        {/* Red Flags */}
        {signal.redFlags && signal.redFlags.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Red Flags ({signal.redFlags.length})
              </span>
            </div>
            <div className="space-y-2">
              {signal.redFlags.map((flag, idx) => (
                <div
                  key={`${flag.code}-${idx}`}
                  className="p-2 bg-white dark:bg-slate-900/40 rounded border border-red-100 dark:border-red-900"
                >
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono text-red-700 dark:text-red-300">
                      {flag.code}
                    </code>
                    {flag.severity && (
                      <Badge variant="danger" size="sm">
                        {flag.severity}
                      </Badge>
                    )}
                  </div>
                  {flag.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {flag.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signal Codes / Labels */}
        {signal.signalCodes && signal.signalCodes.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Signal Codes / Labels
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {signal.signalCodes.map((code, idx) => (
                <code
                  key={`${code}-${idx}`}
                  className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Priority Ranking */}
        {signal.priorityRanking && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Priority Ranking
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {signal.priorityRanking.tier && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tier:</span>
                  <Badge variant="secondary">{signal.priorityRanking.tier}</Badge>
                </div>
              )}
              {signal.priorityRanking.rank !== null && signal.priorityRanking.rank !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Rank:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {signal.priorityRanking.rank}
                  </span>
                </div>
              )}
              {signal.priorityRanking.interventions && Array.isArray(signal.priorityRanking.interventions) && signal.priorityRanking.interventions.length > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {signal.priorityRanking.interventions.length} Intervention(en) priorisiert
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
