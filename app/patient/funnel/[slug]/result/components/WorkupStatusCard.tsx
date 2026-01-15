'use client'

import { Card } from '@/lib/ui'
import { typography } from '@/lib/design-tokens'

type WorkupStatus = 'needs_more_data' | 'ready_for_review' | null

type WorkupStatusCardProps = {
  status: WorkupStatus
  missingDataFields?: string[]
}

/**
 * WorkupStatusCard Component
 * 
 * E6.4.4: Displays workup status and missing data information for patients.
 * Shows clear next steps without exposing medical diagnoses.
 */
export function WorkupStatusCard({ status, missingDataFields = [] }: WorkupStatusCardProps) {
  if (!status) return null

  const isNeedsMoreData = status === 'needs_more_data'
  const statusConfig = isNeedsMoreData
    ? {
        icon: '📋',
        title: 'Weitere Angaben erforderlich',
        description:
          'Um Ihre Betreuung optimal zu gestalten, benötigen wir noch einige zusätzliche Informationen.',
        bgColor: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        statusLabel: 'Daten ergänzen',
        statusColor: 'text-amber-700 dark:text-amber-400',
      }
    : {
        icon: '✅',
        title: 'Assessment vollständig',
        description:
          'Ihre Angaben sind vollständig und werden für die weitere Betreuung verwendet.',
        bgColor: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        statusLabel: 'Bereit zur Auswertung',
        statusColor: 'text-emerald-700 dark:text-emerald-400',
      }

  return (
    <Card
      padding="lg"
      radius="xl"
      shadow="md"
      border
      className={`bg-gradient-to-br ${statusConfig.bgColor} ${statusConfig.borderColor}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl flex-shrink-0">{statusConfig.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100"
              style={{ lineHeight: typography.lineHeight.tight }}
            >
              {statusConfig.title}
            </h3>
            <span
              className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-full ${statusConfig.statusColor} bg-white dark:bg-slate-800`}
            >
              {statusConfig.statusLabel}
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
            {statusConfig.description}
          </p>
        </div>
      </div>

      {/* Missing Data List */}
      {isNeedsMoreData && missingDataFields.length > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
          <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Fehlende Informationen:
          </h4>
          <ul className="space-y-1">
            {missingDataFields.map((field, index) => (
              <li
                key={index}
                className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>{formatFieldName(field)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

/**
 * Format field names for display
 * Converts snake_case to readable German labels
 */
function formatFieldName(field: string): string {
  const fieldLabels: Record<string, string> = {
    sleep_quality: 'Schlafqualität',
    stress_triggers: 'Stressauslöser',
    daily_routine: 'Tagesablauf',
    exercise_frequency: 'Bewegungshäufigkeit',
    nutrition_habits: 'Ernährungsgewohnheiten',
    social_support: 'Soziale Unterstützung',
    work_stress: 'Arbeitsstress',
    family_history: 'Familienanamnese',
  }

  return fieldLabels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
