'use client'


import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, LoadingSkeleton, ErrorState } from '@/lib/ui/mobile-v2'
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
    refetch,
  } = useAssessmentResult({ slug, assessmentId })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex items-center justify-center">
        <LoadingSkeleton variant="card" count={1} />
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
