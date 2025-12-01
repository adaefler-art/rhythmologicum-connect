'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type RiskLevel = 'low' | 'moderate' | 'high' | null

type Report = {
  id: string
  created_at: string
  score_numeric: number | null
  risk_level: RiskLevel
  report_text_short: string | null
  assessment_id: string
}

type ScoresPayload = {
  stressScore: number | null
  sleepScore: number | null
  riskLevel: RiskLevel
}

export default function StressResultClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawParam =
    searchParams.get('assessmentId') ?? searchParams.get('assessment')
  const assessmentId = rawParam ?? undefined

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [scores, setScores] = useState<ScoresPayload | null>(null)

  useEffect(() => {
    async function loadOrCreateReport() {
      if (!assessmentId) {
        console.error('StressResultClient: Kein assessmentId in der URL')
        setError('Kein Assessment gefunden. Bitte starten Sie den Test erneut.')
        setLoading(false)
        return
      }

      try {
        console.log('StressResultClient: rufe AMY-Endpoint auf mit', {
          assessmentId,
        })

        const response = await fetch('/api/amy/stress-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assessmentId }),
        })

        console.log('StressResultClient: Response Status =', response.status)

        if (!response.ok) {
          console.error(
            'StressResultClient: AMY-Endpoint nicht erfolgreich',
            response.status
          )
          throw new Error('AMY-Endpoint nicht erfolgreich')
        }

        const data = await response.json()
        console.log('StressResultClient: Daten von AMY =', data)

        setReport(data.report as Report)
        if (data.scores) {
          setScores(data.scores as ScoresPayload)
        }

        setLoading(false)
      } catch (e: any) {
        console.error('StressResultClient: Fehler bei AMY, nutze Fallback:', e)
        setError('Die automatische Auswertung ist aktuell nicht verfügbar.')
        setLoading(false)
      }
    }

    loadOrCreateReport()
  }, [assessmentId])

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const getRiskLabel = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return 'Hohes Stressniveau'
      case 'moderate':
        return 'Mittleres Stressniveau'
      case 'low':
        return 'Niedriges Stressniveau'
      default:
        return 'Noch nicht klassifiziert'
    }
  }

  const getRiskBadgeClasses = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getRiskDotClasses = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return 'bg-red-500'
      case 'moderate':
        return 'bg-amber-500'
      case 'low':
        return 'bg-emerald-500'
      default:
        return 'bg-slate-400'
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-2">
            Ihr persönlicher Bericht wird erstellt…
          </p>
          <p className="text-xs text-slate-400">
            Dies kann einen kleinen Moment dauern.
          </p>
        </div>
      </main>
    )
  }

  if (error || !report) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl shadow-sm p-6 text-center">
          <p className="text-sm text-red-600 mb-3">
            {error ?? 'Kein Bericht verfügbar.'}
          </p>
          <p className="text-xs text-slate-500 mb-5">
            Bitte gehen Sie einen Schritt zurück und starten Sie den
            Stress-Check erneut.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push('/patient/stress-check')}
              className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition"
            >
              Zurück zum Fragebogen
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </main>
    )
  }

  const riskLabel = getRiskLabel(report.risk_level)
  const riskBadge = getRiskBadgeClasses(report.risk_level)
  const riskDot = getRiskDotClasses(report.risk_level)

  const hasScores = !!scores && (scores.stressScore != null || scores.sleepScore != null)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
        {/* Header */}
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-600 mb-1">
            Ergebnis
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Ihr Stress- &amp; Schlaf-Report
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Auf Basis Ihrer Antworten wurde ein individueller Überblick über
            Ihr aktuelles Stress- und Erholungsniveau erstellt.
          </p>
        </header>

        {/* Meta + Level */}
        <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm text-slate-600">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Datum der Auswertung
            </p>
            <p className="font-medium text-slate-900">
              {formatDateTime(report.created_at)}
            </p>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${riskBadge}`}
            >
              <span className={`w-2 h-2 rounded-full ${riskDot}`} />
              {riskLabel}
            </span>
          </div>
        </section>

        {/* Score-Kacheln */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <p className="text-xs font-medium text-slate-500 mb-1">
              Gesamt-Score
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {report.score_numeric != null ? report.score_numeric : '–'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Oberer Orientierungswert aus Ihren Antworten.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <p className="text-xs font-medium text-slate-500 mb-1">
              Stress-Score (0–100)
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {scores?.stressScore != null ? scores.stressScore : '–'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Höherer Wert = mehr Belastung durch Stress.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <p className="text-xs font-medium text-slate-500 mb-1">
              Schlaf-Score (0–100)
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {scores?.sleepScore != null ? scores.sleepScore : '–'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Höherer Wert = stärkere Einschränkungen im Schlaf.
            </p>
          </div>
        </section>

        {/* Hinweis, falls Scores fehlen */}
        {!hasScores && (
          <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Die numerischen Score-Werte konnten noch nicht vollständig
            berechnet werden. Ihr Kurzbericht unten steht aber bereits zur
            Verfügung.
          </div>
        )}

        {/* Kurzbericht */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Kurzbericht (AMY)
          </h2>
          <div className="border border-slate-200 rounded-xl bg-slate-50/70 px-4 py-3">
            <p className="whitespace-pre-line text-sm text-slate-800 leading-relaxed">
              {report.report_text_short ??
                'Für dieses Assessment liegt noch kein Kurzbericht vor.'}
            </p>
          </div>
        </section>

        {/* Footer / Actions */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Dieser Report ersetzt keine ärztliche Diagnose. Bitte besprechen
            Sie Auffälligkeiten und Sorgen immer mit Ihrer behandelnden
            Ärztin bzw. Ihrem behandelnden Arzt.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => router.push('/patient/stress-check')}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              Test erneut durchführen
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition"
            >
              Zur Startseite
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
