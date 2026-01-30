'use client'


import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, ErrorState } from '@/lib/ui/mobile-v2'
import { useAssessmentResult } from '@/lib/hooks/useAssessmentResult'

interface ResultsV2ClientProps {
  slug: string
  assessmentId: string
}

export default function ResultsV2Client({ slug, assessmentId }: ResultsV2ClientProps) {
  const router = useRouter()
  const {
    data: runtimeResult,
    isLoading,
    error,
    errorObj,
    isPolling,
    pollTimedOut,
    refetch,
  } = useAssessmentResult({
    slug,
    assessmentId,
    enabled: true,
    pollOnConflict: true, // Enable polling for in_progress assessments
    pollInterval: 2000,
    pollTimeout: 30000,
  })

  // Polling or loading - show preparing UI
  if (isLoading || isPolling) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex flex-col items-center justify-center">
        <Card padding="lg" shadow="md" className="mb-6 text-center">
          <div className="space-y-4">
            <div className="animate-pulse flex justify-center">
              <div className="size-16 bg-[#4a90e2] rounded-full flex items-center justify-center mb-4">
                <svg className="size-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#1f2937]">
              {isPolling ? 'Ergebnis wird vorbereitet…' : 'Lade Ergebnis…'}
            </h2>
            <p className="text-[#6b7280]">Bitte warten Sie einen Moment.</p>
          </div>
        </Card>
      </div>
    )
  }

  // Polling timed out
  if (pollTimedOut) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex flex-col items-center justify-center">
        <Card padding="lg" shadow="md" className="mb-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1f2937]">Ergebnis wird noch verarbeitet</h2>
            <p className="text-[#6b7280]">Die Auswertung dauert länger als erwartet. Sie können es erneut versuchen oder später zurückkehren.</p>
            <div className="flex flex-col gap-3 mt-4">
              <Button variant="primary" size="lg" onClick={refetch}>
                Ergebnis aktualisieren
              </Button>
              <Button size="lg" onClick={() => router.push('/patient/assess')}>
                Zur Übersicht
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Special handling for STATE_CONFLICT (assessment in_progress)
  if (
    errorObj?.code === 'STATE_CONFLICT' &&
    errorObj.details &&
    typeof errorObj.details === 'object' &&
    (errorObj.details as { status?: string }).status === 'in_progress' &&
    (errorObj.details as { assessmentId?: string }).assessmentId
  ) {
    const details = errorObj.details as { assessmentId: string }
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex flex-col items-center justify-center">
        <Card padding="lg" shadow="md" className="mb-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1f2937]">Assessment ist noch nicht abgeschlossen</h2>
            <p className="text-[#6b7280]">Sie können das Assessment fortsetzen, um Ihr Ergebnis zu sehen.</p>
            <div className="flex flex-col gap-3 mt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push(`/patient/assess/${slug}/flow?assessmentId=${details.assessmentId}`)}
              >
                Assessment fortsetzen
              </Button>
              <Button size="lg" onClick={refetch}>
                Erneut versuchen
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  if (error || !runtimeResult || !runtimeResult.result) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex flex-col items-center justify-center">
        <ErrorState
          title="Fehler beim Laden des Ergebnisses"
          message={error || 'Das Ergebnis konnte nicht geladen werden.'}
          onRetry={refetch}
        />
      </div>
    )
  }
  const { result, report, funnelTitle, completedAt } = runtimeResult
  const summaryBullets = Array.isArray(result.summaryBullets) ? result.summaryBullets : []
  const derived = result.derived || {}
  const riskScore = result.scores?.riskScore
  const riskLevel = result.riskModels?.riskLevel
  const priorityRanking = result.priorityRanking

  const formatRiskLevel = (value?: string | null) => {
    if (!value) return null
    switch (value) {
      case 'low':
        return 'niedrig'
      case 'moderate':
        return 'moderat'
      case 'high':
        return 'hoch'
      case 'critical':
        return 'kritisch'
      default:
        return value
    }
  }
  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1f2937]">{funnelTitle || 'Ergebnis'}</h1>
        </div>
        <Card padding="lg" shadow="md">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1f2937]">
                {result.summaryTitle ?? 'Assessment abgeschlossen'}
              </h2>
              {result.kind && (
                <p className="text-sm text-[#6b7280]">Typ: {result.kind}</p>
              )}
              {completedAt && (
                <p className="text-xs text-[#6b7280]">Abgeschlossen: {new Date(completedAt).toLocaleString()}</p>
              )}
            </div>
            {summaryBullets.length > 0 && (
              <ul className="space-y-2 text-sm text-[#374151] list-disc pl-5">
                {summaryBullets.map((bullet, idx) => (
                  <li key={`${bullet}-${idx}`}>{bullet}</li>
                ))}
              </ul>
            )}
            {(riskScore !== undefined || riskLevel) && (
              <div className="rounded-lg border border-[#e5e7eb] bg-white/70 p-4 text-sm text-[#111827]">
                <div className="flex flex-col gap-2">
                  {riskScore !== undefined && riskScore !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#6b7280]">Risiko-Score</span>
                      <span className="font-semibold">{Number(riskScore).toFixed(0)}</span>
                    </div>
                  )}
                  {riskLevel && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#6b7280]">Risiko-Level</span>
                      <span className="font-semibold">{formatRiskLevel(riskLevel)}</span>
                    </div>
                  )}
                  {priorityRanking && (
                    <div className="text-xs text-[#6b7280]">
                      Priorisierung verfügbar
                    </div>
                  )}
                </div>
              </div>
            )}
            {'cardiovascularAgeYears' in derived && (
              <div className="text-lg font-semibold text-[#2563eb]">
                Kardiovaskuläres Alter: {String(derived.cardiovascularAgeYears)} Jahre
              </div>
            )}
            {'riskBand' in derived && (
              <div className="text-sm text-[#6b7280]">
                Risiko-Band: {String(derived.riskBand)}
              </div>
            )}
            {report && (
              <p className="text-xs text-[#6b7280]">
                Report-Status: {report.status || 'not generated'}
              </p>
            )}
          </div>
        </Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button variant="ghost" size="lg" onClick={() => router.push('/patient/assess')}>
            Zur Übersicht
          </Button>
        </div>
      </div>
    </div>
  )
}
