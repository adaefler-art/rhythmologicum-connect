'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { featureFlags } from '@/lib/featureFlags'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import type { ContentPage } from '@/lib/types/content'

type RiskLevel = 'low' | 'moderate' | 'high' | null

type Report = {
  id: string
  assessment_id: string
  score_numeric: number | null
  sleep_score: number | null
  risk_level: RiskLevel
  report_text_short: string | null
  created_at: string
  updated_at: string
}

type ScoresPayload = {
  stressScore: number | null
  sleepScore: number | null
  riskLevel: RiskLevel
}

type ApiResponse = {
  report: Report | null
  scores: ScoresPayload | null
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; report: Report | null; scores: ScoresPayload | null }
  | { status: 'error'; message: string }

export default function StressResultClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawParam = searchParams.get('assessmentId')
  const assessmentId = typeof rawParam === 'string' && rawParam.length > 0 ? rawParam : null

  const [state, setState] = useState<FetchState>({ status: 'idle' })
  const [retryCounter, setRetryCounter] = useState(0)
  const [contentPages, setContentPages] = useState<ContentPage[]>([])
  const [contentLoading, setContentLoading] = useState(true)

  // F8: Load dynamic content pages for result category
  useEffect(() => {
    const loadContentPages = async () => {
      try {
        setContentLoading(true)
        // Load result-category content pages for stress funnel
        const response = await fetch(
          '/api/content-resolver?funnel=stress-assessment&category=result',
        )
        if (response.ok) {
          const data = await response.json()
          setContentPages(Array.isArray(data) ? data : data.pages || [])
        }
      } catch (error) {
        console.error('Error loading content pages:', error)
      } finally {
        setContentLoading(false)
      }
    }
    loadContentPages()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!assessmentId) {
        setState({
          status: 'error',
          message:
            'Wir konnten keinen gültigen Link zu deinem Report finden. Bitte öffne den Link direkt aus deiner E-Mail oder wiederhole den Fragebogen.',
        })
        return
      }

      try {
        setState({ status: 'loading' })

        // 1. Fetch stress report (creates/updates Supabase records internally)
        const res = await fetch('/api/amy/stress-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assessmentId }),
        })

        const text = await res.text()
        let json: ApiResponse | null = null

        try {
          json = text ? (JSON.parse(text) as ApiResponse) : null
        } catch (e) {
          console.error('Stress report: Antwort ist kein valides JSON', e, text)
        }

        if (!res.ok || !json) {
          console.error('Stress report: API-Fehler', res.status, json ?? text)
          setState({
            status: 'error',
            message:
              'Die automatische Auswertung ist aktuell nicht verfügbar. Dein Fragebogen ist sicher gespeichert – bitte versuche es gleich noch einmal oder später erneut.',
          })
          return
        }

        setState({
          status: 'success',
          report: json.report,
          scores: json.scores,
        })
      } catch (err) {
        console.error('Stress report: Fetch-Fehler', err)
        setState({
          status: 'error',
          message:
            'Die automatische Auswertung ist aktuell nicht verfügbar. Dein Fragebogen ist sicher gespeichert – bitte versuche es gleich noch einmal oder später erneut.',
        })
      }
    }

    fetchData()
  }, [assessmentId, retryCounter])

  const handleRetry = () => {
    setRetryCounter((prev) => prev + 1)
  }

  // Hilfsfunktionen UI
  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return 'Datum unbekannt'
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    } catch {
      return 'Datum unbekannt'
    }
  }

  const riskLabel = (risk: RiskLevel) => {
    if (!risk) return 'Noch nicht klassifiziert'
    switch (risk) {
      case 'low':
        return 'Niedriges Risiko'
      case 'moderate':
        return 'Moderates Risiko'
      case 'high':
        return 'Erhöhtes Risiko'
      default:
        return 'Noch nicht klassifiziert'
    }
  }

  const riskBadgeClasses = (risk: RiskLevel) => {
    switch (risk) {
      case 'low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  // Render-Zustände

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Dein Stress &amp; Resilienz-Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">Wir bereiten deine Ergebnisse auf …</p>
        </section>

        <section className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
        </section>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Dein Stress &amp; Resilienz-Report
          </h1>
        </section>

        <section className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-800">
          <p className="font-medium">Die automatische Auswertung ist im Moment nicht erreichbar.</p>
          <p className="mt-1">
            {state.message ||
              'Unsere Systeme sind gerade ausgelastet oder in Wartung. Deine Angaben sind sicher gespeichert – du kannst die Seite später erneut öffnen oder gleich noch einmal versuchen.'}
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 shadow-sm hover:bg-red-50"
            >
              Noch einmal versuchen
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Zur Startseite
            </button>
          </div>
        </section>
      </main>
    )
  }

  // status === 'success'
  const { report, scores } = state

  const hasReport = !!report || !!scores
  const stressScore = scores?.stressScore ?? report?.score_numeric ?? null
  const sleepScore = scores?.sleepScore ?? null
  const risk: RiskLevel = scores?.riskLevel ?? report?.risk_level ?? null

  const hasReportText = !!report?.report_text_short
  const primaryText =
    report?.report_text_short ||
    (hasReport && risk === 'high'
      ? 'Deine aktuellen Daten zeigen ein erhöhtes Stressniveau. Das ist ein Hinweis, dass dein System gerade viel tragen muss – du bist damit nicht allein. Die nächsten Schritte helfen dir, wieder in Balance zu kommen.'
      : hasReport && risk === 'moderate'
      ? 'Dein Stressniveau ist im mittleren Bereich. Es lohnt sich, jetzt gezielt an Schlaf, Erholung und Grenzen zu arbeiten, bevor sich Beschwerden verstärken.'
      : hasReport && risk === 'low'
      ? 'Aktuell liegen deine Werte im eher entspannten Bereich. Das ist eine gute Basis – achte weiter auf Schlaf, Bewegung und Pausen, damit das so bleibt.'
      : 'Deine Antworten sind sicher gespeichert. Die automatische Auswertung wird in Kürze erstellt – bitte lade diese Seite in einem Moment neu.')

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dein Stress &amp; Resilienz-Report
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Basierend auf deinen Antworten aus dem Fragebogen.
        </p>
      </section>

      {/* Meta / Datum */}
      <section className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          {hasReport ? (
            <>
              <span>Auswertung vom </span>
              <span className="font-medium text-slate-700">
                {formatDate(report?.created_at ?? null)}
              </span>
            </>
          ) : (
            <span>Die Auswertung wird vorbereitet.</span>
          )}
        </div>
        {assessmentId && (
          <div className="truncate text-right">
            <span className="font-mono text-[10px] text-slate-400">
              ID: {assessmentId.slice(0, 8)}…
            </span>
          </div>
        )}
      </section>

      {/* Score Karten */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Stress-Score
          </p>
          {stressScore != null ? (
            <p className="mt-2 text-2xl font-semibold text-slate-900">{Math.round(stressScore)}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Noch nicht verfügbar</p>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            Höhere Werte bedeuten mehr Belastung im Alltag.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Schlaf-Score
          </p>
          {sleepScore != null ? (
            <p className="mt-2 text-2xl font-semibold text-slate-900">{Math.round(sleepScore)}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Noch nicht verfügbar</p>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            Zeigt, wie erholsam dein Schlaf aktuell ist.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Risiko-Einschätzung
          </p>
          <div className="mt-2 inline-flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${riskBadgeClasses(
                risk,
              )}`}
            >
              {riskLabel(risk)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Einschätzung deines aktuellen Stress- und Belastungsniveaus.
          </p>
        </div>
      </section>

      {/* AMY Text / Fallback */}
      {featureFlags.AMY_ENABLED && (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800">Deine persönliche Einordnung</h2>
            {hasReportText && (
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                von AMY
              </span>
            )}
          </div>
          <p className="text-base leading-7 text-slate-700 whitespace-pre-line">
            {primaryText}
          </p>
          {!hasReportText && hasReport && (
            <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-900">
                <span aria-label="Hinweis">💡</span> Die detaillierte KI-gestützte Auswertung folgt in Kürze
              </p>
              <p className="mt-1 text-sm text-blue-800">
                Deine Daten sind bereits ausgewertet. Eine noch genauere, personalisierte Einordnung durch unsere KI-Assistentin AMY wird gerade erstellt.
              </p>
            </div>
          )}
          {!hasReport && (
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-900">
                <span aria-label="Wartezeit">⏳</span> Auswertung läuft gerade
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Deine Antworten werden analysiert. Das dauert normalerweise nur wenige Sekunden. Bitte lade die Seite in einem Moment neu.
              </p>
              <p className="mt-2 text-xs text-amber-700">
                Falls die Auswertung länger als 2 Minuten dauert, kannst du dich gerne an deine behandelnde Praxis wenden.
              </p>
            </div>
          )}
        </section>
      )}

      {/* F8: Dynamic Content Blocks from Database */}
      {!contentLoading && contentPages.length > 0 && (
        <section className="space-y-4">
          {contentPages.map((page) => (
            <div
              key={page.id}
              className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-800 mb-3">{page.title}</h2>
              {page.excerpt && (
                <p className="text-sm text-slate-600 mb-3 italic">{page.excerpt}</p>
              )}
              <MarkdownRenderer content={page.body_markdown} />
            </div>
          ))}
        </section>
      )}

      {/* Navigation Actions */}
      <section className="flex flex-col gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push('/patient/history')}
          className="w-full inline-flex justify-center items-center px-6 py-4 rounded-xl bg-sky-600 text-white text-base font-semibold shadow-md hover:bg-sky-700 transition-all"
          aria-label="Meinen Verlauf ansehen"
        >
          <span aria-hidden="true">📊</span>
          <span className="ml-2">Meinen Verlauf ansehen</span>
        </button>
        <div className="flex justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => router.push('/patient/stress-check?new=true')}
            className="text-slate-600 hover:text-slate-900 underline transition"
          >
            Neuen Fragebogen starten
          </button>
        </div>
      </section>
    </main>
  )
}
