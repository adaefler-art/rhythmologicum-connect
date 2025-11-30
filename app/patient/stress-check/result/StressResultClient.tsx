'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Report = {
  id: string
  created_at: string
  score_numeric: number
  risk_level: 'low' | 'moderate' | 'high' | null
  report_text_short: string | null
  assessment_id: string
}

export default function StressResultClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const assessmentId = searchParams.get('assessmentId')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    const loadOrCreateReport = async () => {
      if (!assessmentId) {
        setError('Kein Assessment gefunden.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 1) Gibt es schon einen Report?
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('assessment_id', assessmentId)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setReport(data as Report)
          setLoading(false)
          return
        }

        // 2) Wenn nicht: AMY-API aufrufen und Report erzeugen
        const response = await fetch('/api/amy/stress-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessmentId }),
        })

        if (!response.ok) {
          console.error('AMY-Endpoint nicht erfolgreich', response.status)
          throw new Error('AMY-Endpoint nicht erfolgreich')
        }

        const result = await response.json()

        // Du hattest schon geprüft, dass sowas in der Art zurückkommt:
        // { ok: true, score: number, analysis: string }
        // Hier könnte auch der frisch erzeugte Report zurückkommen, falls du das im Backend schon speicherst.
        // Minimal: wir lesen ihn danach aus Supabase.
        const { data: newReport, error: newReportError } = await supabase
          .from('reports')
          .select('*')
          .eq('assessment_id', assessmentId)
          .maybeSingle()

        if (newReportError) throw newReportError
        if (newReport) {
          setReport(newReport as Report)
        } else {
          // Fallback: trotzdem Score + Text aus result verwenden
          setReport({
            id: 'local',
            created_at: new Date().toISOString(),
            score_numeric: result.score ?? 0,
            risk_level: null,
            report_text_short: result.analysis ?? 'Kein Text verfügbar.',
            assessment_id: assessmentId,
          })
        }
      } catch (e: any) {
        console.error('Fehler bei AMY, nutze Fallback:', e)
        setError(e.message ?? 'Fehler bei der Auswertung.')
      } finally {
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
      <h1 className="text-3xl font-bold mb-4">Dein Stress & Resilienz-Report</h1>

      <div className="mb-6 space-y-2">
        <div>
          <p className="text-sm text-slate-500">Datum</p>
          <p className="font-medium">
            {new Date(report.created_at).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Score</p>
          <p className="text-2xl font-bold">{report.score_numeric}</p>
        </div>

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
