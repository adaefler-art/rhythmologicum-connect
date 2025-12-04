'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

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

  const fetchData = useCallback(async () => {
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
  }, [assessmentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRetry = () => {
    fetchData()
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

  const primaryText =
    report?.report_text_short ||
    (hasReport && risk === 'high'
      ? 'Deine aktuellen Daten zeigen ein erhöhtes Stressniveau. Das ist ein Hinweis, dass dein System gerade viel tragen muss – du bist damit nicht allein. Die nächsten Schritte helfen dir, wieder in Balance zu kommen.'
      : hasReport && risk === 'moderate'
      ? 'Dein Stressniveau ist im mittleren Bereich. Es lohnt sich, jetzt gezielt an Schlaf, Erholung und Grenzen zu arbeiten, bevor sich Beschwerden verstärken.'
      : hasReport && risk === 'low'
      ? 'Aktuell liegen deine Werte im eher entspannten Bereich. Das ist eine gute Basis – achte weiter auf Schlaf, Bewegung und Pausen, damit das so bleibt.'
      : 'Deine Antworten sind sicher gespeichert. Sobald die automatische Auswertung abgeschlossen ist, siehst du hier deinen persönlichen Kurz-Report.')

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
      <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Kurze Einordnung</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
          {primaryText}
        </p>
        {!hasReport && (
          <p className="mt-2 text-xs text-slate-500">
            Falls diese Meldung länger bestehen bleibt, kannst du den Fragebogen jederzeit erneut
            ausfüllen oder dich direkt an deine behandelnde Praxis wenden.
          </p>
        )}
      </section>

      {/* Noch-nicht-verfügbar-Hinweis, wenn kein Report */}
      {!hasReport && (
        <section className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-600">
          <p className="font-medium">Dein Report ist noch nicht vollständig verfügbar.</p>
          <p className="mt-1">
            Das ist kein Notfallhinweis. Die medizinische Auswertung im Hintergrund kann etwas
            Zeit benötigen. Deine Daten sind sicher gespeichert und werden nicht verloren gehen.
          </p>
        </section>
      )}
    </main>
  )
}
