/**
 * FindingsScoresSection Component
 * 
 * Displays funnel-specific findings and comprehensive scores from safety checks and reports.
 * Shows safety scores, findings counts, and risk-related information.
 */

import { Card, Badge } from '@/lib/ui'
import { AlertTriangle, CheckCircle2, Shield, TrendingUp } from 'lucide-react'

export interface SafetyFinding {
  severity?: string
  category?: string
  description?: string
}

export interface FindingsScoresSectionProps {
  /** Safety score from report (0-100) */
  safetyScore?: number | null
  /** Safety findings from report */
  safetyFindings?: Record<string, unknown> | null
  /** Calculated scores from calculated_results table */
  calculatedScores?: Record<string, unknown> | null
  /** Risk models from calculated_results table */
  riskModels?: Record<string, unknown> | null
  /** Loading state */
  loading?: boolean
}

/**
 * Get badge variant based on safety score
 */
function getSafetyScoreBadge(score: number): {
  variant: 'danger' | 'warning' | 'success'
  label: string
} {
  if (score >= 80) {
    return { variant: 'success', label: 'Gut' }
  } else if (score >= 60) {
    return { variant: 'warning', label: 'Mittel' }
  } else {
    return { variant: 'danger', label: 'Niedrig' }
  }
}

/**
 * Extract findings count from safety findings object
 */
function extractFindingsInfo(findings: Record<string, unknown>): {
  total: number
  critical: number
  high: number
  medium: number
  low: number
} {
  const result = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  // Try to extract from various possible structures
  if (typeof findings === 'object' && findings !== null) {
    // Check for findings_count fields
    if ('findings_count' in findings && typeof findings.findings_count === 'number') {
      result.total = findings.findings_count
    }
    if ('critical_findings_count' in findings && typeof findings.critical_findings_count === 'number') {
      result.critical = findings.critical_findings_count
    }
    if ('high_findings_count' in findings && typeof findings.high_findings_count === 'number') {
      result.high = findings.high_findings_count
    }
    if ('medium_findings_count' in findings && typeof findings.medium_findings_count === 'number') {
      result.medium = findings.medium_findings_count
    }
    if ('low_findings_count' in findings && typeof findings.low_findings_count === 'number') {
      result.low = findings.low_findings_count
    }
  }

  return result
}

/**
 * Displays funnel-specific findings and scores
 */
export function FindingsScoresSection({
  safetyScore,
  safetyFindings,
  calculatedScores,
  riskModels,
  loading,
}: FindingsScoresSectionProps) {
  if (loading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Findings & Scores
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Daten werden geladen…</p>
      </Card>
    )
  }

  const hasData = safetyScore != null || calculatedScores || riskModels || safetyFindings

  if (!hasData) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Findings & Scores
          </h2>
        </div>
        <div className="text-center py-6">
          <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keine Findings oder Scores verfügbar
          </p>
        </div>
      </Card>
    )
  }

  const findingsInfo = safetyFindings ? extractFindingsInfo(safetyFindings) : null

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
          Findings & Scores
        </h2>
      </div>

      <div className="space-y-4">
        {/* Safety Score */}
        {safetyScore != null && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Safety Score
              </span>
              <Badge variant={getSafetyScoreBadge(safetyScore).variant}>
                {getSafetyScoreBadge(safetyScore).label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {safetyScore}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">/ 100</span>
            </div>
          </div>
        )}

        {/* Findings Summary */}
        {findingsInfo && findingsInfo.total > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Findings Übersicht
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {findingsInfo.critical > 0 && (
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <div className="text-xs text-red-600 dark:text-red-400">Kritisch</div>
                  <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                    {findingsInfo.critical}
                  </div>
                </div>
              )}
              {findingsInfo.high > 0 && (
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                  <div className="text-xs text-orange-600 dark:text-orange-400">Hoch</div>
                  <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                    {findingsInfo.high}
                  </div>
                </div>
              )}
              {findingsInfo.medium > 0 && (
                <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                  <div className="text-xs text-amber-600 dark:text-amber-400">Mittel</div>
                  <div className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                    {findingsInfo.medium}
                  </div>
                </div>
              )}
              {findingsInfo.low > 0 && (
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400">Niedrig</div>
                  <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                    {findingsInfo.low}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calculated Scores */}
        {calculatedScores && Object.keys(calculatedScores).length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Berechnete Scores
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(calculatedScores).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {typeof value === 'number' ? value : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Models Summary */}
        {riskModels && Object.keys(riskModels).length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Risk Models
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {Object.keys(riskModels).length} Modell(e) verfügbar
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
