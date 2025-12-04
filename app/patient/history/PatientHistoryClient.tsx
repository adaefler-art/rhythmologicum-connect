'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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

type Measure = {
  id: string
  assessment_id: string
  patient_id: string
  measurement_type: string
  completed_at: string
  created_at: string
  report: Report | null
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; measures: Measure[] }
  | { status: 'error'; message: string }

export default function PatientHistoryClient() {
  const router = useRouter()
  const [state, setState] = useState<FetchState>({ status: 'idle' })

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // 1. Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Fehler bei getUser:', authError)
        router.push('/login')
        return
      }

      // 2. Get patient profile
      const { data: profileData, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profileData) {
        console.error('Fehler beim Laden des Patientenprofils:', profileError)
        setState({
          status: 'error',
          message:
            'Ihr Profil konnte nicht geladen werden. Bitte versuchen Sie es später erneut.',
        })
        return
      }

      // 3. Fetch patient history
      try {
        setState({ status: 'loading' })

        const res = await fetch(
          `/api/patient-measures/history?patientId=${profileData.id}`
        )

        if (!res.ok) {
          throw new Error('Fehler beim Laden der Verlaufsdaten.')
        }

        const json = await res.json()

        setState({
          status: 'success',
          measures: json.measures || [],
        })
      } catch (err) {
        console.error('Fehler beim Laden der Verlaufsdaten:', err)
        setState({
          status: 'error',
          message:
            'Die Verlaufsdaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.',
        })
      }
    }

    checkAuthAndFetch()
  }, [router])

  // Helper functions
  const formatDateTime = (iso: string | null | undefined) => {
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

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return 'Datum unbekannt'
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d)
    } catch {
      return 'Datum unbekannt'
    }
  }

  const riskLabel = (risk: RiskLevel) => {
    if (!risk) return 'Nicht klassifiziert'
    switch (risk) {
      case 'low':
        return 'Niedriges Risiko'
      case 'moderate':
        return 'Moderates Risiko'
      case 'high':
        return 'Erhöhtes Risiko'
      default:
        return 'Nicht klassifiziert'
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

  // Render states
  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Ihr Verlauf
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ihre bisherigen Stress- und Schlaf-Messungen
          </p>
        </section>

        <section className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </section>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Ihr Verlauf
          </h1>
        </section>

        <section className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-800">
          <p className="font-medium">Fehler beim Laden der Daten</p>
          <p className="mt-1">{state.message}</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 shadow-sm hover:bg-red-50"
            >
              Noch einmal versuchen
            </button>
            <button
              type="button"
              onClick={() => router.push('/patient/stress-check')}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Zum Fragebogen
            </button>
          </div>
        </section>
      </main>
    )
  }

  // status === 'success'
  const { measures } = state

  if (measures.length === 0) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Ihr Verlauf
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ihre bisherigen Stress- und Schlaf-Messungen
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <div className="mx-auto max-w-md">
            <p className="text-4xl mb-4">📊</p>
            <h2 className="text-lg font-semibold text-slate-900">
              Noch keine Messungen vorhanden
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Sie haben bisher noch keine Stress- oder Schlaf-Messungen
              durchgeführt. Starten Sie jetzt mit Ihrer ersten Messung, um Ihren
              Verlauf zu dokumentieren.
            </p>
            <button
              type="button"
              onClick={() => router.push('/patient/stress-check')}
              className="mt-6 inline-flex items-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"
            >
              Zum Fragebogen
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Ihr Verlauf
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ihre bisherigen Stress- und Schlaf-Messungen im Überblick
        </p>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Messungen gesamt
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {measures.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Seit {formatDate(measures[measures.length - 1]?.completed_at)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Letzter Stress-Score
          </p>
          {measures[0]?.report?.score_numeric != null ? (
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {Math.round(measures[0].report.score_numeric)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Keine Daten</p>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            Von {formatDate(measures[0]?.completed_at)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Letzter Schlaf-Score
          </p>
          {measures[0]?.report?.sleep_score != null ? (
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {Math.round(measures[0].report.sleep_score)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Keine Daten</p>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            Von {formatDate(measures[0]?.completed_at)}
          </p>
        </div>
      </section>

      {/* Timeline/History */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Chronologischer Verlauf
        </h2>
        <div className="space-y-4">
          {measures.map((measure, index) => {
            const report = measure.report
            const hasReport = !!report
            const stressScore = report?.score_numeric ?? null
            const sleepScore = report?.sleep_score ?? null
            const risk = report?.risk_level ?? null
            const amyText = report?.report_text_short ?? null

            return (
              <article
                key={measure.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {/* Header */}
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Messung {measures.length - index}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(measure.completed_at)}
                    </p>
                  </div>
                  {risk && (
                    <span
                      className={`inline-flex items-center self-start rounded-full border px-2.5 py-1 text-xs font-medium ${riskBadgeClasses(
                        risk
                      )}`}
                    >
                      {riskLabel(risk)}
                    </span>
                  )}
                </div>

                {/* Scores */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-600">
                      Stress-Score
                    </p>
                    {stressScore != null ? (
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        {Math.round(stressScore)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">—</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-600">
                      Schlaf-Score
                    </p>
                    {sleepScore != null ? (
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        {Math.round(sleepScore)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">—</p>
                    )}
                  </div>
                </div>

                {/* AMY Text */}
                {amyText && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-blue-900">
                        Einordnung von AMY
                      </h4>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        KI-Assistenz
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-blue-900 whitespace-pre-line">
                      {amyText}
                    </p>
                  </div>
                )}

                {hasReport && !amyText && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-600">
                      Für diese Messung liegt noch kein AMY-Text vor.
                    </p>
                  </div>
                )}

                {!hasReport && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                    <p className="text-xs text-amber-800">
                      Die Auswertung für diese Messung wird noch erstellt.
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {/* Action Button */}
      <section className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => router.push('/patient/stress-check')}
          className="inline-flex items-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"
        >
          Neue Messung durchführen
        </button>
      </section>
    </main>
  )
}
