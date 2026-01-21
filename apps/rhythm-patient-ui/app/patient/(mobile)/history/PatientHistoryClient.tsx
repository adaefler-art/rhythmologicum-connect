'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { featureFlags } from '@/lib/featureFlags'

type RiskLevel = 'low' | 'moderate' | 'high' | 'pending' | null

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
  patient_id: string
  created_at: string
  report_id: string | null
  stress_score: number | null
  sleep_score: number | null
  risk_level: RiskLevel | 'pending' | null
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
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // 1. Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Fehler bei getUser:', authError)
        router.push('/')
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
      case 'pending':
        return 'Wird ermittelt'
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
      case 'pending':
        return 'bg-slate-100 text-slate-600 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const handleExportJSON = async () => {
    try {
      setIsExporting(true)

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error('Fehler beim Abrufen der Session:', sessionError)
        alert('Fehler: Sie sind nicht angemeldet.')
        return
      }

      // Call the export endpoint with authorization header
      const res = await fetch('/api/patient-measures/export', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.error || 'Fehler beim Exportieren der Daten.'
        )
      }

      const data = await res.json()

      // Create a blob and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `verlaufsdaten-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Fehler beim Exportieren:', err)
      alert(
        'Fehler beim Exportieren der Daten. Bitte versuchen Sie es später erneut.'
      )
    } finally {
      setIsExporting(false)
    }
  }

  // Render states
  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
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
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        {/* E6.5.8: Back to Dashboard button in error state */}
        <button
          type="button"
          onClick={() => router.push('/patient/dashboard')}
          className="self-start inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline transition-colors"
          aria-label="Zurück zum Dashboard"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Zurück zum Dashboard
        </button>
        
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
              onClick={() => router.push('/patient/dashboard')}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Zum Dashboard
            </button>
          </div>
        </section>
      </div>
    )
  }

  // status === 'success'
  const { measures } = state

  if (measures.length === 0) {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        {/* E6.5.8: Back to Dashboard button in empty state */}
        <button
          type="button"
          onClick={() => router.push('/patient/dashboard')}
          className="self-start inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline transition-colors"
          aria-label="Zurück zum Dashboard"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Zurück zum Dashboard
        </button>
        
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Ihr Verlauf
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ihre bisherigen Stress- und Schlaf-Messungen
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <div className="w-full">
            <p className="text-4xl mb-4" aria-label="Verlaufsdiagramm-Symbol">📊</p>
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
              onClick={() => router.push('/patient/dashboard')}
              className="mt-6 inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: 'var(--color-primary-600)',
              }}
            >
              Zum Dashboard
            </button>
          </div>
        </section>
      </div>
    )
  }

  const latestMeasurement = measures[0]
  const latestStressScore =
    latestMeasurement?.report?.score_numeric ?? latestMeasurement?.stress_score ?? null
  const latestSleepScore =
    latestMeasurement?.report?.sleep_score ?? latestMeasurement?.sleep_score ?? null

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10">
      {/* Header */}
      <section>
        <div className="flex flex-col gap-3">
          {/* E6.5.8: Back to Dashboard button */}
          <button
            type="button"
            onClick={() => router.push('/patient/dashboard')}
            className="self-start inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline transition-colors"
            aria-label="Zurück zum Dashboard"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Zurück zum Dashboard
          </button>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Ihr Verlauf
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Ihre bisherigen Stress- und Schlaf-Messungen im Überblick
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{
                borderColor: 'var(--color-neutral-200)',
                backgroundColor: 'var(--background)',
                color: 'var(--color-neutral-700)',
              }}
            >
              {isExporting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  Exportiere...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Als JSON exportieren
                </>
              )}
            </button>
          </div>
          
          {/* New Check CTA */}
          <button
            type="button"
            onClick={() => router.push('/patient/assessment')}
            className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-lg text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--color-primary-600)',
            }}
            aria-label="Neue Messung durchführen"
          >
            <span className="text-base" aria-hidden="true">✓</span>
            Neue Messung durchführen
          </button>
        </div>
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
            Erste Messung: {formatDate(measures[measures.length - 1]?.created_at)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Letzter Stress-Score
          </p>
          {latestStressScore != null ? (
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {Math.round(latestStressScore)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Keine Daten</p>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            Von {formatDate(measures[0]?.created_at)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Letzter Schlaf-Score
          </p>
          {latestSleepScore != null ? (
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {Math.round(latestSleepScore)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Keine Daten</p>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            Von {formatDate(measures[0]?.created_at)}
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
            const stressScore = report?.score_numeric ?? measure.stress_score ?? null
            const sleepScore = report?.sleep_score ?? measure.sleep_score ?? null
            const risk = report?.risk_level ?? measure.risk_level ?? null
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
                      {index === 0 ? 'Neueste Messung' : `Messung vom ${formatDate(measure.created_at)}`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(measure.created_at)}
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
                {featureFlags.AMY_ENABLED && amyText && (
                  <div className="rounded-lg border border-sky-100 bg-sky-50/50 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-sky-900">
                        Einordnung von AMY
                      </h4>
                      <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                        KI-Assistenz
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-sky-900 whitespace-pre-line">
                      {amyText}
                    </p>
                  </div>
                )}

                {featureFlags.AMY_ENABLED && hasReport && !amyText && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-600">
                      Für diese Messung liegt noch kein AMY-Text vor.
                    </p>
                  </div>
                )}

                {featureFlags.AMY_ENABLED && !hasReport && (
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
    </div>
  )
}
