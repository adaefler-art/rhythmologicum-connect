/**
 * KeyLabsSection Component
 * 
 * Presentational component (props-in, render-out) for displaying laboratory values.
 * Data source: documents.extracted_json.lab_values (populated by V05-I04.2 extraction pipeline)
 * 
 * Fail-closed behavior:
 * - Shows empty state when labValues is empty array
 * - Shows loading state when loading prop is true
 * - No mock/fantasy data - only renders what is passed via props
 */

import { Card } from '@/lib/ui'
import { FlaskConical, TrendingUp, Calendar } from 'lucide-react'
import type { LabValue } from '@/lib/types/extraction'

export interface KeyLabsSectionProps {
  /** Array of lab values from extracted document data */
  labValues: LabValue[]
  /** Loading state */
  loading?: boolean
  /** Error evidence code (PHI-safe) - if present, shows data source error instead of empty state */
  errorEvidenceCode?: string
}

/**
 * Formats a lab value for display
 */
function formatLabValue(value: number | string): string {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return String(value)
}

/**
 * Displays key laboratory values
 */
export function KeyLabsSection({ labValues, loading, errorEvidenceCode }: KeyLabsSectionProps) {
  if (loading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Key Labs
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Labordaten werden geladen…</p>
      </Card>
    )
  }

  // Show error state if data source is unavailable
  if (errorEvidenceCode) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Key Labs
          </h2>
        </div>
        <div className="text-center py-6">
          <FlaskConical className="w-8 h-8 text-amber-300 dark:text-amber-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Datenquelle aktuell nicht verfügbar
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            EVIDENCE: {errorEvidenceCode}
          </p>
        </div>
      </Card>
    )
  }

  if (labValues.length === 0) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Key Labs
          </h2>
        </div>
        <div className="text-center py-6">
          <FlaskConical className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keine Labordaten verfügbar
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
          Key Labs
        </h2>
      </div>

      <div className="space-y-3">
        {labValues.map((lab, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"
          >
            {/* Left: Test name and value */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  {lab.test_name}
                </span>
              </div>
              <div className="flex items-baseline gap-2 pl-6">
                <span className="text-lg font-semibold text-sky-600 dark:text-sky-400">
                  {formatLabValue(lab.value)}
                </span>
                {lab.unit && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">{lab.unit}</span>
                )}
              </div>
            </div>

            {/* Right: Reference range and date */}
            <div className="flex flex-col items-start sm:items-end gap-1 sm:pl-4">
              {lab.reference_range && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ref: {lab.reference_range}
                </span>
              )}
              {lab.date && (
                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{lab.date}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
