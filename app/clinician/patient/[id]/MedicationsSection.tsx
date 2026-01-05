/**
 * MedicationsSection Component
 * 
 * Presentational component (props-in, render-out) for displaying medications.
 * Data source: documents.extracted_json.medications (populated by V05-I04.2 extraction pipeline)
 * 
 * Fail-closed behavior:
 * - Shows empty state when medications is empty array
 * - Shows loading state when loading prop is true
 * - No mock/fantasy data - only renders what is passed via props
 */

import { Card, Badge } from '@/lib/ui'
import { Pill } from 'lucide-react'
import type { Medication } from '@/lib/types/extraction'

export interface MedicationsSectionProps {
  /** Array of medications from extracted document data */
  medications: Medication[]
  /** Loading state */
  loading?: boolean
  /** Error evidence code (PHI-safe) - if present, shows data source error instead of empty state */
  errorEvidenceCode?: string
}

/**
 * Displays patient medications
 */
export function MedicationsSection({ medications, loading, errorEvidenceCode }: MedicationsSectionProps) {
  if (loading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Medikamente
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Medikamentendaten werden geladen…
        </p>
      </Card>
    )
  }

  // Show error state if data source is unavailable
  if (errorEvidenceCode) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Medikamente
          </h2>
        </div>
        <div className="text-center py-6">
          <Pill className="w-8 h-8 text-amber-300 dark:text-amber-600 mx-auto mb-3" />
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

  if (medications.length === 0) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Medikamente
          </h2>
        </div>
        <div className="text-center py-6">
          <Pill className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keine Medikamentendaten verfügbar
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center gap-2 mb-4">
        <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
          Medikamente
        </h2>
      </div>

      <div className="space-y-3">
        {medications.map((med, index) => (
          <div
            key={index}
            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {med.name}
              </h3>
              {med.dosage && (
                <Badge variant="secondary" size="sm">
                  {med.dosage}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
              {med.frequency && (
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Häufigkeit:</span>
                  <span>{med.frequency}</span>
                </span>
              )}
              {med.route && (
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Route:</span>
                  <span>{med.route}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
