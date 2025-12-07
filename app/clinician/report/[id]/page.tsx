'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type AnswerRow = {
  question_id: string
  answer_value: number
}

export default function ClinicianReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [report, setReport] = useState<any>(null)
  const [assessment, setAssessment] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [answers, setAnswers] = useState<AnswerRow[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1) Report laden
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single()

        if (reportError) throw reportError
        setReport(reportData)

        // 2) Assessment laden
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', reportData.assessment_id)
          .single()

        if (assessmentError) throw assessmentError
        setAssessment(assessmentData)

        // 3) Patient laden
        const { data: patientData, error: patientError } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('id', assessmentData.patient_id)
          .single()

        if (patientError) throw patientError
        setPatient(patientData)

        // 4) Antworten laden
        const { data: answersData, error: answersError } = await supabase
          .from('assessment_answers')
          .select('question_id, answer_value')
          .eq('assessment_id', assessmentData.id)

        if (answersError) throw answersError
        setAnswers((answersData ?? []) as AnswerRow[])
      } catch (e: any) {
        console.error('Fehler beim Laden der Report-Details:', e)
        setError(e.message ?? 'Unbekannter Fehler')
      } finally {
        setLoading(false)
      }
    }

    if (reportId) {
      loadData()
    }
  }, [reportId])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Report wird geladen…</p>
      </main>
    )
  }

  if (error || !report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">
            {error ?? 'Report nicht gefunden.'}
          </p>
          <button
            onClick={() => router.push('/clinician')}
            className="px-6 py-3 min-h-[44px] rounded bg-sky-600 text-white text-sm md:text-base hover:bg-sky-700 transition touch-manipulation"
          >
            Zurück
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
      : 'Niedriges Stressniveau'

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/clinician')}
        className="mb-4 px-4 py-2.5 min-h-[44px] text-sm md:text-base text-sky-600 hover:text-sky-700 hover:underline transition touch-manipulation inline-flex items-center gap-2"
      >
        ← Zur Übersicht
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Report – Stress & Resilienz</h1>

      {/* Meta-Daten */}
      <div className="mb-6 space-y-3 md:space-y-4">
        <div>
          <p className="text-sm md:text-base text-slate-500">Datum</p>
          <p className="font-medium text-sm md:text-base">
            {new Date(report.created_at).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm md:text-base text-slate-500">Patient</p>
          <p className="font-medium text-sm md:text-base">
            {patient?.full_name ?? patient?.id ?? 'Unbekannt'}
          </p>
        </div>

        <div>
          <p className="text-sm md:text-base text-slate-500">Stress-Score</p>
          <p className="text-xl md:text-2xl font-bold">{report.score_numeric ?? 'N/A'}</p>
        </div>

        <div>
          <p className="text-sm md:text-base text-slate-500">Schlaf-Score</p>
          <p className="text-xl md:text-2xl font-bold">{report.sleep_score ?? 'N/A'}</p>
        </div>

        <div>
          <p className="text-sm md:text-base text-slate-500">Stress-Level</p>
          <p className="font-medium text-sm md:text-base">{riskLabel}</p>
        </div>
      </div>

      {/* AMY-Text */}
      <div className="border rounded-xl p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Kurzbericht (AMY)</h2>
        <p className="whitespace-pre-line text-gray-800 text-sm md:text-base">
          {report.report_text_short}
        </p>
      </div>

      {/* Antworten */}
      <div className="border rounded-xl p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Antworten (Rohdaten)</h2>
        {answers.length === 0 ? (
          <p className="text-sm md:text-base text-slate-500">
            Keine Antworten gefunden.
          </p>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base text-slate-700">
            {answers.map((a) => (
              <li key={a.question_id}>
                <strong>{a.question_id}:</strong> {a.answer_value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
