'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type RiskLevel = 'low' | 'moderate' | 'high'

type Report = {
  id: string
  score_numeric: number
  risk_level: RiskLevel
  report_text_short: string
  created_at: string
}

export default function StressResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assessmentId = searchParams.get('assessment')

  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrCreateReport = async () => {
      if (!assessmentId) {
        setError('Kein Assessment übergeben.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // 1) eingeloggt?
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError
        if (!user) {
          router.push('/login')
          return
        }

        // 2) gibt es bereits einen Report?
        const { data: existingReports, error: reportFetchError } = await supabase
          .from('reports')
          .select('*')
          .eq('assessment_id', assessmentId)
          .limit(1)

        if (reportFetchError) throw reportFetchError

        if (existingReports && existingReports.length > 0) {
          setReport(existingReports[0] as Report)
          setLoading(false)
          return
        }

        // 3) Antworten laden
        const { data: answers, error: answersError } = await supabase
          .from('assessment_answers')
          .select('answer_value')
          .eq('assessment_id', assessmentId)

        if (answersError) throw answersError
        if (!answers || answers.length === 0) {
          throw new Error('Keine Antworten gefunden.')
        }

        // 4) Score berechnen
        const score = answers.reduce(
          (sum, row: any) => sum + (row.answer_value ?? 0),
          0,
        ) as number

        // 5) Risk-Level bestimmen
        let riskLevel: RiskLevel = 'low'
        if (score > 20) {
          riskLevel = 'high'
        } else if (score > 10) {
          riskLevel = 'moderate'
        }

        // 6) AMY/Claude-Backend aufrufen
        console.log("⚡ Versuche AMY/Claude aufzurufen…")

        let reportText: string

        try {
          const amyResponse = await fetch('/api/amy/stress-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score, riskLevel }),
          })

          if (!amyResponse.ok) {
            throw new Error('AMY-Endpoint nicht erfolgreich')
          }

          const amyJson = await amyResponse.json()
          if (!amyJson.reportText) {
            throw new Error('AMY-Response ohne reportText')
          }

          reportText = amyJson.reportText
        } catch (e) {
          console.error('Fehler bei AMY, nutze Fallback:', e)
          reportText = generateSimpleReport(score, riskLevel)
        }

        // 7) Report speichern
        const { data: insertedReports, error: insertError } = await supabase
          .from('reports')
          .insert({
            assessment_id: assessmentId,
            score_numeric: score,
            risk_level: riskLevel,
            report_text_short: reportText,
          })
          .select()
          .single()

        if (insertError) throw insertError

        setReport(insertedReports as Report)
      } catch (err: any) {
        console.error(err)
        setError(err.message ?? 'Unbekannter Fehler bei der Auswertung.')
      } finally {
        setLoading(false)
      }
    }

    loadOrCreateReport()
  }, [assessmentId, router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Dein Ergebnis wird berechnet…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md border rounded p-4 text-center">
          <p className="text-red-500 mb-4">Fehler: {error}</p>
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

  if (!report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Kein Ergebnis verfügbar.</p>
      </main>
    )
  }

  const badgeColor =
    report.risk_level === 'high'
      ? 'bg-red-100 text-red-700'
      : report.risk_level === 'moderate'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700'

  const riskLabel =
    report.risk_level === 'high'
      ? 'Hohes Stressniveau'
      : report.risk_level === 'moderate'
      ? 'Mittleres Stressniveau'
      : 'Niedriges Stressniveau'

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Dein Ergebnis</h1>
      <p className="text-gray-600 mb-6">
        Dieser Bericht ist ein Prototyp und ersetzt keine ärztliche Diagnose oder
        Notfallversorgung.
      </p>

      <div className="border rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-500 mb-1">
          Gesamt-Score (0–32, höhere Werte = höheres Stresslevel)
        </p>
        <p className="text-4xl font-bold mb-2">{report.score_numeric}</p>

        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
          {riskLabel}
        </span>
      </div>

      <div className="border rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Kurz-Einschätzung</h2>
        <p className="whitespace-pre-line text-gray-800">{report.report_text_short}</p>
      </div>

      <button
        onClick={() => router.push('/patient/stress-check')}
        className="px-4 py-2 rounded border border-gray-300 text-sm"
      >
        Fragebogen erneut ausfüllen
      </button>
    </main>
  )
}

function generateSimpleReport(score: number, riskLevel: RiskLevel): string {
  if (riskLevel === 'low') {
    return (
      `Dein aktueller Stress-Score liegt bei ${score} Punkten und fällt in einen eher niedrigen Bereich.\n\n` +
      `Insgesamt scheinen Stress und Erholung im Alltag bei dir halbwegs im Gleichgewicht zu sein. `
    )
  }

  if (riskLevel === 'moderate') {
    return (
      `Dein Stress-Score liegt bei ${score} Punkten und entspricht einem mittleren Bereich.\n\n` +
      `Du erlebst wahrscheinlich regelmäßige Belastung und merkst zeitweise Erschöpfung oder Anspannung. `
    )
  }

  return (
    `Dein Stress-Score liegt bei ${score} Punkten und zeigt ein deutlich erhöhtes Stressniveau.\n\n` +
    `Es wäre sinnvoll, dies ärztlich oder psychologisch zu besprechen, besonders wenn zusätzliche Symptome wie Schlafprobleme, Herzrasen oder anhaltende Niedergeschlagenheit auftreten.`
  )
}
