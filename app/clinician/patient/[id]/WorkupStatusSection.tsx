'use client'

import { Card } from '@/lib/ui'

type WorkupStatus = 'needs_more_data' | 'ready_for_review' | null

type WorkupStatusSectionProps = {
  workupStatus: WorkupStatus
  missingDataFields?: string[]
  assessmentId: string
}

/**
 * WorkupStatusSection Component
 * 
 * E6.4.4: Displays workup status for clinician/admin view.
 * Shows consistent status values with patient view, plus missing data indicators.
 */
export function WorkupStatusSection({
  workupStatus,
  missingDataFields = [],
  assessmentId,
}: WorkupStatusSectionProps) {
  if (!workupStatus) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Workup-Status noch nicht festgelegt
          </p>
        </div>
      </Card>
    )
  }

  const isNeedsMoreData = workupStatus === 'needs_more_data'
  const statusConfig = isNeedsMoreData
    ? {
        icon: '📋',
        title: 'Weitere Daten erforderlich',
        description: 'Patient muss zusätzliche Informationen bereitstellen.',
        badgeText: 'Daten ergänzen',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
      }
    : {
        icon: '✅',
        title: 'Bereit zur Auswertung',
        description: 'Alle erforderlichen Daten liegen vor.',
        badgeText: 'Vollständig',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
      }

  return (
    <Card padding="lg" shadow="md" border className={`${statusConfig.borderColor}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl flex-shrink-0">{statusConfig.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
              {statusConfig.title}
            </h3>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${statusConfig.badgeColor}`}
            >
              {statusConfig.badgeText}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{statusConfig.description}</p>
        </div>
      </div>

      {/* Missing Data List */}
      {isNeedsMoreData && missingDataFields.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Fehlende Datenfelder:
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {missingDataFields.map((field, index) => (
              <li
                key={index}
                className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                  {field}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assessment ID Reference */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Assessment ID: <code className="text-xs">{assessmentId}</code>
        </p>
      </div>
    </Card>
  )
}
