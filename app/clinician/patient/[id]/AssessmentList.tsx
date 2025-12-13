/**
 * AssessmentList Component
 * 
 * Displays a list of patient assessments/measures in chronological order.
 * Part of the Patient Detail Page in the Clinician Dashboard.
 */

import { Badge, Card } from '@/lib/ui'
import { Calendar, Activity, FileText } from 'lucide-react'

export interface Assessment {
  id: string
  created_at: string
  stress_score: number | null
  sleep_score: number | null
  risk_level: string
  report_id: string | null
  reports?: {
    report_text_short: string
  } | null
}

export interface AssessmentListProps {
  /** Array of assessments to display */
  assessments: Assessment[]
  /** Handler for viewing assessment details */
  onViewDetails?: (assessmentId: string) => void
}

/**
 * Formats ISO date string to German locale
 */
function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString))
  } catch {
    return 'Datum unbekannt'
  }
}

/**
 * Gets the appropriate badge variant for a risk level
 */
function getRiskBadgeVariant(risk: string): 'danger' | 'warning' | 'success' | 'secondary' {
  switch (risk) {
    case 'high':
      return 'danger'
    case 'moderate':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'secondary'
  }
}

/**
 * Gets the German label for a risk level
 */
function getRiskLabel(risk: string): string {
  switch (risk) {
    case 'high':
      return 'Hoch'
    case 'moderate':
      return 'Mittel'
    case 'low':
      return 'Niedrig'
    case 'pending':
      return 'Ausstehend'
    default:
      return 'Unbekannt'
  }
}

/**
 * List component for displaying patient assessments
 */
export function AssessmentList({ assessments, onViewDetails }: AssessmentListProps) {
  if (assessments.length === 0) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <p className="text-6xl mb-4" aria-label="Beruhigendes Symbol">
            🌿
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Noch keine Assessments vorhanden
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Für diese:n Patient:in wurden noch keine Assessments durchgeführt.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {assessments.map((assessment) => (
        <Card
          key={assessment.id}
          padding="lg"
          shadow="md"
          interactive={!!onViewDetails}
          onClick={onViewDetails ? () => onViewDetails(assessment.id) : undefined}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left: Assessment Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(assessment.created_at)}</span>
                <Badge variant={getRiskBadgeVariant(assessment.risk_level)} size="sm">
                  {getRiskLabel(assessment.risk_level)}
                </Badge>
              </div>

              {/* Scores */}
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Stress: {assessment.stress_score !== null ? assessment.stress_score : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Schlaf: {assessment.sleep_score !== null ? assessment.sleep_score : '—'}
                  </span>
                </div>
              </div>

              {/* Report Preview */}
              {assessment.reports?.report_text_short && (
                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {assessment.reports.report_text_short}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Action hint */}
            {onViewDetails && (
              <div className="flex items-center text-sky-600 text-sm font-medium">
                Details →
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
