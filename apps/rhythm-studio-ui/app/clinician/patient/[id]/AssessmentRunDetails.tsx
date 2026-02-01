/**
 * E74.8 — AssessmentRunDetails Component
 * 
 * Displays comprehensive assessment run details including:
 * - Assessment metadata and status
 * - Timeline of all answers with their questions
 * - Result summary (scores, risk levels)
 * - Report preview
 */

'use client'

import { useState, useEffect } from 'react'
import { Badge, Card, Button } from '@/lib/ui'
import { Calendar, Activity, FileText, ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react'

export interface AssessmentAnswer {
  id: string
  questionId: string
  questionText: string
  questionType: string | null
  answerValue: number
  answerData: unknown
  createdAt: string
}

export interface AssessmentDetails {
  assessment: {
    id: string
    patientId: string
    funnelSlug: string | null
    funnelName: string
    status: string
    startedAt: string
    completedAt: string | null
  }
  answers: AssessmentAnswer[]
  result: {
    scores: Record<string, unknown>
    riskModels: Record<string, unknown> | null
    algorithmVersion: string
    computedAt: string
  } | null
  report: {
    scoreNumeric: number
    sleepScore: number
    riskLevel: string
    reportTextShort: string
  } | null
}

interface AssessmentRunDetailsProps {
  assessmentId: string
  onClose?: () => void
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
    default:
      return 'Unbekannt'
  }
}

/**
 * Gets the German label for assessment status
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Abgeschlossen'
    case 'in_progress':
      return 'In Bearbeitung'
    default:
      return status
  }
}

/**
 * Formats answer value for display
 */
function formatAnswerValue(answer: AssessmentAnswer): string {
  // If answerData exists and has a value, use that
  if (answer.answerData !== null && answer.answerData !== undefined) {
    if (typeof answer.answerData === 'object' && answer.answerData !== null) {
      const dataObj = answer.answerData as Record<string, unknown>
      if (dataObj.value !== undefined) {
        return String(dataObj.value)
      }
    }
    if (typeof answer.answerData === 'string' || typeof answer.answerData === 'number') {
      return String(answer.answerData)
    }
  }
  // Otherwise use answerValue
  return String(answer.answerValue)
}

export function AssessmentRunDetails({ assessmentId, onClose }: AssessmentRunDetailsProps) {
  const [details, setDetails] = useState<AssessmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllAnswers, setShowAllAnswers] = useState(false)

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/clinician/assessments/${assessmentId}/details`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || 'Fehler beim Laden der Details')
        }

        setDetails(data.data)
      } catch (err) {
        console.error('[AssessmentRunDetails] Error fetching details:', err)
        setError(err instanceof Error ? err.message : 'Unerwarteter Fehler')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [assessmentId])

  if (loading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="w-8 h-8 text-slate-400 dark:text-slate-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Lade Details...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <p className="text-6xl mb-4" aria-label="Fehler">
            ⚠️
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Fehler beim Laden
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{error}</p>
          {onClose && (
            <Button onClick={onClose} variant="secondary">
              Schließen
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (!details) {
    return null
  }

  const { assessment, answers, result, report } = details
  const displayedAnswers = showAllAnswers ? answers : answers.slice(0, 5)
  const hasMoreAnswers = answers.length > 5

  return (
    <div className="space-y-6">
      {/* Assessment Header */}
      <Card padding="lg" shadow="md">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                {assessment.funnelName}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={assessment.status === 'completed' ? 'success' : 'secondary'} size="sm">
                  {getStatusLabel(assessment.status)}
                </Badge>
                {report && (
                  <Badge variant={getRiskBadgeVariant(report.riskLevel)} size="sm">
                    Risiko: {getRiskLabel(report.riskLevel)}
                  </Badge>
                )}
              </div>
            </div>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                Schließen
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="text-slate-600 dark:text-slate-300">
                Gestartet: {formatDate(assessment.startedAt)}
              </span>
            </div>
            {assessment.completedAt && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-slate-600 dark:text-slate-300">
                  Abgeschlossen: {formatDate(assessment.completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Result Summary */}
      {(result || report) && (
        <Card padding="lg" shadow="md">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Ergebnis-Zusammenfassung
          </h3>
          
          <div className="space-y-4">
            {/* Scores */}
            {report && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Stress-Score: {report.scoreNumeric ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Schlaf-Score: {report.sleepScore ?? '—'}
                  </span>
                </div>
              </div>
            )}

            {/* Report Summary */}
            {report?.reportTextShort && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {report.reportTextShort}
                  </p>
                </div>
              </div>
            )}

            {/* Algorithm Version */}
            {result && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Algorithmus-Version: {result.algorithmVersion}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Answers Timeline */}
      <Card padding="lg" shadow="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Antworten ({answers.length})
          </h3>
        </div>

        {answers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Keine Antworten vorhanden
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedAnswers.map((answer, index) => (
                <div
                  key={answer.id}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                        {answer.questionText}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Antwort: <span className="font-semibold">{formatAnswerValue(answer)}</span>
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(answer.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {hasMoreAnswers && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => setShowAllAnswers(!showAllAnswers)}
                  variant="ghost"
                  size="sm"
                >
                  {showAllAnswers ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Weniger anzeigen
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Alle {answers.length} Antworten anzeigen
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
