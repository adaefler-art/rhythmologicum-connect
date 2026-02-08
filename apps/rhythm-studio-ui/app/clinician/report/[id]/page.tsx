'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { featureFlags } from '@/lib/featureFlags'
import { ASSISTANT_CONFIG } from '@/lib/config/assistant'

type AnswerRow = {
  question_id: string
  answer_value: number
}

type Report = {
  id: string
  assessment_id: string
  created_at: string
  score_numeric: number | null
  sleep_score: number | null
  risk_level: 'low' | 'moderate' | 'high' | null
  report_text_short: string | null
}

type Assessment = {
  id: string
  patient_id: string
}

type PatientProfile = {
  id: string
  full_name: string | null
}

export default function ClinicianReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [report, setReport] = useState<Report | null>(null)
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [answers, setAnswers] = useState<AnswerRow[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1) Report laden
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select<'*', Report>('*')
          .eq('id', reportId)
          .single()

        if (reportError) throw reportError
        setReport(reportData)

        // 2) Assessment laden
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select<'*', Assessment>('*')
          .eq('id', reportData.assessment_id)
          .single()

        if (assessmentError) throw assessmentError

        // 3) Patient laden
        const { data: patientData, error: patientError } = await supabase
          .from('patient_profiles')
          .select<'*', PatientProfile>('*')
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
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unbekannter Fehler'
        console.error('Fehler beim Laden der Report-Details:', e)
        setError(message)
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
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600 dark:text-slate-300">Report wird geladen…</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">
            {error ?? 'Report nicht gefunden.'}
          </p>
          <button
            onClick={() => router.push('/clinician')}
            className="px-6 py-3 min-h-11 rounded bg-sky-600 dark:bg-sky-500 text-white text-sm md:text-base hover:bg-sky-700 dark:hover:bg-sky-600 transition touch-manipulation"
          >
            Zurück
          </button>
        </div>
      </div>
    )
  }

  const riskLabel =
    report.risk_level === 'high'
      ? 'Hohes Stressniveau'
      : report.risk_level === 'moderate'
      ? 'Mittleres Stressniveau'
      : 'Niedriges Stressniveau'

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/clinician')}
        className="mb-4 px-4 py-2.5 min-h-11 text-sm md:text-base text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition touch-manipulation inline-flex items-center gap-2"
      >
        ← Zur Übersicht
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4 md:mb-6">Report – Stress & Resilienz</h1>

      {/* Meta-Daten */}
      <div className="mb-6 space-y-3 md:space-y-4">
        <div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Datum</p>
          <p className="font-medium text-sm md:text-base text-slate-900 dark:text-slate-100">
            {new Date(report.created_at).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Patient</p>
          <p className="font-medium text-sm md:text-base text-slate-900 dark:text-slate-100">
            {patient?.full_name ?? patient?.id ?? 'Unbekannt'}
          </p>
        </div>

        <div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Stress-Score</p>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">{report.score_numeric ?? 'N/A'}</p>
        </div>

        <div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Schlaf-Score</p>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">{report.sleep_score ?? 'N/A'}</p>
        </div>

        <div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Stress-Level</p>
          <p className="font-medium text-sm md:text-base text-slate-900 dark:text-slate-100">{riskLabel}</p>
        </div>
      </div>

      {/* Assistant summary text */}
      {featureFlags.AMY_ENABLED && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 mb-6 bg-white dark:bg-slate-800 transition-colors">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-50 mb-3 md:mb-4">Kurzbericht ({ASSISTANT_CONFIG.name})</h2>
          <p className="whitespace-pre-line text-gray-800 dark:text-slate-200 text-sm md:text-base">
            {report.report_text_short}
          </p>
        </div>
      )}

      {/* Antworten */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 bg-white dark:bg-slate-800 transition-colors">
        <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-50 mb-3 md:mb-4">Antworten (Rohdaten)</h2>
        {answers.length === 0 ? (
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            Keine Antworten gefunden.
          </p>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base text-slate-700 dark:text-slate-300">
            {answers.map((a) => (
              <li key={a.question_id}>
                <strong>{a.question_id}:</strong> {a.answer_value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
