'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Report = {
  id: string
  created_at: string
  score_numeric: number | null
  risk_level: 'low' | 'moderate' | 'high' | null
  report_text_short: string | null
  assessment_id: string
}

type ScoresPayload = {
  stressScore: number | null
  sleepScore: number | null
  riskLevel: 'low' | 'moderate' | 'high' | null
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
        setError('Kein Assessment gefunden.')
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Dein Bericht wird erstellt…</p>
      </main>
    )
  }

  if (error || !report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">
            {error ?? 'Kein Bericht verfügbar.'}
          </p>
          <button
            onClick={() => router.push('/patient/stress-check')}
            className="px-4 py-2 rounded bg-black text-white text-sm"
          >
            Zurück zum Fragebogen
          </button>
        </div>
      </main>
    )
  }

  const riskLabel =
    report.risk_level === 'high'
      ? 'Hohes Stressniveau'
      : report.risk_level === 'moderate'
      ? 'Mittleres Stressniveau'
      : report.risk_level === 'low'
      ? 'Niedriges Stressniveau'
      : 'Noch nicht klassifiziert'

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Dein Stress &amp; Resilienz-Report</h1>

      <div className="mb-6 space-y-2">
        <div>
          <p className="text-sm text-slate-500">Datum</p>
          <p className="font-medium">
            {new Date(report.created_at).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Gesamt-Score</p>
          <p className="text-2xl font-bold">
            {report.score_numeric != null ? report.score_numeric : '–'}
          </p>
        </div>

        {scores && (
          <>
            <div>
              <p className="text-sm text-slate-500">Stress-Score (0–100)</p>
              <p className="font-medium">
                {scores.stressScore != null ? scores.stressScore : '–'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Schlaf-Score (0–100)</p>
              <p className="font-medium">
                {scores.sleepScore != null ? scores.sleepScore : '–'}
              </p>
            </div>
          </>
        )}

        <div>
          <p className="text-sm text-slate-500">Stress-Level</p>
          <p className="font-medium">{riskLabel}</p>
        </div>
      </div>

      <div className="border rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Kurzbericht (AMY)</h2>
        <p className="whitespace-pre-line text-gray-800">
          {report.report_text_short}
        </p>
      </div>

      <button
        onClick={() => router.push('/')}
        className="text-sm text-sky-600 underline"
      >
        Zur Startseite
      </button>
    </main>
  )
}
